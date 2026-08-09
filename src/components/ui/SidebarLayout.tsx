import { ReactNode } from 'react'
import { Sidebar, SidebarItem } from '@/components/ui/Sidebar'
import { Logo } from '@/components/Logo'

interface SidebarLayoutProps {
  items: SidebarItem[]
  activeKey: string
  onSelect: (key: string) => void
  children: ReactNode
  header?: ReactNode
}

export function SidebarLayout({ items, activeKey, onSelect, children, header }: SidebarLayoutProps) {
  return (
    <div className="relative min-h-screen md:pl-[68px]">
      <Sidebar
        items={items}
        activeKey={activeKey}
        onSelect={onSelect}
        header={header ?? <Logo showText={false} size={28} />}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {children}
      </div>
    </div>
  )
}
