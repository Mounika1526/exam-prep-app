import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { useTheme } from '@/contexts/ThemeContext'
import { chartTheme, DIFF_COLORS } from '@/lib/highchartsTheme'
import {
  CheckCircle2, XCircle, MinusCircle, Clock, Target,
  ArrowLeft, RotateCcw, AlertCircle, ChevronDown, TrendingDown,
} from 'lucide-react'
import { formatSeconds } from '@/lib/utils'

export const Route = createFileRoute('/_dashboard/test/$sessionId/result')({
  component: TestResultPage,
})

// ─── Animated score ring ──────────────────────────────────────────────────────

function getScoreGradient(score: number): [string, string] {
  if (score >= 80) return ['#4ADE80', '#00E5CC']
  if (score >= 60) return ['#F5A623', '#F59E0B']
  return ['#F87171', '#EF4444']
}

function AnimatedScoreRing({ score }: { score: number }) {
  const size        = 156
  const strokeWidth = 11
  const r           = (size - strokeWidth) / 2
  const circ        = 2 * Math.PI * r
  const offset      = circ * (1 - Math.min(100, Math.max(0, score)) / 100)
  const [c1, c2]    = getScoreGradient(score)
  const gradId      = `score-ring-grad`

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth}
        />
        {/* Animated fill */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: 'easeOut', delay: 0.25 }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${c1}66)` }}
        />
      </svg>
      {/* Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold tabular-nums leading-none"
          style={{ color: c1 }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.35, type: 'spring', stiffness: 260, damping: 18 }}
        >
          <CountUp end={score} duration={1.3} suffix="%" delay={0.6} />
        </motion.span>
        <motion.span
          className="text-[11px] mt-1"
          style={{ color: '#8B8FA8' }}
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

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#00E5CC', '#4ADE80', '#C084FC', '#F5A623', '#60A5FA', '#F87171']

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
            left:            `${p.x}%`,
            top:             -24,
            width:           p.size,
            height:          p.size,
            backgroundColor: p.color,
            borderRadius:    p.isCircle ? '50%' : '2px',
          }}
          animate={{
            y:       '115vh',
            rotate:  p.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: p.speed, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

// ─── Expandable question row ──────────────────────────────────────────────────

function QuestionRow({ q, idx }: { q: any; idx: number }) {
  const [open, setOpen] = useState(false)
  const isCorrect = q.isCorrect
  const isSkipped = q.userAnswer === null || q.userAnswer === undefined

  const borderColor = isCorrect
    ? 'rgba(74,222,128,0.25)'
    : isSkipped
    ? 'rgba(255,255,255,0.07)'
    : 'rgba(248,113,113,0.25)'

  const iconEl = isCorrect ? (
    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#4ADE80' }} />
  ) : isSkipped ? (
    <MinusCircle className="h-4 w-4 shrink-0" style={{ color: '#8B8FA8' }} />
  ) : (
    <XCircle className="h-4 w-4 shrink-0" style={{ color: '#F87171' }} />
  )

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${borderColor}` }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors"
        style={{ background: 'rgba(255,255,255,0.03)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
      >
        {iconEl}
        <span className="text-xs shrink-0" style={{ color: '#8B8FA8' }}>Q{idx + 1}</span>
        <span className="text-sm font-medium flex-1 truncate" style={{ color: '#F2F2F0' }}>
          {q.text.length > 80 ? q.text.substring(0, 80) + '…' : q.text}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full shrink-0 mx-2"
          style={{
            background: q.difficulty === 'EASY'
              ? 'rgba(74,222,128,0.12)'
              : q.difficulty === 'HARD'
              ? 'rgba(248,113,113,0.12)'
              : 'rgba(245,166,35,0.12)',
            color: q.difficulty === 'EASY' ? '#4ADE80' : q.difficulty === 'HARD' ? '#F87171' : '#F5A623',
          }}
        >
          {q.difficulty}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown className="h-4 w-4 shrink-0" style={{ color: '#8B8FA8' }} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Full question */}
              <p className="text-sm font-medium" style={{ color: '#F2F2F0' }}>{q.text}</p>

              {/* MCQ options */}
              {q.options && (
                <div className="space-y-1.5">
                  {Object.entries(q.options as Record<string, string>).map(([key, val]) => {
                    const isCorrectOpt = q.answer === key
                    const isUserOpt    = q.userAnswer === key
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                        style={{
                          background: isCorrectOpt
                            ? 'rgba(74,222,128,0.10)'
                            : isUserOpt && !isCorrectOpt
                            ? 'rgba(248,113,113,0.10)'
                            : 'rgba(255,255,255,0.03)',
                          border: isCorrectOpt
                            ? '1px solid rgba(74,222,128,0.3)'
                            : isUserOpt && !isCorrectOpt
                            ? '1px solid rgba(248,113,113,0.3)'
                            : '1px solid transparent',
                          color: isCorrectOpt ? '#4ADE80' : isUserOpt && !isCorrectOpt ? '#F87171' : '#8B8FA8',
                        }}
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                          style={{
                            background: isCorrectOpt
                              ? 'rgba(74,222,128,0.2)'
                              : isUserOpt && !isCorrectOpt
                              ? 'rgba(248,113,113,0.2)'
                              : 'rgba(255,255,255,0.08)',
                            color: isCorrectOpt ? '#4ADE80' : isUserOpt && !isCorrectOpt ? '#F87171' : '#8B8FA8',
                          }}
                        >
                          {key}
                        </span>
                        <span className="flex-1">{val}</span>
                        {isCorrectOpt && <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#4ADE80' }} />}
                        {isUserOpt && !isCorrectOpt && <XCircle className="h-4 w-4 shrink-0" style={{ color: '#F87171' }} />}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Non-MCQ */}
              {!q.options && (
                <div className="space-y-1 text-sm">
                  {!isSkipped && (
                    <p style={{ color: isCorrect ? '#4ADE80' : '#F87171' }}>
                      Your answer: <strong>{q.userAnswer}</strong>
                    </p>
                  )}
                  {isSkipped && <p className="italic" style={{ color: '#8B8FA8' }}>Skipped</p>}
                  {!isCorrect && (
                    <p style={{ color: '#4ADE80' }}>Correct: <strong>{q.answer}</strong></p>
                  )}
                </div>
              )}

              {/* Topic */}
              {q.topic && (
                <p className="text-xs" style={{ color: '#8B8FA8' }}>Topic: {q.topic.title}</p>
              )}

              {/* Explanation */}
              {q.explanation && (
                <div
                  className="rounded-lg p-3 text-sm"
                  style={{
                    background: 'rgba(0,229,204,0.07)',
                    border: '1px solid rgba(0,229,204,0.2)',
                    color: '#A7F3ED',
                  }}
                >
                  <p className="font-semibold mb-0.5" style={{ color: '#00E5CC' }}>Explanation</p>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const { data: weakTopics } = useQuery<Array<{
    id: string; title: string; accuracy: number; correct: number; total: number;
    estimatedMins?: number; chapter: { title: string; subject: { title: string } }
  }>>({
    queryKey: ['weak-areas'],
    queryFn: () => api.get('/progress/weak-areas').then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
    enabled: !!result,
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="h-10 w-10" style={{ color: '#F87171' }} />
        <p className="font-semibold" style={{ color: '#F2F2F0' }}>Result not available.</p>
        <p className="text-sm" style={{ color: '#8B8FA8' }}>The test may still be in progress.</p>
        <Button variant="outline" onClick={() => navigate({ to: '/test' })}>
          Back to Tests
        </Button>
      </div>
    )
  }

  const { score, correct, incorrect, unanswered, total, timeTakenSecs, examTitle, questions, analytics } = result

  const chartData = Object.entries(analytics?.byDifficulty ?? {}).map(([key, val]: [string, any]) => ({
    name:     key.charAt(0) + key.slice(1).toLowerCase(),
    accuracy: val.accuracy,
    correct:  val.correct,
    total:    val.total,
    fill:     DIFF_COLORS[key as keyof typeof DIFF_COLORS] ?? '#6366f1',
  }))

  const isPassing   = (score ?? 0) >= 60
  const isHighScore = (score ?? 0) >= 80
  const [c1]        = getScoreGradient(score ?? 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">

      {isHighScore && <Confetti />}

      {/* ── Score card ── */}
      <Card className="glass-card border-0" style={{ borderRadius: 20 }}>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <AnimatedScoreRing score={score ?? 0} />
            <motion.h2
              className="text-2xl font-bold mt-4"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F2F2F0' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {isHighScore ? 'Excellent work!' : isPassing ? 'Test Complete!' : 'Test Complete'}
            </motion.h2>
            <motion.p
              className="mt-0.5"
              style={{ color: '#8B8FA8' }}
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
              <span
                className="inline-block mt-3 text-sm px-4 py-1.5 rounded-full font-semibold"
                style={{
                  background: isPassing ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                  color:      isPassing ? '#4ADE80' : '#F87171',
                  border:     `1px solid ${isPassing ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'}`,
                }}
              >
                {isPassing ? '✓ Pass' : '✗ Fail'}
              </span>
            </motion.div>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div>
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: '#8B8FA8' }}>
                <Target className="h-4 w-4" />
                <span className="text-xs">Correct</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#4ADE80' }}>
                <CountUp end={correct} duration={1.2} enableScrollSpy scrollSpyOnce />
              </p>
              <p className="text-xs" style={{ color: '#8B8FA8' }}>of {total}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: '#8B8FA8' }}>
                <XCircle className="h-4 w-4" />
                <span className="text-xs">Wrong</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#F87171' }}>
                <CountUp end={incorrect} duration={1.2} enableScrollSpy scrollSpyOnce />
              </p>
              <p className="text-xs" style={{ color: '#8B8FA8' }}>of {total}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: '#8B8FA8' }}>
                <MinusCircle className="h-4 w-4" />
                <span className="text-xs">Skipped</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#8B8FA8' }}>
                <CountUp end={unanswered} duration={1.2} enableScrollSpy scrollSpyOnce />
              </p>
              <p className="text-xs" style={{ color: '#8B8FA8' }}>of {total}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: '#8B8FA8' }}>
                <Clock className="h-4 w-4" />
                <span className="text-xs">Time</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#F2F2F0' }}>
                {timeTakenSecs ? formatSeconds(timeTakenSecs) : '—'}
              </p>
              <p className="text-xs" style={{ color: '#8B8FA8' }}>total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Difficulty breakdown chart ── */}
      {chartData.length > 0 && (
        <Card className="glass-card border-0" style={{ borderRadius: 20 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ color: '#F2F2F0' }}>Performance by Difficulty</CardTitle>
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
                  backgroundColor: 'transparent',
                },
                xAxis: {
                  ...chartTheme(isDark).xAxis,
                  categories: chartData.map(d => d.name),
                },
                yAxis: {
                  ...chartTheme(isDark).yAxis,
                  min: 0, max: 100,
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
            <div className="flex justify-center gap-4 mt-2 text-xs" style={{ color: '#8B8FA8' }}>
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

      {/* ── Weak topics ── */}
      {weakTopics && weakTopics.length > 0 && (
        <Card className="glass-card border-0" style={{ borderRadius: 20 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: '#F2F2F0' }}>
              <TrendingDown className="h-4 w-4" style={{ color: '#F87171' }} />
              Topics to Review
            </CardTitle>
            <p className="text-xs mt-0.5" style={{ color: '#8B8FA8' }}>
              Based on your overall test history — below 50% accuracy
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weakTopics.slice(0, 5).map(t => (
                <Link key={t.id} to="/study/$topicId" params={{ topicId: t.id }}>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                    style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.12)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.06)' }}
                  >
                    <div
                      className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}
                    >
                      {t.accuracy}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: '#F2F2F0' }}>{t.title}</p>
                      <p className="text-xs truncate" style={{ color: '#8B8FA8' }}>
                        {t.chapter.subject.title} › {t.chapter.title}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold" style={{ color: '#F87171' }}>
                        {t.correct}/{t.total}
                      </p>
                      <p className="text-[10px]" style={{ color: '#8B8FA8' }}>correct</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Question review ── */}
      <div>
        <h2
          className="text-lg font-semibold mb-3"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F2F2F0' }}
        >
          Question Review
        </h2>
        <div className="space-y-2">
          {(questions ?? []).map((q: any, i: number) => (
            <QuestionRow key={q.id} q={q} idx={i} />
          ))}
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap gap-3">
        <Link to="/test">
          <Button
            variant="outline"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#8B8FA8', background: 'transparent' }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Tests
          </Button>
        </Link>
        <Link to="/test/setup">
          <Button
            className="ep-shimmer-btn ds-btn-shimmer"
            style={{ background: 'linear-gradient(135deg, #00E5CC, #00B8A5)', color: '#0D0F1A', border: 'none', fontWeight: 600 }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </Link>
        <Link to="/">
          <Button
            variant="ghost"
            style={{ color: '#8B8FA8' }}
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
