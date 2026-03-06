import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { StatsCard } from '@/components/dashboard/StatsCard'
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

      {/* ── Row 1: Hero header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#F2F2F0',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          >
            {greeting()},{' '}
            <span className="ep-gradient-text">{user?.name?.split(' ')[0]}</span>!
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#8B8FA8' }}>
            {user?.targetExam
              ? `Preparing for ${user.targetExam.toUpperCase()}`
              : "Let's get studying today"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {examCountdown !== null && user?.targetExam && (
            <div
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold"
              style={{
                background: 'rgba(0,229,204,0.10)',
                border: '1px solid rgba(0,229,204,0.25)',
                color: '#00E5CC',
              }}
            >
              <Target className="h-3.5 w-3.5" />
              {user.targetExam.toUpperCase()} in {examCountdown} days
            </div>
          )}
          {s?.streak && (
            <div
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold"
              style={{
                background: 'rgba(255,140,66,0.12)',
                border: '1px solid rgba(255,140,66,0.3)',
                color: '#FF8C42',
              }}
            >
              <Flame className="h-3.5 w-3.5" style={{ filter: 'drop-shadow(0 0 4px rgba(255,140,66,0.6))' }} />
              {s.streak.currentStreak} day streak
            </div>
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
