import { useEffect, useRef, useState } from 'react'
import { formatSeconds } from '@/lib/utils'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  durationMins?: number
  initialRemainingSeconds?: number
  onTimeout?: () => void
}

export function TestTimer({ durationMins = 60, initialRemainingSeconds, onTimeout }: Props) {
  const [remaining, setRemaining] = useState<number>(() =>
    initialRemainingSeconds !== undefined ? initialRemainingSeconds : durationMins * 60
  )

  const totalRef = useRef<number>(
    initialRemainingSeconds !== undefined ? initialRemainingSeconds : durationMins * 60
  )

  useEffect(() => {
    if (initialRemainingSeconds !== undefined) {
      setRemaining(initialRemainingSeconds)
      totalRef.current = initialRemainingSeconds
    }
  }, [initialRemainingSeconds])

  useEffect(() => {
    if (remaining <= 0) {
      onTimeout?.()
      return
    }
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(id); onTimeout?.(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pct       = totalRef.current > 0 ? remaining / totalRef.current : 0
  const isUrgent  = pct < 0.10
  const isWarning = pct < 0.30

  return (
    <div
      className={cn(
        'ds-timer flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-semibold shrink-0',
        isUrgent  ? 'ds-timer-urgent'  : '',
        isWarning && !isUrgent ? 'ds-timer-warning' : '',
      )}
      style={!isUrgent && !isWarning ? {
        color: '#8B8FA8',
        borderColor: 'rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.05)',
      } : {}}
    >
      <Clock className="h-3.5 w-3.5" />
      {formatSeconds(remaining)}
    </div>
  )
}
