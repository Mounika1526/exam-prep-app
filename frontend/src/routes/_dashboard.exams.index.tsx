import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, BookOpen, HelpCircle, Filter } from 'lucide-react'
import { useState, useMemo } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'

export const Route = createFileRoute('/_dashboard/exams/')({
  component: ExamsPage,
})

// ─── localStorage-backed enrollment set ──────────────────────────────────────

function loadEnrolled(): Set<string> {
  try {
    const raw = localStorage.getItem('exam-prep-enrolled')
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveEnrolled(set: Set<string>) {
  localStorage.setItem('exam-prep-enrolled', JSON.stringify([...set]))
}

// ─── Component ───────────────────────────────────────────────────────────────

function ExamsPage() {
  const navigate = useNavigate()
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState<string>('ALL')
  const [enrolled, setEnrolled]     = useState<Set<string>>(loadEnrolled)

  const { data, isLoading } = useQuery({
    queryKey: ['exams', search],
    queryFn: () => api.get(`/exams?search=${encodeURIComponent(search)}&limit=100`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const allExams: any[] = data?.data?.data ?? []

  // Distinct categories
  const categories = useMemo(() => {
    const cats = [...new Set(allExams.map((e: any) => e.category as string))].sort()
    return ['ALL', ...cats]
  }, [allExams])

  // Filter by selected category
  const exams = useMemo(() =>
    category === 'ALL' ? allExams : allExams.filter((e: any) => e.category === category),
    [allExams, category]
  )

  // Group by category
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
      <div>
        <h1 className="text-2xl font-bold">Exam Catalog</h1>
        <p className="text-muted-foreground">Choose an exam to start preparing</p>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exams..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat === 'ALL' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
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
              <h2 className="text-lg font-semibold mb-3">{cat}</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(catExams as any[]).map(exam => {
                const isEnrolled = enrolled.has(exam.id)
                return (
                  <div
                    key={exam.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group bg-card"
                    onClick={() => isEnrolled ? handleContinue(exam.id) : undefined}
                  >
                    {/* Thumbnail */}
                    {exam.imageUrl ? (
                      <img
                        src={exam.imageUrl}
                        alt={exam.title}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-primary/40" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
                          {exam.title}
                        </h3>
                        <Badge variant="secondary" className="shrink-0 text-xs">{exam.category}</Badge>
                      </div>
                      {exam.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {exam.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {exam._count?.subjects ?? 0} subjects
                          </span>
                          <span className="flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" />
                            {exam._count?.questions ?? 0} questions
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant={isEnrolled ? 'default' : 'outline'}
                          onClick={e => {
                            e.stopPropagation()
                            isEnrolled ? handleContinue(exam.id) : handleEnroll(exam.id)
                          }}
                        >
                          {isEnrolled ? 'Continue →' : 'Enroll'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
