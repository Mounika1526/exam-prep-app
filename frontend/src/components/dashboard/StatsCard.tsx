import { motion, type Variants } from 'framer-motion'
import CountUp from 'react-countup'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

// Map color names to DS icon classes + glow colors
const COLOR_MAP = {
  blue:   { cls: 'ds-icon-blue',   glow: 'rgba(96,165,250,0.3)',  bar: 'progress-teal' },
  green:  { cls: 'ds-icon-green',  glow: 'rgba(74,222,128,0.3)',  bar: 'progress-teal' },
  yellow: { cls: 'ds-icon-amber',  glow: 'rgba(245,166,35,0.3)',  bar: 'progress-amber' },
  orange: { cls: 'ds-icon-amber',  glow: 'rgba(245,166,35,0.35)', bar: 'progress-amber' },
  purple: { cls: 'ds-icon-purple', glow: 'rgba(192,132,252,0.3)', bar: 'progress-teal' },
}

// Variants consumed by a parent motion container with staggerChildren
export const statsCardVariants: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: keyof typeof COLOR_MAP
  progress?: number
}

export function StatsCard({ title, value, subtitle, icon: Icon, color, progress }: StatsCardProps) {
  const isNumeric = typeof value === 'number'
  const cfg = COLOR_MAP[color]

  return (
    <motion.div variants={statsCardVariants} className="h-full">
      <Card className={cn('glass-card card-lift h-full border-0')} style={{ borderRadius: 16 }}>
        <CardContent className="pt-5 pb-5 px-5">
          <div className="flex items-start justify-between">
            {/* Value + labels */}
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8B8FA8' }}>
                {title}
              </p>
              <p className="text-3xl font-bold ds-stat-number leading-none mt-2">
                {isNumeric
                  ? <CountUp end={value} duration={1.4} separator="," enableScrollSpy scrollSpyOnce />
                  : value}
              </p>
              {subtitle && (
                <p className="text-xs mt-1.5" style={{ color: '#8B8FA8' }}>{subtitle}</p>
              )}
            </div>

            {/* Glow icon */}
            <div
              className={cn(cfg.cls, 'shrink-0')}
              style={{ boxShadow: `0 0 18px ${cfg.glow}`, marginLeft: 12 }}
            >
              <Icon style={{ width: 20, height: 20 }} />
            </div>
          </div>

          {/* Gradient progress bar */}
          {progress !== undefined && (
            <div className="mt-4">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <div
                  className={cn('h-full rounded-full transition-all duration-700', cfg.bar === 'progress-teal' ? '' : '')}
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    background: cfg.bar === 'progress-amber'
                      ? 'linear-gradient(90deg, #E08B10 0%, #F5A623 100%)'
                      : 'linear-gradient(90deg, #00B8A5 0%, #00E5CC 100%)',
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
