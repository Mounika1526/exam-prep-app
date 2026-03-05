import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressHeatmap } from '@/components/dashboard/ProgressHeatmap'
import { CheckCircle2, Clock, Circle } from 'lucide-react'

export const Route = createFileRoute('/_dashboard/progress')({
  component: ProgressPage,
})

const STATUS_CONFIG = {
  COMPLETED:   { icon: CheckCircle2, color: 'text-green-500',        label: 'Completed',   badge: 'default'    as const },
  IN_PROGRESS: { icon: Clock,        color: 'text-yellow-500',       label: 'In Progress', badge: 'secondary'  as const },
  NOT_STARTED: { icon: Circle,       color: 'text-muted-foreground', label: 'Not Started', badge: 'outline'    as const },
}

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Progress</h1>
        <p className="text-muted-foreground">Track your study completion across all topics</p>
      </div>

      {/* Activity Heatmap */}
      <ProgressHeatmap />

      {/* Overview counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Topics',  value: stats.total,      className: '' },
          { label: 'Completed',     value: stats.completed,  className: 'text-green-600' },
          { label: 'In Progress',   value: stats.inProgress, className: 'text-yellow-600' },
          { label: 'Not Started',   value: stats.notStarted, className: '' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-3xl font-bold ${s.className}`}>{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Overall Completion</span>
          <span className="font-medium">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
          </span>
        </div>
        <Progress value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} />
      </div>

      {/* By Subject */}
      {Object.entries(grouped).map(([subject, topics]: [string, any]) => {
        const subjectCompleted = topics.filter((t: any) => t.status === 'COMPLETED').length
        return (
          <Card key={subject}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{subject}</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {subjectCompleted}/{topics.length}
                </span>
              </div>
              <Progress value={(subjectCompleted / topics.length) * 100} className="h-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topics.map((p: any) => {
                  const cfg  = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG]
                  const Icon = cfg.icon
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                      <span className="text-sm flex-1 truncate">{p.topic?.title}</span>
                      <Badge variant={cfg.badge} className="text-xs">{cfg.label}</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {items.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No topics tracked yet. Start studying to see your progress!</p>
        </div>
      )}
    </div>
  )
}
