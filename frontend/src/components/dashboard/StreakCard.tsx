import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Trophy, Leaf, Gem } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Streak } from '@/types'

interface Props { streak?: Streak | null }

const MILESTONES = [
  { days: 7,   label: '1 Week',   Icon: Leaf,  teal: false, achieved_cls: 'border-green-500/40 bg-green-500/10 text-green-400' },
  { days: 30,  label: '1 Month',  Icon: Flame, teal: false, achieved_cls: 'border-orange-500/40 bg-orange-500/10 text-orange-400' },
  { days: 100, label: '100 Days', Icon: Gem,   teal: true,  achieved_cls: 'border-primary/50 bg-primary/10 text-primary' },
]

export function StreakCard({ streak }: Props) {
  const current = streak?.currentStreak || 0
  const longest = streak?.longestStreak || 0
  const lastActive = streak?.lastActiveDate

  const isActiveToday = lastActive &&
    new Date(lastActive).toDateString() === new Date().toDateString()

  return (
    <Card className="glass-card card-lift h-full border-0" style={{ borderRadius: 16 }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F2F2F0' }}>
          <Flame
            className="h-4.5 w-4.5"
            style={{ width: 18, height: 18, color: '#FF8C42', filter: 'drop-shadow(0 0 6px rgba(255,140,66,0.6))' }}
          />
          Study Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── Dramatic streak number ── */}
        <div className="text-center py-3">
          <div
            className="streak-number text-7xl font-bold leading-none"
            style={{ letterSpacing: '-0.04em' }}
          >
            {current}
          </div>
          <div className="text-sm mt-2" style={{ color: '#8B8FA8' }}>
            {current === 1 ? 'day' : 'days'} in a row
          </div>
          {isActiveToday && (
            <div
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
              Active today
            </div>
          )}
        </div>

        {/* ── Personal best ── */}
        <div
          className="flex items-center justify-between p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: '#8B8FA8' }}>
            <Trophy className="h-4 w-4" style={{ color: '#F5A623' }} />
            Personal best
          </div>
          <span className="font-semibold text-sm" style={{ color: '#F2F2F0' }}>{longest} days</span>
        </div>

        {/* ── Milestone badges ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#8B8FA8' }}>
            Milestones
          </p>
          <div className="flex gap-2">
            {MILESTONES.map(({ days, label, Icon, achieved_cls }) => {
              const achieved = longest >= days
              return (
                <div
                  key={days}
                  title={`${label} streak`}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all',
                    achieved
                      ? achieved_cls
                      : 'border-white/8 text-muted-foreground opacity-40',
                  )}
                  style={achieved ? {} : { borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Last 7 day bars ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#8B8FA8' }}>
            Last 7 days
          </p>
          <div className="flex gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date()
              d.setDate(d.getDate() - (6 - i))
              const isToday = d.toDateString() === new Date().toDateString()
              const active = lastActive ? new Date(lastActive) >= d : false
              const isLitUp = active && i >= 7 - current
              return (
                <div
                  key={i}
                  title={d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                  className="flex-1 h-8 rounded-md transition-all duration-300"
                  style={
                    isLitUp
                      ? { background: 'linear-gradient(to top, #FF6B35, #F5A623)', boxShadow: '0 0 8px rgba(245,166,35,0.4)' }
                      : isToday
                      ? { background: 'rgba(245,166,35,0.2)', border: '1px dashed rgba(245,166,35,0.4)' }
                      : { background: 'rgba(255,255,255,0.06)' }
                  }
                />
              )
            })}
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="flex-1 text-center text-[10px]" style={{ color: '#8B8FA8' }}>{d}</div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
