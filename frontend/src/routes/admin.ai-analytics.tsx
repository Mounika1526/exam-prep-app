import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Bot, MessageSquare, Calendar, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/admin/ai-analytics')({
  component: AdminAiAnalyticsPage,
})

function AdminAiAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    staleTime: 2 * 60 * 1000,
  })

  const cards = [
    {
      label:    'AI Messages Today',
      value:    data?.aiMessagesToday,
      icon:     MessageSquare,
      color:    'text-blue-500',
      bg:       'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label:    'AI Messages This Month',
      value:    data?.aiMessagesThisMonth,
      icon:     Calendar,
      color:    'text-purple-500',
      bg:       'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      label:    'Total Tests Taken',
      value:    data?.totalTestsTaken,
      icon:     TrendingUp,
      color:    'text-green-500',
      bg:       'bg-green-50 dark:bg-green-950/30',
    },
    {
      label:    'Tests Today',
      value:    data?.testsToday,
      icon:     Bot,
      color:    'text-orange-500',
      bg:       'bg-orange-50 dark:bg-orange-950/30',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">AI usage and activity overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-5">
              <div className={`inline-flex h-10 w-10 rounded-lg items-center justify-center mb-3 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              {isLoading
                ? <Skeleton className="h-8 w-16 mb-1" />
                : <p className="text-2xl font-bold">{(value ?? 0).toLocaleString()}</p>
              }
              <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top exams by activity */}
      {(data?.topExams?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Top Exams by Activity</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Exam</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Test Takers</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {data!.topExams.map((exam) => (
                  <tr key={exam.examId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{exam.examTitle}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{exam.enrolledCount}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {exam.avgScore != null ? `${exam.avgScore}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
