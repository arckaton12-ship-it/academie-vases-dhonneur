import RegistrationStep2 from '@/components/RegistrationStep2'
import { Input } from '@/components/ui/Input'
import { Sidebar, SidebarItem, MobileMenuButton } from '@/components/ui/Sidebar'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { NotificationPrompt } from '@/components/NotificationPrompt'
import { NotificationBanner } from '@/components/NotificationBanner'
import { SectionWatermark } from '@/components/SectionWatermark'
import { VerseReference } from '@/components/VerseReference'
import { DayAccentBand } from '@/components/DayAccentBand'
import { NotificationsBell } from '@/components/NotificationsBell'
import { BadgeDrawer } from '@/components/BadgeDrawer'
import { BadgeEarnModal } from '@/components/BadgeEarnModal'
import { QuizPlayer } from '@/components/QuizPlayer'
import { ClassPicker } from '@/components/ClassPicker'
import { FloatingMascot } from '@/components/FloatingMascot'
import BilanPopup from '@/components/BilanPopup'
import { useStudentDashboardState, type Tab } from './student/useStudentDashboardState'
import { StudentDashboardProvider } from './student/StudentDashboardContext'
import { AcademieTab } from '@/components/student/tabs/AcademieTab'
import { AnnoncesTab } from '@/components/student/tabs/AnnoncesTab'
import { DevoirsTab } from '@/components/student/tabs/DevoirsTab'
import { RevueTab } from '@/components/student/tabs/RevueTab'
import { ParcoursTab } from '@/components/student/tabs/ParcoursTab'
import { ServiceTab } from '@/components/student/tabs/ServiceTab'
import { MessagerieTab } from '@/components/student/tabs/MessagerieTab'
import { ParametresTab } from '@/components/student/tabs/ParametresTab'

export default function StudentDashboard() {
  const state = useStudentDashboardState()
  const { loading, showRegistration, setShowRegistration, profile, setProfile, tab, setTab, swipeHandlers, currentNotif, dismissNotif, mascotMood, unreadByTab, searchOpen, setSearchOpen, notifications, handleMarkNotificationsRead, handleNotificationNavigate, message, badgeDrawerOpen, setBadgeDrawerOpen, earnedBadges, badgeProgress, handleSelectActiveBadge, badgeBusy, celebrateBadge, setCelebrateBadge, activeQuizId, setActiveQuizId, showBilanPopup, bilanPopupData, setShowBilanPopup, setBilanPopupData, searchOverlayRef, searchQuery, setSearchQuery, searchWeek, setSearchWeek, weekOptions, filteredCourses, handleSelectCourse } = state

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
        <div className="space-y-4">
          <div className="skeleton h-9 w-48" />
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-44 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
        </div>
      </div>
    )
  }

  if (showRegistration && profile) {
    return (
      <RegistrationStep2
        profile={{ first_name: profile.first_name, last_name: profile.last_name, avatar_url: profile.avatar_url ?? undefined, tribe: profile.tribe ?? undefined, department: profile.department ?? undefined }}
        onComplete={() => setShowRegistration(false)}
      />
    )
  }

  if (profile && !profile.class_id) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <Logo showText={false} size={48} className="mx-auto" />
            <h1 className="mt-3 font-display text-xl text-bordeaux">Bienvenue dans l'Académie</h1>
            <p className="mt-1 text-sm text-pierre">Choisis ta classe pour commencer ton parcours.</p>
          </div>
          <ClassPicker
            userId={profile.id}
            onPicked={(classId) => setProfile((prev) => prev ? { ...prev, class_id: classId } : prev)}
          />
        </div>
      </div>
    )
  }

  const studentSidebarItems: SidebarItem[] = [
    { key: 'academie', label: 'Académie', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
    { key: 'annonces', label: 'Annonces', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, unread: unreadByTab.annonces },
    { key: 'devoirs', label: 'Devoirs', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, unread: unreadByTab.devoirs },
    { key: 'revue', label: 'Revue', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { key: 'service', label: 'Service', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 21h8m-4-4v4m-4-8a4 4 0 0 1-4-4V4h16v5a4 4 0 0 1-4 4h-4z"/><circle cx="12" cy="7" r="3"/></svg> },
    { key: 'parcours', label: 'Mon Parcours', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg> },
    { key: 'messagerie', label: 'Messagerie', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, unread: unreadByTab.messagerie },
    { key: 'parametres', label: 'Paramètres', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ]

  return (
    <StudentDashboardProvider value={state}>
    <div className="relative min-h-screen md:pl-[68px]">
      {currentNotif && <NotificationBanner notification={currentNotif} onDismiss={dismissNotif} />}
      <FloatingMascot mood={mascotMood} />
      <NotificationPrompt />
      <Sidebar
        items={studentSidebarItems}
        activeKey={tab}
        onSelect={(k) => setTab(k as Tab)}
        header={<Logo showText={false} size={28} />}
      />
      <div className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6" {...swipeHandlers}>
      <SectionWatermark
        kind={tab === 'devoirs' || tab === 'revue' ? 'livre' : tab === 'service' ? 'mains' : 'flamme'}
      />
      <div className="relative z-10 page-enter">
      <DayAccentBand />
      <header className="glass-nav sticky top-0 z-20 mb-4 pb-3 pt-3 md:static md:mb-6 md:border-0 md:bg-transparent md:pt-0 md:shadow-none md:backdrop-blur-none dark:md:bg-transparent">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <MobileMenuButton />
            <Logo showText={false} size={28} className="md:hidden" />
            <Logo showText={false} size={34} className="hidden md:block" />
            <div>
              <h1 className="font-display text-lg text-bordeaux md:text-2xl">Ton espace Académie</h1>
              {profile && (
                <p className="hidden items-center gap-2 text-sm text-pierre md:flex">
                  {profile.first_name} {profile.last_name}
                  <VerseReference />
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-pierre/20 bg-white text-pierre transition-colors hover:border-or/60 hover:text-or"
              aria-label="Rechercher un cours"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <NotificationsBell notifications={notifications} onMarkRead={handleMarkNotificationsRead} onNavigate={handleNotificationNavigate} />
            <Avatar
              url={profile?.avatar_url}
              firstName={profile?.first_name}
              lastName={profile?.last_name}
              size={36}
              onClick={() => setTab('parametres')}
              className="md:hidden"
            />
            <Avatar
              url={profile?.avatar_url}
              firstName={profile?.first_name}
              lastName={profile?.last_name}
              size={40}
              onClick={() => setTab('parametres')}
              className="hidden md:block"
            />
          </div>
        </div>
      </header>

      {message && (
        <p className="mb-4 rounded-md border border-olive/30 bg-olive/5 px-3 py-2 text-sm text-bordeaux">
          {message}
        </p>
      )}


      {tab === 'academie' && <AcademieTab />}

      {tab === 'parcours' && <ParcoursTab />}

      {tab === 'annonces' && <AnnoncesTab />}

      {tab === 'devoirs' && <DevoirsTab />}

      {tab === 'service' && <ServiceTab />}

      {tab === 'revue' && <RevueTab />}

      {tab === 'messagerie' && <MessagerieTab />}

      {tab === 'parametres' && profile && <ParametresTab />}
      {badgeDrawerOpen && (
        <BadgeDrawer
          open={badgeDrawerOpen}
          onClose={() => setBadgeDrawerOpen(false)}
          earnedBadges={earnedBadges}
          activeBadge={profile?.active_badge ?? null}
          badgeProgress={badgeProgress}
          onSelect={handleSelectActiveBadge}
          busy={badgeBusy}
        />
      )}

      {celebrateBadge && (
        <BadgeEarnModal
          badgeType={celebrateBadge}
          onClose={() => setCelebrateBadge(null)}
        />
      )}

      {activeQuizId && (
        <QuizPlayer quizId={activeQuizId} onClose={() => setActiveQuizId(null)} />
      )}

      {showBilanPopup && bilanPopupData && (
        <BilanPopup
          studentId={profile?.id ?? ''}
          studentName={bilanPopupData.studentName}
          weekNumber={bilanPopupData.weekNumber}
          currentBilanDay={bilanPopupData.currentBilanDay}
          missingDays={bilanPopupData.missingDays}
          existingBilan={bilanPopupData.existingBilan}
          onClose={() => { setShowBilanPopup(false); setBilanPopupData(null) }}
        />
      )}

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16"
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false) }}
        >
          <div ref={searchOverlayRef} className="mx-4 w-full max-w-lg rounded-xl border border-pierre/20 bg-parchemin p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-bordeaux">Rechercher un cours</p>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-pierre transition-colors hover:bg-pierre/10"
                aria-label="Fermer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Titre, description… (ex. semaine 3)"
                className="max-w-xs"
                autoFocus
              />
              <select
                value={searchWeek}
                onChange={(e) => setSearchWeek(e.target.value)}
                aria-label="Filtrer par semaine"
                className="rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
              >
                <option value="">Toutes les semaines</option>
                {weekOptions.map((w) => (
                  <option key={w} value={w}>
                    Semaine {w}
                  </option>
                ))}
              </select>
            </div>
            {searchQuery.trim() !== '' || searchWeek !== '' ? (
              <div className="mt-3 max-h-64 overflow-y-auto">
                {filteredCourses.length === 0 ? (
                  <p className="text-sm text-pierre">Aucun cours ne correspond à ta recherche.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {filteredCourses.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => { handleSelectCourse(c); setSearchOpen(false) }}
                          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-pierre/15 px-3 py-2 text-left text-sm transition-colors hover:border-or/60 hover:bg-or/5"
                        >
                          <span className="font-medium text-bordeaux">
                            Semaine {c.week} — {c.title}
                          </span>
                          <span className="shrink-0 text-xs text-pierre">Ouvrir →</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs text-pierre">
                Astuce : tape « semaine 3 » ou un mot du titre pour retrouver un cours.
              </p>
            )}
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
    </StudentDashboardProvider>
  )
}
