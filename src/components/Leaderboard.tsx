import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getSafeSession } from '@/lib/auth'
import { Avatar } from '@/components/Avatar'
import { LevelBadge } from '@/components/LevelBadge'

interface LeaderboardEntry {
  rank: number
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  xp: number
  period_xp: number
  level: number
  level_label: string
  is_me: boolean
}

interface LeaderboardProps {
  currentUserId: string
  className?: string
}

type Scope = 'class' | 'department' | 'global'
type Period = 'week' | 'month' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Cette semaine',
  month: 'Ce mois',
  all: 'Tout temps',
}

const SCOPE_LABELS: Record<Scope, string> = {
  class: 'Ma classe',
  department: 'Mon service',
  global: 'Global',
}

const RANK_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

export function Leaderboard({ currentUserId, className = '' }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState<Scope>('class')
  const [period, setPeriod] = useState<Period>('week')
  const [myRank, setMyRank] = useState<number | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const session = getSafeSession()
      if (!session) return

      let scopeId: string | null = null
      if (scope === 'class' || scope === 'department') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('class_id, department')
          .eq('id', currentUserId)
          .single()
        if (profile) {
          scopeId = scope === 'class' ? String(profile.class_id) : String(profile.department)
        }
      }

      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_scope: scope,
        p_scope_id: scopeId,
        p_period: period,
        p_limit: 50,
        p_current_user_id: currentUserId,
      })

      if (error) throw error
      if (data) {
        setEntries(data.leaderboard || [])
        setMyRank(data.my_rank ?? null)
      }
    } catch (e) {
      console.error('[Leaderboard] fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [scope, period, currentUserId])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  return (
    <div className={`rounded-xl border border-pierre/10 bg-white dark:border-white/10 dark:bg-slate-800 ${className}`}>
      {/* Header */}
      <div className="border-b border-pierre/10 px-4 py-3 dark:border-white/10">
        <h3 className="text-sm font-bold text-bordeaux dark:text-or">Classement</h3>
        {myRank && (
          <p className="text-[10px] text-pierre dark:text-slate-400">
            Ta position : <span className="font-bold text-or">#{myRank}</span>
          </p>
        )}
      </div>

      {/* Scope tabs */}
      <div className="flex border-b border-pierre/10 dark:border-white/10">
        {(Object.keys(SCOPE_LABELS) as Scope[]).map(s => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`flex-1 py-2 text-[10px] font-medium transition-colors ${
              scope === s
                ? 'border-b-2 border-or text-or'
                : 'text-pierre hover:text-bordeaux dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {SCOPE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 px-4 pt-2">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-3 py-1 text-[10px] font-medium transition-colors ${
              period === p
                ? 'bg-or/15 text-or'
                : 'text-pierre hover:bg-pierre/5 dark:text-slate-400 dark:hover:bg-white/5'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Leaderboard list */}
      <div className="max-h-80 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-xs text-pierre dark:text-slate-500">
            Aucun classement disponible pour cette sélection.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  entry.is_me
                    ? 'bg-or/10 ring-1 ring-or/20'
                    : 'hover:bg-pierre/5 dark:hover:bg-white/5'
                }`}
              >
                {/* Rank */}
                <div className="w-6 flex-shrink-0 text-center">
                  {RANK_MEDALS[entry.rank] ? (
                    <span className="text-base">{RANK_MEDALS[entry.rank]}</span>
                  ) : (
                    <span className={`text-xs font-bold ${entry.rank <= 10 ? 'text-or' : 'text-pierre/50 dark:text-slate-500'}`}>
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar
                  url={entry.avatar_url}
                  firstName={entry.first_name}
                  lastName={entry.last_name}
                  size={32}
                />

                {/* Name + level */}
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-xs font-semibold ${entry.is_me ? 'text-or' : 'text-bordeaux dark:text-slate-100'}`}>
                    {entry.first_name} {entry.last_name}
                    {entry.is_me && <span className="ml-1 text-[9px] font-normal text-or/70">(Toi)</span>}
                  </p>
                  <p className="text-[10px] text-pierre dark:text-slate-400">
                    Niv. {entry.level} · {entry.level_label}
                  </p>
                </div>

                {/* XP */}
                <div className="text-right">
                  <p className="text-xs font-bold text-or">{entry.period_xp.toLocaleString()}</p>
                  <p className="text-[9px] text-pierre dark:text-slate-500">XP période</p>
                </div>

                {/* Level badge */}
                <LevelBadge level={entry.level} levelLabel={entry.level_label} xp={entry.xp} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
