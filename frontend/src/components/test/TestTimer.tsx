import { useEffect, useRef, useState } from 'react'
import { formatSeconds } from '@/lib/utils'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  /** Total duration in minutes — used when no initialRemainingSeconds given */
  durationMins?: number
  /** Seconds already computed server-side (e.g. from resume). Overrides durationMins. */
  initialRemainingSeconds?: number
  onTimeout?: () => void
}

export function TestTimer({ durationMins = 60, initialRemainingSeconds, onTimeout }: Props) {
  const [remaining, setRemaining] = useState<number>(() =>
    initialRemainingSeconds !== undefined ? initialRemainingSeconds : durationMins * 60
  )

  // Record the "total" once so we can compute percentage-based thresholds.
  // We use the value at first meaningful render (not re-set on resume re-initialise).
  const totalRef = useRef<number>(
    initialRemainingSeconds !== undefined ? initialRemainingSeconds : durationMins * 60
  )

  // Re-initialize if the prop changes (e.g. data loads after mount)
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
        if (r <= 1) {
          clearInterval(id)
          onTimeout?.()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally only on mount; initialRemainingSeconds handled above

  const pct        = totalRef.current > 0 ? remaining / totalRef.current : 0
  const isUrgent   = pct < 0.10   // red + pulse  (< 10 %)
  const isWarning  = pct < 0.30   // yellow        (10–30 %)

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-mono font-medium shrink-0 transition-colors duration-500',
      isUrgent
        ? 'text-red-600 border-red-200 bg-red-50 animate-pulse dark:bg-red-950/30 dark:border-red-800'
        : isWarning
        ? 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800'
        : 'text-muted-foreground border-border'
    )}>
      <Clock className="h-4 w-4" />
      {formatSeconds(remaining)}
    </div>
  )
}
