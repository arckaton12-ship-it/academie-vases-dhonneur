import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CLASSES = ['Connaître & Servir Christ', 'Croître avec Jésus', 'Consécration']
const SEXES = ['Homme', 'Femme']
const CANAUX = ['En Présentiel', 'En Ligne (avec autorisation)']
const SITUATIONS = ['Célibataire', 'Fiancé(e)', 'Marié(e)', 'Veuf/Veuve']
const TRIBUS = ['Lévi', 'Juda', 'Siméon', 'Ruben', 'Zabulon', 'Issacar', 'Dan', 'Nephtali', 'Gad', 'Aser', 'Manassé', 'Éphraïm', 'Benjamin', 'Aucune']
const DEPARTEMENTS = ['Intercession', 'Chantre', 'Communication', 'Accueil', 'Gestion des Cultes', "Médecine d'Honneur", 'Portier', 'Évangélisation', 'Amis des Nouveaux (ADN)', 'Social', 'Aucun']
const TYPES = ['Nouveau', 'Ancien']
const NIVEAUX = ['Bon', 'Moyen', 'Faible']

interface RegistrationData {
  email: string
  last_name: string
  first_name: string
  photo_url: string
  phone_whatsapp: string
  phone_telegram: string
  emergency_contact: string
  sex: string
  class_name: string
  tshirt_size: string
  training_channel: string
  payment_mode: string
  profession: string
  neighborhood: string
  birth_date: string
  marital_status: string
  children_count: number
  baptized_immersion: boolean
  baptism_date: string
  conversion_date: string
  service_department: string
  tribe: string
  student_type: string
  french_reading_level: string
  french_listening_level: string
  french_writing_level: string
  commitment: boolean
}

interface Props {
  profile: { first_name?: string; last_name?: string; avatar_url?: string; tribe?: string; department?: string }
  onComplete: () => void
}

export default function RegistrationStep2({ profile, onComplete }: Props) {
  const [form, setForm] = useState<RegistrationData>({
    email: '',
    last_name: profile.last_name || '',
    first_name: profile.first_name || '',
    photo_url: profile.avatar_url || '',
    phone_whatsapp: '',
    phone_telegram: '',
    emergency_contact: '',
    sex: '',
    class_name: '',
    tshirt_size: '',
    training_channel: '',
    payment_mode: '',
    profession: '',
    neighborhood: '',
    birth_date: '',
    marital_status: '',
    children_count: 0,
    baptized_immersion: false,
    baptism_date: '',
    conversion_date: '',
    service_department: '',
    tribe: profile.tribe || '',
    student_type: '',
    french_reading_level: '',
    french_listening_level: '',
    french_writing_level: '',
    commitment: false,
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [showCodeOfConduct, setShowCodeOfConduct] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setForm(p => ({ ...p, email: data.user!.email! }))
    })
  }, [])

  const set = (k: keyof RegistrationData, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.commitment) {
      setMsg("Tu dois accepter l'engagement pour continuer.")
      return
    }
    if (!form.class_name) {
      setMsg("Tu dois choisir une classe pour continuer.")
      return
    }
    setLoading(true)
    setMsg('')
    try {
      const { data, error } = await supabase.rpc('submit_registration', {
        p_email: form.email,
        p_last_name: form.last_name,
        p_first_name: form.first_name,
        p_photo_url: form.photo_url || null,
        p_phone_whatsapp: form.phone_whatsapp || null,
        p_phone_telegram: form.phone_telegram || null,
        p_emergency_contact: form.emergency_contact || null,
        p_sex: form.sex || null,
        p_class_name: form.class_name || null,
        p_tshirt_size: form.tshirt_size || null,
        p_training_channel: form.training_channel || null,
        p_payment_mode: form.payment_mode || null,
        p_profession: form.profession || null,
        p_neighborhood: form.neighborhood || null,
        p_birth_date: form.birth_date || null,
        p_marital_status: form.marital_status || null,
        p_children_count: form.children_count,
        p_baptized_immersion: form.baptized_immersion,
        p_baptism_date: form.baptism_date || null,
        p_conversion_date: form.conversion_date || null,
        p_service_department: form.service_department || null,
        p_tribe: form.tribe || null,
        p_student_type: form.student_type || null,
        p_french_reading_level: form.french_reading_level || null,
        p_french_listening_level: form.french_listening_level || null,
        p_french_writing_level: form.french_writing_level || null,
        p_commitment: form.commitment,
      })
      if (error) throw error
      setMsg('Inscription enregistrée !')

      // Sync to Google Sheets (non-blocking)
      const sheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL || 'https://script.google.com/macros/s/AKfycbzgD6VRDwMB1dI_-MorXl-kVwdTeSV0EPdJ3Iegoj9MFXt4PkvNTIezHqG_kClhXtnNkA/exec'
      if (sheetsUrl) {
        const sheetPayload = {
          Horodateur: new Date().toISOString(),
          email: form.email,
          last_name: form.last_name,
          first_name: form.first_name,
          photo_url: form.photo_url,
          phone_whatsapp: form.phone_whatsapp,
          phone_telegram: form.phone_telegram,
          emergency_contact: form.emergency_contact,
          sex: form.sex,
          class_name: form.class_name,
          tshirt_size: form.tshirt_size,
          registration_date: new Date().toISOString(),
          training_channel: form.training_channel,
          payment_mode: form.payment_mode,
          profession: form.profession,
          neighborhood: form.neighborhood,
          birth_date: form.birth_date,
          marital_status: form.marital_status,
          children_count: form.children_count,
          baptized_immersion: form.baptized_immersion,
          baptism_date: form.baptism_date,
          conversion_date: form.conversion_date,
          service_department: form.service_department,
          tribe: form.tribe,
          student_type: form.student_type,
          french_reading_level: form.french_reading_level,
          french_listening_level: form.french_listening_level,
          french_writing_level: form.french_writing_level,
          commitment: form.commitment,
        }
        fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetPayload),
        }).then(async (res) => {
          const responseText = await res.text().catch(() => '')
          await supabase.from('webhook_logs').insert({
            url: sheetsUrl,
            payload: sheetPayload,
            status: res.status,
            response: responseText.slice(0, 2000),
          })
        }).catch(async (err) => {
          console.error('Webhook inscription error:', err)
          await supabase.from('webhook_logs').insert({
            url: sheetsUrl,
            payload: sheetPayload,
            error: String(err?.message || err),
          })
        })
      }

      setTimeout(onComplete, 1500)
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const input = "w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
  const label = "mb-1 block text-sm font-medium text-bordeaux"
  const select = input + " appearance-none"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card bg-white p-6 shadow-xl">
        <h2 className="font-display text-xl text-bordeaux">Fiche d'inscription — Académie</h2>
        <p className="mt-1 text-sm text-pierre">Complète les informations ci-dessous.</p>

        {showCodeOfConduct && (
          <div className="my-4 rounded-md border border-or/40 bg-parchemin p-4 text-sm text-bordeaux">
            <h3 className="font-display text-lg">Ligne de conduite de l'étudiant</h3>
            <p className="mt-2">En tant que membre de l'Académie Vases d'Honneur, je m'engage à :</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Assister régulièrement aux sessions de formation</li>
              <li>Compléter les devoirs et exercices dans les délais</li>
              <li>Respecter les enseignements et la discipline de l'Académie</li>
              <li>Maintenir une attitude respectueuse envers les enseignants et camarades</li>
              <li>Pratiquer les enseignements reçus dans ma vie quotidienne</li>
            </ul>
            <button onClick={() => setShowCodeOfConduct(false)} className="mt-3 rounded-md bg-bordeaux px-3 py-1.5 text-xs text-parchemin hover:bg-teal-dark">Fermer</button>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Nom *</label><input className={input} value={form.last_name} onChange={e => set('last_name', e.target.value)} /></div>
          <div><label className={label}>Prénom *</label><input className={input} value={form.first_name} onChange={e => set('first_name', e.target.value)} /></div>
          <div><label className={label}>Email *</label><input className={input} type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div><label className={label}>WhatsApp</label><input className={input} value={form.phone_whatsapp} onChange={e => set('phone_whatsapp', e.target.value)} /></div>
          <div><label className={label}>Telegram</label><input className={input} value={form.phone_telegram} onChange={e => set('phone_telegram', e.target.value)} /></div>
          <div><label className={label}>Contact d'urgence</label><input className={input} value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} /></div>
          <div><label className={label}>Sexe</label><select className={select} value={form.sex} onChange={e => set('sex', e.target.value)}><option value="">—</option>{SEXES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className={label}>Classe *</label><select className={select} value={form.class_name} onChange={e => set('class_name', e.target.value)}><option value="">—</option>{CLASSES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className={label}>Taille T-Shirt</label><input className={input} value={form.tshirt_size} onChange={e => set('tshirt_size', e.target.value)} /></div>
          <div><label className={label}>Canal de formation</label><select className={select} value={form.training_channel} onChange={e => set('training_channel', e.target.value)}><option value="">—</option>{CANAUX.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className={label}>Mode de paiement</label><input className={input} value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)} /></div>
          <div><label className={label}>Profession</label><input className={input} value={form.profession} onChange={e => set('profession', e.target.value)} /></div>
          <div><label className={label}>Quartier</label><input className={input} value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} /></div>
          <div><label className={label}>Date de naissance</label><input className={input} type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} /></div>
          <div><label className={label}>Situation matrimoniale</label><select className={select} value={form.marital_status} onChange={e => set('marital_status', e.target.value)}><option value="">—</option>{SITUATIONS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className={label}>Nombre d'enfants</label><input className={input} type="number" min={0} value={form.children_count} onChange={e => set('children_count', Number(e.target.value))} /></div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={form.baptized_immersion} onChange={e => set('baptized_immersion', e.target.checked)} className="accent-or" /><label className="text-sm text-bordeaux">Baptisé par immersion</label></div>
          <div><label className={label}>Date de baptême</label><input className={input} type="date" value={form.baptism_date} onChange={e => set('baptism_date', e.target.value)} /></div>
          <div><label className={label}>Date de conversion</label><input className={input} type="date" value={form.conversion_date} onChange={e => set('conversion_date', e.target.value)} /></div>
          <div><label className={label}>Département de service</label><select className={select} value={form.service_department} onChange={e => set('service_department', e.target.value)}><option value="">—</option>{DEPARTEMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
          <div><label className={label}>Tribu</label><select className={select} value={form.tribe} onChange={e => set('tribe', e.target.value)}><option value="">—</option>{TRIBUS.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className={label}>Type d'étudiant</label><select className={select} value={form.student_type} onChange={e => set('student_type', e.target.value)}><option value="">—</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className={label}>Lecture français</label><select className={select} value={form.french_reading_level} onChange={e => set('french_reading_level', e.target.value)}><option value="">—</option>{NIVEAUX.map(n => <option key={n}>{n}</option>)}</select></div>
          <div><label className={label}>Écoute français</label><select className={select} value={form.french_listening_level} onChange={e => set('french_listening_level', e.target.value)}><option value="">—</option>{NIVEAUX.map(n => <option key={n}>{n}</option>)}</select></div>
          <div><label className={label}>Écriture français</label><select className={select} value={form.french_writing_level} onChange={e => set('french_writing_level', e.target.value)}><option value="">—</option>{NIVEAUX.map(n => <option key={n}>{n}</option>)}</select></div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-2">
            <input type="checkbox" checked={form.commitment} onChange={e => set('commitment', e.target.checked)} className="mt-0.5 accent-or" />
            <label className="text-sm text-bordeaux">
              J'ai lu la <button type="button" onClick={() => setShowCodeOfConduct(true)} className="underline hover:text-teal-dark">ligne de conduite de l'étudiant</button> et je m'engage à la respecter. *
            </label>
          </div>
        </div>

        {msg && <p className={`mt-3 text-sm ${msg.includes('Erreur') || msg.includes('obligatoire') ? 'text-rouge' : 'text-olive'}`}>{msg}</p>}

        <div className="mt-4 flex gap-3">
          <button onClick={onComplete} className="rounded-md border border-pierre/30 px-4 py-2 text-sm text-pierre hover:bg-parchemin">Passer</button>
          <button onClick={handleSubmit} disabled={loading || !form.commitment} className="rounded-md bg-bordeaux px-4 py-2 text-sm font-medium text-parchemin hover:bg-teal-dark disabled:opacity-50">
            {loading ? 'Envoi...' : "Valider l'inscription"}
          </button>
        </div>
      </div>
    </div>
  )
}
