import { useState } from 'react'

interface CollapsibleCardProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function CollapsibleCard({ title, defaultOpen = true, children, className = '' }: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`rounded-xl border border-pierre/15 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800 ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <h3 className="font-display text-sm font-semibold text-bordeaux dark:text-slate-200">{title}</h3>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`shrink-0 text-pierre transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="border-t border-pierre/10 px-4 pb-4 pt-3 dark:border-white/10">{children}</div>}
    </div>
  )
}
