import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EmptyState } from '@/components/ui/EmptyState'

export const Route = createFileRoute('/_dashboard/my-questions')({
  component: MyQuestionsPage,
})

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

const DIFF_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  EASY:   { bg: 'rgba(74,222,128,0.12)',  color: '#4ADE80', border: 'rgba(74,222,128,0.3)'  },
  MEDIUM: { bg: 'rgba(245,166,35,0.12)',  color: '#F5A623', border: 'rgba(245,166,35,0.3)'  },
  HARD:   { bg: 'rgba(248,113,113,0.12)', color: '#F87171', border: 'rgba(248,113,113,0.3)' },
}

function Flashcard({ q, onDelete }: { q: SavedQuestion; onDelete: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const entries = Object.entries(q.options ?? {})
  const diff = DIFF_STYLE[q.difficulty] ?? DIFF_STYLE.MEDIUM

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
          style={{
            backfaceVisibility: 'hidden',
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setFlipped(true)}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'rgba(0,229,204,0.05)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,204,0.15)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-relaxed flex-1 line-clamp-4" style={{ color: '#F2F2F0' }}>
              {q.question}
            </p>
            <span
              className="text-xs shrink-0 px-2 py-0.5 rounded-full font-semibold"
              style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}
            >
              {q.difficulty}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: '#8B8FA8' }}>Tap to reveal answer</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="h-7 w-7 flex items-center justify-center rounded-md transition-colors"
              style={{ color: '#8B8FA8' }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.color = '#F87171'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.1)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.color = '#8B8FA8'
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
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
            background: 'rgba(0,229,204,0.04)',
            border: '1px solid rgba(0,229,204,0.15)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            cursor: 'pointer',
            overflowY: 'auto',
          }}
          onClick={() => setFlipped(false)}
        >
          {entries.length > 0 ? (
            <div className="space-y-1">
              {entries.map(([key, val]) => {
                const isCorrect = key === q.answer
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                    style={{
                      background: isCorrect ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)',
                      color: isCorrect ? '#4ADE80' : 'rgba(255,255,255,0.4)',
                      fontWeight: isCorrect ? 700 : 400,
                    }}
                  >
                    <span
                      className="h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        background: isCorrect ? '#4ADE80' : 'rgba(255,255,255,0.08)',
                        color: isCorrect ? '#0D0F1A' : '#8B8FA8',
                      }}
                    >
                      {key}
                    </span>
                    {val}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm font-semibold" style={{ color: '#4ADE80' }}>Answer: {q.answer}</p>
          )}

          {q.explanation && (
            <p
              className="text-xs leading-relaxed line-clamp-3 mt-auto"
              style={{
                color: '#8B8FA8',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: 8,
              }}
            >
              {q.explanation}
            </p>
          )}
          <span className="text-[10px]" style={{ color: '#8B8FA8', marginTop: 'auto' }}>Tap to flip back</span>
        </div>
      </div>
    </div>
  )
}

function MyQuestionsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [topicFilter, setTopicFilter] = useState<string>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['saved-questions'],
    queryFn: () => api.get('/ai/saved-questions').then(r => r.data),
  })

  const allQuestions: SavedQuestion[] = data ?? []

  const topics = useMemo(() => {
    const seen = new Map<string, string>()
    allQuestions.forEach(q => {
      if (q.topicId && q.topic?.title) seen.set(q.topicId, q.topic.title)
    })
    return Array.from(seen.entries())
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#F2F2F0',
              letterSpacing: '-0.025em',
            }}
          >
            My Question Bank
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8B8FA8' }}>
            Questions you've saved from AI generation sessions.
          </p>
        </div>
        {allQuestions.length > 0 && (
          <span
            className="text-sm px-3 py-1 rounded-full font-semibold"
            style={{
              background: 'rgba(0,229,204,0.12)',
              color: '#00E5CC',
              border: '1px solid rgba(0,229,204,0.3)',
            }}
          >
            {allQuestions.length} saved
          </span>
        )}
      </div>

      {/* Filter */}
      {topics.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: '#8B8FA8' }}>Filter by topic:</span>
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
            <Skeleton key={i} className="h-52 rounded-xl" />
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
