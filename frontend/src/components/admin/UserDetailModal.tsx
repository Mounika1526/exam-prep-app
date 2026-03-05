import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/adminApi'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  User, Mail, Target, Calendar, Trophy, BookOpen,
  MessageSquare, Bookmark, Flame, Clock,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (s?: string | null) => {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const timeAgo = (s?: string | null) => {
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

const statusColor: Record<string, string> = {
  COMPLETED:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  NOT_STARTED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  userId: string | null
  onClose: () => void
}

export function UserDetailModal({ userId, onClose }: Props) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminApi.getUserById(userId!),
    enabled: !!userId,
  })

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?'

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading || !user ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              {/* User header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl">{user.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <Badge
                      className={
                        user.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0'
                      }
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <Separator />

            <Tabs defaultValue="overview">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="progress" className="flex-1">
                  Progress ({user._count.userProgress})
                </TabsTrigger>
                <TabsTrigger value="tests" className="flex-1">
                  Tests ({user._count.testSessions})
                </TabsTrigger>
              </TabsList>

              {/* ── Overview ── */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { icon: User,          label: 'Joined',       value: fmt(user.createdAt) },
                    { icon: Clock,         label: 'Last Active',  value: timeAgo(user.lastActive) },
                    { icon: Target,        label: 'Target Exam',  value: user.targetExam || '—' },
                    { icon: Calendar,      label: 'Exam Date',    value: fmt(user.examDate) },
                    { icon: Mail,          label: 'Email',        value: user.email },
                    { icon: Clock,         label: 'Study hrs/day',value: user.hoursPerDay ? `${user.hoursPerDay}h` : '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-medium truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: BookOpen,      label: 'Tests',       value: user._count.testSessions,     color: 'text-blue-500' },
                    { icon: Trophy,        label: 'Topics',      value: user._count.userProgress,     color: 'text-purple-500' },
                    { icon: MessageSquare, label: 'AI Chats',    value: user._count.aiConversations,  color: 'text-cyan-500' },
                    { icon: Bookmark,      label: 'Saved Qs',    value: user._count.aiSavedQuestions, color: 'text-orange-500' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="text-center p-3 rounded-lg bg-muted/50">
                      <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
                      <p className="text-xl font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Streak */}
                {user.streak && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                    <Flame className="h-6 w-6 text-orange-500" />
                    <div>
                      <p className="text-sm font-semibold">
                        {user.streak.currentStreak}-day streak
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Longest: {user.streak.longestStreak} days
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── Progress ── */}
              <TabsContent value="progress" className="mt-4">
                {user.userProgress.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No progress tracked yet
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {user.userProgress.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-muted/50 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.topic.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.topic.chapter.subject.exam.title} › {p.topic.chapter.subject.title} › {p.topic.chapter.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[p.status] ?? ''}`}>
                            {p.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground w-16 text-right">
                            {timeAgo(p.updatedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Test History ── */}
              <TabsContent value="tests" className="mt-4">
                {user.testSessions.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No completed tests yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 font-medium">Exam</th>
                          <th className="text-right py-2 font-medium">Score</th>
                          <th className="text-right py-2 font-medium">Questions</th>
                          <th className="text-right py-2 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.testSessions.map((t) => (
                          <tr key={t.id} className="border-b last:border-0">
                            <td className="py-2.5 font-medium truncate max-w-[180px]">
                              {t.exam.title}
                            </td>
                            <td className="py-2.5 text-right">
                              {t.score != null ? (
                                <span className={
                                  t.score >= 70 ? 'text-green-600 font-semibold' :
                                  t.score >= 50 ? 'text-yellow-600 font-semibold' :
                                  'text-red-600 font-semibold'
                                }>
                                  {t.score}%
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground">
                              {t.totalQuestions}
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground">
                              {fmt(t.submittedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
