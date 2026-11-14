import { SidebarLayout } from '@/components/ui/SidebarLayout'
import { MobileMenuButton } from '@/components/ui/Sidebar'
import { SectionWatermark } from '@/components/SectionWatermark'
import { DayAccentBand } from '@/components/DayAccentBand'
import { Logo } from '@/components/Logo'
import { VerseReference } from '@/components/VerseReference'
import { AdminDashboardProvider } from './admin/AdminDashboardContext'
import { useAdminDashboardState, type Section } from './admin/useAdminDashboardState'
import { VueSection } from '@/components/admin/sections/VueSection'
import { ExportSection } from '@/components/admin/sections/ExportSection'
import { ParametresSection } from '@/components/admin/sections/ParametresSection'
import { ClassesSection } from '@/components/admin/sections/ClassesSection'
import { CoursSection } from '@/components/admin/sections/CoursSection'
import { NotationSection } from '@/components/admin/sections/NotationSection'
import { EtudiantsSection } from '@/components/admin/sections/EtudiantsSection'
import { ModerateursSection } from '@/components/admin/sections/ModerateursSection'
import { AdminClasseSectionWrapper } from '@/components/admin/sections/AdminClasseSectionWrapper'
import { MeditationSection } from '@/components/admin/sections/MeditationSection'
import { MessagerieSection } from '@/components/admin/sections/MessagerieSection'
import { QuizSection } from '@/components/admin/sections/QuizSection'
import { AnnoncesSection } from '@/components/admin/sections/AnnoncesSection'
import { DemandesSection } from '@/components/admin/sections/DemandesSection'

const sectionIcons: Record<string, React.ReactNode> = {
  vue: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  gestion: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  cours_quiz: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  notes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  messagerie: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  annonces: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  export: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  parametres: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  classes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  cours: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  notation: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  etudiants: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  moderateurs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  admin_classe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  meditation: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  quiz: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  demandes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
}

export default function AdminDashboard() {
  const state = useAdminDashboardState()
  const {
    section,
    setSection,
    accessMsg,
    setAccessMsg,
    moderatorMsg,
    setModeratorMsg,
    accountMsg,
    setAccountMsg,
    adminProfile,
    error,
    adminSections,
  } = state

  return (
    <AdminDashboardProvider value={state}>
    <SidebarLayout
      items={adminSections.map(([k, label]) => ({ key: k, label, icon: sectionIcons[k] }))}
      activeKey={section}
      onSelect={(k) => { setSection(k as Section); setAccessMsg(null); setModeratorMsg(null); setAccountMsg(null) }}
    >
      <SectionWatermark kind="croix" />
      <div className="relative z-10 page-enter">
      <DayAccentBand />
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <Logo showText={false} size={34} />
          <div>
            <h1 className="font-display text-2xl text-bordeaux">Administration</h1>
            {adminProfile && (
              <p className="flex items-center gap-2 text-sm text-pierre">
                {adminProfile.first_name} {adminProfile.last_name}
                <VerseReference />
              </p>
            )}
          </div>
        </div>
      </header>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {accessMsg && <p className="mb-4 text-sm text-olive">{accessMsg}</p>}

        {section === 'vue' && <VueSection />}

        {section === 'export' && <ExportSection />}

        {section === 'parametres' && <ParametresSection />}

        {section === 'classes' && <ClassesSection />}

        {section === 'cours' && <CoursSection />}

        {section === 'notation' && <NotationSection />}

        {section === 'etudiants' && <EtudiantsSection />}

        {section === 'moderateurs' && <ModerateursSection />}

        {section === 'admin_classe' && <AdminClasseSectionWrapper />}

        {section === 'meditation' && <MeditationSection />}

        {section === 'messagerie' && <MessagerieSection />}

        {section === 'quiz' && <QuizSection />}

        {section === 'annonces' && <AnnoncesSection />}

        {section === 'demandes' && <DemandesSection />}

      </div>
    </SidebarLayout>
    </AdminDashboardProvider>
  )
}
