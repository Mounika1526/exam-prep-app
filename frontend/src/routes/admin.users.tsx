import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/adminApi'
import type { AdminUser, Role } from '@/types'
import { UserDetailModal } from '@/components/admin/UserDetailModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import {
  Search, MoreHorizontal, Eye, UserCheck, UserX,
  ShieldCheck, GraduationCap, ChevronLeft, ChevronRight,
} from 'lucide-react'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
})

const timeAgo = (s: string | null) => {
  if (!s) return 'Never'
  const ms = Date.now() - new Date(s).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d}d ago` : `${Math.floor(d / 30)}mo ago`
}

function AdminUsersPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [role, setRole]               = useState<Role | ''>('')
  const [sortBy, setSortBy]           = useState<'createdAt' | 'name' | 'lastActive'>('createdAt')
  const [order, setOrder]             = useState<'asc' | 'desc'>('desc')
  const [page, setPage]               = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [role, sortBy, order])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', { page, search, role, sortBy, order }],
    queryFn: () => adminApi.getUsers({ page, limit: 15, search, role: role || undefined, sortBy, order }),
    placeholderData: (prev) => prev,
  })

  const users      = data?.data ?? []
  const pagination = data?.pagination

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { role?: Role; isActive?: boolean } }) =>
      adminApi.updateUser(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user', updated.id] })
      toast({ title: 'User updated' })
    },
    onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
  })

  const handleToggleActive = (user: AdminUser) => {
    updateMutation.mutate({ id: user.id, payload: { isActive: !user.isActive } })
  }

  const handleChangeRole = (user: AdminUser, newRole: Role) => {
    updateMutation.mutate({ id: user.id, payload: { role: newRole } })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F2F2F0', letterSpacing: '-0.025em' }}
        >
          User Management
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8B8FA8' }}>
          {pagination ? `${pagination.total.toLocaleString()} users total` : 'Manage all platform users'}
        </p>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0" style={{ borderRadius: 14 }}>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: '#8B8FA8' }}
              />
              <input
                placeholder="Search name or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-md text-sm focus:outline-none focus:ring-1"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: '#F2F2F0',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,229,204,0.4)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)' }}
              />
            </div>

            <Select value={role || 'all'} onValueChange={(v) => setRole(v === 'all' ? '' : v as Role)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={`${sortBy}:${order}`}
              onValueChange={(v) => {
                const [s, o] = v.split(':') as [typeof sortBy, typeof order]
                setSortBy(s); setOrder(o)
              }}
            >
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:desc">Newest first</SelectItem>
                <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                <SelectItem value="name:asc">Name A–Z</SelectItem>
                <SelectItem value="name:desc">Name Z–A</SelectItem>
                <SelectItem value="lastActive:desc">Recently active</SelectItem>
                <SelectItem value="lastActive:asc">Least active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card border-0" style={{ borderRadius: 14 }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: '#F2F2F0' }}>
            Users
            {isFetching && (
              <span
                className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#00E5CC', borderTopColor: 'transparent' }}
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: '#8B8FA8' }}>
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: '#8B8FA8' }}>User</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: '#8B8FA8' }}>Role</th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: '#8B8FA8' }}>Tests</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: '#8B8FA8' }}>Last Active</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: '#8B8FA8' }}>Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isUpdating={updateMutation.isPending && updateMutation.variables?.id === user.id}
                      onView={() => setSelectedUserId(user.id)}
                      onToggleActive={() => handleToggleActive(user)}
                      onChangeRole={(role) => handleChangeRole(user, role)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm" style={{ color: '#8B8FA8' }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={!pagination.hasPrev}
                style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#8B8FA8', background: 'transparent' }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
                style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#8B8FA8', background: 'transparent' }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  )
}

// ─── Table row ────────────────────────────────────────────────────────────────

function UserRow({
  user, isUpdating, onView, onToggleActive, onChangeRole,
}: {
  user: AdminUser
  isUpdating: boolean
  onView: () => void
  onToggleActive: () => void
  onChangeRole: (role: Role) => void
}) {
  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <tr
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        opacity: isUpdating ? 0.6 : 1,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar
            className="h-9 w-9 shrink-0"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <AvatarImage src={user.avatar} />
            <AvatarFallback
              className="text-xs font-medium"
              style={{ background: 'rgba(0,229,204,0.12)', color: '#00E5CC' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate" style={{ color: '#F2F2F0' }}>{user.name}</p>
            <p className="text-xs truncate" style={{ color: '#8B8FA8' }}>{user.email}</p>
            {user.targetExam && (
              <p className="text-xs truncate" style={{ color: 'rgba(0,229,204,0.6)' }}>{user.targetExam}</p>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={user.role === 'ADMIN' ? {
            background: 'rgba(0,229,204,0.12)',
            color: '#00E5CC',
            border: '1px solid rgba(0,229,204,0.25)',
          } : {
            background: 'rgba(255,255,255,0.06)',
            color: '#8B8FA8',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {user.role === 'ADMIN'
            ? <><ShieldCheck className="h-3 w-3" />Admin</>
            : <><GraduationCap className="h-3 w-3" />Student</>
          }
        </span>
      </td>

      <td className="px-4 py-3 text-right" style={{ color: '#8B8FA8' }}>
        {user._count.testSessions}
      </td>

      <td className="px-4 py-3 text-sm" style={{ color: '#8B8FA8' }}>
        {timeAgo(user.lastActive)}
      </td>

      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
          style={user.isActive ? {
            background: 'rgba(74,222,128,0.12)',
            color: '#4ADE80',
            border: '1px solid rgba(74,222,128,0.25)',
          } : {
            background: 'rgba(248,113,113,0.12)',
            color: '#F87171',
            border: '1px solid rgba(248,113,113,0.25)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: user.isActive ? '#4ADE80' : '#F87171' }}
          />
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>

      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChangeRole(user.role === 'ADMIN' ? 'STUDENT' : 'ADMIN')}>
              {user.role === 'ADMIN'
                ? <><GraduationCap className="h-4 w-4 mr-2" />Make Student</>
                : <><ShieldCheck className="h-4 w-4 mr-2" />Make Admin</>
              }
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onToggleActive}
              className={user.isActive ? 'text-destructive focus:text-destructive' : ''}
            >
              {user.isActive
                ? <><UserX className="h-4 w-4 mr-2" />Deactivate</>
                : <><UserCheck className="h-4 w-4 mr-2" />Activate</>
              }
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
