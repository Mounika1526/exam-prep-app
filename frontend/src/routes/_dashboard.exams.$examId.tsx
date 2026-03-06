import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, Play, Brain, CheckCircle2, Clock,
  Circle, AlertCircle, ExternalLink, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDuration } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/_dashboard/exams/$examId')({
  component: ExamDashboardPage,
})

// ─── Teal progress ring ───────────────────────────────────────────────────────

function ProgressRing({ value, size = 88 }: { value: number; size?: number }) {
  const r      = (size - 10) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ
  const gradId = `ring-grad-${size}-${value}`
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B8A5" />
          <stop offset="100%" stopColor="#00E5CC" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={7}
        stroke="rgba(255,255,255,0.08)"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={7}
        stroke={`url(#${gradId})`}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease', filter: 'drop-shadow(0 0 4px rgba(0,229,204,0.35))' }}
      />
    </svg>
  )
}

// ─── Status ───────────────────────────────────────────────────────────────────

const STATUS = {
  COMPLETED:   { icon: CheckCircle2, color: '#4ADE80' },
  IN_PROGRESS: { icon: AlertCircle,  color: '#F5A623' },
  NOT_STARTED: { icon: Circle,       color: '#8B8FA8'  },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function subjectStats(subject: any) {
  const topics: any[] = subject.chapters?.flatMap((c: any) => c.topics ?? []) ?? []
  const completed = topics.filter(t => t.status === 'COMPLETED').length
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

  const { data: examData, isLoading } = useQuery({
    queryKey: ['exam-progress', examId],
    queryFn: () => api.get(`/progress/exam/${examId}`).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  })

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="grid grid-cols-[220px_1fr] gap-4">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="text-center py-16" style={{ color: '#8B8FA8' }}>
        <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Exam not found or no content yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Hero Banner ── */}
      <div className="relative rounded-2xl overflow-hidden h-44 sm:h-52">
        {(examData as any).imageUrl ? (
          <img
            src={(examData as any).imageUrl}
            alt={examData.examTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, rgba(0,229,204,0.3) 0%, rgba(0,184,165,0.15) 50%, rgba(13,15,26,0.8) 100%)',
            }}
          />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,15,26,0.85) 0%, rgba(13,15,26,0.2) 60%, transparent 100%)' }} />

        {/* Back button */}
        <Link to="/exams" className="absolute top-3 left-3">
          <Button
            size="sm"
            className="h-8 gap-1.5"
            style={{ background: 'rgba(0,0,0,0.45)', color: '#F2F2F0', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Exams
          </Button>
        </Link>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            size="sm"
            className="ep-shimmer-btn ds-btn-shimmer h-8 gap-1.5"
            onClick={() => navigate({ to: '/test/setup', search: { examId } })}
            style={{ background: 'linear-gradient(135deg, #00E5CC, #00B8A5)', color: '#0D0F1A', border: 'none', fontWeight: 600 }}
          >
            <Play className="h-3.5 w-3.5" />
            Start Test
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => navigate({ to: '/ai-tutor', search: { examId } })}
            style={{ background: 'rgba(0,0,0,0.45)', color: '#F2F2F0', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
          >
            <Brain className="h-3.5 w-3.5" />
            AI Tutor
          </Button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4">
          <h1
            className="text-white text-2xl font-bold leading-tight drop-shadow"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}
          >
            {examData.examTitle}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {subjects.length} subjects · {totalTopics} topics
          </p>
        </div>
      </div>

      {/* ── Overall Progress ── */}
      <div
        className="glass-card rounded-xl flex items-center gap-6 px-6 py-5"
        style={{ borderRadius: 16 }}
      >
        <div className="relative shrink-0">
          <ProgressRing value={overallPct} />
          <div className="absolute inset-0 flex items-center justify-center rotate-90">
            <span className="text-lg font-bold leading-none" style={{ color: '#00E5CC' }}>{overallPct}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base" style={{ color: '#F2F2F0' }}>Overall Progress</p>
          <p className="text-sm mb-3" style={{ color: '#8B8FA8' }}>
            {completedTopics} of {totalTopics} topics completed
          </p>
          {/* Teal progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg, #00B8A5, #00E5CC)' }}
            />
          </div>
        </div>
        <div className="hidden sm:flex gap-6 text-center shrink-0">
          {subjects.slice(0, 3).map(s => {
            const st = subjectStats(s)
            return (
              <div key={s.id}>
                <p className="text-xl font-bold" style={{ color: '#00E5CC' }}>{st.pct}%</p>
                <p className="text-xs truncate max-w-[72px]" style={{ color: '#8B8FA8' }}>{s.title}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">

        {/* ── Subject sidebar ── */}
        <div
          className="glass-card h-fit rounded-xl overflow-hidden lg:sticky lg:top-4"
          style={{ borderRadius: 12 }}
        >
          <div
            className="px-4 py-3"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <p
              className="text-xs font-semibold tracking-wider"
              style={{ color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.07em' }}
            >
              Subjects
            </p>
          </div>
          <div>
            {subjects.map(subject => {
              const st     = subjectStats(subject)
              const active = (selectedSubjectId ?? subjects[0]?.id) === subject.id
              return (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className="w-full text-left px-4 py-3 transition-all duration-150 flex items-start gap-2.5"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: active ? 'rgba(0,229,204,0.07)' : 'transparent',
                    borderLeft: active ? '2px solid #00E5CC' : '2px solid transparent',
                  }}
                >
                  {subject.icon && <span className="text-lg leading-tight">{subject.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium leading-snug truncate"
                      style={{ color: active ? '#00E5CC' : '#F2F2F0' }}
                    >
                      {subject.title}
                    </p>
                    {/* Mini progress bar */}
                    <div className="mt-1.5 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${st.pct}%`, background: active ? '#00E5CC' : 'rgba(0,229,204,0.4)' }}
                      />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: '#8B8FA8' }}>
                      {st.completed}/{st.total} done · {st.pct}%
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
                <h2
                  className="text-lg font-semibold"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F2F2F0' }}
                >
                  {activeSubject.title}
                </h2>
                <span
                  className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(0,229,204,0.12)',
                    color: '#00E5CC',
                    border: '1px solid rgba(0,229,204,0.25)',
                  }}
                >
                  {subjectStats(activeSubject).pct}% complete
                </span>
              </div>

              {(activeSubject.chapters ?? []).map((chapter: any) => {
                const isOpen = expandedChapters.has(chapter.id)
                return (
                  <div
                    key={chapter.id}
                    className="glass-card overflow-hidden"
                    style={{ borderRadius: 12 }}
                  >
                    {/* Chapter header */}
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                    >
                      <motion.span
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="shrink-0"
                      >
                        <ChevronRight className="h-4 w-4" style={{ color: '#8B8FA8' }} />
                      </motion.span>
                      <span className="font-medium flex-1 text-sm" style={{ color: '#F2F2F0' }}>
                        {chapter.title}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: '#8B8FA8',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {chapter.topics?.length ?? 0} topics
                      </span>
                    </button>

                    {/* Topics list */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="topics"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          {(chapter.topics ?? []).map((topic: any, idx: number) => {
                            const cfg  = STATUS[topic.status as keyof typeof STATUS] ?? STATUS.NOT_STARTED
                            const Icon = cfg.icon
                            return (
                              <div
                                key={topic.id}
                                className="flex items-center gap-3 px-4 py-3 transition-colors"
                                style={{
                                  borderTop: idx === 0 ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.04)',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                              >
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
                                    <Icon className="h-4 w-4 shrink-0" style={{ color: cfg.color }} />
                                  </motion.div>
                                </AnimatePresence>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate" style={{ color: '#F2F2F0' }}>
                                    {topic.title}
                                  </p>
                                  {topic.estimatedMins && (
                                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: '#8B8FA8' }}>
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(topic.estimatedMins)}
                                    </div>
                                  )}
                                </div>

                                {/* Status badge */}
                                <span
                                  className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 hidden sm:inline-block"
                                  style={{
                                    background: topic.status === 'COMPLETED'
                                      ? 'rgba(74,222,128,0.12)'
                                      : topic.status === 'IN_PROGRESS'
                                      ? 'rgba(245,166,35,0.12)'
                                      : 'rgba(255,255,255,0.05)',
                                    color: cfg.color,
                                    border: `1px solid ${
                                      topic.status === 'COMPLETED'
                                        ? 'rgba(74,222,128,0.25)'
                                        : topic.status === 'IN_PROGRESS'
                                        ? 'rgba(245,166,35,0.25)'
                                        : 'rgba(255,255,255,0.08)'
                                    }`,
                                  }}
                                >
                                  {topic.status.replace('_', ' ')}
                                </span>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {topic.status !== 'COMPLETED' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs gap-1"
                                      disabled={markDone.isPending}
                                      onClick={() => markDone.mutate(topic.id)}
                                      style={{ color: '#4ADE80' }}
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Done
                                    </Button>
                                  )}
                                  <Link to="/study/$topicId" params={{ topicId: topic.id }}>
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs gap-1"
                                      style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(0,229,204,0.3)',
                                        color: '#00E5CC',
                                      }}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
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
                <div
                  className="text-center py-12 rounded-xl"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', color: '#8B8FA8' }}
                >
                  <p>No chapters available yet.</p>
                </div>
              )}
            </>
          ) : (
            <div
              className="text-center py-16 rounded-xl"
              style={{ border: '1px solid rgba(255,255,255,0.07)', color: '#8B8FA8' }}
            >
              <p>No subjects available for this exam yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
