import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, ClipboardList, Trophy, Clock, RotateCcw } from 'lucide-react'
import { formatSeconds } from '@/lib/utils'

export const Route = createFileRoute('/_dashboard/test/')({
  component: TestIndexPage,
})

function scoreColor(score: number): string {
  if (score >= 70) return '#4ADE80'
  if (score >= 50) return '#F5A623'
  return '#F87171'
}

function TestIndexPage() {
  const navigate = useNavigate()

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['test-sessions'],
    queryFn: () => api.get('/tests?limit=20').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const sessions: any[] = sessionsData?.data?.data ?? sessionsData?.data ?? []

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#F2F2F0',
              letterSpacing: '-0.025em',
            }}
          >
            Practice Tests
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8B8FA8' }}>
            Test your knowledge, track your progress
          </p>
        </div>
        <Link to="/test/setup">
          <Button
            className="ep-shimmer-btn ds-btn-shimmer gap-2"
            style={{
              background: 'linear-gradient(135deg, #00E5CC, #00B8A5)',
              color: '#0D0F1A',
              border: 'none',
              fontWeight: 600,
            }}
          >
            <Plus className="h-4 w-4" />
            New Test
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {!isLoading && sessions.length === 0 && (
        <div
          className="glass-card rounded-2xl py-16 text-center"
          style={{ borderRadius: 16 }}
        >
          <ClipboardList
            className="h-12 w-12 mx-auto mb-4"
            style={{ color: 'rgba(255,255,255,0.15)' }}
          />
          <h3 className="font-semibold text-lg mb-2" style={{ color: '#F2F2F0' }}>
            No tests taken yet
          </h3>
          <p className="text-sm mb-6" style={{ color: '#8B8FA8' }}>
            Start your first practice test to see your results here.
          </p>
          <Link to="/test/setup">
            <Button
              className="ep-shimmer-btn ds-btn-shimmer"
              style={{
                background: 'linear-gradient(135deg, #00E5CC, #00B8A5)',
                color: '#0D0F1A',
                border: 'none',
                fontWeight: 600,
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Start First Test
            </Button>
          </Link>
        </div>
      )}

      {/* Session history */}
      {(isLoading || sessions.length > 0) && (
        <div>
          <h2
            className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Test History
          </h2>
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))
              : sessions.map((s: any) => {
                  const isCompleted = s.status === 'COMPLETED'
                  const sc = scoreColor(s.score ?? 0)
                  return (
                    <div
                      key={s.id}
                      className="glass-card rounded-xl flex items-center gap-4 px-5 py-4 cursor-pointer transition-all duration-200"
                      style={{ borderRadius: 12 }}
                      onClick={() =>
                        navigate({
                          to: isCompleted ? '/test/$sessionId/result' : '/test/$sessionId',
                          params: { sessionId: s.id },
                        })
                      }
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLElement).style.background = 'rgba(0,229,204,0.06)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,204,0.15)'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLElement).style.background = ''
                        ;(e.currentTarget as HTMLElement).style.borderColor = ''
                      }}
                    >
                      {/* Score / status */}
                      <div className="shrink-0 text-center w-14">
                        {isCompleted ? (
                          <>
                            <p className="text-xl font-bold tabular-nums" style={{ color: sc }}>
                              {s.score ?? 0}%
                            </p>
                            <Trophy className="h-3.5 w-3.5 mx-auto mt-0.5" style={{ color: '#F5A623' }} />
                          </>
                        ) : (
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              background: 'rgba(245,166,35,0.12)',
                              color: '#F5A623',
                              border: '1px solid rgba(245,166,35,0.3)',
                            }}
                          >
                            {s.status}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{ color: '#F2F2F0', fontSize: '14px' }}>
                          {s.exam?.title ?? 'Unknown Exam'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#8B8FA8' }}>
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
                        <div className="shrink-0 text-right text-xs" style={{ color: '#8B8FA8' }}>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatSeconds(s.timeTakenSecs)}
                        </div>
                      )}

                      {/* Resume badge */}
                      {!isCompleted && (
                        <span
                          className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                          style={{
                            background: 'rgba(245,166,35,0.12)',
                            color: '#F5A623',
                            border: '1px solid rgba(245,166,35,0.3)',
                          }}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Resume
                        </span>
                      )}
                    </div>
                  )
                })}
          </div>
        </div>
      )}
    </div>
  )
}
