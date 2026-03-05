import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex flex-col items-center gap-3"
      >
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading…</p>
      </motion.div>
    </div>
  )
}
