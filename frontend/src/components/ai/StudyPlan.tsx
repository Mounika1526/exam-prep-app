import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Calendar, Sparkles, Target, Lightbulb } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { AiStudyPlan, StudyPlanData } from '@/types'

export function StudyPlan() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [examId, setExamId] = useState('')
  const [examDate, setExamDate] = useState((user as any)?.examDate?.split('T')[0] || '')
  const [hoursPerDay, setHoursPerDay] = useState(String((user as any)?.hoursPerDay || 4))

  const { data: examsData } = useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get('/exams?limit=50').then(r => r.data),
  })
  const exams = examsData?.data || []

  const { data: existingPlan, isLoading: planLoading } = useQuery<AiStudyPlan>({
    queryKey: ['study-plan', examId],
    queryFn: () => api.post('/ai/study-plan', {
      examId,
      examDate: examDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      hoursPerDay: parseFloat(hoursPerDay),
    }).then(r => r.data),
    enabled: false,
  })

  const generateMutation = useMutation({
    mutationFn: () => api.post('/ai/study-plan', {
      examId,
      examDate: examDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      hoursPerDay: parseFloat(hoursPerDay),
    }).then(r => r.data),
    onError: () => toast({ title: 'Failed to generate plan', variant: 'destructive' }),
  })

  const plan = generateMutation.data?.plan as StudyPlanData | undefined

  return (
    <div className="space-y-6">
      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Generate Study Plan
          </CardTitle>
          <CardDescription>AI will create a personalized plan based on your exam date and availability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Target Exam</Label>
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exam Date</Label>
              <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hours/Day</Label>
              <Select value={hoursPerDay} onValueChange={setHoursPerDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['1', '2', '3', '4', '5', '6', '8'].map(h => (
                    <SelectItem key={h} value={h}>{h} hours</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            disabled={!examId || generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            {generateMutation.isPending
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Plan
          </Button>
        </CardContent>
      </Card>

      {/* Plan Display */}
      {generateMutation.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
          <Skeleton className="h-36" />
        </div>
      )}

      {plan && (
        <div className="space-y-4">
          {/* Overview */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <p className="text-sm">{plan.overview}</p>
              <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                <span>📅 {plan.totalDays} days</span>
                <span>⏰ {plan.hoursPerDay} hrs/day</span>
              </div>
            </CardContent>
          </Card>

          {/* Phases */}
          {plan.phases?.map((phase, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {phase.name}
                  </CardTitle>
                  <Badge variant="outline">Day {phase.startDay}–{phase.endDay}</Badge>
                </div>
                <CardDescription>{phase.goal}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phase.subjects?.map((subj, j) => (
                    <div key={j} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{subj.name}</p>
                        <Badge variant="secondary">{subj.dailyHours}h/day</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {subj.chapters?.map((ch, k) => (
                          <Badge key={k} variant="outline" className="text-xs">{ch}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Tips */}
          {plan.tips?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
