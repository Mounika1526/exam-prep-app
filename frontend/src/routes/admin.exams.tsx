import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Layers, BookMarked, FileText, CheckCircle, XCircle } from 'lucide-react'

export const Route = createFileRoute('/admin/exams')({
  component: AdminExamsPage,
})

function AdminExamsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-content'],
    queryFn: adminApi.getContent,
    staleTime: 2 * 60 * 1000,
  })

  const statCards = [
    { label: 'Total Exams',    value: data?.exams.total,    icon: BookOpen,   color: 'text-blue-500' },
    { label: 'Active Exams',   value: data?.exams.active,   icon: CheckCircle,color: 'text-green-500' },
    { label: 'Inactive Exams', value: data?.exams.inactive, icon: XCircle,    color: 'text-red-400' },
    { label: 'Subjects',       value: data?.subjects,        icon: Layers,     color: 'text-purple-500' },
    { label: 'Chapters',       value: data?.chapters,        icon: BookMarked, color: 'text-orange-500' },
    { label: 'Topics',         value: data?.topics,          icon: FileText,   color: 'text-cyan-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exams</h1>
        <p className="text-sm text-muted-foreground mt-1">Content library overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <Icon className={`h-5 w-5 mb-2 ${color}`} />
              {isLoading ? (
                <Skeleton className="h-7 w-12 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{value ?? 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Exams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Exams</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Subjects</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Questions</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {((data as any)?.recentExams ?? []).map((exam: any) => (
                    <tr key={exam.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{exam.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{exam.category}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{exam._count?.subjects ?? 0}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{exam._count?.questions ?? 0}</td>
                      <td className="px-4 py-3">
                        <Badge variant={exam.isActive ? 'default' : 'secondary'} className="text-xs">
                          {exam.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
