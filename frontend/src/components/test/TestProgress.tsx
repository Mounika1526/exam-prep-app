import { Progress } from '@/components/ui/progress'

interface Props {
  current: number
  total: number
  answered: number
}

export function TestProgress({ current, total, answered }: Props) {
  return (
    <div className="flex-1 space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Question {current} of {total}</span>
        <span className="text-muted-foreground">{answered} answered</span>
      </div>
      <Progress value={(answered / total) * 100} className="h-2" />
    </div>
  )
}
