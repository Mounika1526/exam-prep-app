import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Clock, Target } from 'lucide-react'
import { getScoreColor, getScoreLabel, formatSeconds } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  score: number
  correct: number
  total: number
  session: any
}

export function ResultsCard({ score, correct, total, session }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
          <h2 className="text-3xl font-bold">Test Complete!</h2>
          <p className="text-muted-foreground mt-1">{session?.exam?.title}</p>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center py-6 border-y mb-6">
          <div className={cn('text-6xl font-bold', getScoreColor(score))}>{score}%</div>
          <Badge className="mt-2" variant={score >= 60 ? 'default' : 'destructive'}>
            {getScoreLabel(score)}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs">Correct</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{correct}</p>
            <p className="text-xs text-muted-foreground">of {total}</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs">Wrong</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{total - correct}</p>
            <p className="text-xs text-muted-foreground">of {total}</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Time</span>
            </div>
            <p className="text-2xl font-bold">
              {session?.timeTakenSecs ? formatSeconds(session.timeTakenSecs) : '–'}
            </p>
            <p className="text-xs text-muted-foreground">total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
