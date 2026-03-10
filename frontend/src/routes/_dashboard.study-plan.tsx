import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, Loader2, CalendarDays, Printer, RotateCcw, BookMarked, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/_dashboard/study-plan')({
  component: StudyPlanPage,
})

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

interface PlanReference {
  title: string
  type: string
  url?: string
}

interface StudyPlanData {
  id: string
  plan: {
    phases?: Phase[]
    weeks?: Phase[]
    totalWeeks?: number
    dailyHours?: number
    tips?: string[]
    references?: PlanReference[]
  }
  examDate: string
  hoursPerDay: number
}

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
        className="mt-0.5 h-4 w-4 rounded shrink-0"
        style={{ accentColor: '#00E5CC' }}
      />
      <span
        className="text-sm"
        style={{
          color: checked ? '#8B8FA8' : '#F2F2F0',
          textDecoration: checked ? 'line-through' : 'none',
        }}
      >
        {label}
      </span>
    </label>
  )
}

function PhaseCard({ phase, idx, planId }: { phase: Phase; idx: number; planId: string }) {
  const label = phase.title || phase.focus || `Week ${phase.week ?? phase.phase ?? idx + 1}`
  const days = phase.endDay && phase.startDay
    ? `Days ${phase.startDay}–${phase.endDay}`
    : null

  const tasks: string[] = []

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

  if (phase.dailySchedule?.length && tasks.length === 0) {
    phase.dailySchedule.forEach(d =>
      tasks.push(`Day ${d.day}: ${d.subject}${d.chapter ? ` — ${d.chapter}` : ''} (${d.hours}h)`)
    )
  }

  if (tasks.length === 0 && phase.description) {
    tasks.push(phase.description)
  }

  return (
    <Card className="glass-card border-0 break-inside-avoid" style={{ borderRadius: 12 }}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-semibold" style={{ color: '#F2F2F0' }}>{label}</CardTitle>
          {days && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: 'rgba(0,229,204,0.12)',
                color: '#00E5CC',
                border: '1px solid rgba(0,229,204,0.25)',
              }}
            >
              {days}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1.5">
        {tasks.length === 0 ? (
          <p className="text-xs italic" style={{ color: '#8B8FA8' }}>No tasks listed for this phase.</p>
        ) : (
          tasks.map((task, ti) => (
            <TaskCheckbox key={ti} planId={planId} phaseIdx={idx} taskIdx={ti} label={task} />
          ))
        )}
      </CardContent>
    </Card>
  )
}

function StudyPlanPage() {
  const { toast } = useToast()

  const [examId, setExamId]   = useState('')
  const [examDate, setExamDate] = useState('')
  const [hours, setHours]     = useState(4)
  const [plan, setPlan]       = useState<StudyPlanData | null>(null)

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
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#F2F2F0',
              letterSpacing: '-0.025em',
            }}
          >
            AI Study Plan
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8B8FA8' }}>
            Get a personalized weekly schedule tailored to your exam date.
          </p>
        </div>
        {plan && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 print:hidden"
            onClick={() => window.print()}
            style={{
              borderColor: 'rgba(255,255,255,0.12)',
              color: '#8B8FA8',
              background: 'transparent',
            }}
          >
            <Printer className="h-4 w-4" />
            Export PDF
          </Button>
        )}
      </div>

      {/* Config form */}
      <Card className="glass-card border-0 print:hidden" style={{ borderRadius: 16 }}>
        <CardContent className="pt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Exam */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#F2F2F0' }}>Target Exam</label>
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
              <label className="text-sm font-medium" style={{ color: '#F2F2F0' }}>Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex h-9 w-full rounded-md px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#F2F2F0',
                }}
              />
            </div>

            {/* Hours */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#F2F2F0' }}>Hours per Day</label>
              <Select value={String(hours)} onValueChange={v => setHours(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5", "6", "7", "8", "10", "12"].map(h => (
                    <SelectItem key={h} value={h}>
                      {h} {h === "1" ? "hour" : "hours"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!examId || !examDate || generateMutation.isPending}
            className="gap-2 w-full sm:w-auto ep-shimmer-btn ds-btn-shimmer"
            style={
              !examId || !examDate
                ? { background: 'rgba(255,255,255,0.06)', color: '#8B8FA8', border: 'none' }
                : { background: 'linear-gradient(135deg, #00E5CC, #00B8A5)', color: '#0D0F1A', border: 'none', fontWeight: 700 }
            }
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
          <div className="flex items-center gap-3 flex-wrap print:hidden">
            <div className="flex items-center gap-2 text-sm" style={{ color: '#8B8FA8' }}>
              <CalendarDays className="h-4 w-4" style={{ color: '#00E5CC' }} />
              <span>
                {phases.length} {phases.length === 1 ? 'phase' : 'phases'} ·{' '}
                {plan.hoursPerDay}h/day ·{' '}
                Exam: {new Date(plan.examDate).toLocaleDateString()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 ml-auto"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              style={{ color: '#8B8FA8' }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>

          <div className="hidden print:block mb-4">
            <h2 className="text-xl font-bold">Study Plan</h2>
            <p className="text-sm">
              {plan.hoursPerDay}h/day · Exam: {new Date(plan.examDate).toLocaleDateString()}
            </p>
          </div>

          {phases.length === 0 ? (
            <p className="text-sm" style={{ color: '#8B8FA8' }}>No phases found in the generated plan.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2">
              {phases.map((phase, i) => (
                <PhaseCard key={i} phase={phase} idx={i} planId={plan.id} />
              ))}
            </div>
          )}

          {/* References */}
          {plan.plan.references && plan.plan.references.length > 0 && (
            <Card className="glass-card border-0" style={{ borderRadius: 12 }}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F2F2F0' }}>
                  <BookMarked className="h-4 w-4" style={{ color: '#A78BFA' }} />
                  Recommended Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {plan.plan.references.map((ref, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{
                        background: ref.type === 'book' ? 'rgba(167,139,250,0.15)' :
                                    ref.type === 'video' ? 'rgba(248,113,113,0.15)' :
                                    ref.type === 'website' ? 'rgba(0,229,204,0.12)' :
                                    'rgba(245,166,35,0.15)',
                        color: ref.type === 'book' ? '#A78BFA' :
                               ref.type === 'video' ? '#F87171' :
                               ref.type === 'website' ? '#00E5CC' :
                               '#F5A623',
                      }}
                    >
                      {ref.type}
                    </span>
                    {ref.url ? (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-flex items-center gap-1"
                        style={{ color: '#00E5CC' }}
                      >
                        {ref.title}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span style={{ color: '#8B8FA8' }}>{ref.title}</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
