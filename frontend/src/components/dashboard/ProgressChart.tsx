import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { useTheme } from '@/contexts/ThemeContext'
import { chartTheme, CHART_COLORS } from '@/lib/highchartsTheme'
import { BarChart3 } from 'lucide-react'
import type { StudySession } from '@/types'

interface Props {
  data: StudySession[]
  isLoading?: boolean
}

export function ProgressChart({ data, isLoading = false }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const chartData   = data.slice(0, 7).reverse()
  const categories  = chartData.map(s =>
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
      // Transparent bg — card provides it
      backgroundColor: 'transparent',
    },
    colors: CHART_COLORS,
    xAxis: { ...base.xAxis, categories },
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
        borderRadius: 6,
        borderWidth: 0,
        // Gradient fill via color stops
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, '#00E5CC'],
            [1, 'rgba(0,184,165,0.4)'],
          ],
        } as any,
        states: {
          hover: {
            color: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                [0, '#00FFE0'],
                [1, '#00B8A5'],
              ],
            } as any,
          },
        },
      },
    },
    series: [{
      type: 'column',
      name: 'Minutes studied',
      data: values,
    }],
  }

  return (
    <Card className="glass-card border-0 h-full" style={{ borderRadius: 16 }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F2F2F0' }}>
          <BarChart3
            className="h-4.5 w-4.5"
            style={{ width: 18, height: 18, color: '#00E5CC', filter: 'drop-shadow(0 0 4px rgba(0,229,204,0.5))' }}
          />
          Study Activity — Last 7 Days
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <div className="flex items-end gap-2 h-[220px] px-6">
                {[60, 85, 40, 100, 55, 75, 45].map((h, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#8B8FA8' }}>
                  No study sessions yet — start studying to see your chart!
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
