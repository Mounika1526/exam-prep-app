import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, ChevronRight, TrendingUp } from 'lucide-react'

interface RecentTest {
  id: string
  score: number | null
  totalQuestions: number
  submittedAt: string | null
  exam: { id: string; title: string }
}

interface Props { tests: RecentTest[] }

function fmtDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function scoreMeta(score: number): { color: string; bg: string; border: string; label: string } {
  if (score >= 70) return { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)', label: 'Pass' }
  if (score >= 50) return { color: '#F5A623', bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.3)', label: 'Fair' }
  return { color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', label: 'Low' }
}

export function RecentTestResults({ tests }: Props) {
  return (
    <Card className="glass-card border-0 h-full" style={{ borderRadius: 16 }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F2F2F0' }}>
            <TrendingUp
              className="h-4.5 w-4.5"
              style={{ width: 18, height: 18, color: '#C084FC', filter: 'drop-shadow(0 0 4px rgba(192,132,252,0.5))' }}
            />
            Recent Tests
          </CardTitle>
          <Button variant="ghost" size="sm" asChild
            className="text-xs h-7 px-2"
            style={{ color: '#8B8FA8' }}
          >
            <Link to="/test">
              View all
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm" style={{ color: '#8B8FA8' }}>No completed tests yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((t) => {
              const meta = t.score != null ? scoreMeta(t.score) : null
              return (
                <div key={t.id} className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(192,132,252,0.12)' }}
                  >
                    <ClipboardCheck className="h-4 w-4" style={{ color: '#C084FC' }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#F2F2F0' }}>
                      {t.exam.title}
                    </p>
                    <p className="text-xs" style={{ color: '#8B8FA8' }}>
                      {t.totalQuestions} questions · {fmtDate(t.submittedAt)}
                    </p>
                  </div>

                  {/* Score badge */}
                  {t.score != null && meta ? (
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                    >
                      {t.score}%
                    </span>
                  ) : (
                    <span className="text-sm shrink-0" style={{ color: '#8B8FA8' }}>—</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
