import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, CalendarDays, Printer, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/_dashboard/study-plan')({
  component: StudyPlanPage,
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface Phase {
  phase?: number
  week?: number
  title?: string
  description?: string
  startDay?: number
  endDay?: number
  subjects?: Array<{ name: string; chapters?: string[]; hours?: number; dailyHours?: number }>
  dailySchedule?: Array<{ day: number; subject: string; chapter?: string; hours: number }>
  focus?: string
}

interface StudyPlanData {
  id: string
  plan: {
    phases?: Phase[]
    weeks?: Phase[]
    totalWeeks?: number
    dailyHours?: number
  }
  examDate: string
  hoursPerDay: number
}

// ─── Task checkbox (with localStorage persistence) ────────────────────────────

function TaskCheckbox({
  planId, phaseIdx, taskIdx, label,
}: { planId: string; phaseIdx: number; taskIdx: number; label: string }) {
  const key = `sp-${planId}-${phaseIdx}-${taskIdx}`
  const [checked, setChecked] = useState(() => localStorage.getItem(key) === '1')

  const toggle = () => {
    const next = !checked
    setChecked(next)
    localStorage.setItem(key, next ? '1' : '0')
  }

  return (
    <label className="flex items-start gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        className="mt-0.5 h-4 w-4 rounded border-border accent-primary shrink-0"
      />
      <span className={checked ? 'line-through text-muted-foreground text-sm' : 'text-sm'}>
        {label}
      </span>
    </label>
  )
}

// ─── Phase card ───────────────────────────────────────────────────────────────

function PhaseCard({ phase, idx, planId }: { phase: Phase; idx: number; planId: string }) {
  const label = phase.title || phase.focus || `Week ${phase.week ?? phase.phase ?? idx + 1}`
  const days = phase.endDay && phase.startDay
    ? `Days ${phase.startDay}–${phase.endDay}`
    : null

  const tasks: string[] = []

  // From subjects list
  if (phase.subjects?.length) {
    phase.subjects.forEach(s => {
      if (s.chapters?.length) {
        s.chapters.forEach(ch => tasks.push(`${s.name} — ${ch}`))
      } else {
        const hrs = s.hours ?? s.dailyHours
        tasks.push(`${s.name}${hrs ? ` (${hrs}h)` : ''}`)
      }
    })
  }

  // From dailySchedule
  if (phase.dailySchedule?.length && tasks.length === 0) {
    phase.dailySchedule.forEach(d =>
      tasks.push(`Day ${d.day}: ${d.subject}${d.chapter ? ` — ${d.chapter}` : ''} (${d.hours}h)`)
    )
  }

  // Description as fallback task
  if (tasks.length === 0 && phase.description) {
    tasks.push(phase.description)
  }

  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-semibold">{label}</CardTitle>
          {days && <Badge variant="secondary" className="text-xs">{days}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1.5">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No tasks listed for this phase.</p>
        ) : (
          tasks.map((task, ti) => (
            <TaskCheckbox key={ti} planId={planId} phaseIdx={idx} taskIdx={ti} label={task} />
          ))
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function StudyPlanPage() {
  const { toast } = useToast()

  const [examId, setExamId]   = useState('')
  const [examDate, setExamDate] = useState('')
  const [hours, setHours]     = useState(4)
  const [plan, setPlan]       = useState<StudyPlanData | null>(null)

  // Fetch exams for the selector
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['exams-list'],
    queryFn: () => api.get('/exams?limit=100').then(r => r.data),
    staleTime: 10 * 60 * 1000,
  })
  const exams: any[] = examsData?.data?.data ?? []

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post('/ai/study-plan', { examId, examDate, hoursPerDay: hours }).then(r => r.data),
    onSuccess: (data) => {
      setPlan(data)
      toast({ title: 'Study plan generated!' })
    },
    onError: () => toast({ title: 'Failed to generate plan', variant: 'destructive' }),
  })

  const phases: Phase[] = plan?.plan?.phases ?? plan?.plan?.weeks ?? []

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">AI Study Plan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Get a personalised weekly schedule tailored to your exam date.
          </p>
        </div>
        {plan && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Export PDF
          </Button>
        )}
      </div>

      {/* Config form */}
      <Card className="print:hidden">
        <CardContent className="pt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Exam */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target Exam</label>
              {examsLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select value={examId} onValueChange={setExamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam…" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Hours */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Hours per Day <span className="text-primary font-semibold">{hours}h</span>
              </label>
              <input
                type="range"
                min={1}
                max={12}
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
                className="w-full accent-primary h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1h</span><span>12h</span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!examId || !examDate || generateMutation.isPending}
            className="gap-2 w-full sm:w-auto"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating your plan…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate My Plan</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated plan */}
      {plan && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-3 flex-wrap print:hidden">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                {phases.length} {phases.length === 1 ? 'phase' : 'phases'} •{' '}
                {plan.hoursPerDay}h/day •{' '}
                Exam: {new Date(plan.examDate).toLocaleDateString()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground ml-auto"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>

          {/* Print title (only visible when printing) */}
          <div className="hidden print:block mb-4">
            <h2 className="text-xl font-bold">Study Plan</h2>
            <p className="text-sm text-muted-foreground">
              {plan.hoursPerDay}h/day · Exam: {new Date(plan.examDate).toLocaleDateString()}
            </p>
          </div>

          {/* Phase grid */}
          {phases.length === 0 ? (
            <p className="text-muted-foreground text-sm">No phases found in the generated plan.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2">
              {phases.map((phase, i) => (
                <PhaseCard key={i} phase={phase} idx={i} planId={plan.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
