import { type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ─── Built-in SVG Illustrations ───────────────────────────────────────────────

function IllustrationEmpty() {
  return (
    <svg viewBox="0 0 160 120" className="w-40 h-30" aria-hidden="true">
      {/* Box outline */}
      <rect x="40" y="60" width="80" height="50" rx="6"
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2" />
      {/* Box flaps */}
      <path d="M40 60 L60 45 L100 45 L120 60" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2" />
      <path d="M60 45 L80 55 L100 45" fill="hsl(var(--border) / 0.4)" stroke="hsl(var(--border))" strokeWidth="1.5" />
      {/* Floating dots */}
      <motion.circle cx="30" cy="40" r="4" fill="hsl(var(--primary) / 0.3)"
        animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity }} />
      <motion.circle cx="130" cy="50" r="3" fill="hsl(var(--primary) / 0.2)"
        animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
      <motion.circle cx="75" cy="25" r="2.5" fill="hsl(var(--primary) / 0.25)"
        animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
    </svg>
  )
}

function IllustrationSearch() {
  return (
    <svg viewBox="0 0 160 120" className="w-40 h-30" aria-hidden="true">
      {/* Magnifying glass circle */}
      <circle cx="70" cy="55" r="30"
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2.5" />
      {/* Magnifying glass handle */}
      <line x1="92" y1="77" x2="115" y2="100"
        stroke="hsl(var(--border))" strokeWidth="5" strokeLinecap="round" />
      {/* Inner circle — no results */}
      <circle cx="70" cy="55" r="18" fill="hsl(var(--background))" />
      {/* X mark inside */}
      <line x1="62" y1="47" x2="78" y2="63"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="78" y1="47" x2="62" y2="63"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" strokeLinecap="round" />
      {/* Floating sparkles */}
      <motion.text x="20" y="30" fontSize="12" opacity="0.4"
        animate={{ opacity: [0.2, 0.6, 0.2], y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity }}>✦</motion.text>
      <motion.text x="125" y="40" fontSize="10" opacity="0.3"
        animate={{ opacity: [0.2, 0.5, 0.2], y: [0, -4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.7 }}>✦</motion.text>
    </svg>
  )
}

function IllustrationChart() {
  return (
    <svg viewBox="0 0 160 120" className="w-40 h-30" aria-hidden="true">
      {/* Chart bars */}
      <rect x="30" y="80" width="20" height="30" rx="3" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" />
      <rect x="60" y="60" width="20" height="50" rx="3" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" />
      <rect x="90" y="40" width="20" height="70" rx="3" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" />
      <rect x="120" y="55" width="20" height="55" rx="3" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" />
      {/* Baseline */}
      <line x1="20" y1="110" x2="150" y2="110" stroke="hsl(var(--border))" strokeWidth="2" />
      {/* Question mark floating above */}
      <motion.text x="75" y="30" fontSize="20" textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity }}>?</motion.text>
    </svg>
  )
}

const ILLUSTRATIONS = {
  empty:  IllustrationEmpty,
  search: IllustrationSearch,
  chart:  IllustrationChart,
} as const

export type EmptyStateIllustration = keyof typeof ILLUSTRATIONS

// ─── Component ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: LucideIcon
  illustration?: EmptyStateIllustration
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Illustration = illustration ? ILLUSTRATIONS[illustration] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
    >
      {Illustration ? (
        <div className="mb-4">
          <Illustration />
        </div>
      ) : Icon ? (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4"
        >
          <Icon className="h-8 w-8 text-muted-foreground" />
        </motion.div>
      ) : null}

      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  )
}
