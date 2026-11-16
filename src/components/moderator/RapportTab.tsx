import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { exportToCSV, exportToPDF, ExportRow } from '@/lib/export'
import { getModerationReports, createModerationReport, deleteModerationReport, ClassRow, Course, StudentProfile, Submission, Streak, ModerationReport } from '@/lib/courses'
import { formatShortDate, formatDateLong } from './dates'

export function RapportTab({
  students,
  submissions,
  streaks,
  classById,
  courses,
  moderatorId,
  onReportsChanged,
}: {
  students: StudentProfile[]
  submissions: Submission[]
  streaks: Streak[]
  classById: Map<string, ClassRow>
  courses: Course[]
  moderatorId: string
  onReportsChanged: () => void
}) {
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [reportCourseId, setReportCourseId] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [reportContent, setReportContent] = useState('')
  const [reportMsg, setReportMsg] = useState<string | null>(null)
  const [reportSaving, setReportSaving] = useState(false)

  useEffect(() => {
    if (!moderatorId) return
    getModerationReports(moderatorId)
      .then(setReports)
      .catch(() => setReports([]))
  }, [moderatorId])

  async function handleCreateReport(e: FormEvent) {
    e.preventDefault()
    if (!reportContent.trim()) {
      setReportMsg('Écris au moins une observation.')
      return
    }
    setReportSaving(true)
    setReportMsg(null)
    try {
      await createModerationReport({
        courseId: reportCourseId || undefined,
        sessionDate: reportDate || undefined,
        content: reportContent,
      })
      setReportContent('')
      setReportDate('')
      setReportCourseId('')
      const updated = await getModerationReports(moderatorId)
      setReports(updated)
      setReportMsg('Rapport enregistré. Il apparaît dans ton historique.')
      onReportsChanged()
    } catch (err) {
      setReportMsg(err instanceof Error ? err.message : 'Erreur à la sauvegarde du rapport.')
    } finally {
      setReportSaving(false)
    }
  }

  async function handleDeleteReport(reportId: string) {
    if (!window.confirm('Supprimer ce rapport ?')) return
    try {
      await deleteModerationReport(reportId)
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    } catch {
      setReportMsg('Erreur de suppression.')
    }
  }

  function toReportRows(): ExportRow[] {
    return reports.map((r) => [
      r.course ? `Semaine ${r.course.week} — ${r.course.title}` : 'Session générale',
      r.session_date ?? '—',
      formatDateLong(r.created_at ?? ''),
      r.content,
    ])
  }

  const reportHeaders = ['Cours', 'Date session', 'Rédigé le', 'Rapport']

  const rows = useMemo(() => {
    const byStudent = new Map<string, Submission[]>()
    for (const s of submissions) {
      const list = byStudent.get(s.student_id) ?? []
      list.push(s)
      byStudent.set(s.student_id, list)
    }
    const streakByStudent = new Map<string, number>()
    for (const s of streaks) {
      const current = streakByStudent.get(s.student_id) ?? 0
      if (s.consecutive_weeks > current) streakByStudent.set(s.student_id, s.consecutive_weeks)
    }

    return students.map((student) => {
      const subs = byStudent.get(student.id) ?? []
      const grades = subs
        .map((s) => s.grade)
        .filter((g): g is number => g !== null && g !== undefined)
      const avg = grades.length
        ? (grades.reduce((acc, g) => acc + Number(g), 0) / grades.length).toFixed(2)
        : '—'
      const className = student.class_id ? classById.get(student.class_id)?.name ?? '—' : '—'
      return {
        student,
        className,
        submissionCount: subs.length,
        avg,
        streak: streakByStudent.get(student.id) ?? 0,
      }
    })
  }, [students, submissions, streaks, classById])

  function toExportRows(): ExportRow[] {
    return rows.map((r) => [
      `${r.student.last_name} ${r.student.first_name}`,
      r.student.email,
      r.className,
      r.submissionCount,
      r.avg,
      r.streak,
    ])
  }

  const headers = ['Étudiant', 'Email', 'Classe', 'Soumissions', 'Moyenne', 'Méditation (sem.)']

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Rédiger un rapport de session</CardTitle>
        <CardDescription className="mt-1 mb-4">
          Consigne tes observations et ton déroulé après chaque session de modération. Ils
          s'ajoutent à ton historique.
        </CardDescription>
        <form onSubmit={handleCreateReport} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="report-course">Cours concerné (optionnel)</Label>
              <select
                id="report-course"
                value={reportCourseId}
                onChange={(e) => setReportCourseId(e.target.value)}
                className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
              >
                <option value="">Session générale</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    Semaine {c.week} — {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="report-date">Date de la session</Label>
              <Input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="report-content">Rapport & observations</Label>
            <textarea
              id="report-content"
              rows={4}
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              placeholder="Déroulé de la session, participation, difficultés rencontrées, observations…"
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            />
          </div>
          {reportMsg && <p className="text-sm text-olive">{reportMsg}</p>}
          <Button type="submit" disabled={reportSaving}>
            {reportSaving ? 'Enregistrement…' : 'Enregistrer le rapport'}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Historique de mes rapports</CardTitle>
          {reports.length > 0 && (
            <Button
              variant="outline"
              onClick={() => exportToCSV('rapports-moderation.csv', reportHeaders, toReportRows())}
            >
              Exporter l'historique (CSV)
            </Button>
          )}
        </div>
        <CardDescription className="mt-1 mb-4">
          {reports.length} rapport{reports.length > 1 ? 's' : ''} rédigé{reports.length > 1 ? 's' : ''}.
        </CardDescription>
        {reports.length === 0 ? (
          <p className="text-sm text-pierre">Aucun rapport pour le moment. Rédige ton premier rapport de session.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-md border border-pierre/15 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-bordeaux">
                    {r.course ? `Semaine ${r.course.week} — ${r.course.title}` : 'Session générale'}
                    {r.session_date && (
                      <span className="ml-2 font-mono text-xs text-pierre">
                        {formatShortDate(r.session_date)}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => handleDeleteReport(r.id)}
                    className="text-xs text-red-700 underline"
                  >
                    Supprimer
                  </button>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-pierre">{r.content}</p>
                <p className="mt-1.5 text-xs text-pierre/70">
                  Rédigé le {formatDateLong(r.created_at ?? '')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Rapport de suivi</CardTitle>
        <CardDescription className="mt-1 mb-4">
          {students.length} étudiant{students.length > 1 ? 's' : ''} inscrit{students.length > 1 ? 's' : ''}
        </CardDescription>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => exportToCSV('rapport-etudiants.csv', headers, toExportRows())}
          >
            Exporter CSV
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportToPDF(
                'rapport-etudiants.pdf',
                'Rapport de suivi — Académie Vases d\'Honneur',
                'Suivi des étudiants par classe, soumissions et assiduité',
                headers,
                toExportRows()
              )
            }
          >
            Exporter PDF
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm leading-relaxed">
            <thead>
              <tr className="border-b-2 border-or bg-white/60 text-left dark:bg-white/5">
                <th className="px-4 py-3 font-medium text-bordeaux">Étudiant</th>
                <th className="px-4 py-3 font-medium text-bordeaux">Classe</th>
                <th className="px-4 py-3 font-medium text-bordeaux">Soumissions</th>
                <th className="px-4 py-3 font-medium text-bordeaux">Moyenne</th>
                <th className="px-4 py-3 font-medium text-bordeaux">Méditation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student.id} className="border-b border-pierre/15 transition-colors last:border-0 hover:bg-or/5 dark:hover:bg-or/5">
                  <td className="px-4 py-3 text-bordeaux">
                    {r.student.last_name} {r.student.first_name}
                  </td>
                  <td className="px-4 py-3 text-pierre">{r.className}</td>
                  <td className="px-4 py-3 font-mono text-pierre">{r.submissionCount}</td>
                  <td className="px-4 py-3 font-mono text-pierre">{r.avg}</td>
                  <td className="px-4 py-3 font-mono text-pierre">{r.streak}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-pierre">
                    Aucun étudiant inscrit pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}