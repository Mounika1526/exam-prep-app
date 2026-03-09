import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, Trash2, Play, X, ChevronRight, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EmptyState } from '@/components/ui/EmptyState'

export const Route = createFileRoute('/_dashboard/my-questions')({
  component: MyQuestionsPage,
})

interface SavedQuestion {
  id: string
  question: string
  options?: Record<string, string> | null
  answer: string
  explanation?: string | null
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  topicId?: string | null
  createdAt: string
  topic?: { title: string } | null
}

const DIFF_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  EASY:   { bg: 'rgba(74,222,128,0.12)',  color: '#4ADE80', border: 'rgba(74,222,128,0.3)'  },
  MEDIUM: { bg: 'rgba(245,166,35,0.12)',  color: '#F5A623', border: 'rgba(245,166,35,0.3)'  },
  HARD:   { bg: 'rgba(248,113,113,0.12)', color: '#F87171', border: 'rgba(248,113,113,0.3)' },
}

// ─── Flashcard ─────────────────────────────────────────────────────────────

function Flashcard({ q, onDelete }: { q: SavedQuestion; onDelete: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const entries = Object.entries(q.options ?? {})
  const diff = DIFF_STYLE[q.difficulty] ?? DIFF_STYLE.MEDIUM

  return (
    <div style={{ perspective: '1000px' }} className="h-52">
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s',
          transform: flipped ? 'rotateY(180deg)' : 'none',
          position: 'relative',
          height: '100%',
        }}
      >
        {/* ── Front ── */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setFlipped(true)}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'rgba(0,229,204,0.05)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,204,0.15)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-relaxed flex-1 line-clamp-4" style={{ color: '#F2F2F0' }}>
              {q.question}
            </p>
            <span
              className="text-xs shrink-0 px-2 py-0.5 rounded-full font-semibold"
              style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}
            >
              {q.difficulty}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: '#8B8FA8' }}>Tap to reveal answer</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="h-7 w-7 flex items-center justify-center rounded-md transition-colors"
              style={{ color: '#8B8FA8' }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.color = '#F87171'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.1)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.color = '#8B8FA8'
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Back ── */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,229,204,0.04)',
            border: '1px solid rgba(0,229,204,0.15)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            cursor: 'pointer',
            overflowY: 'auto',
          }}
          onClick={() => setFlipped(false)}
        >
          {entries.length > 0 ? (
            <div className="space-y-1">
              {entries.map(([key, val]) => {
                const isCorrect = key === q.answer
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                    style={{
                      background: isCorrect ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)',
                      color: isCorrect ? '#4ADE80' : 'rgba(255,255,255,0.4)',
                      fontWeight: isCorrect ? 700 : 400,
                    }}
                  >
                    <span
                      className="h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        background: isCorrect ? '#4ADE80' : 'rgba(255,255,255,0.08)',
                        color: isCorrect ? '#0D0F1A' : '#8B8FA8',
                      }}
                    >
                      {key}
                    </span>
                    {val}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm font-semibold" style={{ color: '#4ADE80' }}>Answer: {q.answer}</p>
          )}

          {q.explanation && (
            <p
              className="text-xs leading-relaxed line-clamp-3 mt-auto"
              style={{
                color: '#8B8FA8',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: 8,
              }}
            >
              {q.explanation}
            </p>
          )}
          <span className="text-[10px]" style={{ color: '#8B8FA8', marginTop: 'auto' }}>Tap to flip back</span>
        </div>
      </div>
    </div>
  )
}

// ─── Quiz Mode ─────────────────────────────────────────────────────────────

function QuizMode({ questions, onExit }: { questions: SavedQuestion[]; onExit: () => void }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set())

  const q = questions[index]
  const entries = Object.entries(q?.options ?? {})
  const hasOptions = entries.length > 0
  const answered = selected !== null
  const isCorrect = selected === q?.answer

  const handleSelect = (key: string) => {
    if (answered) return
    setSelected(key)
    if (key === q.answer) {
      setScore(s => s + 1)
    } else {
      setWrongIds(prev => new Set(prev).add(q.id))
    }
  }

  const handleReveal = () => setSelected(q.answer)

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true)
    } else {
      setIndex(i => i + 1)
      setSelected(null)
    }
  }

  const handleRestart = () => {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
    setWrongIds(new Set())
  }

  const pct = Math.round((score / questions.length) * 100)

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
          style={{
            background: pct >= 70 ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
            border: `2px solid ${pct >= 70 ? '#4ADE80' : '#F87171'}`,
            color: pct >= 70 ? '#4ADE80' : '#F87171',
          }}
        >
          {pct}%
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#F2F2F0', fontFamily: '"Playfair Display", Georgia, serif' }}>
            {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : 'Keep practising!'}
          </h2>
          <p className="text-sm" style={{ color: '#8B8FA8' }}>
            You got {score} out of {questions.length} correct
          </p>
          {wrongIds.size > 0 && (
            <p className="text-xs mt-1" style={{ color: '#F5A623' }}>
              {wrongIds.size} question{wrongIds.size > 1 ? 's' : ''} to review
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#8B8FA8', background: 'transparent' }}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
          <Button size="sm" onClick={onExit} className="ep-shimmer-btn ds-btn-shimmer">
            Back to Bank
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: '#8B8FA8' }}>
            {index + 1} / {questions.length}
          </span>
          <div className="h-1.5 rounded-full overflow-hidden w-32" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((index + 1) / questions.length) * 100}%`,
                background: 'linear-gradient(90deg, #00B8A5 0%, #00E5CC 100%)',
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: '#4ADE80' }}>
            {score} correct
          </span>
          <button
            onClick={onExit}
            className="h-7 w-7 flex items-center justify-center rounded-md"
            style={{ color: '#8B8FA8' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F2F2F0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8B8FA8')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* Question */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="text-base font-medium leading-relaxed" style={{ color: '#F2F2F0' }}>
                {q.question}
              </p>
              <span
                className="text-xs shrink-0 px-2 py-0.5 rounded-full font-semibold"
                style={{ background: DIFF_STYLE[q.difficulty]?.bg, color: DIFF_STYLE[q.difficulty]?.color, border: `1px solid ${DIFF_STYLE[q.difficulty]?.border}` }}
              >
                {q.difficulty}
              </span>
            </div>
            {q.topic?.title && (
              <p className="text-xs mt-1" style={{ color: '#8B8FA8' }}>{q.topic.title}</p>
            )}
          </div>

          {/* Options or reveal */}
          {hasOptions ? (
            <div className="space-y-2.5">
              {entries.map(([key, val]) => {
                const isAnswer = key === q.answer
                const isChosen = selected === key
                let bg = 'rgba(255,255,255,0.04)'
                let border = 'rgba(255,255,255,0.08)'
                let color = '#F2F2F0'
                if (answered) {
                  if (isAnswer) { bg = 'rgba(74,222,128,0.12)'; border = 'rgba(74,222,128,0.4)'; color = '#4ADE80' }
                  else if (isChosen) { bg = 'rgba(248,113,113,0.12)'; border = 'rgba(248,113,113,0.4)'; color = '#F87171' }
                }
                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(key)}
                    disabled={answered}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: bg,
                      border: `1px solid ${border}`,
                      color,
                      cursor: answered ? 'default' : 'pointer',
                    }}
                  >
                    <span
                      className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: answered && isAnswer ? '#4ADE80' : answered && isChosen ? '#F87171' : 'rgba(255,255,255,0.08)',
                        color: answered && (isAnswer || isChosen) ? '#0D0F1A' : '#8B8FA8',
                      }}
                    >
                      {key}
                    </span>
                    <span className="text-sm flex-1">{val}</span>
                    {answered && isAnswer && <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#4ADE80' }} />}
                    {answered && isChosen && !isAnswer && <XCircle className="h-4 w-4 shrink-0" style={{ color: '#F87171' }} />}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-center">
              {!answered ? (
                <Button
                  variant="outline"
                  onClick={handleReveal}
                  style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#8B8FA8', background: 'transparent' }}
                >
                  Reveal Answer
                </Button>
              ) : (
                <div
                  className="rounded-xl p-4 text-center"
                  style={{ background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.3)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: '#4ADE80' }}>Answer: {q.answer}</p>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {answered && q.explanation && (
            <div
              className="rounded-xl px-4 py-3 text-sm leading-relaxed"
              style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#C4B5FD' }}
            >
              {q.explanation}
            </div>
          )}

          {/* Next / self-score for non-MCQ */}
          {!hasOptions && answered ? (
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setWrongIds(prev => new Set(prev).add(q.id)); handleNext() }}
                style={{ borderColor: 'rgba(248,113,113,0.3)', color: '#F87171', background: 'transparent' }}
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Got it wrong
              </Button>
              <Button
                size="sm"
                onClick={() => { setScore(s => s + 1); handleNext() }}
                className="ep-shimmer-btn ds-btn-shimmer"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Got it right
              </Button>
            </div>
          ) : answered ? (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleNext} className="ep-shimmer-btn ds-btn-shimmer">
                {index + 1 >= questions.length ? 'See Results' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

function MyQuestionsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [topicFilter, setTopicFilter] = useState<string>('ALL')
  const [quizMode, setQuizMode] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['saved-questions'],
    queryFn: () => api.get('/ai/saved-questions').then(r => r.data),
  })

  const allQuestions: SavedQuestion[] = data ?? []

  const topics = useMemo(() => {
    const seen = new Map<string, string>()
    allQuestions.forEach(q => {
      if (q.topicId && q.topic?.title) seen.set(q.topicId, q.topic.title)
    })
    return Array.from(seen.entries())
  }, [allQuestions])

  const filtered = topicFilter === 'ALL'
    ? allQuestions
    : allQuestions.filter(q => q.topicId === topicFilter)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ai/saved-questions/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-questions'] })
      toast({ title: 'Question removed' })
    },
    onError: () => toast({ title: 'Failed to delete', variant: 'destructive' }),
  })

  if (quizMode && filtered.length > 0) {
    return (
      <div className="space-y-6">
        <QuizMode questions={filtered} onExit={() => setQuizMode(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#F2F2F0',
              letterSpacing: '-0.025em',
            }}
          >
            My Question Bank
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8B8FA8' }}>
            Questions you've saved from AI generation sessions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allQuestions.length > 0 && (
            <span
              className="text-sm px-3 py-1 rounded-full font-semibold"
              style={{
                background: 'rgba(0,229,204,0.12)',
                color: '#00E5CC',
                border: '1px solid rgba(0,229,204,0.3)',
              }}
            >
              {allQuestions.length} saved
            </span>
          )}
          {filtered.length > 0 && (
            <Button
              size="sm"
              onClick={() => setQuizMode(true)}
              className="ep-shimmer-btn ds-btn-shimmer"
              style={{ height: 34, fontWeight: 600 }}
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Quiz Mode
            </Button>
          )}
        </div>
      </div>

      {/* Filter */}
      {topics.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: '#8B8FA8' }}>Filter by topic:</span>
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-52 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Topics</SelectItem>
              {topics.map(([id, title]) => (
                <SelectItem key={id} value={id}>{title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={allQuestions.length === 0 ? 'No saved questions yet' : 'No questions match this filter'}
          description={
            allQuestions.length === 0
              ? 'Generate practice questions from any topic page and save the ones you want to review.'
              : 'Try selecting a different topic filter.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(q => (
            <Flashcard
              key={q.id}
              q={q}
              onDelete={() => deleteMutation.mutate(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
