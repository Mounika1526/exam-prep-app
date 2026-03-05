import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { BookOpen, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Already logged in — redirect to the correct home
  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex">

      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary p-12 text-primary-foreground">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <BookOpen className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight">ExamPrep</span>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
          }}
        >
          <motion.h1
            className="text-4xl font-bold leading-tight"
            variants={{
              hidden:  { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
            }}
          >
            Your AI-powered<br />exam preparation partner
          </motion.h1>

          <motion.p
            className="text-primary-foreground/80 text-lg leading-relaxed"
            variants={{
              hidden:  { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
            }}
          >
            Personalized study plans, AI tutoring, practice tests, and progress
            tracking — everything you need to ace your exam.
          </motion.p>

          <motion.div
            className="grid grid-cols-2 gap-4 pt-2"
            variants={{
              hidden:  { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
            }}
          >
            {[
              { label: 'Study Topics',      value: '500+' },
              { label: 'Practice Questions', value: '10,000+' },
              { label: 'AI Tutor',           value: '24/7' },
              { label: 'Success Rate',       value: '94%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-primary-foreground/70 text-sm mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <p className="text-primary-foreground/40 text-sm">
          © {new Date().getFullYear()} ExamPrep. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <motion.div
            className="flex items-center gap-2 mb-8 lg:hidden"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <BookOpen className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">ExamPrep</span>
          </motion.div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
