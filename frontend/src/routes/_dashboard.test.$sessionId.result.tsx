import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { useTheme } from '@/contexts/ThemeContext'
import { chartTheme, DIFF_COLORS } from '@/lib/highchartsTheme'
import {
  CheckCircle2, XCircle, MinusCircle, Clock, Target,
  ArrowLeft, RotateCcw, AlertCircle,
} from 'lucide-react'
import { formatSeconds, getScoreColor, getScoreLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_dashboard/test/$sessionId/result')({
  component: TestResultPage,
})

// ─── Animated score ring ──────────────────────────────────────────────────────

function getScoreStroke(score: number) {
  if (score >= 80) return '#16a34a'
  if (score >= 60) return '#ca8a04'
  return '#dc2626'
}

function AnimatedScoreRing({ score }: { score: number }) {
  const size        = 156
  const strokeWidth = 11
  const r           = (size - strokeWidth) / 2
  const circ        = 2 * Math.PI * r
  const offset      = circ * (1 - Math.min(100, Math.max(0, score)) / 100)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" className="stroke-muted" strokeWidth={strokeWidth}
        />
        {/* Animated fill */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={getScoreStroke(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: 'easeOut', delay: 0.25 }}
          strokeLinecap="round"
        />
      </svg>
      {/* Label — rotated back to upright */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn('text-4xl font-bold tabular-nums leading-none', getScoreColor(score))}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.35, type: 'spring', stiffness: 260, damping: 18 }}
        >
          <CountUp end={score} duration={1.3} suffix="%" delay={0.6} />
        </motion.span>
        <motion.span
          className="text-[11px] text-muted-foreground mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Score
        </motion.span>
      </div>
    </div>
  )
}

// ─── Confetti (framer-motion, no extra dep) ───────────────────────────────────

const CONFETTI_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#f43f5e']

function Confetti() {
  const particles = useMemo(() =>
    Array.from({ length: 48 }, (_, i) => ({
      id:       i,
      x:        Math.random() * 100,
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay:    Math.random() * 0.7,
      rotation: Math.random() * 360,
      size:     6 + Math.random() * 8,
      speed:    1.6 + Math.random() * 1.4,
      isCircle: i % 3 !== 0,
    }))
  , [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: -24,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
          }}
          animate={{
            y:       '115vh',
            rotate:  p.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.speed,
            delay:    p.delay,
            ease:     'easeIn',
          }}
        />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function TestResultPage() {
  const { sessionId }  = Route.useParams()
  const navigate       = useNavigate()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['test-result', sessionId],
    queryFn: () => api.get(`/tests/${sessionId}/result`).then(r => r.data.data),
    staleTime: Infinity,
    retry: false,
  })

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="font-semibold">Result not available.</p>
        <p className="text-sm text-muted-foreground">The test may still be in progress.</p>
        <Button variant="outline" onClick={() => navigate({ to: '/test' })}>
          Back to Tests
        </Button>
      </div>
    )
  }

  const { score, correct, incorrect, unanswered, total, timeTakenSecs, examTitle, questions, analytics } = result

  // ── Difficulty chart data ─────────────────────────────────────────────────
  const chartData = Object.entries(analytics?.byDifficulty ?? {}).map(([key, val]: [string, any]) => ({
    name:     key.charAt(0) + key.slice(1).toLowerCase(), // 'Easy'
    accuracy: val.accuracy,
    correct:  val.correct,
    total:    val.total,
    fill:     DIFF_COLORS[key as keyof typeof DIFF_COLORS] ?? '#6366f1',
  }))

  const isPassing  = (score ?? 0) >= 60
  const isHighScore = (score ?? 0) >= 80

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">

      {/* Confetti — only on high score */}
      {isHighScore && <Confetti />}

      {/* ── Score card ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            {/* Animated score ring replaces the plain trophy + big number */}
            <AnimatedScoreRing score={score ?? 0} />
            <motion.h2
              className="text-2xl font-bold mt-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {isHighScore ? '🎉 Excellent work!' : isPassing ? 'Test Complete!' : 'Test Complete'}
            </motion.h2>
            <motion.p
              className="text-muted-foreground mt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              {examTitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Badge
                className="mt-3 text-sm px-3"
                variant={isPassing ? 'default' : 'destructive'}
              >
                {isPassing ? '✓ Pass' : '✗ Fail'} · {getScoreLabel(score ?? 0)}
              </Badge>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-t pt-5">
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs">Correct</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                <CountUp end={correct} duration={1.2} enableScrollSpy scrollSpyOnce />
              </p>
              <p className="text-xs text-muted-foreground">of {total}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-xs">Wrong</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                <CountUp end={incorrect} duration={1.2} enableScrollSpy scrollSpyOnce />
              </p>
              <p className="text-xs text-muted-foreground">of {total}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <MinusCircle className="h-4 w-4" />
                <span className="text-xs">Skipped</span>
              </div>
              <p className="text-2xl font-bold text-muted-foreground">
                <CountUp end={unanswered} duration={1.2} enableScrollSpy scrollSpyOnce />
              </p>
              <p className="text-xs text-muted-foreground">of {total}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Time</span>
              </div>
              <p className="text-2xl font-bold">
                {timeTakenSecs ? formatSeconds(timeTakenSecs) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Difficulty breakdown chart ── */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <HighchartsReact
              highcharts={Highcharts}
              options={{
                ...chartTheme(isDark),
                chart: {
                  ...chartTheme(isDark).chart,
                  type: 'column',
                  height: 200,
                  margin: [10, 10, 30, 44],
                },
                xAxis: {
                  ...chartTheme(isDark).xAxis,
                  categories: chartData.map(d => d.name),
                },
                yAxis: {
                  ...chartTheme(isDark).yAxis,
                  min: 0,
                  max: 100,
                  labels: {
                    ...(chartTheme(isDark).yAxis as Highcharts.YAxisOptions)?.labels,
                    formatter() { return `${this.value}%` },
                  },
                },
                tooltip: {
                  ...chartTheme(isDark).tooltip,
                  formatter(this: any) {
                    const pt = this.point
                    return `<b>${pt.category}</b><br/><span style="color:${pt.color}">●</span> Accuracy: <b>${pt.y}%</b> (${pt.correct}/${pt.total})`
                  },
                },
                legend: { enabled: false },
                plotOptions: {
                  column: { borderRadius: 4, borderWidth: 0 },
                },
                series: [{
                  type: 'column',
                  name: 'Accuracy',
                  data: chartData.map(d => ({
                    y: d.accuracy,
                    correct: d.correct,
                    total: d.total,
                    color: d.fill,
                  })),
                }],
              } as Highcharts.Options}
            />
            {/* Legend row */}
            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
              {chartData.map(d => (
                <span key={d.name} className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ backgroundColor: d.fill }} />
                  {d.name}: {d.accuracy}%
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Question-by-question review ── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Question Review</h2>
        <Accordion type="multiple" className="space-y-2">
          {(questions ?? []).map((q: any, i: number) => {
            const isCorrect = q.isCorrect
            const isSkipped = q.userAnswer === null || q.userAnswer === undefined
            const statusIcon = isCorrect ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : isSkipped ? (
              <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            )

            return (
              <AccordionItem
                key={q.id}
                value={q.id}
                className={cn(
                  'border rounded-lg px-0 overflow-hidden',
                  isCorrect
                    ? 'border-green-200 dark:border-green-800'
                    : isSkipped
                    ? 'border-border'
                    : 'border-red-200 dark:border-red-800'
                )}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/30">
                  <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                    {statusIcon}
                    <span className="text-xs text-muted-foreground shrink-0">Q{i + 1}</span>
                    <span className="text-sm font-medium truncate">
                      {q.text.length > 80 ? q.text.substring(0, 80) + '…' : q.text}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs shrink-0">
                      {q.difficulty}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {/* Full question */}
                  <p className="text-sm font-medium mb-3">{q.text}</p>

                  {/* MCQ options */}
                  {q.options && (
                    <div className="space-y-1.5 mb-3">
                      {Object.entries(q.options as Record<string, string>).map(([key, val]) => {
                        const isCorrectOpt = q.answer === key
                        const isUserOpt    = q.userAnswer === key
                        return (
                          <div
                            key={key}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-md text-sm border',
                              isCorrectOpt
                                ? 'border-green-400 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300'
                                : isUserOpt && !isCorrectOpt
                                ? 'border-red-400 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300'
                                : 'border-transparent bg-muted/30'
                            )}
                          >
                            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0">
                              {key}
                            </span>
                            <span className="flex-1">{val}</span>
                            {isCorrectOpt && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            )}
                            {isUserOpt && !isCorrectOpt && (
                              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Non-MCQ answers */}
                  {!q.options && (
                    <div className="space-y-1 text-sm mb-3">
                      {!isSkipped && (
                        <p className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                          Your answer: <strong>{q.userAnswer}</strong>
                        </p>
                      )}
                      {isSkipped && (
                        <p className="text-muted-foreground italic">Skipped</p>
                      )}
                      {!isCorrect && (
                        <p className="text-green-600">
                          Correct answer: <strong>{q.answer}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Topic badge */}
                  {q.topic && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Topic: {q.topic.title}
                    </p>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-0.5">Explanation</p>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap gap-3">
        <Link to="/test">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Tests
          </Button>
        </Link>
        <Link to="/test/setup">
          <Button>
            <RotateCcw className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </Link>
        <Link to="/">
          <Button variant="ghost">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
