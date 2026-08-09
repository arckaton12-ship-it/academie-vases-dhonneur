import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/Avatar'
import { Badge } from '@/components/Badge'
import { supabase } from '@/lib/supabase'
import {
  getStudentProgress,
  getSubmissions,
  getStreaks,
  getBadges,
  getResumesForReview,
  StudentProgress,
  Submission,
  Streak,
  BadgeRow,
} from '@/lib/courses'

interface StudentProfileCardProps {
  studentId: string
  onClose?: () => void
}

interface StudentWithAvatar {
  id: string
  email: string
  first_name: string
  last_name: string
  tribe: string | null
  department: string | null
  role: string
  class_id: string | null
  active: boolean
  meditation_grade: number | null
  active_badge: string | null
  avatar_url: string | null
  phone: string | null
  class?: { id: string; name: string; level: number } | null
}

interface GradeRow {
  courseTitle: string
  week: number
  grade: number | null
  feedback: string | null
}

export function StudentProfileCard({ studentId, onClose }: StudentProfileCardProps) {
  const [student, setStudent] = useState<StudentWithAvatar | null>(null)
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [badges, setBadges] = useState<BadgeRow[]>([])
  const [resumes, setResumes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: s } = await supabase
        .from('profiles')
        .select('*, class:classes(id, name, level)')
        .eq('id', studentId)
        .single()
      setStudent(s as any)

      const [p, allSubs, allStreaks, b, r] = await Promise.all([
        getStudentProgress(studentId).catch(() => null),
        getSubmissions().catch(() => [] as Submission[]),
        getStreaks().catch(() => [] as Streak[]),
        getBadges(studentId).catch(() => []),
        getResumesForReview(studentId).catch(() => []),
      ])
      setProgress(p)
      setSubmissions(allSubs.filter((x) => x.student_id === studentId))
      setStreaks(allStreaks.filter((x) => x.student_id === studentId))
      setBadges(b)
      setResumes(r)
      setLoading(false)
    }
    load()
  }, [studentId])

  if (loading) return <Card><p className="text-sm text-pierre">Chargement du profil…</p></Card>
  if (!student) return <Card><p className="text-sm text-pierre">Étudiant introuvable.</p></Card>

  const attendanceRate = progress?.presenceRate ?? 0
  const resumeCount = resumes.length
  const avgGrade = submissions.filter((s) => s.grade != null).length > 0
    ? submissions.filter((s) => s.grade != null).reduce((sum, s) => sum + (s.grade ?? 0), 0) /
      submissions.filter((s) => s.grade != null).length
    : null
  const currentStreak = streaks.length > 0 ? Math.max(...streaks.map((s) => s.consecutive_weeks)) : 0
  const grades: GradeRow[] = submissions
    .filter((s) => s.grade != null)
    .map((s) => ({
      courseTitle: s.assignment_id ?? '—',
      week: 0,
      grade: s.grade,
      feedback: s.feedback,
    }))

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            url={student.avatar_url}
            firstName={student.first_name}
            lastName={student.last_name}
            size={64}
            badgeType={student.active_badge}
          />
          <div>
            <h3 className="font-display text-lg text-bordeaux">
              {student.first_name} {student.last_name}
            </h3>
            <p className="text-xs text-pierre">{student.email}</p>
            {student.class && (
              <p className="mt-0.5 text-xs text-olive font-medium">
                Classe {student.class.name} (Niveau {student.class.level})
              </p>
            )}
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="text-pierre hover:text-bordeaux">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
        )}
      </div>

      {/* Infos personnelles */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {student.phone && (
          <div>
            <span className="text-pierre">Téléphone :</span>{' '}
            <span className="text-bordeaux font-medium">{student.phone}</span>
          </div>
        )}
        {student.tribe && (
          <div>
            <span className="text-pierre">Tribu :</span>{' '}
            <span className="text-bordeaux font-medium">{student.tribe}</span>
          </div>
        )}
        {student.department && (
          <div>
            <span className="text-pierre">Département :</span>{' '}
            <span className="text-bordeaux font-medium">{student.department}</span>
          </div>
        )}
        <div>
          <span className="text-pierre">Statut :</span>{' '}
          <span className={`font-medium ${student.active ? 'text-olive' : 'text-red-600'}`}>
            {student.active ? 'Actif' : 'Inactif'}
          </span>
        </div>
        <div>
          <span className="text-pierre">Rôle :</span>{' '}
          <span className="text-bordeaux font-medium">{student.role}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Présence', value: `${Math.round(attendanceRate)}%` },
          { label: 'Résumés', value: String(resumeCount) },
          { label: 'Note moy.', value: avgGrade != null ? `${avgGrade.toFixed(1)}/20` : '—' },
          { label: 'Série', value: `${currentStreak}j` },
        ].map((s) => (
          <div key={s.label} className="rounded-card bg-or/10 p-2 text-center">
            <p className="text-[10px] text-pierre">{s.label}</p>
            <p className="text-sm font-bold text-bordeaux">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Badges gagnés */}
      {badges.length > 0 && (
        <div>
          <p className="text-xs font-medium text-bordeaux mb-2">Badges ({badges.length})</p>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <Badge key={b.badge_type} type={b.badge_type} size={40} />
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {grades.length > 0 && (
        <div>
          <p className="text-xs font-medium text-bordeaux mb-2">Notes des devoirs</p>
          <div className="space-y-1">
            {grades.slice(0, 10).map((g, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-pierre truncate">{g.courseTitle}</span>
                <span className="font-bold text-or ml-2">{g.grade}/20</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note de méditation */}
      <div className="flex items-center justify-between text-xs border-t border-pierre/10 pt-3">
        <span className="text-pierre">Note de méditation :</span>
        <span className="font-bold text-bordeaux">
          {student.meditation_grade != null ? `${student.meditation_grade}/20` : '—'}
        </span>
      </div>
    </Card>
  )
}
