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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const shake = () =>
    controls.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.45, ease: 'easeInOut' },
    })

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
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mb-7">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-1 text-sm">Sign in to continue your preparation</p>
      </div>

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
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </motion.form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Create one
        </Link>
      </p>
    </motion.div>
  )
}
