import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

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

// Month label positions: first week-column index per month
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

function cellColor(day: CalendarDay | null, today: string): string {
  if (!day) return 'opacity-0 pointer-events-none'
  const isToday = day.date === today
  if (!day.active) {
    return cn(
      'bg-muted hover:bg-muted-foreground/25',
      isToday && 'ring-1 ring-orange-300 ring-offset-background dark:bg-orange-900/40',
    )
  }
  // Intensity based on durationMins
  const mins = day.durationMins
  const intensity =
    mins >= 90 ? 'bg-green-600 dark:bg-green-400' :
    mins >= 60 ? 'bg-green-500 dark:bg-green-500' :
    mins >= 30 ? 'bg-green-400 dark:bg-green-600' :
                 'bg-green-200 dark:bg-green-800'
  return cn(
    intensity,
    'hover:opacity-80',
    isToday && 'ring-1 ring-green-400 ring-offset-background',
  )
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

  // Build week-aligned grid: columns = weeks (L→R), rows = day of week (Sun=0 top)
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
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse h-28 bg-muted rounded-md" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Activity — Last 6 Months
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Streak badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge
            variant="secondary"
            className="gap-1.5 text-orange-700 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200"
          >
            <Flame className="h-3 w-3" />
            {currentStreak} day streak
            {isActiveToday && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            )}
          </Badge>
          <Badge
            variant="secondary"
            className="gap-1.5 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200"
          >
            <Trophy className="h-3 w-3" />
            {longestStreak} day best
          </Badge>
        </div>

        {/* Month labels + heatmap grid */}
        <div className="overflow-x-auto pb-1">
          {/* Month labels row */}
          {monthLabels.length > 0 && (
            <div className="flex mb-1 ml-[18px]">
              {weeks.map((_, wi) => {
                const lbl = monthLabels.find((l) => l.col === wi)
                return (
                  <div key={wi} className="w-[15px] shrink-0 mr-[3px] text-[9px] text-muted-foreground">
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
                  className="h-3 w-3 text-[9px] leading-3 text-muted-foreground flex items-center justify-center"
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
                    className={cn('h-3 w-3 rounded-[2px] transition-colors', cellColor(day, today))}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded-[2px] bg-muted" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-green-200 dark:bg-green-800" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-green-400 dark:bg-green-600" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-green-600 dark:bg-green-400" />
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  )
}
