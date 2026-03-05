import { Link } from '@tanstack/react-router'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, ChevronRight } from 'lucide-react'
import type { Subject } from '@/types'
import { formatDuration } from '@/lib/utils'

interface Props { subjects: Subject[] }

export function SubjectList({ subjects }: Props) {
  if (subjects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>No subjects available yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {subjects.map((subject) => (
        <div key={subject.id} className="border rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 p-4 bg-muted/30">
            {subject.icon && <span className="text-2xl">{subject.icon}</span>}
            <div className="flex-1">
              <h3 className="font-semibold">{subject.title}</h3>
              <p className="text-sm text-muted-foreground">
                {subject.chapters?.length || 0} chapters
              </p>
            </div>
          </div>

          <Accordion type="single" collapsible>
            {subject.chapters?.map((chapter) => (
              <AccordionItem key={chapter.id} value={chapter.id} className="border-t">
                <AccordionTrigger className="px-4 text-sm font-medium">
                  {chapter.title}
                  <Badge variant="outline" className="ml-auto mr-2 text-xs">
                    {chapter.topics?.length || 0} topics
                  </Badge>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 space-y-1 pb-2">
                    {chapter.topics?.map((topic) => (
                      <Link
                        key={topic.id}
                        to="/study/$topicId"
                        params={{ topicId: topic.id }}
                        className="flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors group"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-sm flex-1 group-hover:text-primary transition-colors">
                          {topic.title}
                        </span>
                        {topic.estimatedMins && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatDuration(topic.estimatedMins)}
                          </div>
                        )}
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  )
}
