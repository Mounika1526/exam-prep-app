import { AnimatePresence, motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react'

const TOAST_DURATION = 5000 // must match TOAST_AUTO_DISMISS in use-toast.ts

const VARIANT_STYLES = {
  default:     'border-border bg-background text-foreground',
  destructive: 'border-destructive/50 bg-destructive text-destructive-foreground',
  success:     'border-green-500/40 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100',
  warning:     'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100',
  info:        'border-blue-500/40 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
}

const PROGRESS_COLORS = {
  default:     'bg-foreground/20',
  destructive: 'bg-destructive-foreground/40',
  success:     'bg-green-500',
  warning:     'bg-yellow-500',
  info:        'bg-blue-500',
}

const VARIANT_ICONS = {
  default:     null,
  destructive: AlertCircle,
  success:     CheckCircle2,
  warning:     AlertTriangle,
  info:        Info,
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      <AnimatePresence mode="sync">
        {toasts.filter(t => t.open).map((toast) => {
          const variant = toast.variant ?? 'default'
          const Icon = VARIANT_ICONS[variant]
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 64, scale: 0.95 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{    opacity: 0, x: 64, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'relative flex items-start gap-3 rounded-lg border shadow-lg overflow-hidden',
                'pt-4 pb-5 px-4',
                VARIANT_STYLES[variant],
              )}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0 mt-0.5 opacity-80" />}
              <div className="flex-1 min-w-0">
                {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
                {toast.description && (
                  <p className="text-sm opacity-90 mt-0.5">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Auto-dismiss progress bar */}
              <motion.div
                className={cn(
                  'absolute bottom-0 left-0 h-1 rounded-bl-lg',
                  PROGRESS_COLORS[variant],
                )}
                initial={{ scaleX: 1, transformOrigin: 'left' }}
                animate={{ scaleX: 0 }}
                transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
                style={{ width: '100%' }}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
