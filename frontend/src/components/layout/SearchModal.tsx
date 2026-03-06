import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, GraduationCap, BookOpen, Loader2, Command } from 'lucide-react'
import { api } from '@/lib/api'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { motion, AnimatePresence } from 'framer-motion'

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

  useKeyboardShortcuts({ 'ctrl+k': () => { if (!open) onClose() } })

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

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
              id: e.id, title: e.title, type: 'exam' as const, subtitle: e.category,
            }))
          : []

      const topicResults: SearchResult[] =
        topicsRes.status === 'fulfilled'
          ? (topicsRes.value.data?.data?.data ?? topicsRes.value.data?.data ?? []).map((t: any) => ({
              id: t.id, title: t.title, type: 'topic' as const, subtitle: t.chapter?.title,
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

  const exams  = results.filter(r => r.type === 'exam')
  const topics = results.filter(r => r.type === 'topic')
  let globalIdx = 0

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* ── Modal panel ── */}
          <motion.div
            className="ds-search-modal relative w-full max-w-lg rounded-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* ── Search input row ── */}
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,229,204,0.12)', color: '#00E5CC' }}
              >
                {loading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Search className="h-3.5 w-3.5" />
                }
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
                onKeyDown={handleKeyDown}
                placeholder="Search exams, topics..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#F2F2F0' }}
              />
              <div className="hidden sm:flex items-center gap-1.5">
                <kbd
                  style={{
                    fontSize: '10px', fontFamily: 'monospace',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 4, padding: '2px 6px', color: '#8B8FA8',
                  }}
                >
                  Esc
                </kbd>
              </div>
            </div>

            {/* ── Results ── */}
            {results.length > 0 && (
              <div className="max-h-72 overflow-y-auto py-2">
                {exams.length > 0 && (
                  <div>
                    <p
                      className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: '#8B8FA8' }}
                    >
                      Exams
                    </p>
                    {exams.map((r) => {
                      const idx = globalIdx++
                      const isActive = activeIdx === idx
                      return (
                        <button
                          key={r.id}
                          onClick={() => selectResult(r)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'ds-search-result-active' : ''}`}
                          style={isActive ? {} : { color: '#B0B4CC' }}
                        >
                          <div
                            className="shrink-0 flex items-center justify-center"
                            style={{
                              width: 30, height: 30, borderRadius: 8,
                              background: isActive ? 'rgba(0,229,204,0.15)' : 'rgba(255,255,255,0.06)',
                              color: isActive ? '#00E5CC' : '#8B8FA8',
                            }}
                          >
                            <GraduationCap className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: isActive ? '#F2F2F0' : '#C8CCEA' }}>{r.title}</p>
                            {r.subtitle && <p className="text-xs truncate" style={{ color: '#8B8FA8' }}>{r.subtitle}</p>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
                {topics.length > 0 && (
                  <div>
                    <p
                      className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: '#8B8FA8' }}
                    >
                      Topics
                    </p>
                    {topics.map((r) => {
                      const idx = globalIdx++
                      const isActive = activeIdx === idx
                      return (
                        <button
                          key={r.id}
                          onClick={() => selectResult(r)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'ds-search-result-active' : ''}`}
                        >
                          <div
                            className="shrink-0 flex items-center justify-center"
                            style={{
                              width: 30, height: 30, borderRadius: 8,
                              background: isActive ? 'rgba(0,229,204,0.15)' : 'rgba(255,255,255,0.06)',
                              color: isActive ? '#00E5CC' : '#8B8FA8',
                            }}
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: isActive ? '#F2F2F0' : '#C8CCEA' }}>{r.title}</p>
                            {r.subtitle && <p className="text-xs truncate" style={{ color: '#8B8FA8' }}>{r.subtitle}</p>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {query && !loading && results.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Search className="h-8 w-8 mx-auto mb-3" style={{ color: 'rgba(139,143,168,0.4)' }} />
                <p className="text-sm" style={{ color: '#8B8FA8' }}>No results for &ldquo;{query}&rdquo;</p>
              </div>
            )}

            {!query && (
              <div className="px-4 py-8 text-center space-y-2">
                <Command className="h-8 w-8 mx-auto" style={{ color: 'rgba(0,229,204,0.3)' }} />
                <p className="text-sm" style={{ color: '#8B8FA8' }}>Type to search exams and topics...</p>
              </div>
            )}

            {/* ── Footer keyboard hints ── */}
            <div
              className="flex items-center gap-4 px-4 py-2.5 text-[11px]"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#8B8FA8' }}
            >
              {[['↑↓', 'navigate'], ['↵', 'select'], ['Esc', 'close']].map(([key, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <kbd style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>
                    {key}
                  </kbd>
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
