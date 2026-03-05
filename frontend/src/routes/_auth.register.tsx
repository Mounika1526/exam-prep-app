import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { motion, useAnimationControls } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { api, setAccessToken } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FloatingInput } from '@/components/ui/FloatingInput'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Exam } from '@/types'

export const Route = createFileRoute('/_auth/register')({
  component: RegisterPage,
})

const schema = z
  .object({
    name:            z.string().min(2, 'Name must be at least 2 characters').max(100),
    email:           z.string().email('Enter a valid email address'),
    password:        z.string().min(6, 'Password must be at least 6 characters').max(100),
    confirmPassword: z.string(),
    targetExam:      z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>


function getStrength(password: string) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8)          score++
  if (/[A-Z]/.test(password))        score++
  if (/[0-9]/.test(password))        score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const STRENGTH_CONFIG = [
  { label: 'Weak',   bar: 'bg-red-500',    text: 'text-red-600 dark:text-red-400' },
  { label: 'Fair',   bar: 'bg-orange-400', text: 'text-orange-600 dark:text-orange-400' },
  { label: 'Good',   bar: 'bg-yellow-400', text: 'text-yellow-600 dark:text-yellow-400' },
  { label: 'Strong', bar: 'bg-green-500',  text: 'text-green-600 dark:text-green-400' },
]

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const score = getStrength(password)
  const cfg   = STRENGTH_CONFIG[Math.max(0, score - 1)]
  return (
    <div className="space-y-1 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              n <= score ? cfg.bar : 'bg-muted',
            )}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={cn('text-xs font-medium', cfg.text)}>{cfg.label}</p>
      )}
    </div>
  )
}


function RegisterPage() {
  const navigate      = useNavigate()
  const { setUser }   = useAuthStore()
  const [showPassword,        setShowPassword]        = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const controls = useAnimationControls()

  const { data: examsData } = useQuery<{ data: Exam[] }>({
    queryKey: ['exams-list'],
    queryFn:  () => api.get('/exams?limit=50').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
  const exams: Exam[] = examsData?.data?.data ?? []

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const passwordValue = watch('password', '')

  const shake = () =>
    controls.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.45, ease: 'easeInOut' },
    })

  const onSubmit = async ({ confirmPassword: _, targetExam, ...rest }: FormData) => {
    setIsPending(true)
    try {
      const { data } = await api.post('/auth/register', {
        ...rest,
        ...(targetExam ? { targetExam } : {}),
      })
      setAccessToken(data.data.accessToken)
      setUser(data.data.user)
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      shake()
      toast({
        title: 'Registration failed',
        description: err.response?.data?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mb-7">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground mt-1 text-sm">Start your exam preparation journey today</p>
      </div>

      <motion.form
        animate={controls}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Full Name */}
        <FloatingInput
          id="name"
          label="Full Name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Email */}
        <FloatingInput
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Target Exam (optional) — Select doesn't use FloatingInput */}
        <div className="space-y-1.5">
          <Label htmlFor="targetExam">
            Target Exam{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Controller
            name="targetExam"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger id="targetExam">
                  <SelectValue placeholder="Select your target exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.length === 0 ? (
                    <SelectItem value="_loading" disabled>
                      Loading exams…
                    </SelectItem>
                  ) : (
                    exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.title}>
                        {exam.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Password + strength indicator */}
        <div>
          <FloatingInput
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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
          <PasswordStrength password={passwordValue} />
        </div>

        {/* Confirm Password */}
        <FloatingInput
          id="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          rightElement={
            <button
              type="button"
              tabIndex={-1}
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...register('confirmPassword')}
        />

        <Button type="submit" className="w-full mt-2" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </motion.form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
