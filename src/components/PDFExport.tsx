import jsPDF from 'jspdf'

interface StudentData {
  firstName: string
  lastName: string
  className: string
  coursesCompleted: number
  coursesTotal: number
  averageGrade: number
  streak: number
  badges: string[]
  attendances: number
  resumes: number
}

export function exportStudentProgressPDF(data: StudentData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(168, 42, 46)
  doc.text('Academie Vases d\'Honneur', pageWidth / 2, 25, { align: 'center' })
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text('Assemblee Eaux Paisibles de Yaounde', pageWidth / 2, 33, { align: 'center' })

  doc.setDrawColor(212, 160, 23)
  doc.setLineWidth(0.5)
  doc.line(20, 40, pageWidth - 20, 40)

  doc.setFontSize(14)
  doc.setTextColor(27, 107, 99)
  doc.text('Parcours de Formation', 20, 52)

  doc.setFontSize(11)
  doc.setTextColor(60, 60, 60)
  let y = 62

  const lines = [
    [`Nom : `, `${data.firstName} ${data.lastName}`],
    [`Classe : `, data.className],
    [`Cours completes : `, `${data.coursesCompleted} / ${data.coursesTotal}`],
    [`Note moyenne : `, `${data.averageGrade.toFixed(1)} / 20`],
    [`Streak : `, `${data.streak} semaines consecutives`],
    [`Presences : `, `${data.attendances}`],
    [`Resumes soumis : `, `${data.resumes}`],
  ]

  doc.setFont('helvetica', 'normal')
  lines.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 55, y)
    y += 8
  })

  if (data.badges.length > 0) {
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(27, 107, 99)
    doc.text('Badges obtenus :', 20, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    data.badges.forEach((badge) => {
      doc.text(`  * ${badge}`, 20, y)
      y += 6
    })
  }

  y += 10
  doc.setDrawColor(212, 160, 23)
  doc.line(20, y, pageWidth - 20, y)
  y += 8
  doc.setFontSize(9)
  doc.setTextColor(130, 130, 130)
  doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR')}`, 20, y)
  doc.text('Academie Vases d\'Honneur', pageWidth - 20, y, { align: 'right' })

  doc.save(`parcours_${data.firstName}_${data.lastName}.pdf`)
}
