import { useEffect, useRef } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  BookOpen, LayoutDashboard, GraduationCap, ClipboardList,
  BarChart3, Bot, User, LogOut, BookMarked, FlaskConical, X,
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

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const drawerRef = useRef<HTMLDivElement>(null)

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + '/')

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden
      />

      {/* ── Drawer — glass dark panel ── */}
      <div
        ref={drawerRef}
        className="ds-sidebar absolute left-0 top-0 h-full w-72 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div className="ep-logo-icon" style={{ width: 34, height: 34, borderRadius: 8 }}>
              <BookOpen style={{ width: 17, height: 17, color: '#0D0F1A' }} />
            </div>
            <span
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '17px',
                fontWeight: 700,
                color: '#F2F2F0',
                letterSpacing: '-0.02em',
              }}
            >
              ExamPrep
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: '#8B8FA8', background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F2F2F0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8B8FA8' }}
          >
            <X className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto px-3">
          {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className={cn(
                  'ds-nav-item flex items-center gap-3 border-l-[3px] pl-3 pr-3 py-2.5 rounded-r-lg text-sm font-medium',
                  active
                    ? 'ds-nav-active border-primary'
                    : 'border-transparent text-muted-foreground',
                )}
              >
                <Icon style={{ width: 17, height: 17 }} className="shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link
            to="/profile"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-lg transition-all duration-150',
              isActive('/profile') ? 'bg-white/5' : 'hover:bg-white/5'
            )}
          >
            <Avatar className="h-8 w-8" style={{ border: '2px solid rgba(0,229,204,0.3)' }}>
              <AvatarImage src={(user as any)?.avatar} />
              <AvatarFallback
                className="text-xs font-semibold"
                style={{ background: 'rgba(0,229,204,0.15)', color: '#00E5CC' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#F2F2F0' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: '#8B8FA8' }}>{user?.email}</p>
            </div>
            <User className="h-4 w-4 shrink-0" style={{ color: '#8B8FA8' }} />
          </Link>
          <button
            onClick={() => { logout(); onClose() }}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm transition-all duration-150 mt-1"
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
      </div>
    </div>
  )
}
