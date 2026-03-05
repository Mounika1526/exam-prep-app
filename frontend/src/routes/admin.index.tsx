import { createFileRoute } from '@tanstack/react-router'
import CountUp from 'react-countup'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users, UserCheck, ClipboardCheck, TrendingUp,
  TrendingDown, Minus, Bot, BookOpen, HelpCircle,
} from 'lucide-react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { useTheme } from '@/contexts/ThemeContext'
import { chartTheme, CHART_COLORS, DIFF_COLORS } from '@/lib/highchartsTheme'
import type { AdminTopExam } from '@/types'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (s: string) => {
  try {
    const [, m, d] = s.split('-').map(Number)
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] + ' ' + d
  } catch { return s }
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title, value, suffix, subtitle, icon: Icon, colorCls, trend, decimals = 0,
}: {
  title: string
  value: number
  suffix?: string
  subtitle?: string
  icon: React.ElementType
  colorCls: string
  trend?: { delta: number; label: string }
  decimals?: number
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              <CountUp end={value} duration={1.4} separator="," decimals={decimals} suffix={suffix} enableScrollSpy scrollSpyOnce />
            </p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 pt-0.5">
                {trend.delta > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : trend.delta < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                )}
                <span className={`text-xs font-medium ${
                  trend.delta > 0 ? 'text-green-500' :
                  trend.delta < 0 ? 'text-red-500' : 'text-muted-foreground'
                }`}>
                  {Math.abs(trend.delta)} {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${colorCls}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdminDashboardPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    staleTime: 1000 * 60 * 2,
  })

  const { data: content } = useQuery({
    queryKey: ['admin-content'],
    queryFn: adminApi.getContent,
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="pt-6"><Skeleton className="h-56" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-56" /></CardContent></Card>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const base = chartTheme(isDark)

  const userGrowthData  = (stats.userGrowth    ?? []).map((d) => ({ date: fmtDate(d.date), count: d.count }))
  const testActivityData = (stats.testActivity ?? []).map((d) => ({ date: fmtDate(d.date), count: d.count }))

  const difficultyData = content
    ? [
        { name: 'Easy',   y: content.questions.byDifficulty['EASY']   ?? 0, color: DIFF_COLORS.EASY },
        { name: 'Medium', y: content.questions.byDifficulty['MEDIUM'] ?? 0, color: DIFF_COLORS.MEDIUM },
        { name: 'Hard',   y: content.questions.byDifficulty['HARD']   ?? 0, color: DIFF_COLORS.HARD },
      ]
    : []

  const hasDifficultyData = difficultyData.some((d) => d.y > 0)

  // ── Chart: User Signups (line) ─────────────────────────────────────────────
  const userGrowthOptions: Highcharts.Options = {
    ...base,
    chart: { ...base.chart, type: 'spline', height: 220, margin: [10, 10, 30, 40] },
    colors: CHART_COLORS,
    xAxis: {
      ...base.xAxis,
      categories: userGrowthData.map(d => d.date),
      tickInterval: Math.max(1, Math.floor(userGrowthData.length / 6)),
    },
    yAxis: { ...base.yAxis, allowDecimals: false },
    tooltip: {
      ...base.tooltip,
      formatter() { return `<b>${this.x}</b><br/><span style="color:${CHART_COLORS[0]}">●</span> ${this.y} new users` },
    },
    legend: { enabled: false },
    plotOptions: {
      spline: {
        lineWidth: 2.5,
        marker: { enabled: false, symbol: 'circle', radius: 4 },
        states: { hover: { lineWidth: 3 } },
      },
    },
    series: [{ type: 'spline', name: 'New users', data: userGrowthData.map(d => d.count), color: CHART_COLORS[0] }],
  }

  // ── Chart: Test Activity (column) ─────────────────────────────────────────
  const testActivityOptions: Highcharts.Options = {
    ...base,
    chart: { ...base.chart, type: 'column', height: 220, margin: [10, 10, 30, 40] },
    colors: CHART_COLORS,
    xAxis: {
      ...base.xAxis,
      categories: testActivityData.map(d => d.date),
      tickInterval: Math.max(1, Math.floor(testActivityData.length / 6)),
    },
    yAxis: { ...base.yAxis, allowDecimals: false },
    tooltip: {
      ...base.tooltip,
      formatter() { return `<b>${this.x}</b><br/><span style="color:${CHART_COLORS[1]}">●</span> ${this.y} tests` },
    },
    legend: { enabled: false },
    plotOptions: {
      column: { borderRadius: 4, borderWidth: 0, color: CHART_COLORS[1], pointPadding: 0.1 },
    },
    series: [{ type: 'column', name: 'Tests taken', data: testActivityData.map(d => d.count), color: CHART_COLORS[1] }],
  }

  // ── Chart: Difficulty donut ────────────────────────────────────────────────
  const difficultyOptions: Highcharts.Options = {
    ...base,
    chart: { ...base.chart, type: 'pie', height: 180, margin: [0, 0, 0, 0] },
    tooltip: {
      ...base.tooltip,
      formatter() { return `<b>${this.point.name}</b>: ${this.y}` },
    },
    plotOptions: {
      pie: {
        innerSize: '55%',
        borderWidth: 0,
        dataLabels: { enabled: false },
        showInLegend: true,
      },
    },
    legend: {
      ...base.legend,
      enabled: true,
      align: 'center',
      verticalAlign: 'bottom',
      itemStyle: { ...base.legend?.itemStyle, fontSize: '11px' },
    },
    series: [{ type: 'pie', name: 'Questions', data: difficultyData }],
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview and key metrics</p>
      </div>

      {/* ── Row 1: KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Users" value={stats.totalUsers}
          icon={Users} colorCls="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
          trend={{ delta: stats.newUsersThisWeek, label: 'new this week' }}
        />
        <KpiCard
          title="Active Today" value={stats.activeUsersToday}
          subtitle={`${stats.activeUsersThisWeek.toLocaleString()} this week`}
          icon={UserCheck} colorCls="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          trend={{ delta: stats.newUsersToday, label: 'new today' }}
        />
        <KpiCard
          title="Tests Taken Today" value={stats.testsToday}
          subtitle={`${stats.totalTestsTaken.toLocaleString()} total`}
          icon={ClipboardCheck} colorCls="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
        />
        <KpiCard
          title="Avg Score" value={stats.avgScoreOverall} suffix="%" decimals={1}
          subtitle="across all completed tests"
          icon={TrendingUp} colorCls="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </div>

      {/* ── Row 2: Growth charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User Signups — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="-mx-2">
            <HighchartsReact highcharts={Highcharts} options={userGrowthOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tests Taken — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="-mx-2">
            <HighchartsReact highcharts={Highcharts} options={testActivityOptions} />
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Top exams + Difficulty donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Top 5 exams */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Exams by Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground w-6">#</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Exam</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Enrolled</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {(stats.topExams ?? []).map((exam: AdminTopExam, i) => (
                  <tr key={exam.examId} className="border-b last:border-0">
                    <td className="py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5 font-medium"><span className="line-clamp-1">{exam.examTitle}</span></td>
                    <td className="py-2.5 text-right">{exam.enrolledCount.toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      {exam.avgScore != null ? (
                        <span className={
                          exam.avgScore >= 70 ? 'text-emerald-600 font-semibold' :
                          exam.avgScore >= 50 ? 'text-amber-600 font-semibold' :
                          'text-rose-600 font-semibold'
                        }>
                          {exam.avgScore}%
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
                {(stats.topExams ?? []).length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No test activity yet</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Difficulty donut */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Question Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            {hasDifficultyData ? (
              <HighchartsReact highcharts={Highcharts} options={difficultyOptions} />
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No questions added yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: AI + content mini stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Messages Today</p>
                <p className="text-2xl font-bold">{stats.aiMessagesToday.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.aiMessagesThisMonth.toLocaleString()} this month</p>
              </div>
              <div className="p-2.5 rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                <Bot className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Users / Month</p>
                <p className="text-2xl font-bold">{stats.newUsersThisMonth.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.newUsersThisWeek} this week</p>
              </div>
              <div className="p-2.5 rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {content && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Exams</p>
                    <p className="text-2xl font-bold">{content.exams.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">{content.exams.active} active · {content.exams.inactive} inactive</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Questions</p>
                    <p className="text-2xl font-bold">{content.questions.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{content.topics} topics · {content.subjects} subjects</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!content && (
          <>
            <Card><CardContent className="pt-6"><Skeleton className="h-16" /></CardContent></Card>
            <Card><CardContent className="pt-6"><Skeleton className="h-16" /></CardContent></Card>
          </>
        )}
      </div>
    </div>
  )
}
