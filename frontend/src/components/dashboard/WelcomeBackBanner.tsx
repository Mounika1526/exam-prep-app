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
  if (sessionStorage.getItem(TODAY_KEY)) return false
  if (!streak) return false
  const lastActive = new Date(streak.lastActiveDate)
  const today = new Date()
  lastActive.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
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
          initial={{ opacity: 0, y: -14, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          {/* ── Teal glow banner ── */}
          <div className="ds-welcome-banner flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 mb-2">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Animated icon pill */}
              <div
                className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center"
                style={{
                  background: hasStreak ? 'rgba(245,120,50,0.18)' : 'rgba(0,229,204,0.12)',
                  boxShadow: hasStreak ? '0 0 16px rgba(245,120,50,0.35)' : '0 0 16px rgba(0,229,204,0.25)',
                }}
              >
                {hasStreak
                  ? <Flame className="h-5 w-5" style={{ color: '#FF8C42', filter: 'drop-shadow(0 0 4px rgba(255,140,66,0.7))' }} />
                  : <Sparkles className="h-5 w-5" style={{ color: '#00E5CC', filter: 'drop-shadow(0 0 4px rgba(0,229,204,0.7))' }} />
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#F2F2F0' }}>
                  Welcome back{first ? `, ${first}` : ''}!
                </p>
                <p className="text-xs truncate" style={{ color: '#8B8FA8' }}>
                  {hasStreak
                    ? `You're on a ${streak!.currentStreak}-day streak — keep it going today!`
                    : 'Ready to start a new streak? Pick up where you left off.'}
                </p>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="shrink-0 rounded-lg p-1.5 transition-colors"
              style={{ color: '#8B8FA8', background: 'rgba(255,255,255,0.05)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F2F2F0' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8B8FA8' }}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
