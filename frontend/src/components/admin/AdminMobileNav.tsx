import { useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LayoutDashboard, Users, BookOpen, HelpCircle,
  Bot, Settings, LogOut, ShieldCheck, X,
} from 'lucide-react'

const ADMIN_NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',   to: '/admin',              exact: true  },
  { icon: Users,           label: 'Users',        to: '/admin/users',        exact: false },
  { icon: BookOpen,        label: 'Exams',        to: '/admin/exams',        exact: false },
  { icon: HelpCircle,      label: 'Questions',    to: '/admin/questions',    exact: false },
  { icon: Bot,             label: 'AI Analytics', to: '/admin/ai-analytics', exact: false },
  { icon: Settings,        label: 'Settings',     to: '/admin/settings',     exact: false },
]

interface AdminMobileNavProps {
  open: boolean
  onClose: () => void
}

export function AdminMobileNav({ open, onClose }: AdminMobileNavProps) {
  const { user }  = useAuthStore()
  const { logout } = useAuth()
  const routerState = useRouterState()
  const pathname    = routerState.location.pathname

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + '/')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

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

      {/* Drawer */}
      <div className="ds-sidebar absolute left-0 top-0 h-full w-72 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,229,204,0.15)', border: '1px solid rgba(0,229,204,0.3)' }}
            >
              <ShieldCheck style={{ width: 16, height: 16, color: '#00E5CC' }} />
            </div>
            <span
              className="text-base font-bold text-foreground"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              ExamPrep
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,229,204,0.12)', color: '#00E5CC', border: '1px solid rgba(0,229,204,0.25)' }}
            >
              ADMIN
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto px-3">
          {ADMIN_NAV_ITEMS.map(({ icon: Icon, label, to, exact }) => {
            const active = isActive(to, exact)
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border-l-2',
                  active
                    ? 'border-[#00E5CC] text-[#00E5CC] bg-[rgba(0,229,204,0.10)]'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                <Icon style={{ width: 17, height: 17 }} className="shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-border/40">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
            <Avatar className="h-8 w-8 shrink-0" style={{ border: '1px solid rgba(0,229,204,0.3)' }}>
              <AvatarImage src={(user as any)?.avatar} />
              <AvatarFallback
                className="text-xs font-semibold"
                style={{ background: 'rgba(0,229,204,0.15)', color: '#00E5CC' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{user?.name}</p>
              <p className="text-xs truncate text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); onClose() }}
            className="flex items-center gap-3 px-2 py-1.5 w-full rounded-lg text-sm mt-1 transition-colors text-muted-foreground hover:text-red-500 hover:bg-red-500/8"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
