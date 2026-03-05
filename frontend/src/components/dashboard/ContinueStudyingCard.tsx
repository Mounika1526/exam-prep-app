import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, ChevronRight, Clock } from 'lucide-react'
import type { ContinueTopic } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS:  'In Progress',
  COMPLETED:    'Completed',
}

const STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: 'bg-muted text-muted-foreground',
  IN_PROGRESS:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMPLETED:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export function ContinueStudyingCard() {
  const { data: topic, isLoading } = useQuery<ContinueTopic | null>({
    queryKey: ['continue-topic'],
    queryFn: () => api.get('/users/continue-topic').then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return (
      <Card>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Continue Studying
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No study activity yet. Pick an exam to get started!
          </p>
        </CardContent>
      </Card>
    )
  }

  const pct = topic.chapterProgress.total > 0
    ? Math.round((topic.chapterProgress.completed / topic.chapterProgress.total) * 100)
    : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Continue Studying
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Topic info */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold truncate">{topic.topicTitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {topic.examTitle} › {topic.subjectTitle} › {topic.chapterTitle}
            </p>
          </div>
          <Badge className={STATUS_COLOR[topic.topicStatus]}>
            {STATUS_LABEL[topic.topicStatus] ?? topic.topicStatus}
          </Badge>
        </div>

        {/* Estimated time */}
        {topic.estimatedMins && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            ~{topic.estimatedMins} min
          </div>
        )}

        {/* Chapter progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{topic.chapterTitle}</span>
            <span>{topic.chapterProgress.completed}/{topic.chapterProgress.total} topics</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        {/* Resume button */}
        <Button asChild size="sm" className="w-full">
          <Link to="/exams/$examId" params={{ examId: topic.examId }}>
            Resume
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
