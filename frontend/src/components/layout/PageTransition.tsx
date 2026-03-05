import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageTransitionProps {
  routeKey: string
  children: ReactNode
  className?: string
}

const variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
}

/**
 * Wraps page content with enter/exit animations keyed to the current route.
 * Place AnimatePresence + motion.div around <Outlet /> in layout routes,
 * passing the current pathname as `routeKey`.
 */
export function PageTransition({ routeKey, children, className }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
