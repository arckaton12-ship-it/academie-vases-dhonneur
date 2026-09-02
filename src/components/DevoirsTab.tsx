import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { playSuccess } from '@/lib/sound'
import { Assignment, MySubmission } from '@/lib/courses'

interface DevoirsTabProps {
  assignments: Assignment[]
  submissions: MySubmission[]
  courseName: string
  onSubmit: (assignmentId: string, content: string, file: File | null) => Promise<void>
}

function getGradeColor(grade: number | null): string {
  if (grade === null || grade === undefined) return ''
  if (grade >= 16) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
  if (grade >= 14) return 'text-olive bg-olive/5 border-olive/20'
  if (grade >= 10) return 'text-or bg-or/5 border-or/20'
  return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
}

function getGradeLabel(grade: number | null): string {
  if (grade === null || grade === undefined) return ''
  if (grade >= 16) return 'Excellent'
  if (grade >= 14) return 'Bien'
  if (grade >= 10) return 'Assez bien'
  if (grade >= 8) return 'Passable'
  return 'Insuffisant'
}

function getGradeEmoji(grade: number | null): string {
  if (grade === null || grade === undefined) return ''
  if (grade >= 16) return '🌟'
  if (grade >= 14) return '👍'
  if (grade >= 10) return '✅'
  if (grade >= 8) return '⚠️'
  return '❌'
}

function getCountdown(dueDate: string | null): string | null {
  if (!dueDate) return null
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'En retard'
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Demain'
  if (diffDays <= 7) return `Dans ${diffDays} jours`
  return null
}

function getCountdownColor(dueDate: string | null): string {
  if (!dueDate) return ''
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (diffDays <= 2) return 'bg-or/10 text-or'
  return 'bg-pierre/10 text-pierre dark:bg-white/10 dark:text-slate-400'
}

export function DevoirsTab({ assignments, submissions, courseName, onSubmit }: DevoirsTabProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded' | 'submitted'>('all')
  const [drafts, setDrafts] = useState<Record<string, { content: string; file: File | null }>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [submitMsg, setSubmitMsg] = useState<Record<string, string>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const submissionMap = new Map(submissions.map((s) => [s.assignment_id, s]))

  const items = assignments.map((a) => ({
    assignment: a,
    submission: submissionMap.get(a.id) ?? null,
  }))

  const filtered = items.filter(({ submission }) => {
    if (filter === 'all') return true
    if (filter === 'pending') return !submission
    if (filter === 'graded') return submission?.grade !== null && submission?.grade !== undefined
    if (filter === 'submitted') return !!submission
    return true
  })

  const gradedCount = items.filter((i) => i.submission?.grade !== null && i.submission?.grade !== undefined).length
  const pendingCount = items.filter((i) => !i.submission).length
  const submittedCount = items.filter((i) => !!i.submission).length

  async function handleSubmit(assignmentId: string) {
    const draft = drafts[assignmentId]
    if (!draft?.content?.trim() && !draft?.file) return
    setSubmitting((prev) => ({ ...prev, [assignmentId]: true }))
    try {
      await onSubmit(assignmentId, draft.content, draft.file)
      setSubmitMsg((prev) => ({ ...prev, [assignmentId]: 'Envoyé !' }))
      toast('Devoir envoyé avec succès !')
      playSuccess()
      setDrafts((prev) => ({ ...prev, [assignmentId]: { content: '', file: null } }))
    } catch {
      setSubmitMsg((prev) => ({ ...prev, [assignmentId]: 'Erreur d\'envoi.' }))
    } finally {
      setSubmitting((prev) => ({ ...prev, [assignmentId]: false }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-pierre/10 bg-white/60 p-3 text-center dark:bg-white/5 dark:border-white/5">
          <p className="text-lg font-bold text-bordeaux dark:text-slate-100">{assignments.length}</p>
          <p className="text-[10px] text-pierre dark:text-slate-500">Total</p>
        </div>
        <div className="rounded-lg border border-olive/20 bg-olive/5 p-3 text-center">
          <p className="text-lg font-bold text-olive">{gradedCount}</p>
          <p className="text-[10px] text-pierre dark:text-slate-500">Corrigés</p>
        </div>
        <div className="rounded-lg border border-or/20 bg-or/5 p-3 text-center">
          <p className="text-lg font-bold text-or">{pendingCount}</p>
          <p className="text-[10px] text-pierre dark:text-slate-500">À faire</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 rounded-lg bg-pierre/5 p-1">
        {[
          { key: 'all' as const, label: 'Tous', count: items.length },
          { key: 'pending' as const, label: 'A rendre', count: pendingCount },
          { key: 'graded' as const, label: 'Notes', count: gradedCount },
          { key: 'submitted' as const, label: 'Envoyés', count: submittedCount },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
              filter === f.key
                ? 'bg-bordeaux text-white dark:bg-or dark:text-bordeaux'
                : 'text-pierre hover:text-bordeaux dark:text-slate-400'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Assignment cards */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-pierre dark:text-slate-500">Aucun devoir dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ assignment: a, submission }) => {
            const isExpanded = expandedId === a.id
            const grade = submission?.grade ?? null
            const countdown = getCountdown(a.due_date)
            const isGraded = grade !== null && grade !== undefined

            return (
              <div
                key={a.id}
                className={`overflow-hidden rounded-xl border transition-all ${
                  isGraded
                    ? 'border-olive/20 bg-gradient-to-r from-olive/5 to-transparent'
                    : submission
                    ? 'border-or/20 bg-gradient-to-r from-or/5 to-transparent'
                    : 'border-pierre/10 bg-white/60 dark:bg-white/5 dark:border-white/5'
                }`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  className="flex w-full items-center gap-3 p-3 text-left"
                >
                  {/* Grade badge */}
                  {isGraded ? (
                    <div className={`flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl border ${getGradeColor(grade)}`}>
                      <span className="text-sm font-bold">{grade}</span>
                      <span className="text-[8px]">/20</span>
                    </div>
                  ) : submission ? (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-or/20 bg-or/10 text-or">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-pierre/15 bg-pierre/5 text-pierre">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-bordeaux dark:text-slate-100">
                        {a.type === 'DEVOIR' ? 'Devoir' : 'Exercice'}
                      </p>
                      {isGraded && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${getGradeColor(grade)}`}>
                          {getGradeEmoji(grade)} {getGradeLabel(grade)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-pierre dark:text-slate-400">{a.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {countdown && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getCountdownColor(a.due_date)}`}>
                        {countdown}
                      </span>
                    )}
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`text-pierre transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-pierre/10 px-3 pb-3 pt-2 dark:border-white/5">
                    {/* Submission info */}
                    {submission && (
                      <div className="mb-3 rounded-lg border border-pierre/10 bg-white/50 p-2.5 dark:bg-white/5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-pierre dark:text-slate-400">
                            Envoyé le {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString('fr-FR') : '—'}
                          </p>
                          {isGraded && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getGradeColor(grade)}`}>
                              {grade}/20
                            </span>
                          )}
                        </div>
                        {submission.feedback && (
                          <p className="mt-1.5 rounded bg-pierre/5 px-2 py-1 text-xs text-pierre dark:text-slate-300">
                            💬 {submission.feedback}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Submit form */}
                    <textarea
                      rows={3}
                      placeholder="Ta reponse..."
                      value={drafts[a.id]?.content ?? ''}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [a.id]: { content: e.target.value, file: prev[a.id]?.file ?? null } }))}
                      className="w-full rounded-lg border border-pierre/20 bg-white px-3 py-2 text-sm text-bordeaux focus:border-or focus:outline-none dark:bg-white/5 dark:text-slate-200"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="!px-3 !py-1.5 text-xs"
                        disabled={submitting[a.id] || (!drafts[a.id]?.content?.trim() && !drafts[a.id]?.file)}
                        onClick={() => handleSubmit(a.id)}
                      >
                        {submitting[a.id] ? 'Envoi...' : submission ? 'Renvoyer' : 'Soumettre'}
                      </Button>
                      {submitMsg[a.id] && (
                        <span className="text-xs text-olive">{submitMsg[a.id]}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
