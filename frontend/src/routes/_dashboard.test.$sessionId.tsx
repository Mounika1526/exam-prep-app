import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuestionCard } from '@/components/test/QuestionCard'
import { TestTimer } from '@/components/test/TestTimer'
import { TestProgress } from '@/components/test/TestProgress'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, Send, Flag, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_dashboard/test/$sessionId')({
  component: ActiveTestPage,
})

// Slide variants — custom is the direction: 1 = forward (→), -1 = backward (←)
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

  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers,    setAnswers]     = useState<Record<string, string>>({})
  const [flagged,    setFlagged]     = useState<Set<string>>(new Set())
  const [direction,  setDirection]   = useState(1)  // 1 = forward, -1 = backward

  // ── Fetch session (resumes with existing answers) ────────────────────────
  const { data: sessionData, isLoading, isError } = useQuery({
    queryKey: ['test-session', sessionId],
    queryFn: () => api.get(`/tests/${sessionId}`).then(r => r.data.data),
    staleTime: Infinity, // don't re-fetch mid-test
    retry: false,
  })

  // Auto-redirect: if session is already COMPLETED (loaded from cache or backend
  // returns 400 for completed session), go straight to results.
  useEffect(() => {
    if (sessionData?.status === 'COMPLETED' || isError) {
      navigate({ to: '/test/$sessionId/result', params: { sessionId } })
    }
  }, [sessionData?.status, isError, navigate, sessionId])

  // Pre-populate existing answers on resume
  useEffect(() => {
    if (sessionData?.answers) {
      setAnswers(sessionData.answers)
    }
  }, [sessionData?.answers])

  // ── Mutations ─────────────────────────────────────────────────────────────
  const answerMutation = useMutation({
    mutationFn: ({ questionId, selectedAnswer }: { questionId: string; selectedAnswer: string }) =>
      api.post(`/tests/${sessionId}/answer`, { questionId, selectedAnswer }).then(r => r.data),
  })

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/tests/${sessionId}/submit`).then(r => r.data),
    onSuccess: () => {
      // Remove stale cached session so result page fetches fresh data
      queryClient.removeQueries({ queryKey: ['test-session', sessionId] })
      navigate({ to: '/test/$sessionId/result', params: { sessionId } })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Submit failed. Please try again.'
      toast({ title: 'Submit failed', description: msg, variant: 'destructive' })
    },
  })

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading your test…</p>
      </div>
    )
  }

  // ── Submitting / redirecting state ────────────────────────────────────────
  if (submitMutation.isSuccess || submitMutation.isPending) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center"
      >
        {submitMutation.isSuccess ? (
          <>
            <CheckCircle2 className="h-14 w-14 text-green-500" />
            <div>
              <p className="text-xl font-semibold">Test Submitted!</p>
              <p className="text-muted-foreground mt-1">Redirecting to your results…</p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-medium">Submitting your test…</p>
            <p className="text-sm text-muted-foreground">Please wait, do not close this page.</p>
          </>
        )}
      </motion.div>
    )
  }

  // ── Error / redirect state (session COMPLETED or not found) ──────────────
  if (isError || !sessionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to results…</p>
      </div>
    )
  }

  const questions: any[]             = sessionData.questions ?? []
  const timeRemaining: number | null = sessionData.timeRemaining ?? null

  if (questions.length === 0) {
    return (
      <p className="text-center text-muted-foreground mt-12">
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

  // Direction-aware navigation helpers
  const goPrev = () => { setDirection(-1); setCurrentIdx(i => i - 1) }
  const goNext = () => { setDirection(1);  setCurrentIdx(i => i + 1) }
  const goTo   = (i: number) => {
    setDirection(i > currentIdx ? 1 : -1)
    setCurrentIdx(i)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* ── Top bar: progress + timer ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <TestProgress
            current={currentIdx + 1}
            total={questions.length}
            answered={totalAnswered}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Flag toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFlag(currentQ.id)}
            className={cn(
              'gap-1.5',
              flagged.has(currentQ.id) ? 'text-orange-500 hover:text-orange-600' : 'text-muted-foreground'
            )}
          >
            <Flag className={cn('h-4 w-4', flagged.has(currentQ.id) && 'fill-current')} />
            {flagged.has(currentQ.id) ? 'Flagged' : 'Flag'}
          </Button>

          {/* Timer — only shown when session has a time limit */}
          {timeRemaining !== null && (
            <TestTimer
              initialRemainingSeconds={timeRemaining}
              onTimeout={() => submitMutation.mutate()}
            />
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
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {!isLastQuestion ? (
            <Button onClick={goNext}>
              Next
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={submitMutation.isPending || submitMutation.isSuccess}>
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
                      <span className="text-yellow-600">
                        {' '}{questions.length - totalAnswered} will be marked as skipped.
                      </span>
                    )}
                    {flagged.size > 0 && (
                      <span className="block mt-1 text-orange-500">
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
                    {submitMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Submit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* ── Question navigator grid ── */}
      <Card>
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground mb-2">Question Navigator</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q: any, i: number) => {
              const isAnswered = !!answers[q.id]
              const isFlagged  = flagged.has(q.id)
              const isCurrent  = i === currentIdx
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(i)}
                  title={
                    isFlagged ? 'Flagged for review' :
                    isAnswered ? 'Answered' : 'Not answered'
                  }
                  className={cn(
                    'w-8 h-8 rounded text-xs font-medium transition-all relative',
                    isCurrent
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                      : isFlagged
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300'
                      : isAnswered
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                >
                  {i + 1}
                  {isFlagged && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </button>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-primary inline-block" /> Current
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-green-200 inline-block" /> Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-orange-200 inline-block" /> Flagged
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-muted inline-block" /> Unanswered
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
