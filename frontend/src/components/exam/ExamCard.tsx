import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, HelpCircle } from 'lucide-react'
import type { Exam } from '@/types'

interface Props { exam: Exam }

export function ExamCard({ exam }: Props) {
  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group">
      {exam.imageUrl && (
        <img
          src={exam.imageUrl}
          alt={exam.title}
          className="w-full h-32 object-cover rounded-t-lg"
        />
      )}
      {!exam.imageUrl && (
        <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
          <BookOpen className="h-10 w-10 text-primary/40" />
        </div>
      )}
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
            {exam.title}
          </h3>
          <Badge variant="secondary" className="shrink-0 text-xs">{exam.category}</Badge>
        </div>
        {exam.description && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{exam.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {exam._count?.subjects || 0} subjects
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            {exam._count?.questions || 0} questions
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
