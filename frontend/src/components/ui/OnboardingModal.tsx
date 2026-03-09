import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Brain, ClipboardList, ArrowRight, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STEPS = [
  {
    icon: BookOpen,
    iconColor: '#00E5CC',
    iconBg: 'rgba(0,229,204,0.12)',
    title: 'Pick your exam',
    description:
      'Browse exams, explore subjects and chapters, and start tracking your progress topic by topic.',
    cta: 'Browse Exams',
    action: '/exams',
  },
  {
    icon: Brain,
    iconColor: '#A78BFA',
    iconBg: 'rgba(167,139,250,0.12)',
    title: 'Study with AI',
    description:
      'Use the AI Tutor to ask questions, generate practice questions per topic, and create a personalised study plan.',
    cta: 'Try AI Tutor',
    action: '/ai-tutor',
  },
  {
    icon: ClipboardList,
    iconColor: '#F5A623',
    iconBg: 'rgba(245,166,35,0.12)',
    title: 'Test yourself',
    description:
      'Take timed mock tests, review your results, and see exactly which topics need more work.',
    cta: 'Start a Test',
    action: '/test/setup',
  },
]

const STORAGE_KEY = 'ep-onboarding-done'

export function useOnboarding() {
  const [open, setOpen] = useState(() => !localStorage.getItem(STORAGE_KEY))
  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
  }
  return { open, dismiss }
}

interface Props { onClose: () => void }

export function OnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const handleCta = () => {
    onClose()
    navigate({ to: current.action as any })
  }

  const handleNext = () => {
    if (isLast) { onClose(); return }
    setStep(s => s + 1)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-md"
        style={{
          background: 'rgba(17,20,35,0.98)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
          style={{ color: '#8B8FA8' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#F2F2F0')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8B8FA8')}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4" style={{ color: '#00E5CC' }} />
            <span className="text-xs font-semibold label-caps" style={{ color: '#00E5CC' }}>
              Welcome to Exam Prep
            </span>
          </div>
          <h2 className="page-title" style={{ color: '#F2F2F0', fontSize: '1.4rem' }}>
            Get started in 3 steps
          </h2>
        </div>

        {/* Steps */}
        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: current.iconBg, border: `1px solid ${current.iconColor}30` }}
              >
                <current.icon className="h-7 w-7" style={{ color: current.iconColor }} />
              </div>

              {/* Text */}
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#F2F2F0' }}>
                  {current.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8B8FA8' }}>
                  {current.description}
                </p>
              </div>

              {/* Step dots */}
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? 20 : 6,
                      height: 6,
                      background: i === step ? '#00E5CC' : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="flex-1"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#8B8FA8', background: 'transparent' }}
          >
            {isLast ? 'Done' : 'Next'}
          </Button>
          <Button
            size="sm"
            onClick={handleCta}
            className="flex-1 ep-shimmer-btn ds-btn-shimmer"
            style={{ fontWeight: 600 }}
          >
            {current.cta}
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
