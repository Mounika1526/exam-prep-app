import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState, useEffect } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, BookOpen, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

// ─── Route params (examId pre-fills when coming from exam detail) ─────────────

const searchSchema = z.object({ examId: z.string().optional() })

export const Route = createFileRoute('/_dashboard/test/setup')({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  component: TestSetupPage,
})

// ─── Options ─────────────────────────────────────────────────────────────────

const COUNT_OPTIONS  = ['10', '20', '30', '50'] as const
const DIFF_OPTIONS   = [
  { value: 'ANY',    label: 'Any difficulty' },
  { value: 'EASY',   label: 'Easy only'      },
  { value: 'MEDIUM', label: 'Medium only'    },
  { value: 'HARD',   label: 'Hard only'      },
]
const LIMIT_OPTIONS  = [
  { value: 'NONE', label: 'No time limit' },
  { value: '10',   label: '10 minutes'    },
  { value: '20',   label: '20 minutes'    },
  { value: '30',   label: '30 minutes'    },
  { value: '45',   label: '45 minutes'    },
  { value: '60',   label: '60 minutes'    },
  { value: '90',   label: '90 minutes'    },
]

// ─── Component ────────────────────────────────────────────────────────────────

function TestSetupPage() {
  const navigate      = useNavigate()
  const { toast }     = useToast()
  const search        = Route.useSearch()
  const presetExamId  = (search as any)?.examId ?? ''

  const [examId,        setExamId]        = useState(presetExamId)
  const [subjectIds,    setSubjectIds]     = useState<string[]>([])
  const [difficulty,    setDifficulty]     = useState('ANY')
  const [count,         setCount]          = useState('20')
  const [timeLimitMins, setTimeLimitMins]  = useState('NONE')

  // ── Exams list ────────────────────────────────────────────────────────────
  const { data: examsData } = useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get('/exams?limit=100').then(r => r.data),
    staleTime: 10 * 60 * 1000,
  })
  const exams: any[] = examsData?.data?.data ?? []

  // ── Subjects for selected exam ────────────────────────────────────────────
  const { data: examDetail, isLoading: loadingSubjects } = useQuery({
    queryKey: ['exam-subjects', examId],
    queryFn: () => api.get(`/exams/${examId}/subjects`).then(r => r.data.data ?? r.data),
    enabled: !!examId,
    staleTime: 5 * 60 * 1000,
  })
  const subjects: any[] = examDetail?.subjects ?? []

  // Reset subject selection when exam changes
  useEffect(() => { setSubjectIds([]) }, [examId])

  const toggleSubject = (id: string) => {
    setSubjectIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  // ── Start mutation ────────────────────────────────────────────────────────
  const startMutation = useMutation({
    mutationFn: () =>
      api.post('/tests/create', {
        examId,
        subjectIds:    subjectIds.length ? subjectIds : undefined,
        difficulty:    difficulty !== 'ANY' ? difficulty : undefined,
        questionCount: parseInt(count),
        timeLimitMins: timeLimitMins !== 'NONE' ? parseInt(timeLimitMins) : undefined,
      }).then(r => r.data),
    onSuccess: data => {
      navigate({
        to: '/test/$sessionId',
        params: { sessionId: data.data.sessionId },
      })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Could not start test'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    },
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/test">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Practice Test</h1>
          <p className="text-muted-foreground text-sm">Configure your session</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Settings</CardTitle>
          <CardDescription>Select exam, topics, and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Exam */}
          <div className="space-y-2">
            <Label>Exam <span className="text-destructive">*</span></Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an exam…" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subjects filter */}
          {examId && (
            <div className="space-y-2">
              <Label>
                Subjects
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                  (leave blank = all subjects)
                </span>
              </Label>
              {loadingSubjects ? (
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 w-24 rounded-full bg-muted animate-pulse" />
                  ))}
                </div>
              ) : subjects.length ? (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors',
                        subjectIds.includes(s.id)
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border hover:bg-accent text-muted-foreground'
                      )}
                    >
                      {s.icon && <span>{s.icon}</span>}
                      {s.title}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No subjects found for this exam.</p>
              )}
              {subjectIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {subjectIds.length} subject{subjectIds.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {/* Questions + Difficulty row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Questions</Label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNT_OPTIONS.map(n => (
                    <SelectItem key={n} value={n}>{n} questions</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue placeholder="Any difficulty" /></SelectTrigger>
                <SelectContent>
                  {DIFF_OPTIONS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time limit */}
          <div className="space-y-2">
            <Label>Time Limit</Label>
            <Select value={timeLimitMins} onValueChange={setTimeLimitMins}>
              <SelectTrigger><SelectValue placeholder="No time limit" /></SelectTrigger>
              <SelectContent>
                {LIMIT_OPTIONS.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="rounded-lg border bg-muted/40 px-4 py-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {count} questions
            </span>
            {difficulty !== 'ANY' && <Badge variant="outline">{difficulty}</Badge>}
            {timeLimitMins !== 'NONE' && <span>⏱ {timeLimitMins} min</span>}
            {subjectIds.length > 0 && (
              <span>{subjectIds.length} subject{subjectIds.length > 1 ? 's' : ''}</span>
            )}
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!examId || startMutation.isPending}
            onClick={() => startMutation.mutate()}
          >
            {startMutation.isPending
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <Play className="h-4 w-4 mr-2" />
            }
            Start Test
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
