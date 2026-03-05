import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ShieldCheck, Info } from 'lucide-react'

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  const { user } = useAuthStore()
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'A'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Admin account information</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin Profile</CardTitle>
          <CardDescription>Your current admin account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={(user as any)?.avatar} />
              <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge className="mt-1 gap-1">
                <ShieldCheck className="h-3 w-3" />
                Administrator
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">User ID</p>
              <p className="font-mono text-xs truncate">{user?.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Role</p>
              <p>{user?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 pt-5 pb-5">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200">Profile editing</p>
            <p className="text-blue-700 dark:text-blue-300 mt-0.5">
              To update your name, email, or password, use the{' '}
              <span className="font-medium">Profile</span> page in the student dashboard
              (accessible after logging in as a student, or via <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">/profile</code>).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
