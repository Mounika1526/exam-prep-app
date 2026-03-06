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
      {/* ── Sidebar container — glass dark panel ── */}
      <aside className="hidden md:flex flex-col w-64 ds-sidebar shrink-0">

        {/* ── Logo ── */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Teal glow icon — matches auth page logo */}
          <div className="ep-logo-icon" style={{ width: 36, height: 36, borderRadius: 9 }}>
            <BookOpen style={{ width: 18, height: 18, color: '#0D0F1A' }} />
          </div>
          <span
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '18px',
              fontWeight: 700,
              color: '#F2F2F0',
              letterSpacing: '-0.02em',
            }}
          >
            ExamPrep
          </span>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto px-3">
          {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
            const active = isActive(to)
            return (
              <Tooltip key={to}>
                <TooltipTrigger asChild>
                  <Link
                    to={to}
                    className={cn(
                      // Base layout — left border slot + padding
                      'ds-nav-item flex items-center gap-3 border-l-[3px] pl-3 pr-3 py-2.5 rounded-r-lg text-sm font-medium',
                      active
                        ? 'ds-nav-active border-primary'
                        : 'border-transparent text-muted-foreground',
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" style={{ width: 18, height: 18 }} />
                    {label}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>{label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* ── User section ── */}
        <div
          className="p-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Profile link */}
          <Link
            to="/profile"
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-lg transition-all duration-150',
              isActive('/profile')
                ? 'bg-accent/50'
                : 'hover:bg-white/5'
            )}
          >
            <div className="relative">
              <Avatar className="h-8 w-8" style={{ border: '2px solid rgba(0,229,204,0.3)' }}>
                <AvatarImage src={(user as any)?.avatar} />
                <AvatarFallback
                  className="text-xs font-semibold"
                  style={{ background: 'rgba(0,229,204,0.15)', color: '#00E5CC' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                style={{ background: '#4ADE80', border: '2px solid #0D0F1A', boxShadow: '0 0 6px rgba(74,222,128,0.6)' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#F2F2F0' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: '#8B8FA8' }}>{user?.email}</p>
            </div>
            <User className="h-4 w-4 shrink-0" style={{ color: '#8B8FA8' }} />
          </Link>

          {/* Sign out */}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm transition-all duration-150 mt-1 group"
            style={{ color: '#8B8FA8' }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.color = '#F87171'
              ;(e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.color = '#8B8FA8'
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
