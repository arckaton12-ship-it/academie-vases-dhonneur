import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

interface BulletinData {
  student: {
    first_name: string
    last_name: string
    email: string
    class_name: string
    meditation_grade: number | null
  }
  resumes: { course_title: string; week: number; grade: number; feedback: string | null }[]
  submissions: { type: string; grade: number; feedback: string | null }[]
  quizzes: { quiz_title: string; score: number; is_passed: boolean }[]
  avg_resume: number | null
  avg_submission: number | null
  avg_quiz: number | null
  attendance_rate: number
  total_courses: number
  attended_courses: number
  streak: { consecutive_weeks: number } | null
  meditation_grade: number | null
  general_average: number | null
}

interface BulletinPDFProps {
  studentId: string
  studentName?: string
}

export function BulletinPDF({ studentId, studentName }: BulletinPDFProps) {
  const [loading, setLoading] = useState(false)

  const generate = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_student_bulletin', { p_student_id: studentId })
      if (error) throw error
      if (!data) {
        alert('Les données du bulletin ne sont pas disponibles pour cet étudiant.')
        return
      }

      const d = data as BulletinData
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const w = 210
      const margin = 15

      // ─── Border ───
      doc.setDrawColor(27, 107, 99)
      doc.setLineWidth(1.5)
      doc.rect(8, 8, w - 16, 297 - 16)
      doc.setDrawColor(212, 160, 23)
      doc.setLineWidth(0.5)
      doc.rect(10, 10, w - 20, 297 - 20)

      // ─── Header ───
      doc.setFontSize(20)
      doc.setTextColor(27, 107, 99)
      doc.text('ACADEMIE VASES D\'HONNEUR', w / 2, 25, { align: 'center' })

      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text('Bulletin de Notes', w / 2, 33, { align: 'center' })

      // Line
      doc.setDrawColor(212, 160, 23)
      doc.setLineWidth(0.8)
      doc.line(margin, 38, w - margin, 38)

      // ─── Student Info ───
      let y = 46
      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)

      doc.text(`Nom : ${d.student.last_name} ${d.student.first_name}`, margin, y)
      doc.text(`Classe : ${d.student.class_name}`, w / 2, y)
      y += 7
      doc.text(`Email : ${d.student.email}`, margin, y)
      doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, w / 2, y)

      y += 10
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(margin, y, w - margin, y)
      y += 8

      // ─── General Average ───
      doc.setFontSize(14)
      doc.setTextColor(27, 107, 99)
      const avg = d.general_average ?? 0
      doc.text(`Moyenne Generale : ${avg.toFixed(2)} / 20`, w / 2, y, { align: 'center' })
      y += 4

      // Grade indicator
      const gradeColor: [number, number, number] = avg >= 16 ? [34, 139, 34] : avg >= 10 ? [27, 107, 99] : [168, 42, 46]
      doc.setFillColor(...gradeColor)
      doc.roundedRect(w / 2 - 25, y, 50, 10, 3, 3, 'F')
      doc.setFontSize(12)
      doc.setTextColor(255, 255, 255)
      doc.text(avg >= 10 ? 'ADMISSIBLE' : 'NON ADMISSIBLE', w / 2, y + 7, { align: 'center' })
      y += 16

      // ─── Grades Table ───
      doc.setFontSize(11)
      doc.setTextColor(27, 107, 99)
      doc.text('RECAPITULATIF DES NOTES', margin, y)
      y += 3

      doc.setFillColor(27, 107, 99)
      doc.rect(margin, y, w - 2 * margin, 8, 'F')
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text('Matiere', margin + 3, y + 5.5)
      doc.text('Note', w - margin - 20, y + 5.5, { align: 'right' })
      doc.text('Appreciation', w / 2, y + 5.5, { align: 'center' })
      y += 10

      const addRow = (label: string, grade: number | null, feedback?: string | null) => {
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFillColor(245, 245, 245)
        doc.rect(margin, y - 4, w - 2 * margin, 8, 'F')
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        doc.text(label, margin + 3, y + 1)
        doc.setTextColor(27, 107, 99)
        doc.text(grade !== null ? `${grade.toFixed(1)}/20` : '—', w - margin - 15, y + 1, { align: 'right' })
        if (feedback) {
          doc.setTextColor(100, 100, 100)
          doc.text(feedback.substring(0, 50), w / 2, y + 1, { align: 'center' })
        }
        y += 8
      }

      // Resumes
      if (d.resumes && d.resumes.length > 0) {
        d.resumes.forEach((r) => {
          addRow(`Resume: ${r.course_title} (S${r.week})`, r.grade, r.feedback)
        })
      }

      // Submissions
      if (d.submissions && d.submissions.length > 0) {
        d.submissions.forEach((s) => {
          addRow(`Devoir (${s.type})`, s.grade, s.feedback)
        })
      }

      // Quizzes
      if (d.quizzes && d.quizzes.length > 0) {
        d.quizzes.forEach((q) => {
          addRow(`Quiz: ${q.quiz_title}`, q.score, q.is_passed ? 'Reussi' : 'Echoue')
        })
      }

      // Meditation
      addRow('Meditation', d.meditation_grade)

      // ─── Summary ───
      y += 5
      if (y > 240) { doc.addPage(); y = 20 }

      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, w - margin, y)
      y += 8

      doc.setFontSize(11)
      doc.setTextColor(27, 107, 99)
      doc.text('STATISTIQUES', margin, y)
      y += 8

      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      const stats = [
        ['Moyenne resumes', d.avg_resume !== null ? `${d.avg_resume}/20` : '—'],
        ['Moyenne devoirs', d.avg_submission !== null ? `${d.avg_submission}/20` : '—'],
        ['Moyenne quiz', d.avg_quiz !== null ? `${d.avg_quiz}/20` : '—'],
        ['Taux de presence', `${d.attendance_rate}% (${d.attended_courses}/${d.total_courses})`],
        ['Méditation semaines', d.streak ? `${d.streak.consecutive_weeks}` : '0'],
      ]

      stats.forEach(([label, value]) => {
        doc.text(label, margin + 3, y)
        doc.text(value, w - margin - 15, y, { align: 'right' })
        y += 6
      })

      // ─── Footer ───
      y += 10
      if (y > 250) { doc.addPage(); y = 20 }

      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('Academie Vases d\'Honneur - Yaounde', w / 2, 280, { align: 'center' })
      doc.text(`Document genere le ${new Date().toLocaleDateString('fr-FR')}`, w / 2, 285, { align: 'center' })

      // Save
      const fileName = `Bulletin_${d.student.last_name}_${d.student.first_name}.pdf`
      doc.save(fileName)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur lors de la generation du bulletin')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  return (
    <Button variant="outline" onClick={generate} disabled={loading} className="!px-3 !py-1.5 text-xs">
      {loading ? 'Generation...' : `Bulletin PDF${studentName ? ` - ${studentName}` : ''}`}
    </Button>
  )
}
