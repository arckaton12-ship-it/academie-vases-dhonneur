import { useState, useEffect } from 'react'
import { DarkModeToggle } from '@/components/DarkModeToggle'

export interface SidebarItem {
  key: string
  label: string
  icon: React.ReactNode
}

interface SidebarProps {
  items: SidebarItem[]
  activeKey: string
  onSelect: (key: string) => void
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function Sidebar({ items, activeKey, onSelect, header, footer }: SidebarProps) {
  const [expanded, setExpanded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on resize
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Close mobile sidebar on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header / Logo */}
      {header && (
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3 dark:border-white/5">
          {header}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3" onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item.key)
              setMobileOpen(false)
            }}
            className={`sidebar-item w-full ${activeKey === item.key ? 'active' : ''}`}
            title={!expanded ? item.label : undefined}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
            {expanded && (
              <span className="truncate whitespace-nowrap">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="border-t border-white/10 px-3 py-3 dark:border-white/5">
          {footer}
        </div>
      )}

      {/* Dark mode toggle at bottom */}
      <div className="border-t border-white/10 px-3 py-3 dark:border-white/5">
        <DarkModeToggle />
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-pierre/20 bg-white/80 backdrop-blur-sm md:hidden dark:border-white/10 dark:bg-slate-800/80"
        aria-label="Ouvrir le menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={`sidebar sidebar-expanded md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ transition: 'transform 0.3s ease' }}>
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
          {header}
          <button onClick={() => setMobileOpen(false)} className="text-pierre hover:text-bordeaux dark:text-slate-400 dark:hover:text-or">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                onSelect(item.key)
                setMobileOpen(false)
              }}
              className={`sidebar-item w-full ${activeKey === item.key ? 'active' : ''}`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
              <span className="truncate whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>
        {footer && (
          <div className="border-t border-white/10 px-3 py-3 dark:border-white/5">{footer}</div>
        )}
        <div className="border-t border-white/10 px-3 py-3 dark:border-white/5">
          <DarkModeToggle />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`sidebar ${expanded ? 'sidebar-expanded' : 'sidebar-collapsed'} hidden md:flex`}>
        {sidebarContent}
      </div>
    </>
  )
}

// Shared icon components for sidebar
export function SidebarIcon({ d, strokeColor = 'currentColor' }: { d: string; strokeColor?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}
