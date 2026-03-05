import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { StatsCard, statsCardVariants } from '@/components/dashboard/StatsCard'
import { StreakCard } from '@/components/dashboard/StreakCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { ProgressHeatmap } from '@/components/dashboard/ProgressHeatmap'
import { ProgressChart } from '@/components/dashboard/ProgressChart'
import { ContinueStudyingCard } from '@/components/dashboard/ContinueStudyingCard'
import { RecentTestResults } from '@/components/dashboard/RecentTestResults'
import { EnrolledExamsSection } from '@/components/dashboard/EnrolledExamsSection'
import { WelcomeBackBanner } from '@/components/dashboard/WelcomeBackBanner'
import { AiTrendingWidget } from '@/components/ai/AiTrendingWidget'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, Trophy, Target, Flame } from 'lucide-react'
import type { DashboardStats } from '@/types'

export const Route = createFileRoute('/_dashboard/dashboard')({
  component: DashboardPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days > 0 ? days : null
}

// Stagger container for the stats grid
const statsGridVariants = {
  hidden:   {},
  visible:  { transition: { staggerChildren: 0.08 } },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const { user } = useAuthStore()

  const { data: s, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/users/dashboard').then(r => r.data.data),
    staleTime: 1000 * 60 * 2,
  })
  const examCountdown = daysUntil(user?.examDate)

  return (
    <div className="space-y-6">

      {/* ── Welcome back banner (first visit of the day) ── */}
      <WelcomeBackBanner streak={s?.streak} userName={user?.name} />

      {/* ── Row 1: Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {user?.targetExam
              ? `Preparing for ${user.targetExam.toUpperCase()}`
              : "Let's get studying"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {examCountdown !== null && user?.targetExam && (
            <Badge variant="outline" className="gap-1.5 text-sm py-1.5 px-3 border-primary/30">
              <Target className="h-3.5 w-3.5 text-primary" />
              {user.targetExam.toUpperCase()} in {examCountdown} days
            </Badge>
          )}
          {s?.streak && (
            <Badge
              variant="secondary"
              className="gap-1.5 text-sm py-1.5 px-3 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200"
            >
              <Flame className="h-3.5 w-3.5" />
              {s.streak.currentStreak} day streak
            </Badge>
          )}
        </div>
      </div>

      {/* ── Row 2: Quick stats (staggered entrance + count-up) ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={statsGridVariants}
          initial="hidden"
          animate="visible"
        >
          <StatsCard
            title="Topics Completed"
            value={s?.progress?.completed ?? 0}
            subtitle={`of ${s?.progress?.total ?? 0} total`}
            icon={BookOpen}
            color="blue"
            progress={s?.progress?.percentage}
          />
          <StatsCard
            title="Hours This Week"
            value={s?.hoursStudiedThisWeek ?? 0}
            subtitle="hours studied"
            icon={Clock}
            color="green"
          />
          <StatsCard
            title="Tests Taken"
            value={s?.tests?.total ?? 0}
            subtitle={`avg score ${s?.tests?.avgScore ?? 0}%`}
            icon={Trophy}
            color="yellow"
          />
          <StatsCard
            title="Current Streak"
            value={`${s?.streak?.currentStreak ?? 0} days`}
            subtitle={`best: ${s?.streak?.longestStreak ?? 0} days`}
            icon={Flame}
            color="orange"
          />
        </motion.div>
      )}

      {/* ── Row 3: Continue studying + AI suggestions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ContinueStudyingCard />
        </div>
        <div className="lg:col-span-2">
          <AiTrendingWidget examId={user?.targetExam} />
        </div>
      </div>

      {/* ── Row 4: My exams + Recent tests ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <EnrolledExamsSection />
        </div>
        <div className="lg:col-span-2">
          <RecentTestResults tests={s?.recentTests ?? []} />
        </div>
      </div>

      {/* ── Row 5: Study activity chart + Activity heatmap ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressChart
          data={s?.recentStudySessions ?? []}
          isLoading={isLoading}
        />
        <ProgressHeatmap />
      </div>

      {/* ── Row 6: Streak card + Recent study activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <StreakCard streak={s?.streak} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity sessions={s?.recentStudySessions ?? []} />
        </div>
      </div>

    </div>
  )
}
