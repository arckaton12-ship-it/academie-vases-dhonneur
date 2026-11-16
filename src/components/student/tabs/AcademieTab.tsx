import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { CollapsibleCard } from '@/components/ui/CollapsibleCard'
import { Button } from '@/components/ui/Button'
import { CoursePlayer } from '@/components/CoursePlayer'
import { CertificateView } from '@/components/Certificate'
import { AllQuizzesSection } from '@/components/student/AllQuizzesSection'
import { ProgressStat } from '@/components/student/ProgressStat'
import { DailyGoalCard } from '@/components/student/DailyGoalCard'
import { formatDateFR } from '@/lib/date'
import { useStudentDashboardContext } from '@/pages/student/StudentDashboardContext'

export function AcademieTab() {
  const { course, summary, setSummary, handleSummaryFile, summaryUploading, summaryFileUrl, summaryFileName, resumeFileIsImage, handleRemoveSummaryFile, handleSaveSummary, summarySaving, summarySaved, miniTask, miniTaskResponse, setMiniTaskResponse, miniTaskSaved, miniTaskSaving, handleSaveMiniTask, dailyVerse, allCourses, profile, setActiveQuizId, followedCount, progress, followed, certificates, xpStats, dailyGoal, updateDailyGoal, setTab, weeks } = useStudentDashboardContext()
  const courseDone = course ? followed.some(c => c.id === course.id) : false

  return (
        <div className="space-y-5">
          {xpStats && (
            <DailyGoalCard
              variant="compact"
              todayXp={xpStats.todayXp}
              weekXp={xpStats.weekXp}
              goal={dailyGoal}
              streakWeeks={weeks}
              hasCourse={Boolean(course)}
              courseDone={courseDone}
              onGoalChange={updateDailyGoal}
              onAction={() => setTab('parcours')}
              onOpenParcours={() => setTab('parcours')}
            />
          )}

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-or-texte dark:text-or mb-1">Ton prochain cours</p>
            <CardTitle>{course ? course.title : 'Cours de la semaine'}</CardTitle>
            {course && (
              <CardDescription className="mt-1 mb-4">
                Semaine {course.week} · {course.class?.name ?? 'Ta classe'}
                {course.session_date ? ` · ${formatDateFR(course.session_date)}` : ''}
              </CardDescription>
            )}

            {course ? (
              <>
                <div className="mb-4">
                  <CoursePlayer audioUrl={course.audio_url} audioParts={course.audio_parts} videoUrl={course.video_url} week={course.week} title={course.title} />
                </div>

                <label className="mb-1.5 block text-sm font-medium text-bordeaux">Ton résumé du cours</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ce que je retiens de ce cours…"
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                />
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-bordeaux underline">
                  {summaryUploading ? 'Ajout du fichier…' : 'Importer mon résumé (image, PDF ou Word)'}
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*,application/pdf,.doc,.docx"
                    disabled={summaryUploading}
                    onChange={handleSummaryFile}
                  />
                </label>
                {summaryFileUrl && summaryFileName && (
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-pierre/15 bg-white/60 px-3 py-2 text-sm">
                    {resumeFileIsImage() ? (
                      <a href={summaryFileUrl} target="_blank" rel="noreferrer">
                        <img src={summaryFileUrl} alt="Résumé joint" className="h-16 w-20 rounded object-cover" />
                      </a>
                    ) : (
                      <a href={summaryFileUrl} target="_blank" rel="noreferrer" className="text-xs text-bordeaux underline break-all">
                        {summaryFileName}
                      </a>
                    )}
                    {!resumeFileIsImage() && (
                      <a href={summaryFileUrl} target="_blank" rel="noreferrer" className="text-xs text-bordeaux underline">Télécharger</a>
                    )}
                    <button type="button" onClick={handleRemoveSummaryFile} className="ml-auto text-xs text-red-600 underline">
                      Retirer
                    </button>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={handleSaveSummary}
                    disabled={summarySaving || summaryUploading}
                  >
                    {summarySaving ? 'Enregistrement…' : 'Enregistrer le résumé'}
                  </Button>
                  {summarySaved && <span className="text-xs text-olive">Résumé sauvegardé.</span>}
                </div>

                {miniTask && (
                  <div className="mt-4 rounded-card border border-olive/30 bg-olive/5 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-olive">
                      Mini-tâche de la semaine
                    </p>
                    <p className="mt-1 text-sm text-bordeaux">{miniTask.instruction}</p>
                    <textarea
                      rows={3}
                      value={miniTaskResponse}
                      onChange={(e) => setMiniTaskResponse(e.target.value)}
                      placeholder={
                        miniTaskResponse || miniTaskSaved ? '' : "Raconte comment tu l'as mise en pratique…"
                      }
                      className="mt-2 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        className="!px-3 !py-1.5 text-xs"
                        onClick={handleSaveMiniTask}
                        disabled={miniTaskSaving}
                      >
                        {miniTaskSaving
                          ? 'Enregistrement…'
                          : miniTaskSaved
                            ? 'Réponse enregistrée'
                            : 'Enregistrer ma réponse'}
                      </Button>
                      {miniTaskSaved && <span className="text-xs text-olive">C'est enregistré !</span>}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-card border border-olive/30 bg-olive/5 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-olive">Mise en pratique</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-bordeaux">
                    {course?.mise_en_pratique || course?.description || (
                      <>
                        Cette semaine, identifie une situation où tu as dû agir par la foi. Reviens raconter
                        comment cela s'est passé — ce témoignage fait partie de ta formation.
                      </>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-pierre">Aucun cours publié pour ta classe pour le moment.</p>
            )}
          </Card>

          <CollapsibleCard title="Méditation Biblique du Jour — Verset(s) à Méditer">
            <div className="quote-in relative pl-10">
              <span
                className="absolute left-0 top-1 font-display text-5xl leading-none text-or"
                aria-hidden="true"
              >
                "
              </span>
              {dailyVerse ? (
                <>
                  <p className="font-display text-lg leading-snug text-bordeaux">{dailyVerse.verse_text}</p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-wide text-pierre">
                    {dailyVerse.verse_reference}
                  </p>
                </>
              ) : (
                <p className="text-sm text-pierre italic">
                  Le verset du jour n'est pas encore disponible pour ta classe.
                </p>
              )}
            </div>
          </CollapsibleCard>

          {allCourses.length > 0 && profile?.id && (
            <AllQuizzesSection
              courses={allCourses}
              studentId={profile.id}
              onOpenQuiz={setActiveQuizId}
            />
          )}

          <Card>
            <CardTitle>Ton tableau de bord</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Cours déjà suivis : {followedCount}. Voici ta progression sur la session.
            </CardDescription>
            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <ProgressStat label="Présence" value={`${progress?.presenceRate ?? 0}%`} animated={progress?.presenceRate ?? 0} />
              <ProgressStat label="Résumés faits" value={`${progress?.resumeRate ?? 0}%`} animated={progress?.resumeRate ?? 0} />
              <ProgressStat label="Moyenne exercices & devoirs" value={progress?.averageGrade ?? '—'} />
              <ProgressStat label="Méditation de la Parole" value={progress?.meditationGrade != null ? `${progress.meditationGrade}/20` : '—'} animated={progress?.meditationGrade != null ? Math.round((progress.meditationGrade / 20) * 100) : undefined} />
            </dl>
            {followed.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-sable/60 pt-3 text-sm text-pierre">
                {followed.map((c) => (
                  <li key={c.id}>• Semaine {c.week} — {c.title}</li>
                ))}
              </ul>
            )}
          </Card>

          {certificates.length > 0 && (
            <Card>
              <CardTitle>Ton certificat</CardTitle>
              <CardDescription className="mt-1 mb-4">
                Félicitations pour avoir mené ton cycle à son terme.
              </CardDescription>
              {[...certificates]
                .sort((a, b) => b.cycle - a.cycle)
                .map((cert) => (
                  <CertificateView
                    key={cert.id}
                    certificate={cert}
                    firstName={profile?.first_name ?? ''}
                    lastName={profile?.last_name ?? ''}
                    className="mb-4"
                  />
                ))}
            </Card>
          )}
        </div>
  )
}
