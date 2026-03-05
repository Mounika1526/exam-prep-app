import { createRootRouteWithContext, Outlet, Link, useRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Telescope } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'
import { PageLoader } from '@/components/ui/PageLoader'
import { Button } from '@/components/ui/button'

interface RouterContext {
  queryClient: QueryClient
}

function NotFoundPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center overflow-hidden">
      {/* Animated illustration */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8"
      >
        <svg
          viewBox="0 0 320 220"
          className="w-72 h-52 mx-auto"
          aria-hidden="true"
        >
          {/* Stars background */}
          {[
            [20, 30], [60, 15], [100, 40], [140, 10], [180, 35],
            [220, 12], [260, 28], [300, 18], [35, 80], [280, 75],
            [310, 55], [10, 60], [155, 70], [250, 60],
          ].map(([x, y], i) => (
            <motion.circle
              key={i}
              cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.2}
              fill="hsl(var(--primary))"
              opacity={0.4}
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 2 + (i % 3) * 0.7, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}

          {/* Planet */}
          <motion.circle
            cx="160" cy="140" r="58"
            fill="hsl(var(--muted))"
            animate={{ scale: [1, 1.01, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Planet ring */}
          <motion.ellipse
            cx="160" cy="140" rx="80" ry="14"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeOpacity="0.35"
            animate={{ rotateX: [0, 5, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          {/* Planet surface lines */}
          <path d="M115 120 Q160 110 205 120" stroke="hsl(var(--border))" strokeWidth="2" fill="none" />
          <path d="M105 145 Q160 135 215 145" stroke="hsl(var(--border))" strokeWidth="1.5" fill="none" />

          {/* Astronaut body */}
          <motion.g
            animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Suit body */}
            <rect x="143" y="62" width="34" height="44" rx="12"
              fill="hsl(var(--primary) / 0.18)"
              stroke="hsl(var(--primary))" strokeWidth="1.5" />
            {/* Helmet */}
            <circle cx="160" cy="50" r="22"
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))" strokeWidth="2" />
            {/* Visor */}
            <circle cx="160" cy="50" r="14"
              fill="hsl(var(--primary) / 0.15)"
              stroke="hsl(var(--primary))" strokeWidth="1" />
            {/* Visor sheen */}
            <ellipse cx="155" cy="44" rx="5" ry="3"
              fill="white" opacity="0.25" />
            {/* Arms */}
            <rect x="124" y="70" width="18" height="10" rx="5"
              fill="hsl(var(--primary) / 0.2)"
              stroke="hsl(var(--primary))" strokeWidth="1.5" />
            <rect x="178" y="70" width="18" height="10" rx="5"
              fill="hsl(var(--primary) / 0.2)"
              stroke="hsl(var(--primary))" strokeWidth="1.5" />
            {/* Legs */}
            <rect x="148" y="104" width="12" height="18" rx="5"
              fill="hsl(var(--primary) / 0.2)"
              stroke="hsl(var(--primary))" strokeWidth="1.5" />
            <rect x="160" y="104" width="12" height="18" rx="5"
              fill="hsl(var(--primary) / 0.2)"
              stroke="hsl(var(--primary))" strokeWidth="1.5" />
            {/* Backpack */}
            <rect x="175" y="65" width="14" height="22" rx="4"
              fill="hsl(var(--muted-foreground) / 0.2)"
              stroke="hsl(var(--border))" strokeWidth="1" />
          </motion.g>

          {/* Floating "?" bubble */}
          <motion.g
            animate={{ opacity: [0, 1, 1, 0], y: [0, -20, -40, -60], x: [0, 8, -4, 12] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
          >
            <circle cx="192" cy="38" r="12" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
            <text x="192" y="43" textAnchor="middle" fontSize="12" fill="hsl(var(--primary))" fontWeight="bold">?</text>
          </motion.g>
        </svg>
      </motion.div>

      {/* Text content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col items-center"
      >
        <div className="flex items-center gap-3 mb-3">
          <Telescope className="h-6 w-6 text-primary" />
          <span className="text-6xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Lost in space</h1>
        <p className="text-muted-foreground max-w-sm mb-8">
          The page you're looking for drifted into a black hole. Let's get you back on course.
        </p>

        <div className="flex gap-3">
          <Button asChild>
            <Link to="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" onClick={() => router.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <Toaster />
    </>
  ),
  pendingComponent: PageLoader,
  notFoundComponent: NotFoundPage,
})
