import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: RootRedirect,
})

function RootRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />
  return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} />
}
