import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GraduationCap, ChevronRight } from 'lucide-react'
import type { EnrolledExam } from '@/types'

// ─── SVG circular progress ring ──────────────────────────────────────────────

function ProgressRing({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        strokeWidth={5}
        className="stroke-muted"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        strokeWidth={5}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="stroke-primary transition-all duration-700"
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-[10px] font-semibold"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
        style={{ fontSize: 10 }}
      >
        {pct}%
      </text>
    </svg>
  )
}

// ─── Exam card ────────────────────────────────────────────────────────────────

function ExamCard({ exam }: { exam: EnrolledExam }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      <ProgressRing pct={exam.progressPct} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{exam.examTitle}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {exam.topicsCompleted} / {exam.totalTopics} topics completed
        </p>
        <p className="text-xs text-muted-foreground capitalize">{exam.examCategory}</p>
      </div>
      <Button asChild size="sm" variant="outline" className="shrink-0">
        <Link to="/exams/$examId" params={{ examId: exam.examId }}>
          Continue
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Link>
      </Button>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function EnrolledExamsSection() {
  const { data: exams, isLoading } = useQuery<EnrolledExam[]>({
    queryKey: ['enrolled-exams'],
    queryFn: () => api.get('/users/enrolled-exams').then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          My Exams
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : !exams || exams.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              No exam progress yet.
            </p>
            <Button asChild size="sm" variant="outline">
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
