import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, ChevronRight, Clock, Zap } from 'lucide-react'
import type { ContinueTopic } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS:  'In Progress',
  COMPLETED:    'Completed',
}

const STATUS_STYLE: Record<string, { background: string; color: string; border: string }> = {
  NOT_STARTED: { background: 'rgba(255,255,255,0.06)', color: '#8B8FA8', border: '1px solid rgba(255,255,255,0.1)' },
  IN_PROGRESS: { background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.25)' },
  COMPLETED:   { background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' },
}

export function ContinueStudyingCard() {
  const { data: topic, isLoading } = useQuery<ContinueTopic | null>({
    queryKey: ['continue-topic'],
    queryFn: () => api.get('/users/continue-topic').then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return (
      <Card className="glass-card border-0" style={{ borderRadius: 16 }}>
        <CardHeader><Skeleton className="h-5 w-44" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!topic) {
    return (
      <Card className="glass-card border-0" style={{ borderRadius: 16 }}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F2F2F0' }}>
            <BookOpen className="h-4.5 w-4.5 text-primary" style={{ width: 18, height: 18 }} />
            Continue Studying
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center py-4" style={{ color: '#8B8FA8' }}>
            No study activity yet. Pick an exam to get started!
          </p>
        </CardContent>
      </Card>
    )
  }

  const statusStyle = STATUS_STYLE[topic.topicStatus] ?? STATUS_STYLE.NOT_STARTED
  const pct = topic.chapterProgress.total > 0
    ? Math.round((topic.chapterProgress.completed / topic.chapterProgress.total) * 100)
    : 0

  return (
    <Card className="glass-card card-lift border-0" style={{ borderRadius: 16 }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F2F2F0' }}>
          <Zap
            className="h-4.5 w-4.5"
            style={{ width: 18, height: 18, color: '#00E5CC', filter: 'drop-shadow(0 0 4px rgba(0,229,204,0.6))' }}
          />
          Continue Studying
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Topic info */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold truncate" style={{ color: '#F2F2F0' }}>{topic.topicTitle}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#8B8FA8' }}>
              {topic.examTitle} › {topic.subjectTitle} › {topic.chapterTitle}
            </p>
          </div>
          <span
            className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={statusStyle}
          >
            {STATUS_LABEL[topic.topicStatus] ?? topic.topicStatus}
          </span>
        </div>

        {/* Estimated time */}
        {topic.estimatedMins && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8B8FA8' }}>
            <Clock className="h-3.5 w-3.5" />
            ~{topic.estimatedMins} min estimated
          </div>
        )}

        {/* Chapter progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: '#8B8FA8' }}>
            <span>{topic.chapterTitle}</span>
            <span style={{ color: '#00E5CC' }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #00B8A5 0%, #00E5CC 100%)',
              }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: '#8B8FA8' }}>
            {topic.chapterProgress.completed}/{topic.chapterProgress.total} topics
          </p>
        </div>

        {/* Resume button with shimmer */}
        <Button
          asChild
          size="sm"
          className="w-full ds-btn-shimmer ep-shimmer-btn"
          style={{ height: 40, fontWeight: 600 }}
        >
          <Link to="/study/$topicId" params={{ topicId: topic.topicId }}>
            Resume
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
