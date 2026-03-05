import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft, Play, Brain, CheckCircle2, Clock,
  Circle, AlertCircle, ExternalLink, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/_dashboard/exams/$examId')({
  component: ExamDashboardPage,
})

// ─── Progress ring (pure SVG, no extra dep) ──────────────────────────────────

function ProgressRing({ value, size = 88 }: { value: number; size?: number }) {
  const r      = (size - 10) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        className="stroke-muted" strokeWidth="7" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        className="stroke-primary transition-all duration-700"
        strokeWidth="7" strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" />
    </svg>
  )
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS = {
  COMPLETED:   { icon: CheckCircle2, color: 'text-green-500',          badge: 'default'    as const },
  IN_PROGRESS: { icon: AlertCircle,  color: 'text-yellow-500',         badge: 'secondary'  as const },
  NOT_STARTED: { icon: Circle,       color: 'text-muted-foreground',   badge: 'outline'    as const },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function subjectStats(subject: any) {
  const topics: any[] = subject.chapters?.flatMap((c: any) => c.topics ?? []) ?? []
  const completed     = topics.filter(t => t.status === 'COMPLETED').length
  return { total: topics.length, completed, pct: topics.length ? Math.round((completed / topics.length) * 100) : 0 }
}

// ─── Main component ───────────────────────────────────────────────────────────

function ExamDashboardPage() {
  const { examId }       = Route.useParams()
  const navigate         = useNavigate()
  const { toast }        = useToast()
  const qc               = useQueryClient()
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [expandedChapters, setExpandedChapters]   = useState<Set<string>>(new Set())

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: examData, isLoading } = useQuery({
    queryKey: ['exam-progress', examId],
    queryFn: () => api.get(`/progress/exam/${examId}`).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  })

  // ── Progress mutation ────────────────────────────────────────────────────
  const markDone = useMutation({
    mutationFn: (topicId: string) =>
      api.put(`/progress/topic/${topicId}`, { status: 'COMPLETED' }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-progress', examId] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({ title: 'Marked as done!' })
    },
    onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
  })

  // ── Derived ──────────────────────────────────────────────────────────────
  const subjects: any[] = examData?.subjects ?? []
  const activeSubject   = subjects.find(s => s.id === selectedSubjectId) ?? subjects[0] ?? null
  const overallPct      = examData?.overallPercent ?? 0
  const totalTopics     = examData?.totalTopics ?? 0
  const completedTopics = examData?.completedTopics ?? 0

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      next.has(chapterId) ? next.delete(chapterId) : next.add(chapterId)
      return next
    })
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-[220px_1fr] gap-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Exam not found or no content yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Hero Banner ── */}
      <div className="relative rounded-xl overflow-hidden h-44 sm:h-52">
        {(examData as any).imageUrl ? (
          <img
            src={(examData as any).imageUrl}
            alt={examData.examTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 via-primary/20 to-primary/5" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Back button */}
        <Link to="/exams" className="absolute top-3 left-3">
          <Button size="sm" variant="secondary"
            className="h-8 gap-1.5 bg-black/40 text-white border-white/20 hover:bg-black/60 backdrop-blur-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Exams
          </Button>
        </Link>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          <Button size="sm" onClick={() => navigate({ to: '/test/setup', search: { examId } })}>
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Start Test
          </Button>
          <Button size="sm" variant="secondary"
            className="bg-black/40 text-white border-white/20 hover:bg-black/60 backdrop-blur-sm"
            onClick={() => navigate({ to: '/ai-tutor', search: { examId } })}>
            <Brain className="h-3.5 w-3.5 mr-1.5" />
            AI Tutor
          </Button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4">
          <h1 className="text-white text-2xl font-bold leading-tight drop-shadow">
            {examData.examTitle}
          </h1>
          <p className="text-white/70 text-sm mt-0.5">
            {subjects.length} subjects · {totalTopics} topics
          </p>
        </div>
      </div>

      {/* ── Overall Progress Bar ── */}
      <div className="border rounded-xl p-5 flex items-center gap-6 bg-card">
        <div className="relative shrink-0">
          <ProgressRing value={overallPct} />
          <div className="absolute inset-0 flex items-center justify-center rotate-90">
            <span className="text-lg font-bold leading-none">{overallPct}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base">Overall Progress</p>
          <p className="text-sm text-muted-foreground mb-2">
            {completedTopics} of {totalTopics} topics completed
          </p>
          <Progress value={overallPct} className="h-2" />
        </div>
        <div className="hidden sm:flex gap-6 text-center shrink-0">
          {subjects.slice(0, 3).map(s => {
            const st = subjectStats(s)
            return (
              <div key={s.id}>
                <p className="text-xl font-bold">{st.pct}%</p>
                <p className="text-xs text-muted-foreground truncate max-w-[72px]">{s.title}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">

        {/* ── Sidebar: subjects ── */}
        <div className="border rounded-xl overflow-hidden bg-card h-fit lg:sticky lg:top-4">
          <div className="px-4 py-3 border-b bg-muted/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Subjects
            </p>
          </div>
          <div className="divide-y">
            {subjects.map(subject => {
              const st     = subjectStats(subject)
              const active = (selectedSubjectId ?? subjects[0]?.id) === subject.id
              return (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 transition-colors flex items-start gap-2.5',
                    active ? 'bg-primary/5 text-primary' : 'hover:bg-accent'
                  )}
                >
                  {subject.icon && <span className="text-lg leading-tight">{subject.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium leading-snug truncate', active && 'text-primary')}>
                      {subject.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Progress value={st.pct} className="h-1 flex-1" />
                      <span className="text-[10px] text-muted-foreground shrink-0">{st.pct}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {st.completed}/{st.total} done
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Main: chapters + topics ── */}
        <div className="space-y-3">
          {activeSubject ? (
            <>
              <div className="flex items-center gap-2 pb-1">
                {activeSubject.icon && <span className="text-xl">{activeSubject.icon}</span>}
                <h2 className="text-lg font-semibold">{activeSubject.title}</h2>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {subjectStats(activeSubject).pct}% complete
                </Badge>
              </div>

              {(activeSubject.chapters ?? []).map((chapter: any) => {
                const isOpen = expandedChapters.has(chapter.id)
                return (
                  <div key={chapter.id} className="border rounded-xl overflow-hidden bg-card">
                    {/* Chapter header */}
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                    >
                      <motion.span
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="shrink-0"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </motion.span>
                      <span className="font-medium flex-1">{chapter.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {chapter.topics?.length ?? 0} topics
                      </Badge>
                    </button>

                    {/* Topics list — animated expand/collapse */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="topics"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden divide-y"
                        >
                        {(chapter.topics ?? []).map((topic: any) => {
                          const cfg = STATUS[topic.status as keyof typeof STATUS] ?? STATUS.NOT_STARTED
                          const Icon = cfg.icon
                          return (
                            <div key={topic.id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
                              {/* Animated status icon */}
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={topic.status}
                                  initial={{ scale: 0.4, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.4, opacity: 0 }}
                                  transition={
                                    topic.status === 'COMPLETED'
                                      ? { type: 'spring', stiffness: 360, damping: 18 }
                                      : { duration: 0.15 }
                                  }
                                >
                                  <Icon className={cn('h-4 w-4 shrink-0', cfg.color)} />
                                </motion.div>
                              </AnimatePresence>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{topic.title}</p>
                                {topic.estimatedMins && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(topic.estimatedMins)}
                                  </div>
                                )}
                              </div>
                              <Badge variant={cfg.badge} className="text-xs shrink-0 hidden sm:inline-flex">
                                {topic.status.replace('_', ' ')}
                              </Badge>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {topic.status !== 'COMPLETED' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    disabled={markDone.isPending}
                                    onClick={() => markDone.mutate(topic.id)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Done
                                  </Button>
                                )}
                                <Link to="/study/$topicId" params={{ topicId: topic.id }}>
                                  <Button size="sm" variant="outline" className="h-7 text-xs">
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    Open
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}

              {(activeSubject.chapters ?? []).length === 0 && (
                <div className="text-center py-12 text-muted-foreground border rounded-xl">
                  <p>No chapters available yet.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground border rounded-xl">
              <p>No subjects available for this exam yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
