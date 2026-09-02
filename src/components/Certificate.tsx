import { jsPDF } from 'jspdf'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'
import { sanitizeForPdf } from '@/lib/pdfFonts'
import type { Certificate } from '@/lib/courses'

interface CertificateViewProps {
  certificate: Certificate
  firstName: string
  lastName: string
  className?: string
}

const CYCLE_LABELS: Record<number, string> = {
  1: 'Classe 1',
  2: 'Classe 2',
  3: 'Classe 3',
}

const CYCLE_VERSETS: Record<number, string> = {
  1: 'Que la Parole demeure en toi comme une lampe sur le sentier.',
  2: 'Confie à l\u2019Éternel tes œuvres, et tes projets réussiront.',
  3: 'Sois fort et courageux, car l\u2019Éternel, ton Dieu, est avec toi.',
}

const VERSET_REFERENCES: Record<number, string> = {
  1: 'Psaume 119,105',
  2: 'Proverbes 16,3',
  3: 'Josué 1,9',
}

export function CertificateView({ certificate, firstName, lastName, className = '' }: CertificateViewProps) {
  const label = CYCLE_LABELS[certificate.cycle] ?? `Cycle ${certificate.cycle}`
  const date = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  async function downloadPdf() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    doc.setFillColor(248, 244, 233)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    doc.setDrawColor(207, 175, 91)
    doc.setLineWidth(2.5)
    doc.rect(32, 32, pageWidth - 64, pageHeight - 64)

    doc.setDrawColor(93, 42, 65)
    doc.setLineWidth(0.8)
    doc.rect(40, 40, pageWidth - 80, pageHeight - 80)

    // Filigrane : croix subtile derrière le contenu
    doc.setDrawColor(214, 201, 178)
    doc.setLineWidth(4)
    doc.line(pageWidth / 2, 70, pageWidth / 2, pageHeight - 70)
    doc.line(pageWidth / 2 - 60, 220, pageWidth / 2 + 60, 220)
    doc.setLineWidth(0.8)

    doc.setFont('times', 'italic')
    doc.setFontSize(14)
    doc.setTextColor(93, 42, 65)
    doc.text(sanitizeForPdf('Académie Vases d\u2019Honneur — Yaoundé'), pageWidth / 2, 84, { align: 'center' })

    // Couronne
    const cx = pageWidth / 2
    doc.setFillColor(207, 175, 91)
    doc.setDrawColor(93, 42, 65)
    doc.triangle(cx, 120, cx - 18, 98, cx - 27, 120, 'FD')
    doc.triangle(cx, 120, cx + 18, 98, cx + 27, 120, 'FD')
    doc.triangle(cx, 120, cx - 5, 90, cx + 5, 90, 'FD')
    doc.roundedRect(cx - 29, 120, 58, 6, 2, 2, 'FD')

    doc.setFont('times', 'bold')
    doc.setFontSize(26)
    doc.setTextColor(93, 42, 65)
    doc.text(sanitizeForPdf('Certificat de fin de cycle'), pageWidth / 2, 160, { align: 'center' })

    doc.setDrawColor(207, 175, 91)
    doc.setLineWidth(1)
    doc.line(pageWidth / 2 - 120, 172, pageWidth / 2 + 120, 172)

    doc.setFont('times', 'normal')
    doc.setFontSize(13)
    doc.setTextColor(107, 107, 107)
    doc.text(sanitizeForPdf('est décerné à'), pageWidth / 2, 206, { align: 'center' })

    doc.setFont('times', 'bold')
    doc.setFontSize(30)
    doc.setTextColor(93, 42, 65)
    doc.text(sanitizeForPdf(`${firstName} ${lastName}`), pageWidth / 2, 244, { align: 'center' })

    doc.setFont('times', 'normal')
    doc.setFontSize(13)
    doc.setTextColor(107, 107, 107)
    const body = doc.splitTextToSize(
      sanitizeForPdf(`pour avoir mené à son terme le cycle de formation ${label}, avec assiduité, fidélité et honneur.`),
      pageWidth - 240
    )
    doc.text(body, pageWidth / 2, 286, { align: 'center' })

    const verset = CYCLE_VERSETS[certificate.cycle] ?? CYCLE_VERSETS[1]
    const reference = VERSET_REFERENCES[certificate.cycle] ?? ''
    const versetY = 286 + body.length * 16 + 18
    doc.setFont('times', 'italic')
    doc.setFontSize(13)
    doc.setTextColor(93, 42, 65)
    doc.text(sanitizeForPdf(`« ${verset} »`), pageWidth / 2, versetY, { align: 'center' })
    if (reference) {
      doc.setFontSize(11)
      doc.setTextColor(107, 107, 107)
      doc.text(sanitizeForPdf(reference), pageWidth / 2, versetY + 16, { align: 'center' })
    }

    if (certificate.number) {
      doc.setFont('times', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(107, 107, 107)
      doc.text(sanitizeForPdf(`N° ${certificate.number}`), pageWidth - 64, 60, { align: 'right' })
    }

    doc.setFont('times', 'italic')
    doc.setFontSize(12)
    doc.setTextColor(93, 42, 65)
    doc.text(sanitizeForPdf(date), pageWidth / 2, pageHeight - 110, { align: 'center' })

    doc.setDrawColor(93, 42, 65)
    doc.setLineWidth(0.8)
    doc.line(pageWidth / 2 - 90, pageHeight - 100, pageWidth / 2 + 90, pageHeight - 100)
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.text(sanitizeForPdf('La direction de l\u2019Académie'), pageWidth / 2, pageHeight - 88, { align: 'center' })

    doc.save(`certificat-${label.replace(/\s/g, '-').toLowerCase()}.pdf`)
  }

  return (
    <div className={`${className}`}>
      <div className="relative border-2 border-or bg-parchemin px-8 py-10 text-center shadow-sm">
        <div className="absolute inset-2 border border-bordeaux/60" aria-hidden="true" />
        <CrownWatermark />
        {certificate.number && (
          <p className="absolute right-4 top-3 font-mono text-[11px] text-pierre" aria-label="Numéro du certificat">
            N° {certificate.number}
          </p>
        )}
        <div className="relative">
          <div className="flex justify-center">
            <CrownMark />
          </div>
          <div className="mt-2 flex justify-center">
            <Logo size={40} />
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-bordeaux">Académie Vases d'Honneur — Yaoundé</p>
          <h3 className="mt-4 font-display text-2xl text-bordeaux">Certificat de fin de cycle</h3>
          <div className="mx-auto mt-3 h-px w-48 bg-or" />
          <p className="mt-5 text-sm text-pierre">est décerné à</p>
          <p className="mt-2 font-display text-3xl text-bordeaux">{firstName} {lastName}</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-pierre">
            pour avoir mené à son terme le cycle de formation {label}, avec assiduité, fidélité et honneur.
          </p>
          <p className="mt-5 font-display italic leading-snug text-bordeaux">
            « {CYCLE_VERSETS[certificate.cycle] ?? CYCLE_VERSETS[1]} »
          </p>
          {VERSET_REFERENCES[certificate.cycle] && (
            <p className="mt-1 font-mono text-[11px] text-pierre">
              {VERSET_REFERENCES[certificate.cycle]}
            </p>
          )}
          <p className="mt-6 font-mono text-xs text-bordeaux">{date}</p>
          <div className="mx-auto mt-8 h-px w-44 bg-bordeaux/50" />
          <p className="mt-1 text-xs text-pierre">La direction de l'Académie</p>
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <Button type="button" variant="outline" onClick={downloadPdf}>
          Télécharger le certificat (PDF)
        </Button>
      </div>
    </div>
  )
}

function CrownWatermark() {
  return (
    <svg
      viewBox="0 0 200 140"
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-auto -translate-x-1/2 -translate-y-1/2 text-bordeaux opacity-[0.05]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M40 96 L54 44 L84 74 L100 34 L116 74 L146 44 L160 96 Z" />
      <path d="M40 96 H160 M40 112 H160" />
    </svg>
  )
}

function CrownMark() {
  return (
    <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden="true">
      <path
        d="M6 31 L10 15 L21 24 L32 8 L43 24 L54 15 L58 31 Z"
        fill="#CFAF5B"
        stroke="#5D2A41"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect x="6" y="30" width="52" height="5" rx="2" fill="#CFAF5B" stroke="#5D2A41" strokeWidth="1.2" />
      <circle cx="32" cy="6" r="3" fill="#5D2A41" />
      <circle cx="16" cy="11" r="2" fill="#5D2A41" opacity="0.85" />
      <circle cx="48" cy="11" r="2" fill="#5D2A41" opacity="0.85" />
    </svg>
  )
}
