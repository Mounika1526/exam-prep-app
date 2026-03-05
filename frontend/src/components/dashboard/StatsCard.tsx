import { motion, type Variants } from 'framer-motion'
import CountUp from 'react-countup'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

const COLOR_MAP = {
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

// Variants consumed by a parent motion container with staggerChildren
export const statsCardVariants: Variants = {
  hidden:   { opacity: 0, y: 16 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
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

  return (
    <motion.div variants={statsCardVariants}>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">
                {isNumeric
                  ? <CountUp end={value} duration={1.4} separator="," enableScrollSpy scrollSpyOnce />
                  : value}
              </p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className={cn('p-2.5 rounded-lg', COLOR_MAP[color])}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          {progress !== undefined && (
            <Progress value={progress} className="h-1.5 mt-4" />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
