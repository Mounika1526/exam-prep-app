import { createFileRoute, useNavigate, Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuestionCard } from '@/components/test/QuestionCard'
import { TestTimer } from '@/components/test/TestTimer'
import { TestProgress } from '@/components/test/TestProgress'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, Send, Flag, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_dashboard/test/$sessionId')({
  component: ActiveTestPage,
})

const slideVariants = {
  initial: (dir: number) => ({ x: dir * 56, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit:    (dir: number) => ({ x: dir * -56, opacity: 0 }),
}

function ActiveTestPage() {
  const { sessionId } = Route.useParams()
  const navigate       = useNavigate()
  const { toast }      = useToast()
  const queryClient    = useQueryClient()
  const { location }   = useRouterState()

  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers,    setAnswers]     = useState<Record<string, string>>({})
  const [flagged,    setFlagged]     = useState<Set<string>>(new Set())
  const [direction,  setDirection]   = useState(1)

  const { data: sessionData, isLoading, isError } = useQuery({
    queryKey: ['test-session', sessionId],
    queryFn: () => api.get(`/tests/${sessionId}`).then(r => r.data.data),
    staleTime: Infinity,
    retry: false,
  })


  useEffect(() => {
    if (sessionData?.answers) setAnswers(sessionData.answers)
  }, [sessionData?.answers])

  const answerMutation = useMutation({
    mutationFn: ({ questionId, selectedAnswer }: { questionId: string; selectedAnswer: string }) =>
      api.post(`/tests/${sessionId}/answer`, { questionId, selectedAnswer }).then(r => r.data),
  })

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/tests/${sessionId}/submit`).then(r => r.data),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['test-session', sessionId] })
      navigate({ to: '/test/$sessionId/result', params: { sessionId } })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Submit failed. Please try again.'
      toast({ title: 'Submit failed', description: msg, variant: 'destructive' })
    },
  })

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#00E5CC' }} />
        <p style={{ color: '#8B8FA8' }}>Loading your test…</p>
      </div>
    )
  }

  // ── Submitting ───────────────────────────────────────────────────────────────
  if (submitMutation.isSuccess || submitMutation.isPending) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center"
      >
        {submitMutation.isSuccess ? (
          <>
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(74,222,128,0.15)', boxShadow: '0 0 40px rgba(74,222,128,0.3)' }}
            >
              <CheckCircle2 className="h-10 w-10" style={{ color: '#4ADE80' }} />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F2F2F0' }}>
                Test Submitted!
              </p>
              <p className="mt-1" style={{ color: '#8B8FA8' }}>Redirecting to your results…</p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#8B8FA8' }} />
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#00E5CC' }} />
            <p className="text-lg font-medium" style={{ color: '#F2F2F0' }}>Submitting your test…</p>
            <p className="text-sm" style={{ color: '#8B8FA8' }}>Please wait, do not close this page.</p>
          </>
        )}
      </motion.div>
    )
  }

  // Session completed or error — redirect only if on the exact parent route, else let child render
  if (!isLoading && (isError || sessionData?.status === 'COMPLETED')) {
    if (location.pathname === `/test/${sessionId}`) {
      return <Navigate to="/test/$sessionId/result" params={{ sessionId }} replace />
    }
    return <Outlet />
  }

  const questions: any[]             = sessionData.questions ?? []
  const timeRemaining: number | null = sessionData.timeRemaining ?? null

  if (questions.length === 0) {
    return (
      <p className="text-center mt-12" style={{ color: '#8B8FA8' }}>
        No questions found for this session.
      </p>
    )
  }

  const currentQ       = questions[currentIdx]
  const totalAnswered  = Object.keys(answers).length
  const isLastQuestion = currentIdx === questions.length - 1

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: answer }))
    answerMutation.mutate({ questionId: currentQ.id, selectedAnswer: answer })
  }

  const toggleFlag = (questionId: string) => {
    setFlagged(prev => {
      const next = new Set(prev)
      next.has(questionId) ? next.delete(questionId) : next.add(questionId)
      return next
    })
  }

  const goPrev = () => { setDirection(-1); setCurrentIdx(i => i - 1) }
  const goNext = () => { setDirection(1);  setCurrentIdx(i => i + 1) }
  const goTo   = (i: number) => { setDirection(i > currentIdx ? 1 : -1); setCurrentIdx(i) }

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* ── Top bar: progress + timer ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <TestProgress current={currentIdx + 1} total={questions.length} answered={totalAnswered} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Flag toggle */}
          <button
            onClick={() => toggleFlag(currentQ.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={flagged.has(currentQ.id)
              ? { background: 'rgba(245,166,35,0.15)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.35)' }
              : { background: 'rgba(255,255,255,0.05)', color: '#8B8FA8', border: '1px solid rgba(255,255,255,0.09)' }
            }
          >
            <Flag className={cn('h-3.5 w-3.5', flagged.has(currentQ.id) && 'fill-current')} />
            {flagged.has(currentQ.id) ? 'Flagged' : 'Flag'}
          </button>

          {timeRemaining !== null && (
            <TestTimer initialRemainingSeconds={timeRemaining} onTimeout={() => submitMutation.mutate()} />
          )}
        </div>
      </div>

      {/* ── Question card — animated slide ── */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentQ.id}
          custom={direction}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <QuestionCard
            question={currentQ}
            selectedAnswer={answers[currentQ.id]}
            onAnswer={handleAnswer}
            questionNumber={currentIdx + 1}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation buttons ── */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIdx === 0}
          onClick={goPrev}
          style={{
            borderColor: 'rgba(255,255,255,0.12)',
            color: '#8B8FA8',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {!isLastQuestion ? (
            <Button
              onClick={goNext}
              className="ep-shimmer-btn"
              style={{ fontWeight: 600 }}
            >
              Next →
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="ep-shimmer-btn"
                  style={{ fontWeight: 600 }}
                  disabled={submitMutation.isPending || submitMutation.isSuccess}
                >
                  {submitMutation.isPending
                    ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    : <Send className="h-4 w-4 mr-2" />
                  }
                  Submit Test
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Test?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You've answered{' '}
                    <strong>{totalAnswered}</strong> of{' '}
                    <strong>{questions.length}</strong> questions.
                    {totalAnswered < questions.length && (
                      <span className="text-yellow-500">
                        {' '}{questions.length - totalAnswered} will be marked as skipped.
                      </span>
                    )}
                    {flagged.size > 0 && (
                      <span className="block mt-1 text-orange-400">
                        {flagged.size} question{flagged.size > 1 ? 's are' : ' is'} flagged for review.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Review Answers</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending || submitMutation.isSuccess}
                  >
                    {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Submit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* ── Question navigator grid ── */}
      <div
        className="glass-card rounded-2xl p-4"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#8B8FA8' }}>
          Question Navigator
        </p>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q: any, i: number) => {
            const isAnswered = !!answers[q.id]
            const isFlagged  = flagged.has(q.id)
            const isCurrent  = i === currentIdx
            return (
              <button
                key={q.id}
                onClick={() => goTo(i)}
                title={isFlagged ? 'Flagged' : isAnswered ? 'Answered' : 'Not answered'}
                className={cn('quiz-dot w-8 h-8 rounded-lg text-xs font-semibold transition-all relative', {
                  'quiz-dot-current':  isCurrent,
                  'quiz-dot-flagged':  isFlagged && !isCurrent,
                  'quiz-dot-answered': isAnswered && !isFlagged && !isCurrent,
                })}
                style={!isCurrent && !isFlagged && !isAnswered
                  ? { background: 'rgba(255,255,255,0.06)', color: '#8B8FA8', border: '1px solid rgba(255,255,255,0.08)' }
                  : {}
                }
              >
                {i + 1}
                {isFlagged && (
                  <span
                    className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
                    style={{ background: '#F5A623', boxShadow: '0 0 5px rgba(245,166,35,0.6)' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 text-[10px]" style={{ color: '#8B8FA8' }}>
          {[
            { color: '#00E5CC', shadow: 'rgba(0,229,204,0.5)', label: 'Current' },
            { color: 'rgba(34,197,94,0.3)', shadow: '', label: 'Answered' },
            { color: 'rgba(245,166,35,0.2)', shadow: '', label: 'Flagged' },
            { color: 'rgba(255,255,255,0.06)', shadow: '', label: 'Unanswered' },
          ].map(({ color, shadow, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded inline-block"
                style={{ background: color, boxShadow: shadow ? `0 0 6px ${shadow}` : undefined }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
