import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'

export const Route = createFileRoute('/_dashboard/my-questions')({
  component: MyQuestionsPage,
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedQuestion {
  id: string
  question: string
  options?: Record<string, string> | null
  answer: string
  explanation?: string | null
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  topicId?: string | null
  createdAt: string
  topic?: { title: string } | null
}

// ─── Difficulty badge colours ──────────────────────────────────────────────────

const DIFF_COLORS = {
  EASY:   'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HARD:   'bg-red-100 text-red-700 border-red-200',
}

// ─── Flashcard ────────────────────────────────────────────────────────────────

function Flashcard({ q, onDelete }: { q: SavedQuestion; onDelete: () => void }) {
  const [flipped, setFlipped] = useState(false)

  const entries = Object.entries(q.options ?? {})
  const isCorrectOption = (key: string) => key === q.answer

  return (
    <div style={{ perspective: '1000px' }} className="h-52">
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s',
          transform: flipped ? 'rotateY(180deg)' : 'none',
          position: 'relative',
          height: '100%',
        }}
      >
        {/* ── Front ── */}
        <div
          style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
          className="border rounded-lg p-4 bg-card flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFlipped(true)}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-relaxed flex-1 line-clamp-4">{q.question}</p>
            <Badge variant="outline" className={cn('text-xs shrink-0', DIFF_COLORS[q.difficulty])}>
              {q.difficulty}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">Tap to reveal answer</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Back ── */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute',
            inset: 0,
          }}
          className="border rounded-lg p-4 bg-card flex flex-col gap-2 cursor-pointer overflow-y-auto hover:shadow-md transition-shadow"
          onClick={() => setFlipped(false)}
        >
          {entries.length > 0 ? (
            <div className="space-y-1">
              {entries.map(([key, val]) => (
                <div
                  key={key}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 rounded text-xs',
                    isCorrectOption(key)
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'text-muted-foreground opacity-60',
                  )}
                >
                  <span className={cn(
                    'h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                    isCorrectOption(key) ? 'bg-green-500 text-white' : 'bg-muted',
                  )}>
                    {key}
                  </span>
                  {val}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-green-700">Answer: {q.answer}</p>
          )}

          {q.explanation && (
            <p className="text-xs text-muted-foreground border-t pt-2 mt-auto leading-relaxed line-clamp-3">
              {q.explanation}
            </p>
          )}
          <span className="text-[10px] text-muted-foreground mt-auto">Tap to flip back</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function MyQuestionsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [topicFilter, setTopicFilter] = useState<string>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['saved-questions'],
    queryFn: () => api.get('/ai/saved-questions').then(r => r.data),
  })

  const allQuestions: SavedQuestion[] = data ?? []

  // Build unique topic list for filter
  const topics = useMemo(() => {
    const seen = new Map<string, string>()
    allQuestions.forEach(q => {
      if (q.topicId && q.topic?.title) {
        seen.set(q.topicId, q.topic.title)
      }
    })
    return Array.from(seen.entries()) // [id, title]
  }, [allQuestions])

  const filtered = topicFilter === 'ALL'
    ? allQuestions
    : allQuestions.filter(q => q.topicId === topicFilter)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ai/saved-questions/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-questions'] })
      toast({ title: 'Question removed' })
    },
    onError: () => toast({ title: 'Failed to delete', variant: 'destructive' }),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Question Bank</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Questions you've saved from AI generation sessions.
          </p>
        </div>
        {allQuestions.length > 0 && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {allQuestions.length} saved
          </Badge>
        )}
      </div>

      {/* Filter */}
      {topics.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by topic:</span>
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-52 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Topics</SelectItem>
              {topics.map(([id, title]) => (
                <SelectItem key={id} value={id}>{title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={allQuestions.length === 0 ? 'No saved questions yet' : 'No questions match this filter'}
          description={
            allQuestions.length === 0
              ? 'Generate practice questions from any topic page and save the ones you want to review.'
              : 'Try selecting a different topic filter.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(q => (
            <Flashcard
              key={q.id}
              q={q}
              onDelete={() => deleteMutation.mutate(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
