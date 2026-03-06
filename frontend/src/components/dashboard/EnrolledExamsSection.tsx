import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GraduationCap, ChevronRight } from 'lucide-react'
import type { EnrolledExam } from '@/types'

// ─── SVG circular progress ring ───────────────────────────────────────────────

function ProgressRing({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5}
        stroke="rgba(255,255,255,0.08)" />
      {/* Fill — teal gradient via linearGradient */}
      <defs>
        <linearGradient id={`ring-grad-${pct}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B8A5" />
          <stop offset="100%" stopColor="#00E5CC" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5}
        stroke={`url(#ring-grad-${pct})`}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease', filter: 'drop-shadow(0 0 4px rgba(0,229,204,0.4))' }}
      />
      {/* Percentage label (un-rotate) */}
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
        style={{ fontSize: 11, fontWeight: 700, fill: '#00E5CC' }}
      >
        {pct}%
      </text>
    </svg>
  )
}

// ─── Single exam row ───────────────────────────────────────────────────────────

function ExamCard({ exam }: { exam: EnrolledExam }) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.background = 'rgba(0,229,204,0.06)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,204,0.15)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'
      }}
    >
      <ProgressRing pct={exam.progressPct} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate" style={{ color: '#F2F2F0', fontSize: '14px' }}>
          {exam.examTitle}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8B8FA8' }}>
          {exam.topicsCompleted} / {exam.totalTopics} topics completed
        </p>
        <p className="text-xs capitalize" style={{ color: '#8B8FA8' }}>{exam.examCategory}</p>
      </div>
      <Button
        asChild size="sm" variant="outline"
        className="shrink-0 ds-btn-shimmer"
        style={{
          borderColor: 'rgba(0,229,204,0.3)',
          color: '#00E5CC',
          background: 'transparent',
          fontSize: '12px',
          height: 32,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        <Link to="/exams/$examId" params={{ examId: exam.examId }}>
          Continue
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Link>
      </Button>
    </div>
  )
}

// ─── Section ───────────────────────────────────────────────────────────────────

export function EnrolledExamsSection() {
  const { data: exams, isLoading } = useQuery<EnrolledExam[]>({
    queryKey: ['enrolled-exams'],
    queryFn: () => api.get('/users/enrolled-exams').then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  })

  return (
    <Card className="glass-card border-0 h-full" style={{ borderRadius: 16 }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F2F2F0' }}>
          <GraduationCap
            className="h-4.5 w-4.5"
            style={{ width: 18, height: 18, color: '#00E5CC', filter: 'drop-shadow(0 0 4px rgba(0,229,204,0.5))' }}
          />
          My Exams
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : !exams || exams.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="h-10 w-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm mb-4" style={{ color: '#8B8FA8' }}>
              No exam progress yet.
            </p>
            <Button
              asChild size="sm" variant="outline"
              style={{ borderColor: 'rgba(0,229,204,0.3)', color: '#00E5CC', background: 'transparent' }}
            >
              <Link to="/exams">Browse Exams</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <ExamCard key={exam.examId} exam={exam} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
