import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { BookOpen, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

// ── Stagger animation variants for the left-panel content ──
const panelVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.32 } },
}
const itemVariant: Variants = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65 } },
}

// ── Stats shown on the brand panel ──
const STATS = [
  { value: '500+',  label: 'Study Topics'       },
  { value: '10K+',  label: 'Practice Questions' },
  { value: '24/7',  label: 'AI Tutor'           },
  { value: '94%',   label: 'Success Rate'       },
]

// ── Feature bullet list ──
const FEATURES = [
  'Personalized AI study plans tailored to your exam',
  'Real-time mock interviews with instant feedback',
  'Topic-wise progress heatmap & streak tracking',
]

function AuthLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      /* Loading screen inherits the dark theme */
      <div
        className="auth-dark min-h-screen flex items-center justify-center"
        style={{ background: '#0D0F1A' }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#00E5CC' }} />
      </div>
    )
  }

  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} />
  }

  return (
    /* ── Root: dark academic canvas ── */
    <div
      className="auth-dark min-h-screen flex relative overflow-hidden"
      style={{ background: '#0D0F1A' }}
    >
      {/* ── Ambient floating orbs (CSS-only, no JS) ── */}
      <div className="ep-orb ep-orb-teal-1" />
      <div className="ep-orb ep-orb-amber-1" />
      <div className="ep-orb ep-orb-teal-2" />

      {/* ── Dot-grid texture overlay ── */}
      <div className="ep-dot-grid-overlay" />

      {/* ══════════════════════════════════════════════
          LEFT BRAND PANEL — desktop only (lg+)
      ══════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-col justify-between relative z-10"
        style={{
          width: '52%',
          padding: '56px 64px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* ── Top: Logo ── */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y:   0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="ep-logo-icon">
            <BookOpen style={{ width: '20px', height: '20px', color: '#0D0F1A' }} />
          </div>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#F2F2F0',
              letterSpacing: '-0.025em',
              fontFamily: '"DM Sans", system-ui, sans-serif',
            }}
          >
            ExamPrep
          </span>
        </motion.div>

        {/* ── Center: Brand copy + stats ── */}
        <motion.div
          className="space-y-8"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main headline — Playfair Display */}
          <motion.div variants={itemVariant}>
            <h1
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 'clamp(40px, 3.5vw, 56px)',
                fontWeight: 700,
                lineHeight: 1.12,
                color: '#F2F2F0',
                letterSpacing: '-0.025em',
              }}
            >
              Master Every{' '}
              <span className="ep-gradient-text">Exam.</span>
              <br />
              Ace Every{' '}
              <span className="ep-gradient-text">Interview.</span>
            </h1>
          </motion.div>

          {/* Sub-copy */}
          <motion.p
            variants={itemVariant}
            style={{
              fontSize: '16px',
              lineHeight: 1.75,
              color: '#8B8FA8',
              maxWidth: '440px',
              fontWeight: 400,
            }}
          >
            Your AI-powered companion for GATE, competitive exams, and technical
            interviews — personalized, adaptive, and always on.
          </motion.p>

          {/* Feature bullets */}
          <motion.ul variants={itemVariant} className="space-y-3" style={{ listStyle: 'none', padding: 0 }}>
            {FEATURES.map((feat) => (
              <li key={feat} className="flex items-start gap-3">
                <span className="ep-check-dot" style={{ marginTop: '7px' }} />
                <span style={{ color: '#B0B4CC', fontSize: '14px', lineHeight: 1.6 }}>{feat}</span>
              </li>
            ))}
          </motion.ul>

          {/* Stats grid */}
          <motion.div
            variants={itemVariant}
            className="grid grid-cols-2 gap-3"
            style={{ maxWidth: '400px' }}
          >
            {STATS.map(({ value, label }) => (
              <div key={label} className="ep-stat-card">
                <div className="ep-stat-value">{value}</div>
                <div className="ep-stat-label">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Bottom: copyright ── */}
        <p style={{ color: 'rgba(139,143,168,0.38)', fontSize: '13px' }}>
          &copy; {new Date().getFullYear()} ExamPrep. All rights reserved.
        </p>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT FORM PANEL — full width on mobile
      ══════════════════════════════════════════════ */}
      <div
        className="flex-1 flex items-center justify-center relative z-10"
        style={{ padding: 'clamp(24px, 5vw, 56px)' }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Mobile logo — hidden on desktop */}
          <motion.div
            className="flex items-center gap-2 mb-10 lg:hidden"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1.00 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="ep-logo-icon ep-logo-icon-sm">
              <BookOpen style={{ width: '18px', height: '18px', color: '#0D0F1A' }} />
            </div>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#F2F2F0',
                letterSpacing: '-0.025em',
              }}
            >
              ExamPrep
            </span>
          </motion.div>

          {/* Auth page content (Login / Register / Forgot-password) */}
          <Outlet />
        </div>
      </div>
    </div>
  )
}
