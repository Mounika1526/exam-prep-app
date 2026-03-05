import { useState } from 'react'
import { createFileRoute, Outlet, Navigate, useRouterState } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BackToTop } from '@/components/ui/BackToTop'
import { PageTransition } from '@/components/layout/PageTransition'
import { SearchModal } from '@/components/layout/SearchModal'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const { user, isLoading } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = useRouterState({ select: s => s.location.pathname })

  useKeyboardShortcuts({ 'ctrl+k': () => setSearchOpen(true) })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />
  if (user.role === 'ADMIN') return <Navigate to="/admin" />

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onSearchOpen={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <PageTransition routeKey={pathname} className="p-6 min-h-full">
            <Outlet />
            <BackToTop />
          </PageTransition>
        </main>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
