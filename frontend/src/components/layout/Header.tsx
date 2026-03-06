import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpen, User, LogOut, Menu, Search, Sun, Moon, Monitor } from 'lucide-react'
import { MobileNav } from '@/components/layout/MobileNav'
import { useTheme } from '@/contexts/ThemeContext'

// Build breadcrumb from pathname
function useBreadcrumb() {
  const routerState = useRouterState()
  const path = routerState.location.pathname

  const ROUTE_LABELS: Record<string, string> = {
    '/dashboard':    'Dashboard',
    '/exams':        'Exams',
    '/test':         'Practice Tests',
    '/progress':     'Progress',
    '/ai-tutor':     'AI Assistant',
    '/study-plan':   'Study Plan',
    '/my-questions': 'Question Bank',
    '/profile':      'Profile',
  }

  for (const [route, label] of Object.entries(ROUTE_LABELS)) {
    if (path === route || path.startsWith(route + '/')) return label
  }
  return 'ExamPrep'
}

interface HeaderProps {
  onSearchOpen: () => void
}

const THEME_OPTIONS = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

export function Header({ onSearchOpen }: HeaderProps) {
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const pageTitle = useBreadcrumb()
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      {/* ── Header bar — blur glass backdrop ── */}
      <header className="ds-header flex items-center justify-between h-16 px-4 md:px-6 shrink-0 sticky top-0 z-30">

        {/* Left: hamburger (mobile) + page title */}
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            style={{ color: '#8B8FA8' }}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo — mobile only */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="ep-logo-icon" style={{ width: 30, height: 30, borderRadius: 7 }}>
              <BookOpen style={{ width: 15, height: 15, color: '#0D0F1A' }} />
            </div>
          </div>

          {/* Page title — Playfair Display on desktop */}
          <h1
            className="text-lg font-semibold"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F2F2F0', letterSpacing: '-0.01em' }}
          >
            {pageTitle}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">

          {/* ── Search button with Ctrl+K hint ── */}
          <button
            onClick={onSearchOpen}
            aria-label="Search (Ctrl+K)"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-150"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: '#8B8FA8',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,204,0.3)'
              ;(e.currentTarget as HTMLElement).style.color = '#F2F2F0'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)'
              ;(e.currentTarget as HTMLElement).style.color = '#8B8FA8'
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <span style={{ fontSize: '13px' }}>Search</span>
            <kbd
              className="hidden md:inline-flex items-center gap-0.5 font-mono"
              style={{
                fontSize: '10px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px',
                padding: '1px 5px',
                color: '#8B8FA8',
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Search icon — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchOpen}
            aria-label="Search"
            className="sm:hidden"
            style={{ color: '#8B8FA8' }}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                style={{ color: '#8B8FA8' }}
                className="hover:text-foreground"
              >
                {resolvedTheme === 'dark' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setTheme(value)}
                  className={theme === value ? 'bg-accent' : ''}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User avatar + dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9" style={{ border: '2px solid rgba(0,229,204,0.35)' }}>
                  <AvatarImage src={(user as any)?.avatar} />
                  <AvatarFallback
                    style={{ background: 'rgba(0,229,204,0.15)', color: '#00E5CC', fontSize: '13px', fontWeight: 700 }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center gap-2.5 p-3">
                <Avatar className="h-9 w-9" style={{ border: '2px solid rgba(0,229,204,0.3)' }}>
                  <AvatarFallback style={{ background: 'rgba(0,229,204,0.12)', color: '#00E5CC', fontWeight: 700 }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  )
}
