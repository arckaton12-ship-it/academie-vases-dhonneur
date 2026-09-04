import { useState, useEffect, useCallback } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { getCourseQuizzes, createQuiz, updateQuiz, deleteQuiz, getQuizWithQuestions, getAdminQuizQuestions, duplicateQuiz, getAllQuizzes, type Quiz, type AdminQuizListItem } from '@/lib/courses'
import { supabase } from '@/lib/supabase'

interface QuizTabProps {
  courses: { id: string; title: string; class_id?: string | null }[]
}

interface QuizQuestionDraft {
  question_text: string
  options: string[]
  correct_option_index: number
  points: number
}

export function QuizTab({ courses }: QuizTabProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTimeLimit, setNewTimeLimit] = useState('')
  const [newPassingScore, setNewPassingScore] = useState('10')
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([])
  const [saving, setSaving] = useState(false)

  // Réutilisation depuis un autre cours
  const [showReuse, setShowReuse] = useState(false)
  const [allQuizzes, setAllQuizzes] = useState<AdminQuizListItem[]>([])
  const [sourceCourseId, setSourceCourseId] = useState<string>('')
  const [reusableQuizzes, setReusableQuizzes] = useState<AdminQuizListItem[]>([])
  const [duplicating, setDuplicating] = useState(false)

  const loadQuizzes = useCallback(async () => {
    if (!selectedCourseId) { setQuizzes([]); return }
    setLoading(true)
    try {
      const data = await getCourseQuizzes(selectedCourseId)
      setQuizzes(data)
    } catch { /* */ }
    setLoading(false)
  }, [selectedCourseId])

  useEffect(() => { loadQuizzes() }, [loadQuizzes])

  const resetForm = useCallback(() => {
    setEditingId(null)
    setNewTitle('')
    setNewDesc('')
    setNewTimeLimit('')
    setNewPassingScore('10')
    setQuestions([])
  }, [])

  const openCreate = () => {
    resetForm()
    setShowReuse(false)
    setShowEditor(!showEditor || editingId !== null ? true : false)
  }

  const editQuiz = async (quizId: string) => {
    setShowEditor(false)
    setShowReuse(false)
    setLoading(true)
    try {
      const { quiz } = await getQuizWithQuestions(quizId)
      const adminQuestions = await getAdminQuizQuestions(quizId)
      setEditingId(quizId)
      setNewTitle(quiz.title)
      setNewDesc(quiz.description ?? '')
      setNewTimeLimit(quiz.time_limit_minutes != null ? String(quiz.time_limit_minutes) : '')
      setNewPassingScore(String(quiz.passing_score ?? 10))
      setQuestions(adminQuestions.map((q) => ({
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options : [],
        correct_option_index: q.correct_option_index ?? 0,
        points: q.points ?? 1,
      })))
      setShowEditor(true)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur lors du chargement du quiz')
    } finally {
      setLoading(false)
    }
  }

  const duplicateToCurrentCourse = async (quizId: string) => {
    if (!selectedCourseId) return
    setDuplicating(true)
    try {
      await duplicateQuiz(quizId, selectedCourseId)
      setShowReuse(false)
      loadQuizzes()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setDuplicating(false)
    }
  }

  const openReuse = async () => {
    setShowEditor(false)
    setShowReuse(!showReuse)
    if (!showReuse && allQuizzes.length === 0) {
      try {
        setAllQuizzes(await getAllQuizzes())
      } catch { /* */ }
    }
  }

  useEffect(() => {
    if (!sourceCourseId) { setReusableQuizzes([]); return }
    setReusableQuizzes(allQuizzes.filter((q) => q.course_id === sourceCourseId))
  }, [sourceCourseId, allQuizzes])

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_option_index: 0, points: 1 }])
  }

  const updateQuestion = (idx: number, field: string, value: unknown) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q
      const opts = [...q.options]
      opts[oIdx] = value
      return { ...q, options: opts }
    }))
  }

  const handleSave = async () => {
    if (!selectedCourseId || !newTitle || questions.length === 0) return
    setSaving(true)
    try {
      const payload = {
        title: newTitle,
        description: newDesc,
        timeLimit: newTimeLimit ? parseInt(newTimeLimit) : null,
        passingScore: parseFloat(newPassingScore),
        questions,
      }
      if (editingId) {
        await updateQuiz(editingId, payload.title, payload.description, payload.timeLimit, payload.passingScore, payload.questions)
      } else {
        await createQuiz(selectedCourseId, payload.title, payload.description, payload.timeLimit, payload.passingScore, payload.questions)
      }
      resetForm()
      setShowEditor(false)
      loadQuizzes()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (quizId: string) => {
    if (!confirm('Supprimer ce quiz ?')) return
    try {
      await deleteQuiz(quizId)
      loadQuizzes()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const sourceOptions = allQuizzes
    .map((q) => q.course_id)
    .filter((v, i, a) => a.indexOf(v) === i)
    .filter((cid) => cid !== selectedCourseId)

  return (
    <Card>
      <CardTitle>Gestion des Quiz (QCM)</CardTitle>
      <CardDescription className="mt-1 mb-4">Crée, modifie, duplique et réutilise les quiz auto-corrigés pour chaque cours.</CardDescription>

      {/* Course selector */}
      <div className="mb-4">
        <Label>Cours</Label>
        <select
          className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
        >
          <option value="">— Choisir un cours —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Quiz list */}
      {selectedCourseId && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-pierre">{quizzes.length} quiz</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowEditor(false); setShowReuse(!showReuse) }} className="!px-3 !py-1.5 text-xs">
                {showReuse ? 'Annuler' : 'Réutiliser un quiz'}
              </Button>
              <Button onClick={openCreate} className="!px-3 !py-1.5 text-xs">
                {showEditor && editingId === null ? 'Annuler' : '+ Nouveau quiz'}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
          ) : quizzes.length === 0 ? (
            <p className="text-sm text-pierre italic">Aucun quiz pour ce cours.</p>
          ) : (
            <div className="space-y-2">
              {quizzes.map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-lg border border-pierre/10 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-bordeaux">{q.title}</p>
                    <p className="text-xs text-pierre">{q.question_count} questions • {q.attempt_count} tentative{Number(q.attempt_count) !== 1 ? 's' : ''} • Moy: {q.avg_score ?? '—'}/20</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => editQuiz(q.id)} className="text-xs text-or hover:underline">Modifier</button>
                    <button onClick={() => duplicateToCurrentCourse(q.id)} className="text-xs text-or hover:underline">Dupliquer ici</button>
                    <button onClick={() => handleDelete(q.id)} className="text-xs text-rouge hover:underline">Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reuse form */}
          {showReuse && (
            <div className="mt-4 rounded-lg border border-or/30 bg-or/5 p-4 space-y-3">
              <p className="text-sm font-medium text-bordeaux">Réutiliser un quiz vers « {courses.find((c) => c.id === selectedCourseId)?.title} »</p>
              <div>
                <Label>Cours source</Label>
                <select
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  value={sourceCourseId}
                  onChange={(e) => setSourceCourseId(e.target.value)}
                >
                  <option value="">— Choisir un cours source —</option>
                  {sourceOptions.map((cid) => (
                    <option key={cid} value={cid}>{courses.find((c) => c.id === cid)?.title ?? '(cours)'}</option>
                  ))}
                </select>
              </div>
              {reusableQuizzes.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-pierre">Quiz disponibles :</p>
                  {reusableQuizzes.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => duplicateToCurrentCourse(q.id)}
                      disabled={duplicating}
                      className="flex w-full items-center justify-between rounded border border-pierre/10 px-3 py-2 text-sm hover:bg-or/10"
                    >
                      <span className="text-bordeaux">{q.title}</span>
                      <span className="text-xs text-or font-medium">Copier ici →</span>
                    </button>
                  ))}
                </div>
              )}
              {sourceCourseId && reusableQuizzes.length === 0 && (
                <p className="text-sm text-pierre italic">Aucun quiz dans ce cours source.</p>
              )}
            </div>
          )}

          {/* Editor (create / edit) */}
          {showEditor && (
            <div className="mt-4 rounded-lg border border-or/30 bg-or/5 p-4 space-y-3">
              <p className="text-sm font-medium text-bordeaux">{editingId ? 'Modifier le quiz' : 'Nouveau quiz'}</p>
              <div>
                <Label>Titre du quiz *</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Quiz sur la Croix" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description optionnelle" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Temps limite (min)</Label>
                  <Input type="number" value={newTimeLimit} onChange={(e) => setNewTimeLimit(e.target.value)} placeholder="Illimité" />
                </div>
                <div>
                  <Label>Score pour réussir (/20)</Label>
                  <Input type="number" value={newPassingScore} onChange={(e) => setNewPassingScore(e.target.value)} />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {questions.map((q, qi) => (
                  <div key={qi} className="rounded border border-pierre/15 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-bordeaux">Question {qi + 1}</span>
                      <button onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))} className="text-xs text-rouge hover:underline">Retirer</button>
                    </div>
                    <Input
                      value={q.question_text}
                      onChange={(e) => updateQuestion(qi, 'question_text', e.target.value)}
                      placeholder="Texte de la question"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${editingId ?? 'new'}-${qi}`}
                            checked={q.correct_option_index === oi}
                            onChange={() => updateQuestion(qi, 'correct_option_index', oi)}
                            className="accent-or"
                          />
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(qi, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            className="!text-xs"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="!text-xs">Points</Label>
                      <Input
                        type="number"
                        min={1}
                        value={q.points}
                        onChange={(e) => updateQuestion(qi, 'points', parseInt(e.target.value) || 1)}
                        className="!w-16 !text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={addQuestion} className="w-full text-xs">+ Ajouter une question</Button>

              <Button onClick={handleSave} disabled={saving || !newTitle || questions.length === 0} className="w-full">
                {saving ? 'Enregistrement...' : editingId ? 'Enregistrer les modifications' : 'Créer le quiz'}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
