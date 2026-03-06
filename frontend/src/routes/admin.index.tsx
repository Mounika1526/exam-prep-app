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

const fmtDate = (s: string) => {
  try {
    const [, m, d] = s.split('-').map(Number)
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] + ' ' + d
  } catch { return s }
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  title: string
  value: number
  suffix?: string
  subtitle?: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  trend?: { delta: number; label: string }
  decimals?: number
}

function KpiCard({ title, value, suffix, subtitle, icon: Icon, iconColor, iconBg, trend, decimals = 0 }: KpiProps) {
  return (
    <Card className="glass-card border-0" style={{ borderRadius: 14 }}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium" style={{ color: '#8B8FA8' }}>{title}</p>
            <p className="text-2xl font-bold" style={{ color: '#F2F2F0' }}>
              <CountUp end={value} duration={1.4} separator="," decimals={decimals} suffix={suffix} enableScrollSpy scrollSpyOnce />
            </p>
            {subtitle && <p className="text-xs" style={{ color: '#8B8FA8' }}>{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 pt-0.5">
                {trend.delta > 0 ? (
                  <TrendingUp className="h-3 w-3" style={{ color: '#4ADE80' }} />
                ) : trend.delta < 0 ? (
                  <TrendingDown className="h-3 w-3" style={{ color: '#F87171' }} />
                ) : (
                  <Minus className="h-3 w-3" style={{ color: '#8B8FA8' }} />
                )}
                <span
                  className="text-xs font-medium"
                  style={{ color: trend.delta > 0 ? '#4ADE80' : trend.delta < 0 ? '#F87171' : '#8B8FA8' }}
                >
                  {Math.abs(trend.delta)} {trend.label}
                </span>
              </div>
            )}
          </div>
          <div
            className="p-2.5 rounded-xl"
            style={{ background: iconBg }}
          >
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
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
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!stats) return null

  const base = chartTheme(isDark)

  const userGrowthData   = (stats.userGrowth    ?? []).map((d) => ({ date: fmtDate(d.date), count: d.count }))
  const testActivityData = (stats.testActivity  ?? []).map((d) => ({ date: fmtDate(d.date), count: d.count }))

  const difficultyData = content ? [
    { name: 'Easy',   y: content.questions.byDifficulty['EASY']   ?? 0, color: DIFF_COLORS.EASY   },
    { name: 'Medium', y: content.questions.byDifficulty['MEDIUM'] ?? 0, color: DIFF_COLORS.MEDIUM },
    { name: 'Hard',   y: content.questions.byDifficulty['HARD']   ?? 0, color: DIFF_COLORS.HARD   },
  ] : []

  const hasDifficultyData = difficultyData.some((d) => d.y > 0)

  const userGrowthOptions: Highcharts.Options = {
    ...base,
    chart: { ...base.chart, type: 'spline', height: 220, margin: [10, 10, 30, 40], backgroundColor: 'transparent' },
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

  const testActivityOptions: Highcharts.Options = {
    ...base,
    chart: { ...base.chart, type: 'column', height: 220, margin: [10, 10, 30, 40], backgroundColor: 'transparent' },
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

  const difficultyOptions: Highcharts.Options = {
    ...base,
    chart: { ...base.chart, type: 'pie', height: 180, margin: [0, 0, 0, 0], backgroundColor: 'transparent' },
    tooltip: {
      ...base.tooltip,
      formatter() { return `<b>${(this as any).point.name}</b>: ${this.y}` },
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
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F2F2F0', letterSpacing: '-0.025em' }}
        >
          Admin Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8B8FA8' }}>Platform overview and key metrics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Users" value={stats.totalUsers}
          icon={Users}
          iconColor="#C084FC" iconBg="rgba(192,132,252,0.12)"
          trend={{ delta: stats.newUsersThisWeek, label: 'new this week' }}
        />
        <KpiCard
          title="Active Today" value={stats.activeUsersToday}
          subtitle={`${stats.activeUsersThisWeek.toLocaleString()} this week`}
          icon={UserCheck}
          iconColor="#4ADE80" iconBg="rgba(74,222,128,0.12)"
          trend={{ delta: stats.newUsersToday, label: 'new today' }}
        />
        <KpiCard
          title="Tests Taken Today" value={stats.testsToday}
          subtitle={`${stats.totalTestsTaken.toLocaleString()} total`}
          icon={ClipboardCheck}
          iconColor="#00E5CC" iconBg="rgba(0,229,204,0.12)"
        />
        <KpiCard
          title="Avg Score" value={stats.avgScoreOverall} suffix="%" decimals={1}
          subtitle="across all completed tests"
          icon={TrendingUp}
          iconColor="#F5A623" iconBg="rgba(245,166,35,0.12)"
        />
      </div>

      {/* Growth charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-0" style={{ borderRadius: 16 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ color: '#F2F2F0' }}>User Signups — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="-mx-2">
            <HighchartsReact highcharts={Highcharts} options={userGrowthOptions} />
          </CardContent>
        </Card>

        <Card className="glass-card border-0" style={{ borderRadius: 16 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ color: '#F2F2F0' }}>Tests Taken — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="-mx-2">
            <HighchartsReact highcharts={Highcharts} options={testActivityOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Top exams + Difficulty donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="glass-card border-0 lg:col-span-3" style={{ borderRadius: 16 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ color: '#F2F2F0' }}>Top Exams by Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th className="text-left py-2 font-medium w-6" style={{ color: '#8B8FA8' }}>#</th>
                  <th className="text-left py-2 font-medium" style={{ color: '#8B8FA8' }}>Exam</th>
                  <th className="text-right py-2 font-medium" style={{ color: '#8B8FA8' }}>Enrolled</th>
                  <th className="text-right py-2 font-medium" style={{ color: '#8B8FA8' }}>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {(stats.topExams ?? []).map((exam: AdminTopExam, i) => (
                  <tr key={exam.examId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="py-2.5" style={{ color: '#8B8FA8' }}>{i + 1}</td>
                    <td className="py-2.5 font-medium" style={{ color: '#F2F2F0' }}>
                      <span className="line-clamp-1">{exam.examTitle}</span>
                    </td>
                    <td className="py-2.5 text-right" style={{ color: '#8B8FA8' }}>
                      {exam.enrolledCount.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">
                      {exam.avgScore != null ? (
                        <span
                          className="font-semibold"
                          style={{
                            color: exam.avgScore >= 70 ? '#4ADE80' : exam.avgScore >= 50 ? '#F5A623' : '#F87171',
                          }}
                        >
                          {exam.avgScore}%
                        </span>
                      ) : <span style={{ color: '#8B8FA8' }}>—</span>}
                    </td>
                  </tr>
                ))}
                {(stats.topExams ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm" style={{ color: '#8B8FA8' }}>
                      No test activity yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 lg:col-span-2" style={{ borderRadius: 16 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ color: '#F2F2F0' }}>Question Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            {hasDifficultyData ? (
              <HighchartsReact highcharts={Highcharts} options={difficultyOptions} />
            ) : (
              <div className="h-48 flex items-center justify-center text-sm" style={{ color: '#8B8FA8' }}>
                No questions added yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI + content mini stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-0" style={{ borderRadius: 14 }}>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: '#8B8FA8' }}>AI Messages Today</p>
                <p className="text-2xl font-bold" style={{ color: '#F2F2F0' }}>
                  {stats.aiMessagesToday.toLocaleString()}
                </p>
                <p className="text-xs mt-1" style={{ color: '#8B8FA8' }}>
                  {stats.aiMessagesThisMonth.toLocaleString()} this month
                </p>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,229,204,0.12)' }}>
                <Bot className="h-5 w-5" style={{ color: '#00E5CC' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0" style={{ borderRadius: 14 }}>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: '#8B8FA8' }}>New Users / Month</p>
                <p className="text-2xl font-bold" style={{ color: '#F2F2F0' }}>
                  {stats.newUsersThisMonth.toLocaleString()}
                </p>
                <p className="text-xs mt-1" style={{ color: '#8B8FA8' }}>{stats.newUsersThisWeek} this week</p>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,229,204,0.12)' }}>
                <TrendingUp className="h-5 w-5" style={{ color: '#00E5CC' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {content ? (
          <>
            <Card className="glass-card border-0" style={{ borderRadius: 14 }}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#8B8FA8' }}>Total Exams</p>
                    <p className="text-2xl font-bold" style={{ color: '#F2F2F0' }}>{content.exams.total}</p>
                    <p className="text-xs mt-1" style={{ color: '#8B8FA8' }}>
                      {content.exams.active} active · {content.exams.inactive} inactive
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(192,132,252,0.12)' }}>
                    <BookOpen className="h-5 w-5" style={{ color: '#C084FC' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0" style={{ borderRadius: 14 }}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#8B8FA8' }}>Total Questions</p>
                    <p className="text-2xl font-bold" style={{ color: '#F2F2F0' }}>
                      {content.questions.total.toLocaleString()}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#8B8FA8' }}>
                      {content.topics} topics · {content.subjects} subjects
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(248,113,113,0.12)' }}>
                    <HelpCircle className="h-5 w-5" style={{ color: '#F87171' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        )}
      </div>
    </div>
  )
}
