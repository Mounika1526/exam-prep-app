import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, BookOpen } from 'lucide-react'
import { formatDate, formatDuration } from '@/lib/utils'
import type { StudySession } from '@/types'

interface Props { sessions: StudySession[] }

export function RecentActivity({ sessions }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Recent Study Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No study sessions yet. Start studying!
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {(s.subject as any)?.title || 'Study Session'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(s.date)}
                  </p>
                </div>
                <div className="text-sm font-medium shrink-0">
                  {formatDuration(s.durationMins)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
