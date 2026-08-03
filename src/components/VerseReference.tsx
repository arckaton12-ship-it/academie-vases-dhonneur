import { getQuoteOfDay } from '@/lib/quotes'

interface VerseReferenceProps {
  className?: string
}

export function VerseReference({ className = '' }: VerseReferenceProps) {
  const quote = getQuoteOfDay()
  return (
    <span
      className={`font-mono text-[11px] text-pierre/70 ${className}`}
      title={`« ${quote.text} »`}
    >
      {quote.reference}
    </span>
  )
}
