import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Trophy, Leaf, Gem } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Streak } from '@/types'

interface Props { streak?: Streak | null }

const MILESTONES = [
  { days: 7,   label: '1 Week',   Icon: Leaf,  cls: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200' },
  { days: 30,  label: '1 Month',  Icon: Flame, cls: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200' },
  { days: 100, label: '100 Days', Icon: Gem,   cls: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200' },
]

export function StreakCard({ streak }: Props) {
  const current = streak?.currentStreak || 0
  const longest = streak?.longestStreak || 0
  const lastActive = streak?.lastActiveDate

  const isActiveToday = lastActive &&
    new Date(lastActive).toDateString() === new Date().toDateString()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Study Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current streak */}
        <div className="text-center py-2">
          <div
            className={cn(
              'text-6xl font-bold text-orange-500 transition-all duration-500',
              current > 0 && 'animate-pulse-once',
            )}
          >
            {current}
          </div>
          <div className="text-muted-foreground text-sm mt-1">
            {current === 1 ? 'day' : 'days'} in a row
          </div>
          {isActiveToday && (
            <div className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              Active today
            </div>
          )}
        </div>

        {/* Longest streak */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Personal best
          </div>
          <span className="font-semibold">{longest} days</span>
        </div>

        {/* Milestone badges */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Milestones</p>
          <div className="flex gap-2">
            {MILESTONES.map(({ days, label, Icon, cls }) => {
              const achieved = longest >= days
              return (
                <div
                  key={days}
                  title={`${label} streak`}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all',
                    achieved
                      ? cls
                      : 'border-muted bg-muted/30 text-muted-foreground opacity-50',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Week grid */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Last 7 days</p>
          <div className="flex gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date()
              d.setDate(d.getDate() - (6 - i))
              const isToday = d.toDateString() === new Date().toDateString()
              const active = lastActive ? new Date(lastActive) >= d : false
              return (
                <div
                  key={i}
                  title={d.toLocaleDateString('en', { weekday: 'short' })}
                  className={cn(
                    'flex-1 h-8 rounded',
                    active && i >= 7 - current
                      ? 'bg-orange-400'
                      : isToday
                      ? 'bg-orange-200 dark:bg-orange-900/40'
                      : 'bg-muted',
                  )}
                />
              )
            })}
          </div>
          <div className="flex gap-1.5 mt-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground">{d}</div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
