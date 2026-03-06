import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressHeatmap } from '@/components/dashboard/ProgressHeatmap'
import { CheckCircle2, Clock, Circle, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/_dashboard/progress')({
  component: ProgressPage,
})

const STATUS_CONFIG = {
  COMPLETED:   {
    icon: CheckCircle2,
    style: { color: '#4ADE80' },
    label: 'Completed',
    badgeStyle: { background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' },
  },
  IN_PROGRESS: {
    icon: Clock,
    style: { color: '#F5A623' },
    label: 'In Progress',
    badgeStyle: { background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.25)' },
  },
  NOT_STARTED: {
    icon: Circle,
    style: { color: '#8B8FA8' },
    label: 'Not Started',
    badgeStyle: { background: 'rgba(255,255,255,0.06)', color: '#8B8FA8', border: '1px solid rgba(255,255,255,0.1)' },
  },
}

const OVERVIEW_STATS = (stats: { total: number; completed: number; inProgress: number; notStarted: number }) => [
  {
    label: 'Total Topics',  value: stats.total,
    style: { color: '#F2F2F0' }, accent: 'rgba(255,255,255,0.08)',
  },
  {
    label: 'Completed',    value: stats.completed,
    style: { color: '#4ADE80' }, accent: 'rgba(74,222,128,0.12)',
  },
  {
    label: 'In Progress',  value: stats.inProgress,
    style: { color: '#F5A623' }, accent: 'rgba(245,166,35,0.12)',
  },
  {
    label: 'Not Started',  value: stats.notStarted,
    style: { color: '#8B8FA8' }, accent: 'rgba(255,255,255,0.04)',
  },
]

function ProgressPage() {
  const { data: progress, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => api.get('/progress').then(r => r.data),
  })

  const items: any[] = progress?.data ?? progress ?? []

  const stats = {
    total:      items.length,
    completed:  items.filter((p: any) => p.status === 'COMPLETED').length,
    inProgress: items.filter((p: any) => p.status === 'IN_PROGRESS').length,
    notStarted: items.filter((p: any) => p.status === 'NOT_STARTED').length,
  }

  const grouped = items.reduce((acc: Record<string, any[]>, p: any) => {
    const subject = p.topic?.chapter?.subject?.title ?? 'General'
    if (!acc[subject]) acc[subject] = []
    acc[subject].push(p)
    return acc
  }, {})

  const overallPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-32 rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 ds-stagger">

      {/* ── Page header ── */}
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F2F2F0', letterSpacing: '-0.025em' }}
        >
          My Progress
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#8B8FA8' }}>
          Track your study completion across all topics
        </p>
      </div>

      {/* ── Activity heatmap ── */}
      <ProgressHeatmap />

      {/* ── Overview stat cards ── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {OVERVIEW_STATS(stats).map(s => (
          <motion.div
            key={s.label}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
          >
            <Card
              className="glass-card progress-stat-card border-0"
              style={{ borderRadius: 16 }}
            >
              <CardContent className="pt-5 pb-5 px-4 text-center">
                <p className="text-3xl font-bold leading-none" style={s.style}>{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wider mt-2" style={{ color: '#8B8FA8' }}>
                  {s.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Overall progress bar ── */}
      <Card className="glass-card border-0" style={{ borderRadius: 16 }}>
        <CardContent className="pt-5 pb-5 px-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium flex items-center gap-2" style={{ color: '#F2F2F0' }}>
              <BarChart3 className="h-4 w-4" style={{ color: '#00E5CC' }} />
              Overall Completion
            </span>
            <span className="font-bold" style={{ color: '#00E5CC' }}>{overallPct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #00B8A5 0%, #00E5CC 100%)' }}
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Per-subject breakdown ── */}
      {Object.entries(grouped).map(([subject, topics]: [string, any]) => {
        const subjectCompleted = topics.filter((t: any) => t.status === 'COMPLETED').length
        const subjectPct = Math.round((subjectCompleted / topics.length) * 100)

        return (
          <Card key={subject} className="glass-card card-lift border-0" style={{ borderRadius: 16 }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle
                  className="text-base font-semibold"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F2F2F0' }}
                >
                  {subject}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: '#00E5CC' }}>
                    {subjectCompleted}/{topics.length}
                  </span>
                </div>
              </div>
              {/* Subject-level progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #00B8A5 0%, #00E5CC 100%)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${subjectPct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topics.map((p: any) => {
                  const cfg  = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG]
                  const Icon = cfg.icon
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 py-0.5"
                    >
                      <Icon
                        className="h-4 w-4 shrink-0"
                        style={cfg.style}
                      />
                      <span className="text-sm flex-1 truncate" style={{ color: '#C8CCEA' }}>
                        {p.topic?.title}
                      </span>
                      <Badge
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={cfg.badgeStyle}
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {items.length === 0 && (
        <div className="text-center py-16" style={{ color: '#8B8FA8' }}>
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No topics tracked yet. Start studying to see your progress!</p>
        </div>
      )}
    </div>
  )
}
