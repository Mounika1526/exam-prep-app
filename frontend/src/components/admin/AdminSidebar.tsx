import { Link, useRouterState } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthStore } from '@/stores/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LayoutDashboard, Users, BookOpen, HelpCircle,
  Bot, Settings, LogOut, ShieldCheck,
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    to: '/admin',               exact: true  },
  { icon: Users,           label: 'Users',         to: '/admin/users',         exact: false },
  { icon: BookOpen,        label: 'Exams',         to: '/admin/exams',         exact: false },
  { icon: HelpCircle,      label: 'Questions',     to: '/admin/questions',     exact: false },
  { icon: Bot,             label: 'AI Analytics',  to: '/admin/ai-analytics',  exact: false },
  { icon: Settings,        label: 'Settings',      to: '/admin/settings',      exact: false },
]

export function AdminSidebar() {
  const { logout }   = useAuth()
  const { user }     = useAuthStore()
  const routerState  = useRouterState()
  const pathname     = routerState.location.pathname

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U'

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + '/')

  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0"
      style={{
        background: 'rgba(13,15,26,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(0,229,204,0.15)', border: '1px solid rgba(0,229,204,0.3)' }}
        >
          <ShieldCheck className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: '#00E5CC' }} />
        </div>
        <span
          className="text-lg font-bold"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F2F2F0' }}
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, to, exact }) => {
          const active = isActive(to, exact)
          return (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={active ? {
                background: 'rgba(0,229,204,0.10)',
                color: '#00E5CC',
                borderLeft: '2px solid #00E5CC',
                paddingLeft: 10,
              } : {
                color: '#8B8FA8',
                borderLeft: '2px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                  ;(e.currentTarget as HTMLElement).style.color = '#F2F2F0'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = '#8B8FA8'
                }
              }}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" style={{ width: 18, height: 18 }} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: 12 }}>
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
          <Avatar
            className="h-8 w-8 shrink-0"
            style={{ border: '1px solid rgba(0,229,204,0.3)' }}
          >
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
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-2 py-1.5 w-full rounded-lg text-sm mt-1 transition-colors"
          style={{ color: '#8B8FA8' }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.color = '#F87171'
            ;(e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.08)'
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
  )
}
