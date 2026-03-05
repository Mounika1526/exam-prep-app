import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/questions')({
  component: AdminQuestionsPage,
})

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY:   'bg-green-500',
  MEDIUM: 'bg-yellow-400',
  HARD:   'bg-red-500',
}

const TYPE_LABELS: Record<string, string> = {
  MCQ:           'Multiple Choice',
  TRUE_FALSE:    'True / False',
  FILL_IN_BLANK: 'Fill in Blank',
}

function AdminQuestionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-content'],
    queryFn: adminApi.getContent,
    staleTime: 2 * 60 * 1000,
  })

  const total = data?.questions.total ?? 0
  const byDifficulty = data?.questions.byDifficulty ?? {}
  const byType       = data?.questions.byType ?? {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Questions</h1>
        <p className="text-sm text-muted-foreground mt-1">Question bank overview</p>
      </div>

      {/* Total */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6 pb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            {isLoading ? <Skeleton className="h-8 w-20 mb-1" /> : <p className="text-3xl font-bold">{total.toLocaleString()}</p>}
            <p className="text-sm text-muted-foreground">Total questions in bank</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Difficulty */}
        <Card>
          <CardHeader><CardTitle className="text-base">By Difficulty</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)
              : ['EASY', 'MEDIUM', 'HARD'].map((level) => {
                  const count = byDifficulty[level] ?? 0
                  const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={level}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium capitalize">{level.toLowerCase()}</span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', DIFFICULTY_COLORS[level])}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
          </CardContent>
        </Card>

        {/* By Type */}
        <Card>
          <CardHeader><CardTitle className="text-base">By Type</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)
              : Object.entries(byType).map(([type, count]) => {
                  const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{TYPE_LABELS[type] ?? type}</span>
                        <span className="text-muted-foreground">{count as number} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
