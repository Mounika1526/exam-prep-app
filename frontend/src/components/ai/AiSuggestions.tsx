import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, TrendingUp } from 'lucide-react'

interface Props {
  examId: string
  compact?: boolean
}

const PRIORITY_COLORS = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
}

export function AiSuggestions({ examId, compact }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-suggestions', examId],
    queryFn: () => api.get(`/ai/suggestions?examId=${examId}`).then(r => r.data),
    enabled: !!examId,
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const suggestions = data?.suggestions || []

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />
  }

  if (suggestions.length === 0) return null

  const displaySuggestions = compact ? suggestions.slice(0, 3) : suggestions

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displaySuggestions.map((s: any, i: number) => (
            <div key={i} className="p-3 border rounded-lg space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">{s.title}</p>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${PRIORITY_COLORS[s.priority as keyof typeof PRIORITY_COLORS] || ''}`}
                >
                  {s.priority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{s.description}</p>
              {s.estimatedTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {s.estimatedTime}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
