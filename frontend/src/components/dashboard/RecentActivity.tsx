import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, BookOpen } from 'lucide-react'
import { formatDate, formatDuration } from '@/lib/utils'
import type { StudySession } from '@/types'

interface Props { sessions: StudySession[] }

// Cycling accent colors for activity icon pills
const ICON_STYLES = [
  { bg: 'rgba(0,229,204,0.12)',  color: '#00E5CC' },
  { bg: 'rgba(245,166,35,0.12)', color: '#F5A623' },
  { bg: 'rgba(192,132,252,0.12)',color: '#C084FC' },
  { bg: 'rgba(96,165,250,0.12)', color: '#60A5FA' },
  { bg: 'rgba(74,222,128,0.12)', color: '#4ADE80' },
]

export function RecentActivity({ sessions }: Props) {
  return (
    <Card className="glass-card border-0 h-full" style={{ borderRadius: 16 }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F2F2F0' }}>
          <Clock
            className="h-4.5 w-4.5"
            style={{ width: 18, height: 18, color: '#60A5FA', filter: 'drop-shadow(0 0 4px rgba(96,165,250,0.5))' }}
          />
          Recent Study Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm" style={{ color: '#8B8FA8' }}>
              No study sessions yet. Start studying!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s, i) => {
              const iconStyle = ICON_STYLES[i % ICON_STYLES.length]
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: iconStyle.bg }}
                  >
                    <BookOpen className="h-4 w-4" style={{ color: iconStyle.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#F2F2F0' }}>
                      {(s.subject as any)?.title || 'Study Session'}
                    </p>
                    <p className="text-xs" style={{ color: '#8B8FA8' }}>
                      {formatDate(s.date)}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold shrink-0 px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#8B8FA8', border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    {formatDuration(s.durationMins)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
