import { useState, useRef } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, ShieldCheck, KeyRound } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPage,
})

// ─── Step schemas ─────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain digits only'),
})

const passwordSchema = z
  .object({
    newPassword:     z.string().min(6, 'Password must be at least 6 characters').max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type EmailData    = z.infer<typeof emailSchema>
type OtpData      = z.infer<typeof otpSchema>
type PasswordData = z.infer<typeof passwordSchema>

type Step = 'email' | 'otp' | 'password'

// ─── Step indicators ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 'email',    label: 'Email',       Icon: Mail },
  { id: 'otp',      label: 'Verify OTP',  Icon: ShieldCheck },
  { id: 'password', label: 'New Password', Icon: KeyRound },
] as const

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current)
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((step, i) => {
        const done    = i < currentIdx
        const active  = step.id === current
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done
                  ? 'bg-primary text-primary-foreground'
                  : active
                  ? 'border-2 border-primary text-primary'
                  : 'border-2 border-muted text-muted-foreground'
              }`}
            >
              {done ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-8 transition-colors ${
                  done ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep]         = useState<Step>('email')
  const [isPending, setIsPending] = useState(false)

  // Carry email and OTP forward between steps
  const emailRef = useRef('')
  const otpRef   = useRef('')

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="space-y-1 pb-2">
        <StepIndicator current={step} />
        <CardTitle className="text-2xl font-bold">
          {step === 'email'    && 'Forgot Password'}
          {step === 'otp'      && 'Enter OTP'}
          {step === 'password' && 'Set New Password'}
        </CardTitle>
        <CardDescription>
          {step === 'email'    && "Enter your email and we'll send you a one-time code."}
          {step === 'otp'      && `We sent a 6-digit code to ${emailRef.current}. Check your inbox.`}
          {step === 'password' && 'Choose a strong password for your account.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        {step === 'email' && (
          <EmailStep
            isPending={isPending}
            setIsPending={setIsPending}
            onSuccess={(email) => {
              emailRef.current = email
              setStep('otp')
            }}
          />
        )}
        {step === 'otp' && (
          <OtpStep
            isPending={isPending}
            setIsPending={setIsPending}
            onSuccess={(otp) => {
              otpRef.current = otp
              setStep('password')
            }}
            onResend={() => {
              // Re-trigger the email send silently
              api.post('/auth/forgot-password', { email: emailRef.current }).catch(() => {})
              toast({ title: 'OTP resent', description: 'Check your inbox for the new code.' })
            }}
          />
        )}
        {step === 'password' && (
          <NewPasswordStep
            isPending={isPending}
            setIsPending={setIsPending}
            onSuccess={async (newPassword) => {
              setIsPending(true)
              try {
                await api.post('/auth/reset-password', {
                  email: emailRef.current,
                  otp:   otpRef.current,
                  newPassword,
                })
                toast({
                  title: 'Password reset!',
                  description: 'You can now sign in with your new password.',
                })
                navigate({ to: '/login' })
              } catch (err: any) {
                toast({
                  title: 'Reset failed',
                  description:
                    err.response?.data?.message || 'Invalid or expired OTP. Please start over.',
                  variant: 'destructive',
                })
                setStep('email')
              } finally {
                setIsPending(false)
              }
            }}
          />
        )}

        <div className="mt-5 text-center">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Step 1: Email ────────────────────────────────────────────────────────────

function EmailStep({
  isPending,
  setIsPending,
  onSuccess,
}: {
  isPending:    boolean
  setIsPending: (v: boolean) => void
  onSuccess:    (email: string) => void
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<EmailData>({
    resolver: zodResolver(emailSchema),
  })

  const onSubmit = async ({ email }: EmailData) => {
    setIsPending(true)
    try {
      await api.post('/auth/forgot-password', { email })
      // Always show the same success message (server does too, to prevent enumeration)
      toast({
        title: 'OTP sent',
        description: 'If this email is registered, you will receive a code shortly.',
      })
      onSuccess(email)
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fp-email">Email address</Label>
        <Input
          id="fp-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send OTP
      </Button>
    </form>
  )
}

// ─── Step 2: OTP ──────────────────────────────────────────────────────────────

function OtpStep({
  isPending,
  setIsPending,
  onSuccess,
  onResend,
}: {
  isPending:    boolean
  setIsPending: (v: boolean) => void
  onSuccess:    (otp: string) => void
  onResend:     () => void
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<OtpData>({
    resolver: zodResolver(otpSchema),
  })

  // OTP verification happens when submitting the new password (needs all 3 values).
  // Here we just collect + validate the format.
  const onSubmit = ({ otp }: OtpData) => {
    onSuccess(otp)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="otp">6-digit code</Label>
        <Input
          id="otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          autoFocus
          className="text-center text-2xl tracking-[0.5em] font-mono"
          {...register('otp')}
        />
        {errors.otp && (
          <p className="text-xs text-destructive">{errors.otp.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        Verify Code
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Didn't receive it?{' '}
        <button
          type="button"
          className="text-primary hover:underline font-medium"
          onClick={onResend}
        >
          Resend OTP
        </button>
      </p>
    </form>
  )
}

// ─── Step 3: New Password ─────────────────────────────────────────────────────

function NewPasswordStep({
  isPending,
  setIsPending,
  onSuccess,
}: {
  isPending:    boolean
  setIsPending: (v: boolean) => void
  onSuccess:    (newPassword: string) => void
}) {
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmit = ({ newPassword }: PasswordData) => {
    onSuccess(newPassword)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNew ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            className="pr-10"
            autoFocus
            {...register('newPassword')}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowNew((v) => !v)}
            aria-label={showNew ? 'Hide password' : 'Show password'}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-xs text-destructive">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            className="pr-10"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Reset Password
      </Button>
    </form>
  )
}
