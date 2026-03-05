import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthStore } from '@/stores/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LayoutDashboard, Users, BookOpen, HelpCircle,
  Bot, Settings, LogOut, ShieldCheck,
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    to: '/admin',               exact: true },
  { icon: Users,           label: 'Users',         to: '/admin/users',         exact: false },
  { icon: BookOpen,        label: 'Exams',         to: '/admin/exams',         exact: false },
  { icon: HelpCircle,      label: 'Questions',     to: '/admin/questions',     exact: false },
  { icon: Bot,             label: 'AI Analytics',  to: '/admin/ai-analytics',  exact: false },
  { icon: Settings,        label: 'Settings',      to: '/admin/settings',      exact: false },
]

export function AdminSidebar() {
  const { logout } = useAuth()
  const { user }   = useAuthStore()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U'

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + '/')

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold">ExamPrep</span>
        <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, to, exact }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
              isActive(to, exact)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-md">
          <Avatar className="h-8 w-8">
            <AvatarImage src={(user as any)?.avatar} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-2 py-1.5 w-full rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-1"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
