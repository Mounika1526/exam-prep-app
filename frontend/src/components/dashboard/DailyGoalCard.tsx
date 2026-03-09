import { Link } from '@tanstack/react-router'
import { Target, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StudySession } from '@/types'

interface Props {
  sessions: StudySession[]
  hoursPerDay?: number
}

export function DailyGoalCard({ sessions, hoursPerDay }: Props) {
  const goalMins = (hoursPerDay ?? 1) * 60

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayMins = sessions
    .filter(s => s.date?.slice(0, 10) === todayStr)
    .reduce((sum, s) => sum + (s.durationMins ?? 0), 0)

  const pct = Math.min(100, goalMins > 0 ? Math.round((todayMins / goalMins) * 100) : 0)
  const done = pct >= 100

  // SVG ring
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <Card className="glass-card border-0" style={{ borderRadius: 16 }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F2F2F0' }}>
          <Target
            className="h-4 w-4"
            style={{ color: '#00E5CC', filter: 'drop-shadow(0 0 4px rgba(0,229,204,0.5))' }}
          />
          Daily Goal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative shrink-0">
            <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
              <circle
                cx={36} cy={36} r={r}
                fill="none"
                stroke={done ? '#4ADE80' : '#00E5CC'}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.8s ease', filter: done ? 'drop-shadow(0 0 6px rgba(74,222,128,0.6))' : 'drop-shadow(0 0 6px rgba(0,229,204,0.5))' }}
              />
            </svg>
            <div
              className="absolute inset-0 flex items-center justify-center text-sm font-bold"
              style={{ color: done ? '#4ADE80' : '#F2F2F0' }}
            >
              {done ? <CheckCircle2 className="h-5 w-5" style={{ color: '#4ADE80' }} /> : `${pct}%`}
            </div>
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            {done ? (
              <p className="text-sm font-semibold" style={{ color: '#4ADE80' }}>
                Goal reached! 🎉
              </p>
            ) : (
              <p className="text-sm font-semibold" style={{ color: '#F2F2F0' }}>
                {Math.round(todayMins)} / {Math.round(goalMins)} min
              </p>
            )}
            <p className="text-xs mt-0.5" style={{ color: '#8B8FA8' }}>
              {hoursPerDay ? `${hoursPerDay}h daily target` : 'Set a daily goal in your profile'}
            </p>
            {!done && !hoursPerDay && (
              <Link
                to="/profile"
                className="text-xs font-semibold mt-1.5 inline-block"
                style={{ color: '#00E5CC' }}
              >
                Set goal →
              </Link>
            )}
            {!done && hoursPerDay && (
              <p className="text-xs mt-1" style={{ color: '#8B8FA8' }}>
                {Math.round(goalMins - todayMins)} min remaining
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
