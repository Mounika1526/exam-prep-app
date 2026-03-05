import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, Check, ChevronRight, BookmarkPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface GeneratedQuestion {
  question: string
  type: 'MCQ' | 'TRUE_FALSE'
  options?: Record<string, string>
  answer: string
  explanation?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

interface Props {
  topicId: string
}

const DIFF_COLORS = {
  EASY:   'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HARD:   'bg-red-100 text-red-700 border-red-200',
}

// ─── Flip animation variants ──────────────────────────────────────────────────

const flipVariants = {
  enter: { rotateY:  90, opacity: 0 },
  show:  { rotateY:   0, opacity: 1 },
  exit:  { rotateY: -90, opacity: 0 },
}

export function AiQuestionGenerator({ topicId }: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM')
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [revealedIdx, setRevealedIdx] = useState<Set<number>>(new Set())
  const [skippedIdx, setSkippedIdx] = useState<Set<number>>(new Set())
  const [savedIdx, setSavedIdx]     = useState<Set<number>>(new Set())
  const [savedCount, setSavedCount] = useState(0)

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post('/ai/generate-questions', { topicId, count: 5, difficulty }).then(r => r.data),
    onSuccess: (data) => {
      setQuestions(prev => [...prev, ...(data.questions || [])])
      setRevealedIdx(new Set())
      setSkippedIdx(new Set())
    },
    onError: () => toast({ title: 'Failed to generate questions', variant: 'destructive' }),
  })

  const saveMutation = useMutation({
    mutationFn: (idx: number) => {
      const q = questions[idx]
      return api.post('/ai/save-question', {
        question:      q.question,
        options:       q.options,
        correctAnswer: q.answer,
        explanation:   q.explanation,
        topicId,
        difficulty:    q.difficulty,
      }).then(r => r.data)
    },
    onSuccess: (_, idx) => {
      setSavedIdx(prev => new Set(prev).add(idx))
      setSavedCount(c => c + 1)
      qc.invalidateQueries({ queryKey: ['saved-questions'] })
      toast({ title: 'Question saved to your bank!' })
    },
    onError: () => toast({ title: 'Failed to save question', variant: 'destructive' }),
  })

  const reveal = (idx: number) => setRevealedIdx(prev => new Set(prev).add(idx))
  const skip   = (idx: number) => setSkippedIdx(prev => new Set(prev).add(idx))

  const visibleQuestions = questions
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => !skippedIdx.has(i))

  return (
    <div className="space-y-4 mt-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="gap-2"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating questions…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-purple-500" />
              Generate Practice Questions
            </>
          )}
        </Button>

        <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
          </SelectContent>
        </Select>

        {savedCount > 0 && (
          <Badge variant="secondary" className="gap-1">
            <BookmarkPlus className="h-3 w-3" />
            {savedCount} saved
          </Badge>
        )}
      </div>

      {/* Question cards */}
      {visibleQuestions.map(({ q, i }) => {
        const isRevealed = revealedIdx.has(i)
        const isSaved    = savedIdx.has(i)
        const entries    = Object.entries(q.options ?? {})

        return (
          <div
            key={i}
            className="border rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ perspective: 900 }}
          >
            {/* ── Flip container — swaps between question and revealed state ── */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isRevealed ? `revealed-${i}` : `question-${i}`}
                variants={flipVariants}
                initial="enter"
                animate="show"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm leading-relaxed flex-1">{q.question}</p>
                  <Badge
                    variant="outline"
                    className={cn('text-xs shrink-0', DIFF_COLORS[q.difficulty])}
                  >
                    {q.difficulty}
                  </Badge>
                </div>

                {/* MCQ Options */}
                {entries.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {entries.map(([key, value]) => {
                      const isCorrect = isRevealed && key === q.answer
                      const isWrong   = isRevealed && key !== q.answer
                      return (
                        <div
                          key={key}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors',
                            isCorrect && 'bg-green-100 border-green-500 text-green-700 font-medium',
                            isWrong   && 'opacity-40',
                            !isRevealed && 'bg-muted/30',
                          )}
                        >
                          <span className={cn(
                            'h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                            isCorrect ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground',
                          )}>
                            {isCorrect ? <Check className="h-3 w-3" /> : key}
                          </span>
                          {value}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* TRUE_FALSE options */}
                {entries.length === 0 && q.type === 'TRUE_FALSE' && (
                  <div className="flex gap-2">
                    {['True', 'False'].map(opt => {
                      const isCorrect = isRevealed && opt === q.answer
                      const isWrong   = isRevealed && opt !== q.answer
                      return (
                        <div
                          key={opt}
                          className={cn(
                            'px-4 py-2 rounded-md border text-sm font-medium',
                            isCorrect && 'bg-green-100 border-green-500 text-green-700',
                            isWrong   && 'opacity-40',
                            !isRevealed && 'bg-muted/30',
                          )}
                        >
                          {opt}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Explanation — only after reveal */}
                {isRevealed && q.explanation && (
                  <motion.div
                    className="bg-muted rounded-md p-3 text-sm text-muted-foreground"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <span className="font-medium text-foreground">Explanation: </span>
                    {q.explanation}
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {!isRevealed ? (
                    <Button size="sm" variant="outline" onClick={() => reveal(i)} className="gap-1.5">
                      <ChevronRight className="h-3.5 w-3.5" />
                      Reveal Answer
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={isSaved ? 'secondary' : 'outline'}
                      disabled={isSaved || saveMutation.isPending}
                      onClick={() => saveMutation.mutate(i)}
                      className="gap-1.5"
                    >
                      {isSaved ? (
                        <><Check className="h-3.5 w-3.5" /> Saved</>
                      ) : (
                        <><BookmarkPlus className="h-3.5 w-3.5" /> Save to My Bank</>
                      )}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => skip(i)}
                    className="text-muted-foreground">
                    Skip
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )
      })}

      {/* Generate More */}
      {questions.length > 0 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="gap-1.5 text-muted-foreground"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate More
          </Button>
        </div>
      )}
    </div>
  )
}
