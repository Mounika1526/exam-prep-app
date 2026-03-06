import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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

// ── Difficulty badge styles ────────────────────────────────────────────────────
const DIFF_STYLE: Record<string, { background: string; color: string; border: string }> = {
  EASY:   { background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' },
  MEDIUM: { background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' },
  HARD:   { background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' },
}

// ── Ripple hook ────────────────────────────────────────────────────────────────

interface Ripple { id: number; x: number; y: number }

function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const counter = useRef(0)

  const spawnRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const id = ++counter.current
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600)
  }

  return { ripples, spawnRipple }
}

// ── Option button ─────────────────────────────────────────────────────────────

interface OptionBtnProps {
  optKey: string
  value: string
  variantClass: string
  variantStyle: React.CSSProperties
  disabled: boolean
  isSelected: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
}

function OptionButton({ optKey, value, variantClass, variantStyle, disabled, isSelected, onClick, children }: OptionBtnProps) {
  const { ripples, spawnRipple } = useRipple()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) spawnRipple(e)
    onClick(e)
  }

  return (
    <button
      disabled={disabled}
      onClick={handleClick}
      className={cn('quiz-option w-full text-left px-4 py-3.5 rounded-xl text-sm flex items-center gap-3 relative overflow-hidden', variantClass)}
      style={{
        border: '1px solid rgba(255,255,255,0.09)',
        color: '#C8CCEA',
        background: 'rgba(255,255,255,0.03)',
        ...variantStyle,
      }}
    >
      {/* Ripple effect */}
      {ripples.map(r => (
        <span
          key={r.id}
          className="animate-ripple absolute rounded-full pointer-events-none"
          style={{
            width: 24, height: 24,
            left: r.x - 12, top: r.y - 12,
            background: 'rgba(0,229,204,0.25)',
          }}
        />
      ))}
      {children}
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function QuestionCard({ question, selectedAnswer, onAnswer, isRevealed, questionNumber }: Props) {
  const options = question.options
    ? Object.entries(question.options as Record<string, string>)
    : question.type === 'TRUE_FALSE'
    ? [['True', 'True'], ['False', 'False']]
    : []

  const diffStyle = DIFF_STYLE[question.difficulty] ?? DIFF_STYLE.MEDIUM

  return (
    <Card className="glass-card border-0" style={{ borderRadius: 20 }}>
      <CardHeader className="pb-2">
        {/* ── Question meta row ── */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#8B8FA8' }}
            >
              Question {questionNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Difficulty badge */}
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={diffStyle}
            >
              {question.difficulty}
            </span>
            {/* Type badge */}
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#8B8FA8', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {question.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* ── Question text ── */}
        <p
          className="text-base leading-relaxed font-medium"
          style={{ color: '#F2F2F0', lineHeight: 1.65 }}
        >
          {question.text}
        </p>
      </CardHeader>

      <CardContent className="pt-2">
        {question.type === 'FILL_IN_BLANK' ? (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Type your answer..."
              value={selectedAnswer || ''}
              onChange={(e) => onAnswer(e.target.value)}
              disabled={isRevealed}
              className="w-full px-4 py-3 text-sm rounded-xl transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F2F2F0',
                outline: 'none',
              }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(0,229,204,0.5)'; (e.target as HTMLElement).style.boxShadow = '0 0 0 2px rgba(0,229,204,0.1)' }}
              onBlur={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.target as HTMLElement).style.boxShadow = 'none' }}
            />
            {isRevealed && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#4ADE80' }} />
                <span style={{ color: '#4ADE80' }}>Correct answer: {question.answer}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {options.map(([key, value]) => {
              const isSelected = selectedAnswer === key
              const isCorrect  = question.answer === key

              let variantClass = ''
              let variantStyle: React.CSSProperties = {}

              if (isRevealed) {
                if (isCorrect) {
                  variantClass = 'quiz-option-correct'
                  variantStyle = {}
                } else if (isSelected && !isCorrect) {
                  variantClass = 'quiz-option-wrong'
                  variantStyle = {}
                } else {
                  variantStyle = { opacity: 0.45 }
                }
              } else if (isSelected) {
                variantClass = 'quiz-option-selected'
                variantStyle = {}
              }

              return (
                <OptionButton
                  key={key}
                  optKey={key}
                  value={value}
                  variantClass={variantClass}
                  variantStyle={variantStyle}
                  disabled={!!isRevealed}
                  isSelected={isSelected}
                  onClick={() => !isRevealed && onAnswer(key)}
                >
                  {/* Option key circle */}
                  <span
                    className="ds-q-num"
                    style={
                      isSelected && !isRevealed
                        ? { borderColor: '#00E5CC', background: 'rgba(0,229,204,0.15)', color: '#00E5CC' }
                        : isRevealed && isCorrect
                        ? { borderColor: '#4ADE80', background: 'rgba(74,222,128,0.15)', color: '#4ADE80' }
                        : isRevealed && isSelected && !isCorrect
                        ? { borderColor: '#F87171', background: 'rgba(248,113,113,0.15)', color: '#F87171' }
                        : {}
                    }
                  >
                    {key}
                  </span>
                  <span className="flex-1">{value}</span>
                  {isRevealed && isCorrect && (
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#4ADE80' }} />
                  )}
                  {isRevealed && isSelected && !isCorrect && (
                    <XCircle className="h-4 w-4 shrink-0" style={{ color: '#F87171' }} />
                  )}
                </OptionButton>
              )
            })}
          </div>
        )}

        {/* ── Explanation panel ── */}
        {isRevealed && question.explanation && (
          <div
            className="mt-4 p-4 rounded-xl text-sm"
            style={{
              background: 'rgba(0,229,204,0.07)',
              border: '1px solid rgba(0,229,204,0.2)',
            }}
          >
            <p className="font-semibold mb-1.5" style={{ color: '#00E5CC' }}>Explanation</p>
            <p style={{ color: '#C8CCEA', lineHeight: 1.6 }}>{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
