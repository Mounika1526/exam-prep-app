import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, BookOpen, HelpCircle, Filter, GraduationCap } from 'lucide-react'
import { useState, useMemo } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/_dashboard/exams/')({
  component: ExamsPage,
})

// ─── localStorage-backed enrollment set ──────────────────────────────────────

function loadEnrolled(): Set<string> {
  try {
    const raw = localStorage.getItem('exam-prep-enrolled')
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function saveEnrolled(set: Set<string>) {
  localStorage.setItem('exam-prep-enrolled', JSON.stringify([...set]))
}

// ─── Category → color mapping ─────────────────────────────────────────────────

function getCatClass(cat: string): string {
  const lower = cat?.toLowerCase() ?? ''
  if (lower.includes('engineer') || lower.includes('gate')) return 'cat-badge cat-engineering'
  if (lower.includes('compet') || lower.includes('civil') || lower.includes('upsc')) return 'cat-badge cat-competitive'
  if (lower.includes('tech') || lower.includes('interview') || lower.includes('mern')) return 'cat-badge cat-technical'
  return 'cat-badge cat-default'
}

// Gradient backgrounds for cards without an image
const GRADIENTS = [
  'linear-gradient(135deg, rgba(0,229,204,0.18) 0%, rgba(0,100,90,0.08) 100%)',
  'linear-gradient(135deg, rgba(245,166,35,0.18) 0%, rgba(180,100,0,0.08) 100%)',
  'linear-gradient(135deg, rgba(167,85,247,0.18) 0%, rgba(80,0,160,0.08) 100%)',
  'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(0,60,180,0.08) 100%)',
  'linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(120,0,80,0.08) 100%)',
]

// ─── Component ─────────────────────────────────────────────────────────────

function ExamsPage() {
  const navigate = useNavigate()
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState<string>('ALL')
  const [enrolled, setEnrolled] = useState<Set<string>>(loadEnrolled)

  const { data, isLoading } = useQuery({
    queryKey: ['exams', search],
    queryFn: () => api.get(`/exams?search=${encodeURIComponent(search)}&limit=100`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const allExams: any[] = data?.data?.data ?? []

  const categories = useMemo(() => {
    const cats = [...new Set(allExams.map((e: any) => e.category as string))].sort()
    return ['ALL', ...cats]
  }, [allExams])

  const exams = useMemo(() =>
    category === 'ALL' ? allExams : allExams.filter((e: any) => e.category === category),
    [allExams, category]
  )

  const grouped = useMemo(() =>
    exams.reduce((acc: Record<string, any[]>, exam: any) => {
      const cat = exam.category as string
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(exam)
      return acc
    }, {}),
    [exams]
  )

  const handleEnroll = (examId: string) => {
    const updated = new Set([...enrolled, examId])
    setEnrolled(updated)
    saveEnrolled(updated)
    navigate({ to: '/exams/$examId', params: { examId } })
  }

  const handleContinue = (examId: string) => {
    navigate({ to: '/exams/$examId', params: { examId } })
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F2F2F0', letterSpacing: '-0.025em' }}
        >
          Exam Catalog
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#8B8FA8' }}>
          Choose an exam to begin your preparation journey
        </p>
      </div>

      {/* ── Search + Category filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: '#8B8FA8' }}
          />
          <input
            placeholder="Search exams..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: '#F2F2F0',
              outline: 'none',
            }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(0,229,204,0.4)'; (e.target as HTMLElement).style.boxShadow = '0 0 0 2px rgba(0,229,204,0.1)' }}
            onBlur={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)'; (e.target as HTMLElement).style.boxShadow = 'none' }}
          />
        </div>
        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 shrink-0" style={{ color: '#8B8FA8' }} />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
              style={category === cat
                ? { background: '#00E5CC', color: '#0D0F1A', boxShadow: '0 0 14px rgba(0,229,204,0.4)' }
                : { background: 'rgba(255,255,255,0.06)', color: '#8B8FA8', border: '1px solid rgba(255,255,255,0.1)' }
              }
              onMouseEnter={e => { if (category !== cat) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,204,0.3)'; (e.currentTarget as HTMLElement).style.color = '#F2F2F0' } }}
              onMouseLeave={e => { if (category !== cat) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#8B8FA8' } }}
            >
              {cat === 'ALL' ? 'All Exams' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Exam grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No exams found"
          description="Try adjusting your search or category filter."
        />
      ) : (
        Object.entries(grouped).map(([cat, catExams]) => (
          <div key={cat}>
            {category === 'ALL' && (
              <h2
                className="text-base font-semibold mb-4 flex items-center gap-2"
                style={{ color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '11px' }}
              >
                <span
                  className="inline-block h-px flex-1"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                />
                {cat}
                <span
                  className="inline-block h-px flex-1"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                />
              </h2>
            )}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
            >
              {(catExams as any[]).map((exam, i) => {
                const isEnrolled = enrolled.has(exam.id)
                const gradient = GRADIENTS[i % GRADIENTS.length]

                return (
                  <motion.div
                    key={exam.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                    className="exam-card glass-card rounded-2xl overflow-hidden cursor-pointer group"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                    onClick={() => isEnrolled ? handleContinue(exam.id) : undefined}
                  >
                    {/* ── Card thumbnail ── */}
                    {exam.imageUrl ? (
                      <img
                        src={exam.imageUrl}
                        alt={exam.title}
                        className="w-full h-36 object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-36 flex items-center justify-center relative overflow-hidden"
                        style={{ background: gradient }}
                      >
                        {/* Grid texture overlay */}
                        <div
                          className="absolute inset-0 opacity-30"
                          style={{
                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                          }}
                        />
                        <GraduationCap
                          className="h-12 w-12 relative z-10 transition-transform duration-300 group-hover:scale-110"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        />
                      </div>
                    )}

                    {/* ── Card body ── */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3
                          className="font-semibold leading-tight transition-colors duration-150"
                          style={{ color: '#F2F2F0', fontSize: '15px' }}
                        >
                          {exam.title}
                        </h3>
                        <span className={getCatClass(exam.category)}>{exam.category}</span>
                      </div>
                      {exam.description && (
                        <p
                          className="text-xs line-clamp-2 mb-3"
                          style={{ color: '#8B8FA8', lineHeight: 1.6 }}
                        >
                          {exam.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-3 text-xs" style={{ color: '#8B8FA8' }}>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {exam._count?.subjects ?? 0} subjects
                          </span>
                          <span className="flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" />
                            {exam._count?.questions ?? 0} Qs
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className={isEnrolled ? 'ep-shimmer-btn ds-btn-shimmer' : ''}
                          variant={isEnrolled ? 'default' : 'outline'}
                          style={isEnrolled
                            ? { height: 32, fontSize: '12px', fontWeight: 600, paddingLeft: 14, paddingRight: 14 }
                            : { height: 32, fontSize: '12px', fontWeight: 600, borderColor: 'rgba(0,229,204,0.3)', color: '#00E5CC', background: 'transparent', paddingLeft: 14, paddingRight: 14 }
                          }
                          onClick={e => {
                            e.stopPropagation()
                            isEnrolled ? handleContinue(exam.id) : handleEnroll(exam.id)
                          }}
                        >
                          {isEnrolled ? 'Continue →' : 'Enroll'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        ))
      )}
    </div>
  )
}
