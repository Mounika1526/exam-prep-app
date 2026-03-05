import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  BookOpen, LayoutDashboard, GraduationCap, ClipboardList,
  BarChart3, Bot, User, LogOut, BookMarked, FlaskConical,
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',     to: '/dashboard' },
  { icon: GraduationCap,   label: 'Exams',         to: '/exams' },
  { icon: ClipboardList,   label: 'Practice Tests', to: '/test' },
  { icon: BarChart3,       label: 'Progress',       to: '/progress' },
  { icon: Bot,             label: 'AI Assistant',   to: '/ai-tutor' },
  { icon: BookMarked,      label: 'Study Plan',     to: '/study-plan' },
  { icon: FlaskConical,    label: 'Question Bank',  to: '/my-questions' },
]

export function Sidebar() {
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + '/')

  return (
    <TooltipProvider delayDuration={400}>
      <aside className="hidden md:flex flex-col w-64 border-r bg-card shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">ExamPrep</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
            const active = isActive(to)
            return (
              <Tooltip key={to}>
                <TooltipTrigger asChild>
                  <Link
                    to={to}
                    className={cn(
                      // Base — left border reserves 3px so spacing stays consistent
                      'flex items-center gap-3 border-l-[3px] pl-[9px] pr-3 py-2.5 rounded-r-md text-sm font-medium',
                      // Hover scale
                      'transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                </TooltipTrigger>
                {/* Tooltip is only meaningful in future collapsed (icon-only) mode */}
                <TooltipContent side="right" sideOffset={12}>
                  {label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t p-3">
          <Link
            to="/profile"
            className={cn(
              'flex items-center gap-3 p-2 rounded-md transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]',
              isActive('/profile') ? 'bg-accent' : 'hover:bg-accent'
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={(user as any)?.avatar} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-2 py-1.5 w-full rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] mt-1"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
