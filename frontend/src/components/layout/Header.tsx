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
      <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b bg-background shrink-0">
        {/* Left: hamburger (mobile) + page title */}
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo — mobile only (sidebar is hidden) */}
          <div className="flex items-center gap-2 md:hidden">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>

          <h1 className="text-lg font-semibold">{pageTitle}</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search — opens command palette (Ctrl+K) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchOpen}
            aria-label="Search (Ctrl+K)"
            className="text-muted-foreground"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Toggle theme">
                {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={(user as any)?.avatar} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{user?.name}</p>
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
