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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Loader2, LogOut } from 'lucide-react'

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
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={(user as any)?.avatar} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user?.name}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Target Exam</Label>
                <Input {...register('targetExam')} placeholder="e.g., UPSC, JEE" />
              </div>
              <div className="space-y-2">
                <Label>Exam Date</Label>
                <Input type="date" {...register('examDate')} />
              </div>
              <div className="space-y-2">
                <Label>Hours per Day</Label>
                <Input type="number" step="0.5" {...register('hoursPerDay', { valueAsNumber: true })} />
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={pwSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" {...pwReg('currentPassword')} />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" {...pwReg('newPassword')} />
              {pwErrors.newPassword && <p className="text-sm text-destructive">{pwErrors.newPassword.message as string}</p>}
            </div>
            <Button type="submit" variant="outline" disabled={passwordMutation.isPending}>
              {passwordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Logout */}
      <Button variant="destructive" onClick={logout}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  )
}
