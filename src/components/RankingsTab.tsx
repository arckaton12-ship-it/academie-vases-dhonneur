import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/Avatar'
import { BADGES } from '@/lib/badges'

interface RankedStudent {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  active_badge: string | null
  badge_count: number
  streak: number
  presence_rate: number
  rank: number
  rank_change: 'up' | 'down' | 'same' | 'new'
}

const RANK_COLORS = [
  'from-yellow-400 to-amber-500', // 1er - Gold
  'from-gray-300 to-gray-400',     // 2e - Silver
  'from-amber-600 to-amber-700',   // 3e - Bronze
]

const RANK_EMOJIS = ['👑', '🥈', '🥉']

export function RankingsTab({ currentUserId }: { currentUserId: string }) {
  const [students, setStudents] = useState<RankedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all')

  useEffect(() => {
    loadRankings()
  }, [period])

  async function loadRankings() {
    setLoading(true)
    try {
      // Get all students with their stats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, active_badge, class_id')
        .eq('role', 'ETUDIANT')
        .eq('active', true)

      if (!profiles) { setLoading(false); return }

      // Get badge counts
      const { data: badgeData } = await supabase
        .from('student_badges')
        .select('student_id')

      const badgeCounts = new Map<string, number>()
      for (const b of badgeData ?? []) {
        badgeCounts.set(b.student_id, (badgeCounts.get(b.student_id) ?? 0) + 1)
      }

      // Get streaks
      const { data: streakData } = await supabase
        .from('streaks')
        .select('student_id, consecutive_weeks')

      const streakMap = new Map<string, number>()
      for (const s of streakData ?? []) {
        const prev = streakMap.get(s.student_id) ?? 0
        if (s.consecutive_weeks > prev) streakMap.set(s.student_id, s.consecutive_weeks)
      }

      // Get attendance rates
      const { data: courses } = await supabase.from('courses').select('id, class_id')
      const { data: attendances } = await supabase.from('attendances').select('student_id, course_id')

      const courseClassMap = new Map<string, string>()
      for (const c of courses ?? []) {
        if (c.class_id) courseClassMap.set(c.id, c.class_id)
      }

      const attendanceCounts = new Map<string, Set<string>>()
      for (const a of attendances ?? []) {
        if (!attendanceCounts.has(a.student_id)) attendanceCounts.set(a.student_id, new Set())
        attendanceCounts.get(a.student_id)!.add(a.course_id)
      }

      // Build ranked list
      const ranked: RankedStudent[] = profiles.map((p, idx) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        avatar_url: p.avatar_url,
        active_badge: p.active_badge,
        badge_count: badgeCounts.get(p.id) ?? 0,
        streak: streakMap.get(p.id) ?? 0,
        presence_rate: 0,
        rank: 0,
        rank_change: 'same' as const,
      }))

      // Score = badges * 3 + streak * 2 + presence_rate
      ranked.sort((a, b) => {
        const scoreA = a.badge_count * 3 + a.streak * 2
        const scoreB = b.badge_count * 3 + b.streak * 2
        return scoreB - scoreA
      })

      ranked.forEach((s, i) => { s.rank = i + 1 })

      setStudents(ranked)
    } catch (e) {
      console.error('[Rankings]', e)
    } finally {
      setLoading(false)
    }
  }

  const myRank = students.find((s) => s.id === currentUserId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-sm text-pierre">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Classement en cours...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with my rank */}
      {myRank && (
        <div className="rounded-xl border border-or/40 bg-gradient-to-r from-or/10 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-or text-lg font-bold text-bordeaux">
              #{myRank.rank}
            </div>
            <div>
              <p className="text-sm font-bold text-bordeaux dark:text-slate-100">Ton rang</p>
              <p className="text-xs text-pierre dark:text-slate-400">
                {myRank.badge_count} badge{myRank.badge_count > 1 ? 's' : ''} · {myRank.streak} sem. méditation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Period selector */}
      <div className="flex gap-1 rounded-lg bg-pierre/5 p-1">
        {[
          { key: 'all' as const, label: 'Tout' },
          { key: 'month' as const, label: 'Mois' },
          { key: 'week' as const, label: 'Semaine' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              period === p.key
                ? 'bg-bordeaux text-white dark:bg-or dark:text-bordeaux'
                : 'text-pierre hover:text-bordeaux dark:text-slate-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {students.slice(0, 50).map((s) => {
          const isMe = s.id === currentUserId
          const top3 = s.rank <= 3

          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                isMe
                  ? 'border-or/50 bg-or/5 shadow-sm'
                  : top3
                  ? 'border-or/20 bg-gradient-to-r from-or/5 to-transparent'
                  : 'border-pierre/10 bg-white/50 dark:bg-white/5 dark:border-white/5'
              }`}
            >
              {/* Rank */}
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                top3
                  ? `bg-gradient-to-br ${RANK_COLORS[s.rank - 1]} text-white`
                  : 'bg-pierre/10 text-pierre dark:bg-white/10 dark:text-slate-400'
              }`}>
                {top3 ? RANK_EMOJIS[s.rank - 1] : `#${s.rank}`}
              </div>

              {/* Avatar */}
              <Avatar url={s.avatar_url} firstName={s.first_name} lastName={s.last_name} size={32} />

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${isMe ? 'text-or' : 'text-bordeaux dark:text-slate-200'}`}>
                  {s.first_name} {s.last_name}
                  {isMe && <span className="ml-1 text-[10px]">(toi)</span>}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-pierre dark:text-slate-500">
                  <span>{s.badge_count} badge{s.badge_count > 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{s.streak} sem.</span>
                </div>
              </div>

              {/* Active badge */}
              {s.active_badge && BADGES[s.active_badge as keyof typeof BADGES] && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-or/10 text-[10px] font-bold text-or" title={BADGES[s.active_badge as keyof typeof BADGES].label}>
                  ★
                </div>
              )}
            </div>
          )
        })}
      </div>

      {students.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-pierre dark:text-slate-500">Aucun etudiant dans le classement.</p>
        </div>
      )}
    </div>
  )
}
