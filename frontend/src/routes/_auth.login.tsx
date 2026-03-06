import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useAnimationControls } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/FloatingInput'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

function LoginPage() {
  const navigate     = useNavigate()
  const { login }    = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isPending,    setIsPending]    = useState(false)
  const controls = useAnimationControls()

  // ── Shake animation on login failure (logic unchanged) ──
  const shake = () =>
    controls.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.45, ease: 'easeInOut' },
    })

  // ── Submit handler (logic unchanged) ──
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setIsPending(true)
    try {
      const user = await login(data.email, data.password)
      navigate({ to: user.role === 'ADMIN' ? '/admin' : '/dashboard' })
    } catch (err: any) {
      shake()
      toast({
        title: 'Login failed',
        description: err.response?.data?.message || 'Invalid email or password.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y:  0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* ── Heading section ── */}
      <div style={{ marginBottom: '32px' }}>
        {/* Pill badge */}
        <div className="ep-badge" style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '14px' }}>✦</span>
          <span>Study smarter, not harder</span>
        </div>

        {/* Main heading — Playfair Display */}
        <h1
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '36px',
            fontWeight: 700,
            color: '#F2F2F0',
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            marginBottom: '8px',
          }}
        >
          Welcome back
        </h1>

        <p
          style={{
            color: '#8B8FA8',
            fontSize: '15px',
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          Sign in to continue your preparation
        </p>
      </div>

      {/* ── Form (logic 100% unchanged) ── */}
      <motion.form
        animate={controls}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Email */}
        <FloatingInput
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password */}
        <div className="space-y-1">
          <FloatingInput
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            error={errors.password?.message}
            rightElement={
              <button
                type="button"
                tabIndex={-1}
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register('password')}
          />

          {/* Forgot password */}
          <div className="flex justify-end" style={{ marginTop: '6px' }}>
            <Link to="/forgot-password" className="ep-link-teal" style={{ fontSize: '13px' }}>
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Sign-in button with shimmer + glow */}
        <Button
          type="submit"
          className="w-full ep-shimmer-btn"
          style={{ marginTop: '8px' }}
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </motion.form>

      {/* ── Divider ── */}
      <div className="ep-divider" style={{ margin: '24px 0' }}>
        <span>or</span>
      </div>

      {/* ── Register link ── */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#8B8FA8',
        }}
      >
        Don&apos;t have an account?{' '}
        <Link to="/register" className="ep-link-teal">
          Create one
        </Link>
      </p>
    </motion.div>
  )
}
