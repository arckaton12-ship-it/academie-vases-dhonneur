import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Course, Submission } from './courses'

export function exportStudentBulletinPDF(input: {
  filename: string
  studentName: string
  className: string
  courses: Course[]
  submissions: Submission[]
  meditationGrade: number | null
  presenceRate: number
  resumeRate: number
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(248, 244, 233)
  doc.rect(0, 0, pageWidth, 110, 'F')
  doc.setDrawColor(207, 175, 91)
  doc.setLineWidth(2)
  doc.rect(0, 0, pageWidth, 110)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(93, 42, 65)
  doc.text('Académie Vases d\u2019Honneur — Yaoundé', pageWidth / 2, 40, { align: 'center' })

  doc.setFontSize(13)
  doc.text('Bulletin de formation', pageWidth / 2, 62, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(107, 107, 107)
  doc.text(`${input.studentName} — ${input.className}`, pageWidth / 2, 84, { align: 'center' })

  doc.setDrawColor(207, 175, 91)
  doc.setLineWidth(1)
  doc.line(40, 130, pageWidth - 40, 130)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(93, 42, 65)
  doc.text('Suivi par cours', 40, 160)

  const rows = input.courses.map((course) => {
    const sub = input.submissions.find((s) => s.assignment?.course_id === course.id)
    return [
      `Semaine ${course.week} — ${course.title}`,
      sub ? (sub.grade !== null && sub.grade !== undefined ? String(sub.grade) : '—') : 'Non rendu',
      sub?.feedback ?? '',
    ]
  })
  const graded = input.submissions.filter((s) => s.grade !== null && s.grade !== undefined)
  const average = graded.length
    ? (graded.reduce((acc, s) => acc + Number(s.grade), 0) / graded.length).toFixed(2)
    : '—'

  autoTable(doc, {
    head: [['Cours', 'Note /20', 'Appréciation']],
    body: rows,
    startY: 172,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5, textColor: [60, 60, 60] },
    headStyles: { fillColor: [93, 42, 65], textColor: [248, 244, 233], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 244, 233] },
  })

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 260

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(93, 42, 65)
  doc.text(
    `Assiduité : ${input.presenceRate}%   ·   Résumés : ${input.resumeRate}%   ·   Moyenne : ${average}/20   ·   Méditation : ${input.meditationGrade ?? '—'}/20`,
    40,
    finalY + 24
  )

  doc.save(input.filename)
}

export type ExportCell = string | number | null | undefined
export type ExportRow = ExportCell[]

function escapeCsv(value: ExportCell): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToCSV(filename: string, headers: string[], rows: ExportRow[]) {
  const separator = ';'
  const lines = [
    headers.map(escapeCsv).join(separator),
    ...rows.map((row) => row.map(escapeCsv).join(separator)),
  ]
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  })
  triggerDownload(blob, filename)
}

export function exportToPDF(filename: string, title: string, subtitle: string, headers: string[], rows: ExportRow[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(93, 42, 65)
  doc.text(title, 40, 40)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 107, 107)
  doc.text(subtitle, 40, 56)

  doc.setDrawColor(207, 175, 91)
  doc.setLineWidth(1.5)
  doc.line(40, 64, 552, 64)

  autoTable(doc, {
    head: [headers],
    body: rows.map((row) => row.map((cell) => (cell === null || cell === undefined ? '' : String(cell)))),
    startY: 78,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5, textColor: [60, 60, 60] },
    headStyles: { fillColor: [93, 42, 65], textColor: [248, 244, 233], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 244, 233] },
  })

  doc.save(filename)
}
