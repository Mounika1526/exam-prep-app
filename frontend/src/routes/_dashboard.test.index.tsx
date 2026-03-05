import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, ClipboardList, Trophy, Clock, RotateCcw } from 'lucide-react'
import { formatSeconds } from '@/lib/utils'
import { getScoreColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_dashboard/test/')({
  component: TestIndexPage,
})

function TestIndexPage() {
  const navigate = useNavigate()

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['test-sessions'],
    queryFn: () => api.get('/tests?limit=20').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })

  // API returns paginated response: { data: { data: [...], pagination: {...} } }
  const sessions: any[] = sessionsData?.data?.data ?? sessionsData?.data ?? []

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Practice Tests</h1>
          <p className="text-muted-foreground">Test your knowledge, track your progress</p>
        </div>
        <Link to="/test/setup">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </Link>
      </div>

      {/* Quick start CTA */}
      {!isLoading && sessions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <h3 className="font-semibold text-lg mb-2">No tests taken yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Start your first practice test to see your results here.
            </p>
            <Link to="/test/setup">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Start First Test
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Session history */}
      {(isLoading || sessions.length > 0) && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Test History
          </h2>
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
              : sessions.map((s: any) => {
                  const isCompleted = s.status === 'COMPLETED'
                  return (
                    <Card
                      key={s.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() =>
                        navigate({
                          to: isCompleted ? '/test/$sessionId/result' : '/test/$sessionId',
                          params: { sessionId: s.id },
                        })
                      }
                    >
                      <CardContent className="py-4 flex items-center gap-4">
                        {/* Score / status */}
                        <div className="shrink-0 text-center w-14">
                          {isCompleted ? (
                            <>
                              <p className={cn('text-xl font-bold', getScoreColor(s.score ?? 0))}>
                                {s.score ?? 0}%
                              </p>
                              <Trophy className="h-3.5 w-3.5 mx-auto text-yellow-500 mt-0.5" />
                            </>
                          ) : (
                            <Badge variant="secondary">{s.status}</Badge>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{s.exam?.title ?? 'Unknown Exam'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(s.startedAt).toLocaleDateString('en', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                            {' · '}
                            {s.totalQuestions} questions
                            {s.timeLimitMins && ` · ${s.timeLimitMins} min limit`}
                          </p>
                        </div>

                        {/* Time taken */}
                        {isCompleted && s.timeTakenSecs && (
                          <div className="shrink-0 text-right text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatSeconds(s.timeTakenSecs)}
                          </div>
                        )}

                        {/* Resume / Review */}
                        {!isCompleted && (
                          <Badge variant="outline" className="shrink-0 text-yellow-600 border-yellow-300">
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Resume
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
          </div>
        </div>
      )}
    </div>
  )
}
