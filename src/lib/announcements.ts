import { supabase } from './supabase'
import { getSafeSession } from './auth'
import { sendPushNotification } from './pushSend'
import type { ClassRow, Announcement, MeditationVerse } from './types'

export async function getAnnouncements(classId?: string): Promise<Announcement[]> {
  let query = supabase
    .from('announcements')
    .select('*, moderator:profiles(first_name, last_name), class:classes(name)')
    .order('created_at', { ascending: false })
  if (classId) query = query.eq('class_id', classId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Announcement[]
}

export async function createAnnouncement(classId: string, title: string, content: string): Promise<void> {
  const session = getSafeSession()
  if (!session) throw new Error('Non authentifié')
  const { error } = await supabase.from('announcements').insert({
    moderator_id: session.user.id,
    class_id: classId,
    title: title.trim(),
    content: content.trim(),
  })
  if (error) throw error

  const { data: students } = await supabase
    .from('profiles')
    .select('id')
    .eq('class_id', classId)
    .eq('role', 'ETUDIANT')
    .eq('active', true)
  if (students) {
    for (const s of students) {
      void supabase.rpc('create_notification', {
        p_user_id: s.id,
        p_type: 'announcement',
        p_title: 'Nouvelle annonce',
        p_body: title.trim(),
      })
    }
  }
}

export async function createBroadcastAnnouncement(title: string, content: string): Promise<number> {
  const session = getSafeSession()
  if (!session) throw new Error('Non authentifié')

  const { data: allClasses } = await supabase.from('classes').select('id')
  if (!allClasses || allClasses.length === 0) return 0

  const rows = allClasses.map((c) => ({
    moderator_id: session.user.id,
    class_id: c.id,
    title: title.trim(),
    content: content.trim(),
  }))

  const { error } = await supabase.from('announcements').insert(rows)
  if (error) throw error
  return allClasses.length
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', announcementId)
  if (error) throw error
}

export async function updateAnnouncement(announcementId: string, title: string, content: string): Promise<void> {
  const { error } = await supabase.from('announcements').update({ title: title.trim(), content: content.trim() }).eq('id', announcementId)
  if (error) throw error
}

const SATURDAY_REMINDER_TITLE_RESUME = '📋 Rappel — Résumé du cours'
const SATURDAY_REMINDER_TITLE_COURS = '⛪ Rappel — Cours de demain'

const SATURDAY_REMINDER_CONTENT_RESUME =
  "Ton résumé du cours de la semaine est attendu aujourd'hui au plus tard à 22H59.\nTu peux l'envoyer à l'adresse E-mail suivante : vhassembleeeauxpaisibles@gmail.com\nOu directement dans l'application (onglet Cours → Résumé).\n\nL'administration."
const SATURDAY_REMINDER_CONTENT_COURS =
  "Ton prochain cours de l'académie c'est demain à 11h en présentiel à l'église.\nBien vouloir te munir de :\n• Ton cahier de méditation\n• Ton résumé imprimé\nà remettre aux admins de ta classe avant le début du cours.\n\nL'administration."

export async function sendSaturdayReminders(): Promise<{ sent: boolean; count: number }> {
  const now = new Date()
  const dayOfWeek = now.getDay()
  if (dayOfWeek !== 6) return { sent: false, count: 0 }

  const todayStr = now.toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('announcements')
    .select('id')
    .eq('title', SATURDAY_REMINDER_TITLE_RESUME)
    .gte('created_at', `${todayStr}T00:00:00Z`)
    .lte('created_at', `${todayStr}T23:59:59Z`)
    .limit(1)

  if (existing && existing.length > 0) return { sent: false, count: 0 }

  const { data: classes } = await supabase.from('classes').select('id')
  if (!classes || classes.length === 0) return { sent: false, count: 0 }

  const session = getSafeSession()
  const modId = session?.user?.id
  if (!modId) return { sent: false, count: 0 }

  const rows = []
  for (const c of classes) {
    rows.push(
      { moderator_id: modId, class_id: c.id, title: SATURDAY_REMINDER_TITLE_RESUME, content: SATURDAY_REMINDER_CONTENT_RESUME },
      { moderator_id: modId, class_id: c.id, title: SATURDAY_REMINDER_TITLE_COURS, content: SATURDAY_REMINDER_CONTENT_COURS }
    )
  }

  const { error } = await supabase.from('announcements').insert(rows)
  if (error) throw error

  try {
    const { data: students } = await supabase
      .from('profiles')
      .select('id, first_name')
      .eq('role', 'ETUDIANT')

    if (students) {
      for (const s of students) {
        const greeting = s.first_name ? `${s.first_name}, ` : ''
        sendPushNotification({
          userId: s.id,
          title: SATURDAY_REMINDER_TITLE_RESUME,
          body: `Bonjour ${greeting}ton résumé du cours est attendu aujourd'hui à 22H59.`,
          tag: 'saturday-resume',
          url: '/etudiant/tableau-de-bord',
        }).catch(() => {})
      }
    }
  } catch {
    // push is best-effort
  }

  return { sent: true, count: classes.length }
}

export async function getDailyVerse(classId: string): Promise<{ verse_text: string; verse_reference: string } | null> {
  const { data, error } = await supabase.rpc('get_daily_verse', { p_class_id: classId })
  if (error) throw error
  if (!data) return null
  const row = Array.isArray(data) ? data[0] : data
  return (row ?? null) as { verse_text: string; verse_reference: string } | null
}

export async function getClassVerses(classId: string): Promise<MeditationVerse[]> {
  const { data, error } = await supabase.rpc('get_class_verses', { p_class_id: classId })
  if (error) throw error
  return (data ?? []) as MeditationVerse[]
}

export async function addVerse(classId: string, verseText: string, verseReference: string, dayOfWeek?: number | null): Promise<void> {
  const { error } = await supabase.rpc('add_verse', {
    p_class_id: classId,
    p_verse_text: verseText.trim(),
    p_verse_reference: verseReference.trim(),
    p_day_of_week: dayOfWeek ?? null,
  })
  if (error) throw error
}

export async function removeVerse(verseId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_verse', { p_verse_id: verseId })
  if (error) throw error
}

export async function toggleVerseActive(verseId: string): Promise<void> {
  const { error } = await supabase.rpc('toggle_verse_active', { p_verse_id: verseId })
  if (error) throw error
}

export async function setVerseDay(verseId: string, dayOfWeek: number | null): Promise<void> {
  const { error } = await supabase.rpc('set_verse_day', { p_verse_id: verseId, p_day_of_week: dayOfWeek })
  if (error) throw error
}
