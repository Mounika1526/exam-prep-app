import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flame, Sparkles } from 'lucide-react'
import type { Streak } from '@/types'

interface Props {
  streak?: Streak | null
  userName?: string
}

const TODAY_KEY = `welcome-shown-${new Date().toISOString().split('T')[0]}`

function shouldShow(streak?: Streak | null): boolean {
  // Already dismissed this session-day
  if (sessionStorage.getItem(TODAY_KEY)) return false
  if (!streak) return false

  const lastActive = new Date(streak.lastActiveDate)
  const today      = new Date()
  lastActive.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  // Show if the user hasn't been active today
  return lastActive.getTime() < today.getTime()
}

export function WelcomeBackBanner({ streak, userName }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (shouldShow(streak)) setVisible(true)
  }, [streak])

  const dismiss = () => {
    sessionStorage.setItem(TODAY_KEY, '1')
    setVisible(false)
  }

  const hasStreak = (streak?.currentStreak ?? 0) > 0
  const first = userName?.split(' ')[0]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                {hasStreak
                  ? <Flame className="h-4 w-4 text-orange-500" />
                  : <Sparkles className="h-4 w-4 text-primary" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Welcome back{first ? `, ${first}` : ''}!
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {hasStreak
                    ? `You're on a ${streak!.currentStreak}-day streak — keep it going today!`
                    : "Ready to start a new streak? Pick up where you left off."
                  }
                </p>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
