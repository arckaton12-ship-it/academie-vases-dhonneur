import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { downloadCourseMedia } from '@/components/CoursePlayer'
import { formatDate, formatDateFR } from '@/lib/date'
import { useStudentDashboardContext } from '@/pages/student/StudentDashboardContext'

export function RevueTab() {
  const { gradedReviews, revueFilter, setRevueFilter, revueItems, reflectionByCourse, reflectionDrafts, setReflectionDrafts, reflectionSaving, handleSaveReflection, reflectionMsg, reflectionIsError } = useStudentDashboardContext()

  return (
        <div className="space-y-5">
          <Card>
            <CardTitle>Revue des cours suivis</CardTitle>
            <CardDescription className="mt-1 mb-3">
              L'historique complet de ta session : cours → résumé → correction → réflexion finale.
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'Tout'],
                  ['pending', 'En attente de correction'],
                  ['graded', 'Corrigés'],
                ] as ['all' | 'pending' | 'graded', string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRevueFilter(key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    revueFilter === key ? 'bg-bordeaux text-parchemin' : 'text-pierre hover:bg-bordeaux/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>

          {gradedReviews.length > 0 && (
            <Card>
              <CardTitle>Progression des notes</CardTitle>
              <CardDescription className="mt-1 mb-3">
                L'évolution de tes notes de résumés au fil des semaines.
              </CardDescription>
              <div className="space-y-2">
                {gradedReviews.map((r) => {
                  const grade = Number(r.resume.grade) || 0
                  return (
                    <div key={r.resume.id} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 font-mono text-xs text-pierre">
                        Semaine {r.course.week}
                      </span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-pierre/15">
                        <div
                          className="h-full rounded-full bg-or"
                          style={{ width: `${Math.min(100, (grade / 20) * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right font-display text-sm text-bordeaux">
                        {grade}/20
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {revueItems.length === 0 ? (
            <Card>
              <p className="text-sm text-pierre">
                Aucun cours suivi pour le moment : valide ta présence sur un cours pour le retrouver ici.
              </p>
            </Card>
          ) : (
            revueItems.map(({ course: c, rev }) => {
              const reflection = reflectionByCourse.get(c.id)
              const graded =
                rev !== null && rev.resume.grade !== null && rev.resume.grade !== undefined
              const draft = reflectionDrafts[c.id] ?? reflection?.content ?? ''
              const saving = reflectionSaving[c.id]
              return (
                <Card key={c.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle>
                        Semaine {c.week} — {c.title}
                      </CardTitle>
                      {c.session_date && (
                        <CardDescription className="mt-0.5">{formatDateFR(c.session_date)}</CardDescription>
                      )}
                    </div>
                    {graded ? (
                      <span className="rounded-full bg-olive/15 px-2.5 py-1 text-xs font-medium text-olive">
                        Corrigé — {rev.resume.grade}/20
                      </span>
                    ) : (
                      <span className="rounded-full bg-or/15 px-2.5 py-1 text-xs font-medium text-or-texte dark:text-or">
                        En attente de correction
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-3">
                    <div className="rounded-md border border-pierre/15 bg-white/50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-bordeaux">Ton résumé</p>
                      {rev && rev.resume.content ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-pierre">{rev.resume.content}</p>
                      ) : (
                        <p className="mt-1 text-sm italic text-pierre/70">Pas encore de résumé écrit.</p>
                      )}
                      {rev?.resume.file_url && rev.resume.file_name && (
                        <div className="mt-2">
                          {/\.(png|jpe?g|gif|webp|bmp)$/i.test(rev.resume.file_name) ? (
                            <a href={rev.resume.file_url} target="_blank" rel="noreferrer">
                              <img src={rev.resume.file_url} alt="Résumé joint" className="h-16 w-20 rounded object-cover" />
                            </a>
                          ) : (
                            <a href={rev.resume.file_url} target="_blank" rel="noreferrer" className="text-xs text-bordeaux underline break-all">
                              Pièce jointe : {rev.resume.file_name}
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {graded && (
                      <div className="rounded-md border border-olive/30 bg-olive/5 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-olive">Correction</p>
                        <p className="mt-1 text-sm text-pierre">
                          Note :{' '}
                          <span className="font-display font-semibold text-bordeaux">
                            {rev.resume.grade}/20
                          </span>
                          {rev.resume.feedback ? (
                            <span className="mt-0.5 block">Appréciation : {rev.resume.feedback}</span>
                          ) : null}
                        </p>
                      </div>
                    )}

                    {(c.audio_url || (c.audio_parts && c.audio_parts.length > 0) || c.video_url) && (
                      <div className="flex flex-wrap gap-2">
                        {c.audio_url && (
                          <Button
                            variant="ghost"
                            className="!px-3 !py-1.5 text-xs underline"
                            onClick={() =>
                              downloadCourseMedia(c.audio_url as string, `cours-semaine-${c.week}.mp3`)
                            }
                          >
                            Telecharger l'audio
                          </Button>
                        )}
                        {!c.audio_url && c.audio_parts && c.audio_parts.length > 0 && (
                          <Button
                            variant="ghost"
                            className="!px-3 !py-1.5 text-xs underline"
                            onClick={() =>
                              downloadCourseMedia(c.audio_parts![0].audio as string, `${c.title || 'cours'} - ${c.audio_parts![0].nom || 'audio'}.mp3`)
                            }
                          >
                            Telecharger l'audio
                          </Button>
                        )}
                        {c.video_url && (
                          <a
                            href={c.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-pierre/25 px-3 py-1.5 text-xs text-bordeaux underline"
                          >
                            Revoir la vidéo
                          </a>
                        )}
                      </div>
                    )}

                    {graded && (
                      <div className="rounded-card border border-or/40 bg-parchemin p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-bordeaux">
                          Clôture de la session
                        </p>
                        <p className="mt-1 text-sm text-pierre">
                          « Que retenez-vous de cette session qui s'achève ? »
                        </p>
                        <textarea
                          rows={2}
                          value={draft}
                          onChange={(e) => setReflectionDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder={reflection?.content ? '' : 'Ta réflexion, en quelques mots…'}
                          className="mt-2 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            className="!px-3 !py-1.5 text-xs"
                            disabled={saving}
                            onClick={() => handleSaveReflection(c)}
                          >
                            {saving ? 'Enregistrement…' : 'Enregistrer ma réflexion'}
                          </Button>
                          {reflection?.answered_at && (
                            <span className="text-xs text-olive">
                              Réfléchi le {formatDate(reflection.answered_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })
          )}
          {reflectionMsg && <p className={`text-sm ${reflectionIsError ? 'text-red-600' : 'text-olive'}`}>{reflectionMsg}</p>}
        </div>
  )
}
