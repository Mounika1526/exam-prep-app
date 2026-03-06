import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Loader2, LogOut, User, Lock } from 'lucide-react'

export const Route = createFileRoute('/_dashboard/profile')({
  component: ProfilePage,
})

const profileSchema = z.object({
  name: z.string().min(2),
  targetExam: z.string().optional(),
  examDate: z.string().optional(),
  hoursPerDay: z.number().min(0.5).max(24).optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const { logout } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      targetExam: (user as any)?.targetExam || '',
      examDate: (user as any)?.examDate ? new Date((user as any).examDate).toISOString().split('T')[0] : '',
      hoursPerDay: (user as any)?.hoursPerDay || 4,
    },
  })

  const { register: pwReg, handleSubmit: pwSubmit, reset: pwReset, formState: { errors: pwErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/profile', data).then(r => r.data),
    onSuccess: (data) => {
      if (data?.data) setUser(data.data)
      qc.invalidateQueries({ queryKey: ['me'] })
      toast({ title: 'Profile updated!' })
    },
  })

  const passwordMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/password', data).then(r => r.data),
    onSuccess: () => {
      pwReset()
      toast({ title: 'Password changed!' })
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.error, variant: 'destructive' })
    },
  })

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            color: '#F2F2F0',
            letterSpacing: '-0.025em',
          }}
        >
          Profile Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8B8FA8' }}>
          Manage your account information
        </p>
      </div>

      {/* Profile Card */}
      <Card className="glass-card border-0" style={{ borderRadius: 16 }}>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar
              className="h-16 w-16"
              style={{ border: '2px solid rgba(0,229,204,0.4)' }}
            >
              <AvatarImage src={(user as any)?.avatar} />
              <AvatarFallback
                className="text-xl font-bold"
                style={{ background: 'rgba(0,229,204,0.15)', color: '#00E5CC' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle style={{ color: '#F2F2F0' }}>{user?.name}</CardTitle>
              <p className="text-sm mt-0.5" style={{ color: '#8B8FA8' }}>{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <User className="h-3.5 w-3.5" style={{ color: '#00E5CC' }} />
            <span className="text-xs font-medium" style={{ color: '#F2F2F0' }}>Profile Information</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#F2F2F0' }}>Full Name</Label>
                <Input {...register('name')} />
                {errors.name && <p className="text-sm" style={{ color: '#F87171' }}>{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#F2F2F0' }}>Target Exam</Label>
                <Input {...register('targetExam')} placeholder="e.g., UPSC, JEE" />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#F2F2F0' }}>Exam Date</Label>
                <Input type="date" {...register('examDate')} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#F2F2F0' }}>Hours per Day</Label>
                <Input type="number" step="0.5" {...register('hoursPerDay', { valueAsNumber: true })} />
              </div>
            </div>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="ep-shimmer-btn ds-btn-shimmer"
              style={{
                background: 'linear-gradient(135deg, #00E5CC, #00B8A5)',
                color: '#0D0F1A',
                border: 'none',
                fontWeight: 600,
              }}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card className="glass-card border-0" style={{ borderRadius: 16 }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" style={{ color: '#C084FC' }} />
            <CardTitle className="text-base" style={{ color: '#F2F2F0' }}>Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={pwSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: '#F2F2F0' }}>Current Password</Label>
              <Input type="password" {...pwReg('currentPassword')} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#F2F2F0' }}>New Password</Label>
              <Input type="password" {...pwReg('newPassword')} />
              {pwErrors.newPassword && (
                <p className="text-sm" style={{ color: '#F87171' }}>
                  {pwErrors.newPassword.message as string}
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={passwordMutation.isPending}
              style={{
                borderColor: 'rgba(192,132,252,0.4)',
                color: '#C084FC',
                background: 'transparent',
              }}
            >
              {passwordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      {/* Logout */}
      <Button
        variant="destructive"
        onClick={logout}
        style={{
          background: 'rgba(248,113,113,0.12)',
          color: '#F87171',
          border: '1px solid rgba(248,113,113,0.3)',
        }}
        className="hover:bg-red-500/20"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  )
}
