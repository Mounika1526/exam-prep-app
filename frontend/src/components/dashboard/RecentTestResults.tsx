import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecentTest {
  id: string
  score: number | null
  totalQuestions: number
  submittedAt: string | null
  exam: { id: string; title: string }
}

interface Props {
  tests: RecentTest[]
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 font-semibold'
  if (score >= 50) return 'text-yellow-600 font-semibold'
  return 'text-red-600 font-semibold'
}

export function RecentTestResults({ tests }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
            Recent Tests
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
            <Link to="/test">
              View all
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No completed tests yet.
          </p>
        ) : (
          <div className="space-y-3">
            {tests.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.exam.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.totalQuestions} questions · {fmtDate(t.submittedAt)}
                  </p>
                </div>
                <div className={cn('text-sm shrink-0', t.score != null ? scoreColor(t.score) : 'text-muted-foreground')}>
                  {t.score != null ? `${t.score}%` : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
