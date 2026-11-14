import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Input'
import { DevoirsTab as DevoirsTabBase } from '@/components/DevoirsTab'
import { getMySubmissions, submitAssignment } from '@/lib/courses'
import { formatDate } from '@/lib/date'
import { useStudentDashboardContext } from '@/pages/student/StudentDashboardContext'

export function DevoirsTab() {
  const { assignments, submissions, course, profile, setSubmissions, handleSubmitNotes, notesFiles, setNotesFiles, notesComment, setNotesComment, notesSubmitting, notesMsg, notesIsError, notesSubmissions } = useStudentDashboardContext()

  return (
        <div className="space-y-5">
          <DevoirsTabBase
            assignments={assignments}
            submissions={submissions}
            courseName={course?.title ?? 'Cours actuel'}
            onSubmit={async (assignmentId: string, content: string, file: File | null) => {
              if (!profile) return
              await submitAssignment({
                studentId: profile.id,
                assignmentId,
                content,
                ...(file ? { file } : {}),
              })
              setSubmissions(await getMySubmissions(profile.id))
            }}
          />

          <Card>
            <CardTitle>Notes manuscrites</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Photographie ou scanne tes notes du cours et envoie-les au modérateur : il pourra les
              corriger, les noter et t'écrire un retour.
            </CardDescription>
            {!course ? (
              <p className="text-sm text-pierre">Aucun cours actif pour le moment.</p>
            ) : (
              <form onSubmit={handleSubmitNotes} className="space-y-3">
                <div>
                  <Label htmlFor="notes-files">Photos de tes notes</Label>
                  <input
                    id="notes-files"
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="block w-full text-xs text-pierre file:mr-3 file:rounded-md file:border-0 file:bg-bordeaux file:px-3 file:py-1.5 file:text-xs file:text-parchemin"
                    onChange={(e) => setNotesFiles(Array.from(e.target.files ?? []))}
                  />
                  {notesFiles.length > 0 && (
                    <p className="mt-1 text-xs text-pierre">
                      {notesFiles.length} fichier{notesFiles.length > 1 ? 's' : ''} sélectionné
                      {notesFiles.length > 1 ? 's' : ''}.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="notes-comment">Commentaire libre</Label>
                  <textarea
                    id="notes-comment"
                    rows={3}
                    value={notesComment}
                    onChange={(e) => setNotesComment(e.target.value)}
                    placeholder="Un mot sur ces notes : la partie du cours, une difficulté, une question…"
                    className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                  />
                </div>
                <Button type="submit" disabled={notesSubmitting}>
                  {notesSubmitting ? 'Envoi…' : 'Envoyer mes notes manuscrites'}
                </Button>
                {notesMsg && <p className={`text-sm ${notesIsError ? 'text-red-600' : 'text-olive'}`}>{notesMsg}</p>}
              </form>
            )}

            {notesSubmissions.length > 0 && (
              <ul className="mt-4 space-y-3 border-t border-sable/60 pt-3">
                {notesSubmissions.map((s) => (
                  <li key={s.id} className="rounded-card border border-pierre/15 p-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {(s.attachments ?? (s.file_url ? [s.file_url] : [])).map((url, i) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={url}
                            alt={`Photo de notes ${i + 1}`}
                            className="h-16 w-16 rounded-md object-cover ring-1 ring-or/40"
                          />
                        </a>
                      ))}
                    </div>
                    {s.content && <p className="mt-2 text-pierre">{s.content}</p>}
                    <p className="mt-1 font-mono text-[10px] text-pierre/70">
                      Envoyé le {s.submitted_at ? formatDate(s.submitted_at) : '—'}
                    </p>
                    {s.grade !== null && s.grade !== undefined && (
                      <p className="mt-1 font-medium text-bordeaux">Note : {s.grade}/20</p>
                    )}
                    {s.feedback && <p className="mt-0.5 text-pierre">{s.feedback}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
  )
}
