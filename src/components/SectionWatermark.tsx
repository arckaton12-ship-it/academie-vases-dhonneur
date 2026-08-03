import type { ReactNode } from 'react'

export type SectionWatermarkKind = 'croix' | 'flamme' | 'livre' | 'mains' | 'couronne'

const SYMBOLS: Record<SectionWatermarkKind, ReactNode> = {
  croix: <path d="M100 28 V172 M45 100 H155" />,
  flamme: (
    <>
      <path d="M100 30 C100 58 74 70 74 100 A26 26 0 0 0 126 100 C126 70 100 58 100 30 Z" />
      <path d="M100 126 V160" />
    </>
  ),
  livre: (
    <>
      <path d="M100 62 V142 M34 62 C34 44 60 44 100 62 C140 44 166 44 166 62 V132 C166 150 140 150 100 132 C60 150 34 150 34 132 Z" />
      <path d="M100 142 V150" />
    </>
  ),
  mains: (
    <>
      <path d="M36 128 C36 96 62 88 100 104 C138 88 164 96 164 128 C144 148 122 150 100 140 C78 150 56 148 36 128 Z" />
      <path d="M100 140 V158" />
    </>
  ),
  couronne: (
    <>
      <path d="M44 124 L54 76 L80 102 L100 62 L120 102 L146 76 L156 124 Z" />
      <path d="M44 124 H156 M44 138 H156" />
    </>
  ),
}

interface SectionWatermarkProps {
  kind: SectionWatermarkKind
  className?: string
}

export function SectionWatermark({ kind, className = '' }: SectionWatermarkProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden text-bordeaux opacity-[0.04] ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-1/2 top-1/2 h-[130vmax] w-[130vmax] -translate-x-1/2 -translate-y-1/2"
      >
        {SYMBOLS[kind]}
      </svg>
    </div>
  )
}
