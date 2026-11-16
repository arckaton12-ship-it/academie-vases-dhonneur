import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StreakFlame } from '@/components/StreakFlame'
import { XpBar } from '@/components/XpBar'
import { AttendanceGauge } from '@/components/AttendanceGauge'
import { CoursePath } from '@/components/CoursePath'
import { BadgePath } from '@/components/BadgePath'
import { Leaderboard } from '@/components/Leaderboard'
import { DailyGoalCard } from '@/components/student/DailyGoalCard'
import { BADGES, BADGE_ORDER, isBadgeKey } from '@/lib/badges'
import { useStudentDashboardContext } from '@/pages/student/StudentDashboardContext'

export function ParcoursTab() {
  const { earnedBadgeKeys, badgeProgress, earnedBadges, weeks, progress, xpData, xpStats, dailyGoal, updateDailyGoal, allCourses, course, currentWeek, followed, handleSelectCourse, mascotMood, handleSelectActiveBadge, openBadgeDrawer, profile, setTab } = useStudentDashboardContext()

        const nextBadgeKey = BADGE_ORDER.find(k => !earnedBadgeKeys.has(k))
        const nextBadgeMeta = nextBadgeKey && isBadgeKey(nextBadgeKey) ? BADGES[nextBadgeKey] : null
        const nextBadgeProgress = nextBadgeKey ? badgeProgress.find(p => p.badge_type === nextBadgeKey) : null
        const recentEarnedBadges = earnedBadges.slice(-5).reverse()
        const totalBadges = BADGE_ORDER.length
        const earnedCount = earnedBadges.length
        const currentCourse = course ?? allCourses.find(c => c.week === currentWeek) ?? null
        const currentCourseDone = currentCourse ? followed.some(c => c.id === currentCourse.id) : false

  return (
          <div className="space-y-5">
            {xpStats && (
              <DailyGoalCard
                todayXp={xpStats.todayXp}
                weekXp={xpStats.weekXp}
                goal={dailyGoal}
                streakWeeks={weeks}
                hasCourse={Boolean(currentCourse)}
                courseDone={currentCourseDone}
                onGoalChange={updateDailyGoal}
                onAction={(target) => {
                  if (target === 'course' && currentCourse) {
                    setTab('academie')
                    void handleSelectCourse(currentCourse)
                    return
                  }
                  setTab(target === 'course' ? 'academie' : 'devoirs')
                }}
              />
            )}

            <Card>
              <CardTitle>Statut gamification</CardTitle>
              <div className="mt-3 space-y-4">
                <div className="flex items-center gap-3">
                  <StreakFlame weeks={weeks} />
                  <div className="flex-1">
                    <AttendanceGauge weeks={weeks} presenceRate={progress?.presenceRate ?? undefined} />
                  </div>
                </div>

                {xpData && (
                  <XpBar
                    xp={xpData.xp}
                    level={xpData.level}
                    levelLabel={xpData.levelLabel}
                    nextLevelLabel={xpData.nextLevelLabel}
                    xpInLevel={xpData.xpInLevel}
                    xpForNextLevel={xpData.xpForNextLevel}
                  />
                )}

                <div className="flex items-center justify-between rounded-lg border border-or/20 bg-or/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏅</span>
                    <span className="text-sm font-semibold text-bordeaux dark:text-or">
                      {earnedCount}/{totalBadges} badges débloqués
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {recentEarnedBadges.map((key) => (
                      <div
                        key={key}
                        className="h-6 w-6 rounded-full border-2 border-or bg-parchemin"
                        title={isBadgeKey(key) ? BADGES[key].label : key}
                      >
                        <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                          <circle cx="24" cy="24" r="22" fill="#F8F4E9" stroke="#CFAF5B" strokeWidth="2.5" />
                        </svg>
                      </div>
                    ))}
                    {earnedCount === 0 && (
                      <span className="text-[10px] text-pierre italic">Aucun badge encore</span>
                    )}
                  </div>
                </div>

                {nextBadgeKey && nextBadgeMeta && (
                  <div className="rounded-lg border border-or/20 bg-gradient-to-br from-or/5 to-or/10 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-or-texte dark:text-or mb-1.5">Prochain badge à débloquer</p>
                    <p className="text-sm font-semibold text-bordeaux dark:text-slate-100">{nextBadgeMeta.label}</p>
                    <p className="text-[11px] text-pierre dark:text-slate-400 mb-2">{nextBadgeMeta.description}</p>
                    {nextBadgeProgress && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-pierre/10 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-or transition-all duration-500"
                            style={{ width: `${Math.min((nextBadgeProgress.current / nextBadgeProgress.target) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-or-texte dark:text-or">
                          {nextBadgeProgress.current}/{nextBadgeProgress.target}
                        </span>
                      </div>
                    )}
                    {!nextBadgeProgress && (
                      <p className="text-[10px] text-pierre italic">Continue comme ça !</p>
                    )}
                  </div>
                )}

                {!nextBadgeKey && earnedCount > 0 && (
                  <div className="rounded-lg border border-olive/30 bg-olive/5 px-4 py-3 text-center">
                    <p className="text-sm font-semibold text-olive">Tous les badges débloqués ! 🎉</p>
                    <p className="text-[11px] text-pierre">Tu es un vrai Vase d'Honneur.</p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardTitle>Mon parcours</CardTitle>
              <CardDescription className="mt-1 mb-3">
                Suis ton évolution à travers les cours de la session.
              </CardDescription>
              <CoursePath
                courses={allCourses}
                currentWeek={currentWeek}
                completedCourseIds={new Set(followed.map((c) => c.id))}
                onSelectCourse={handleSelectCourse}
                mascotMood={mascotMood}
              />
            </Card>

            <Card>
              <CardTitle>Mon parcours de badges</CardTitle>
              <CardDescription className="mt-1 mb-3">
                Chaque étape franchie dessine ta fidélité. Complète le chemin pour devenir un Vase d'Honneur.
              </CardDescription>
              <BadgePath
                earnedBadgeTypes={earnedBadges}
                badgeProgress={badgeProgress}
                onSelectBadge={handleSelectActiveBadge}
              />
              <div className="mt-4">
                <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={openBadgeDrawer}>
                  Salle des badges →
                </Button>
              </div>
            </Card>

            <Leaderboard currentUserId={profile?.id ?? ''} />
          </div>
  )
}
