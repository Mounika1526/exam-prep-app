import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { Question } from '@/types'

interface Props {
  question: Question
  selectedAnswer?: string
  onAnswer: (answer: string) => void
  isRevealed?: boolean
  questionNumber: number
}

const DIFF_COLORS = {
  EASY:   'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HARD:   'bg-red-100 text-red-700',
}

// ─── Ripple hook ──────────────────────────────────────────────────────────────

interface Ripple { id: number; x: number; y: number }

function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const counter = useRef(0)

  const spawnRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const id   = ++counter.current
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600)
  }

  return { ripples, spawnRipple }
}

// ─── Option button with ripple ────────────────────────────────────────────────

interface OptionBtnProps {
  optKey: string
  value: string
  variant: string
  disabled: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
}

function OptionButton({ optKey, value, variant, disabled, onClick, children }: OptionBtnProps) {
  const { ripples, spawnRipple } = useRipple()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) spawnRipple(e)
    onClick(e)
  }

  return (
    <button
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center gap-3 relative overflow-hidden',
        variant
      )}
    >
      {/* Ripple elements */}
      {ripples.map(r => (
        <span
          key={r.id}
          className="animate-ripple absolute rounded-full bg-primary/25 pointer-events-none"
          style={{ width: 24, height: 24, left: r.x - 12, top: r.y - 12 }}
        />
      ))}
      {children}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QuestionCard({ question, selectedAnswer, onAnswer, isRevealed, questionNumber }: Props) {
  const options = question.options
    ? Object.entries(question.options as Record<string, string>)
    : question.type === 'TRUE_FALSE'
    ? [['True', 'True'], ['False', 'False']]
    : []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Question {questionNumber}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', DIFF_COLORS[question.difficulty])}>
              {question.difficulty}
            </Badge>
            <Badge variant="outline" className="text-xs">{question.type.replace('_', ' ')}</Badge>
          </div>
        </div>
        <CardTitle className="text-base font-medium leading-relaxed mt-2">
          {question.text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {question.type === 'FILL_IN_BLANK' ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Type your answer..."
              value={selectedAnswer || ''}
              onChange={(e) => onAnswer(e.target.value)}
              disabled={isRevealed}
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
            {isRevealed && (
              <p className="text-sm text-green-600 font-medium">
                Correct answer: {question.answer}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {options.map(([key, value]) => {
              const isSelected = selectedAnswer === key
              const isCorrect  = question.answer === key
              let variant = 'border bg-background hover:bg-accent cursor-pointer'

              if (isRevealed) {
                if (isCorrect)                   variant = 'border-2 border-green-500 bg-green-50 text-green-700'
                else if (isSelected && !isCorrect) variant = 'border-2 border-red-500 bg-red-50 text-red-700'
                else                             variant = 'border bg-background opacity-60'
              } else if (isSelected) {
                variant = 'border-2 border-primary bg-primary/5'
              }

              return (
                <OptionButton
                  key={key}
                  optKey={key}
                  value={value}
                  variant={variant}
                  disabled={!!isRevealed}
                  onClick={() => !isRevealed && onAnswer(key)}
                >
                  <span className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0 text-xs font-semibold">
                    {key}
                  </span>
                  <span className="flex-1">{value}</span>
                  {isRevealed && isCorrect && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                  {isRevealed && isSelected && !isCorrect && (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                </OptionButton>
              )
            })}
          </div>
        )}

        {isRevealed && question.explanation && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Explanation</p>
            <p>{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
