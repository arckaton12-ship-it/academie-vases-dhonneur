import { useState, useEffect, useCallback } from 'react'
import { getQuizWithQuestions, submitQuiz, Quiz, QuizQuestion, QuizAttempt } from '@/lib/courses'

interface QuizPlayerProps {
  quizId: string
  onClose: () => void
}

export function QuizPlayer({ quizId, onClose }: QuizPlayerProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [attempted, setAttempted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizAttempt | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    getQuizWithQuestions(quizId)
      .then((data) => {
        setQuiz(data.quiz)
        setQuestions(data.questions)
        setAttempted(data.attempted)
        if (data.quiz.time_limit_minutes) {
          setTimeLeft(data.quiz.time_limit_minutes * 60)
        }
      })
      .finally(() => setLoading(false))
  }, [quizId])

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || attempted || result) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t !== null && t <= 1) {
          clearInterval(interval)
          handleSubmit()
          return 0
        }
        return t !== null ? t - 1 : null
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timeLeft, attempted, result])

  const handleSelect = useCallback((questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (submitting || result) return
    setSubmitting(true)
    try {
      const res = await submitQuiz(quizId, answers)
      setResult(res)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }, [quizId, answers, submitting, result])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="glass-card w-full max-w-lg p-6 text-center">
          <div className="skeleton h-6 w-1/2 mx-auto rounded mb-4" />
          <div className="skeleton h-4 w-3/4 mx-auto rounded" />
        </div>
      </div>
    )
  }

  if (!quiz) return null

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const current = questions[currentIdx]
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0

  // Result view
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <div className="text-center mb-6">
            <h2 className="font-display text-2xl text-bordeaux">{result.is_passed ? 'Réussi !' : 'Non atteint'}</h2>
            <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-lg font-bold ${result.is_passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {result.score} / 20
            </div>
            <p className="mt-2 text-sm text-pierre">
              {result.total_points}/{result.max_points} points • Seuil : {result.passing_score}/20
            </p>
          </div>

          <div className="space-y-3">
            {result.questions.map((q, i) => (
              <div key={q.question_id} className={`rounded-lg border p-3 ${q.is_correct ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}`}>
                <p className="text-sm font-medium text-bordeaux dark:text-slate-200">
                  <span className="text-pierre">Q{i + 1}.</span> {q.question_text}
                </p>
                <div className="mt-2 space-y-1">
                  {q.options.map((opt, j) => (
                    <div key={j} className={`flex items-center gap-2 text-sm ${j === q.correct_index ? 'font-semibold text-green-700 dark:text-green-400' : j === q.your_answer && !q.is_correct ? 'text-red-600 dark:text-red-400 line-through' : 'text-pierre'}`}>
                      <span className="w-4">{j === q.correct_index ? '✓' : j === q.your_answer ? '✗' : ''}</span>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={onClose} className="mt-6 w-full rounded-card bg-bordeaux px-4 py-2.5 text-sm font-medium text-parchemin hover:bg-olive">
            Fermer
          </button>
        </div>
      </div>
    )
  }

  // Already attempted
  if (attempted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="glass-card w-full max-w-md p-6 text-center">
          <h2 className="font-display text-xl text-bordeaux">Quiz déjà passé</h2>
          <p className="mt-2 text-sm text-pierre">Vous avez déjà tenté ce quiz. Une seule tentative est autorisée.</p>
          <button onClick={onClose} className="mt-4 rounded-card bg-bordeaux px-4 py-2.5 text-sm font-medium text-parchemin hover:bg-olive">
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-bordeaux">{quiz.title}</h2>
          {timeLeft !== null && (
            <span className={`font-mono text-sm px-2 py-1 rounded ${timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-or/10 text-bordeaux'}`}>
              {formatTime(timeLeft)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4 h-2 rounded-full bg-pierre/10 overflow-hidden">
          <div className="h-full rounded-full bg-or transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <p className="mb-4 text-sm text-pierre">
          Question {currentIdx + 1} sur {questions.length} • {current?.points} point{current?.points > 1 ? 's' : ''}
        </p>

        {/* Question */}
        {current && (
          <div className="mb-6">
            <p className="text-base font-medium text-bordeaux dark:text-slate-200 mb-4">{current.question_text}</p>
            <div className="space-y-2">
              {current.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(current.id, i)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                    answers[current.id] === i
                      ? 'border-or bg-or/10 text-bordeaux font-medium'
                      : 'border-pierre/20 hover:border-or/40 hover:bg-or/5 text-pierre'
                  }`}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-pierre/30 text-xs">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="rounded-card border border-pierre/30 px-4 py-2 text-sm text-pierre hover:bg-parchemin disabled:opacity-40"
          >
            ← Précédent
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx((i) => i + 1)}
              className="rounded-card bg-bordeaux px-4 py-2 text-sm font-medium text-parchemin hover:bg-olive"
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="rounded-card bg-or px-4 py-2 text-sm font-bold text-slate-900 hover:bg-or-light disabled:opacity-40"
            >
              {submitting ? 'Correction...' : 'Soumettre'}
            </button>
          )}
        </div>

        {/* Answer indicator */}
        <div className="mt-4 flex flex-wrap gap-1">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                i === currentIdx ? 'bg-bordeaux text-parchemin' : answers[q.id] !== undefined ? 'bg-or/20 text-bordeaux' : 'bg-pierre/10 text-pierre'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button onClick={onClose} className="mt-4 w-full text-center text-sm text-pierre hover:text-bordeaux">
          Fermer le quiz
        </button>
      </div>
    </div>
  )
}
