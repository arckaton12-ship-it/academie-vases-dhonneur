import { useState, useEffect, useCallback } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { getCourseQuizzes, createQuiz, deleteQuiz, Quiz } from '@/lib/courses'
import { supabase } from '@/lib/supabase'

interface QuizTabProps {
  courses: { id: string; title: string; class_id?: string | null }[]
}

export function QuizTab({ courses }: QuizTabProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTimeLimit, setNewTimeLimit] = useState('')
  const [newPassingScore, setNewPassingScore] = useState('10')
  const [questions, setQuestions] = useState<{ question_text: string; options: string[]; correct_option_index: number; points: number }[]>([])
  const [creating, setCreating] = useState(false)

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

  const handleCreate = async () => {
    if (!selectedCourseId || !newTitle || questions.length === 0) return
    setCreating(true)
    try {
      await createQuiz(
        selectedCourseId,
        newTitle,
        newDesc,
        newTimeLimit ? parseInt(newTimeLimit) : null,
        parseFloat(newPassingScore),
        questions
      )
      setShowCreate(false)
      setNewTitle('')
      setNewDesc('')
      setNewTimeLimit('')
      setNewPassingScore('10')
      setQuestions([])
      loadQuizzes()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setCreating(false)
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

  return (
    <Card>
      <CardTitle>Gestion des Quiz (QCM)</CardTitle>
      <CardDescription className="mt-1 mb-4">Crée et gère les quiz auto-corrigés pour chaque cours.</CardDescription>

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
            <Button onClick={() => setShowCreate(!showCreate)} className="!px-3 !py-1.5 text-xs">
              {showCreate ? 'Annuler' : '+ Nouveau quiz'}
            </Button>
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
                  <button onClick={() => handleDelete(q.id)} className="text-xs text-rouge hover:underline">Supprimer</button>
                </div>
              ))}
            </div>
          )}

          {/* Create form */}
          {showCreate && (
            <div className="mt-4 rounded-lg border border-or/30 bg-or/5 p-4 space-y-3">
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
                            name={`correct-${qi}`}
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

              <Button onClick={handleCreate} disabled={creating || !newTitle || questions.length === 0} className="w-full">
                {creating ? 'Création...' : 'Créer le quiz'}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
