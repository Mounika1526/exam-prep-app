import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { TopicViewer } from '@/components/study/TopicViewer'
import { ReadingProgressBar } from '@/components/study/ReadingProgressBar'
import { AiChatPanel } from '@/components/ai/AiChatPanel'
import { AiQuestionGenerator } from '@/components/ai/AiQuestionGenerator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Clock, CheckCircle2, AlertCircle, Circle, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect, useRef } from 'react'
import { formatDuration } from '@/lib/utils'

export const Route = createFileRoute('/_dashboard/study/$topicId')({
  component: StudyPage,
})

const STATUS_OPTIONS = [
  {
    value: 'NOT_STARTED',
    label: 'Not Started',
    icon: Circle,
    style: { background: 'rgba(255,255,255,0.05)', color: '#8B8FA8', border: '1px solid rgba(255,255,255,0.1)' },
    activeStyle: { background: 'rgba(139,143,168,0.2)', color: '#8B8FA8', border: '1px solid rgba(139,143,168,0.4)' },
  },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    icon: AlertCircle,
    style: { background: 'rgba(245,166,35,0.08)', color: '#8B8FA8', border: '1px solid rgba(255,255,255,0.1)' },
    activeStyle: { background: 'rgba(245,166,35,0.15)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.4)' },
  },
  {
    value: 'COMPLETED',
    label: 'Done',
    icon: CheckCircle2,
    style: { background: 'rgba(74,222,128,0.08)', color: '#8B8FA8', border: '1px solid rgba(255,255,255,0.1)' },
    activeStyle: { background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.4)' },
  },
] as const

function StudyPage() {
  const { topicId } = Route.useParams()
  const { toast }   = useToast()
  const qc          = useQueryClient()

  const [tab, setTab] = useState<string>('content')
  const [notes, setNotes]   = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimer           = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedNotes      = useRef('')

  const { data: topic, isLoading } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => api.get(`/topics/${topicId}`).then(r => r.data.data ?? r.data),
  })

  useEffect(() => {
    const serverNotes = topic?.userProgress?.notes ?? ''
    setNotes(serverNotes)
    lastSavedNotes.current = serverNotes
  }, [topic?.userProgress?.notes])

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

  const handleNotesChange = (value: string) => {
    setNotes(value)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (value === lastSavedNotes.current) return
      setSaving(true)
      progressMutation.mutate(
        { status: currentStatus, notes: value },
        {
          onSuccess: () => { lastSavedNotes.current = value; setSaving(false) },
          onError: () => setSaving(false),
        }
      )
    }, 1500)
  }

  const handleStatusChange = (status: string) => {
    progressMutation.mutate({ status, notes })
    toast({ title: `Marked as ${status.replace('_', ' ').toLowerCase()}` })
  }

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
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs mb-1 flex-wrap" style={{ color: '#8B8FA8' }}>
            <span>{topic?.chapter?.subject?.exam?.title}</span>
            <span style={{ color: 'rgba(0,229,204,0.5)' }}>›</span>
            <span>{topic?.chapter?.subject?.title}</span>
            <span style={{ color: 'rgba(0,229,204,0.5)' }}>›</span>
            <span>{topic?.chapter?.title}</span>
          </div>
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#F2F2F0',
              letterSpacing: '-0.025em',
            }}
          >
            {topic?.title}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {topic?.estimatedMins && (
              <div className="flex items-center gap-1 text-sm" style={{ color: '#8B8FA8' }}>
                <Clock className="h-4 w-4" />
                {formatDuration(topic.estimatedMins)}
              </div>
            )}
          </div>
        </div>

        {/* Status updater */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map(opt => {
            const Icon   = opt.icon
            const active = status === opt.value
            return (
              <button
                key={opt.value}
                disabled={progressMutation.isPending}
                onClick={() => !active && handleStatusChange(opt.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
                style={active ? opt.activeStyle : opt.style}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="notes">
            Notes
            {notes && (
              <span
                className="ml-1.5 h-1.5 w-1.5 rounded-full inline-block"
                style={{ background: '#00E5CC' }}
              />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          {tab === 'content' && <ReadingProgressBar />}
          <TopicViewer topic={topic} />
          <AiQuestionGenerator topicId={topicId} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: '#8B8FA8' }}>
                Personal notes for{' '}
                <span style={{ color: '#F2F2F0' }}>{topic?.title}</span>
              </p>
              <div
                className="flex items-center gap-1.5 text-xs transition-opacity"
                style={{
                  opacity: saving ? 1 : 0,
                  color: '#8B8FA8',
                  pointerEvents: 'none',
                }}
              >
                <Save className="h-3 w-3 animate-pulse" />
                Saving…
              </div>
            </div>
            <Textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Write your notes here… They auto-save as you type."
              className="min-h-[300px] resize-y font-mono text-sm"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#F2F2F0',
              }}
            />
            <p className="text-xs" style={{ color: '#8B8FA8' }}>
              Notes are auto-saved 1.5 seconds after you stop typing.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <AiChatPanel topicId={topicId} topicTitle={topic?.title} />
    </div>
  )
}
