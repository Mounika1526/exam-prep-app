import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Trophy } from 'lucide-react'

interface CalendarDay {
  date: string
  active: boolean
  durationMins: number
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  isActiveToday: boolean
  calendar: CalendarDay[]
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function buildMonthLabels(weeks: (CalendarDay | null)[][]): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = []
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const first = week.find((d) => d !== null)
    if (!first) return
    const m = new Date(first.date + 'T00:00:00').getMonth()
    if (m !== lastMonth) {
      labels.push({ label: MONTHS[m], col: wi })
      lastMonth = m
    }
  })
  return labels
}

function cellStyle(day: CalendarDay | null, today: string): React.CSSProperties {
  if (!day) return { opacity: 0, pointerEvents: 'none' }
  const isToday = day.date === today
  if (!day.active) {
    return {
      background: 'rgba(255,255,255,0.06)',
      outline: isToday ? '1px solid rgba(255,140,66,0.5)' : undefined,
    }
  }
  const mins = day.durationMins
  const alpha =
    mins >= 90 ? 0.9 :
    mins >= 60 ? 0.65 :
    mins >= 30 ? 0.40 :
                 0.20
  return {
    background: `rgba(0,229,204,${alpha})`,
    boxShadow: alpha >= 0.65 ? '0 0 4px rgba(0,229,204,0.4)' : undefined,
    outline: isToday ? '1px solid #00E5CC' : undefined,
  }
}

function fmtTooltip(day: CalendarDay): string {
  const date = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
  if (!day.active) return date
  if (day.durationMins > 0) return `Studied ${day.durationMins}m — ${date}`
  return `Active — ${date}`
}

export function ProgressHeatmap() {
  const { data, isLoading } = useQuery<StreakData>({
    queryKey: ['streak-heatmap'],
    queryFn: () => api.get('/streaks').then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const calendar = data?.calendar ?? []
  const currentStreak = data?.currentStreak ?? 0
  const longestStreak = data?.longestStreak ?? 0
  const isActiveToday = data?.isActiveToday ?? false
  const today = new Date().toISOString().split('T')[0]

  let weeks: (CalendarDay | null)[][] = []
  let monthLabels: { label: string; col: number }[] = []
  if (calendar.length > 0) {
    const firstDow = new Date(calendar[0].date + 'T00:00:00').getDay()
    const padded: (CalendarDay | null)[] = [
      ...Array<null>(firstDow).fill(null),
      ...calendar,
    ]
    for (let i = 0; i < padded.length; i += 7) {
      const week = padded.slice(i, i + 7)
      while (week.length < 7) week.push(null)
      weeks.push(week)
    }
    monthLabels = buildMonthLabels(weeks)
  }

  if (isLoading) {
    return (
      <Card className="glass-card border-0 h-full" style={{ borderRadius: 16 }}>
        <CardContent className="pt-6">
          <div className="animate-pulse h-28 rounded-md" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-0 h-full" style={{ borderRadius: 16 }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F2F2F0' }}>
          <Flame
            className="h-4.5 w-4.5"
            style={{ width: 18, height: 18, color: '#FF8C42', filter: 'drop-shadow(0 0 4px rgba(255,140,66,0.5))' }}
          />
          Activity — Last 6 Months
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Streak badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(255,140,66,0.12)',
              border: '1px solid rgba(255,140,66,0.3)',
              color: '#FF8C42',
            }}
          >
            <Flame className="h-3 w-3" />
            {currentStreak} day streak
            {isActiveToday && (
              <span
                className="h-1.5 w-1.5 rounded-full inline-block animate-pulse"
                style={{ background: '#4ADE80' }}
              />
            )}
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(245,166,35,0.12)',
              border: '1px solid rgba(245,166,35,0.3)',
              color: '#F5A623',
            }}
          >
            <Trophy className="h-3 w-3" />
            {longestStreak} day best
          </span>
        </div>

        {/* Month labels + heatmap grid */}
        <div className="overflow-x-auto pb-1">
          {monthLabels.length > 0 && (
            <div className="flex mb-1 ml-[18px]">
              {weeks.map((_, wi) => {
                const lbl = monthLabels.find((l) => l.col === wi)
                return (
                  <div
                    key={wi}
                    className="w-[15px] shrink-0 mr-[3px] text-[9px]"
                    style={{ color: '#8B8FA8' }}
                  >
                    {lbl?.label ?? ''}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-[3px]">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-[3px] mr-0.5 shrink-0 pt-0.5">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="h-3 w-3 text-[9px] leading-3 flex items-center justify-center"
                  style={{ color: '#8B8FA8' }}
                >
                  {i % 2 === 1 ? label : ''}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px] shrink-0">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day ? fmtTooltip(day) : ''}
                    className="h-3 w-3 rounded-[2px] transition-all duration-150 hover:opacity-80 cursor-default"
                    style={cellStyle(day, today)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 text-[10px]" style={{ color: '#8B8FA8' }}>
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'rgba(0,229,204,0.20)' }} />
          <div className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'rgba(0,229,204,0.40)' }} />
          <div className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'rgba(0,229,204,0.90)' }} />
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  )
}
