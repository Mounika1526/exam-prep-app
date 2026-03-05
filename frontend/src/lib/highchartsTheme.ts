/**
 * Returns Highcharts base options tuned to the current light/dark theme.
 * Import this in every chart component and spread into the options object.
 */
export function chartTheme(isDark: boolean): Highcharts.Options {
  const text   = isDark ? '#94a3b8' : '#64748b'   // muted-foreground
  const grid   = isDark ? '#1e293b' : '#f1f5f9'   // subtle grid lines
  const bg     = isDark ? '#1e293b' : '#ffffff'    // tooltip bg
  const border = isDark ? '#334155' : '#e2e8f0'    // tooltip border
  const label  = isDark ? '#f1f5f9' : '#0f172a'   // tooltip text

  return {
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: 'inherit' },
      animation: { duration: 600 },
    },
    title:    { text: undefined as unknown as string },
    subtitle: { text: undefined as unknown as string },
    credits:  { enabled: false },
    legend:   {
      itemStyle: { color: text, fontWeight: '500', fontSize: '12px' },
      itemHoverStyle: { color: label },
    },
    xAxis: {
      labels:    { style: { color: text, fontSize: '12px' } },
      lineColor:  border,
      tickColor:  'transparent',
      gridLineColor: 'transparent',
    },
    yAxis: {
      title:         { text: undefined as unknown as string },
      labels:        { style: { color: text, fontSize: '12px' } },
      gridLineColor:  grid,
      gridLineDashStyle: 'Dash' as Highcharts.DashStyleValue,
    },
    tooltip: {
      backgroundColor: bg,
      borderColor:     border,
      borderRadius:    8,
      shadow:          false,
      style: { color: label, fontSize: '12px' },
    },
  }
}

/** Shared colour palette — violet-first, not blue */
export const CHART_COLORS = [
  '#8b5cf6', // violet   (primary series)
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f43f5e', // rose
  '#a78bfa', // violet-light
]

/** Semantic difficulty colours */
export const DIFF_COLORS = {
  EASY:   '#10b981',  // emerald
  MEDIUM: '#f59e0b',  // amber
  HARD:   '#f43f5e',  // rose
}
