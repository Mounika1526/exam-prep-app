import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, GraduationCap, BookOpen, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

interface SearchResult {
  id: string
  title: string
  type: 'exam' | 'topic'
  subtitle?: string
}

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  // Ctrl+K to open
  useKeyboardShortcuts({ 'ctrl+k': () => { if (!open) onClose() } })

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const [examsRes, topicsRes] = await Promise.allSettled([
        api.get('/exams', { params: { search: q, limit: 5 } }),
        api.get('/topics', { params: { search: q, limit: 5 } }),
      ])

      const examResults: SearchResult[] =
        examsRes.status === 'fulfilled'
          ? (examsRes.value.data?.data?.data ?? examsRes.value.data?.data ?? []).map((e: any) => ({
              id: e.id,
              title: e.title,
              type: 'exam' as const,
              subtitle: e.category,
            }))
          : []

      const topicResults: SearchResult[] =
        topicsRes.status === 'fulfilled'
          ? (topicsRes.value.data?.data?.data ?? topicsRes.value.data?.data ?? []).map((t: any) => ({
              id: t.id,
              title: t.title,
              type: 'topic' as const,
              subtitle: t.chapter?.title,
            }))
          : []

      setResults([...examResults, ...topicResults])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  const selectResult = (result: SearchResult) => {
    onClose()
    if (result.type === 'exam') navigate({ to: '/exams/$examId', params: { examId: result.id } })
    else navigate({ to: '/study/$topicId', params: { topicId: result.id } })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[activeIdx]) selectResult(results[activeIdx])
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  const exams  = results.filter(r => r.type === 'exam')
  const topics = results.filter(r => r.type === 'topic')
  let globalIdx = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background border rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          {loading
            ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
            : <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search exams, topics..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 px-1.5 items-center gap-1 rounded border bg-muted text-[10px] text-muted-foreground font-mono">
            Esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-72 overflow-y-auto py-2">
            {exams.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Exams</p>
                {exams.map((r) => {
                  const idx = globalIdx++
                  return (
                    <button
                      key={r.id}
                      onClick={() => selectResult(r)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${activeIdx === idx ? 'bg-accent' : 'hover:bg-accent/50'}`}
                    >
                      <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            {topics.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Topics</p>
                {topics.map((r) => {
                  const idx = globalIdx++
                  return (
                    <button
                      key={r.id}
                      onClick={() => selectResult(r)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${activeIdx === idx ? 'bg-accent' : 'hover:bg-accent/50'}`}
                    >
                      <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {query && !loading && results.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            No results for "{query}"
          </p>
        )}

        {!query && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            Type to search exams and topics...
          </p>
        )}

        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1 font-mono">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1 font-mono">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1 font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
