import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { TopicViewer } from '@/components/study/TopicViewer'
import { ReadingProgressBar } from '@/components/study/ReadingProgressBar'
import { AiChatPanel } from '@/components/ai/AiChatPanel'
import { AiQuestionGenerator } from '@/components/ai/AiQuestionGenerator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Clock,
  CheckCircle2, AlertCircle, Circle, Save,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_dashboard/study/$topicId')({
  component: StudyPage,
})

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started', icon: Circle,       color: 'text-muted-foreground' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: AlertCircle,  color: 'text-yellow-500' },
  { value: 'COMPLETED',   label: 'Done',        icon: CheckCircle2, color: 'text-green-500' },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

function StudyPage() {
  const { topicId } = Route.useParams()
  const { toast }   = useToast()
  const qc          = useQueryClient()

  const [tab, setTab] = useState<string>('content')

  // Notes state with debounce
  const [notes, setNotes]   = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimer           = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedNotes      = useRef('')

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: topic, isLoading } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => api.get(`/topics/${topicId}`).then(r => r.data.data ?? r.data),
  })

  // Sync notes from API data on load
  useEffect(() => {
    const serverNotes = topic?.userProgress?.notes ?? ''
    setNotes(serverNotes)
    lastSavedNotes.current = serverNotes
  }, [topic?.userProgress?.notes])

  // ── Mutations ─────────────────────────────────────────────────────────────
  const currentStatus = topic?.userProgress?.status ?? 'NOT_STARTED'

  const progressMutation = useMutation({
    mutationFn: (data: { status: string; notes?: string }) =>
      api.put(`/progress/topic/${topicId}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topic', topicId] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['exam-progress'] })
    },
    onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
  })

  // Debounced notes auto-save
  const handleNotesChange = (value: string) => {
    setNotes(value)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (value === lastSavedNotes.current) return
      setSaving(true)
      progressMutation.mutate(
        { status: currentStatus, notes: value },
        {
          onSuccess: () => {
            lastSavedNotes.current = value
            setSaving(false)
          },
          onError: () => setSaving(false),
        }
      )
    }, 1500)
  }

  const handleStatusChange = (status: string) => {
    progressMutation.mutate({ status, notes })
    toast({ title: `Marked as ${status.replace('_', ' ').toLowerCase()}` })
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const status = topic?.userProgress?.status ?? 'NOT_STARTED'

  return (
    <div className="space-y-4 pb-20">

      {/* ── Topic Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 flex-wrap">
            <span>{topic?.chapter?.subject?.exam?.title}</span>
            <span>›</span>
            <span>{topic?.chapter?.subject?.title}</span>
            <span>›</span>
            <span>{topic?.chapter?.title}</span>
          </div>
          <h1 className="text-2xl font-bold">{topic?.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {topic?.estimatedMins && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {topic.estimatedMins} min
              </div>
            )}
            <Badge variant={
              status === 'COMPLETED'   ? 'default' :
              status === 'IN_PROGRESS' ? 'secondary' : 'outline'
            }>
              {status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Status updater */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map(opt => {
            const Icon    = opt.icon
            const active  = status === opt.value
            return (
              <Button
                key={opt.value}
                size="sm"
                variant={active ? 'default' : 'outline'}
                disabled={progressMutation.isPending}
                onClick={() => !active && handleStatusChange(opt.value)}
                className={cn('gap-1.5', active && 'pointer-events-none')}
              >
                <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary-foreground' : opt.color)} />
                {opt.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="notes">
            Notes
            {notes && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary inline-block" />}
          </TabsTrigger>
        </TabsList>

        {/* Content */}
        <TabsContent value="content" className="mt-4">
          {tab === 'content' && <ReadingProgressBar />}
          <TopicViewer topic={topic} />

          <AiQuestionGenerator topicId={topicId} />
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Personal notes for <span className="text-foreground">{topic?.title}</span>
              </p>
              <div className={cn(
                'flex items-center gap-1.5 text-xs transition-opacity',
                saving ? 'opacity-100 text-muted-foreground' : 'opacity-0'
              )}>
                <Save className="h-3 w-3 animate-pulse" />
                Saving…
              </div>
            </div>
            <Textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Write your notes here… They auto-save as you type."
              className="min-h-[300px] resize-y font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Notes are auto-saved 1.5 seconds after you stop typing.
            </p>
          </div>
        </TabsContent>

      </Tabs>

      <AiChatPanel topicId={topicId} topicTitle={topic?.title} />
    </div>
  )
}
