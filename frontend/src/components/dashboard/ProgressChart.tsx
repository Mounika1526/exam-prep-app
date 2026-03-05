import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { useTheme } from '@/contexts/ThemeContext'
import { chartTheme, CHART_COLORS } from '@/lib/highchartsTheme'
import type { StudySession } from '@/types'

interface Props {
  data: StudySession[]
  isLoading?: boolean
}

export function ProgressChart({ data, isLoading = false }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const chartData = data.slice(0, 7).reverse()
  const categories = chartData.map(s =>
    new Date(s.date).toLocaleDateString('en', { weekday: 'short' })
  )
  const values = chartData.map(s => s.durationMins)

  const base = chartTheme(isDark)

  const options: Highcharts.Options = {
    ...base,
    chart: {
      ...base.chart,
      type: 'column',
      height: 220,
      margin: [10, 10, 30, 44],
    },
    colors: CHART_COLORS,
    xAxis: {
      ...base.xAxis,
      categories,
    },
    yAxis: {
      ...base.yAxis,
      labels: {
        ...(base.yAxis as Highcharts.YAxisOptions)?.labels,
        formatter() { return `${this.value}m` },
      },
    },
    tooltip: {
      ...base.tooltip,
      formatter() {
        return `<b>${this.x}</b><br/><span style="color:${CHART_COLORS[0]}">●</span> ${this.y} minutes`
      },
    },
    legend: { enabled: false },
    plotOptions: {
      column: {
        borderRadius: 5,
        borderWidth: 0,
        color: CHART_COLORS[0],
      },
    },
    series: [{
      type: 'column',
      name: 'Minutes studied',
      data: values,
    }],
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Study Activity (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <div className="flex items-end gap-2 h-[220px] px-6">
                {[60, 85, 40, 100, 55, 75, 45].map((h, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="flex gap-2 px-6">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 h-3 rounded" />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  No study sessions yet. Start studying to see your progress!
                </div>
              ) : (
                <HighchartsReact highcharts={Highcharts} options={options} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
