import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, FileText, Video, Bookmark } from 'lucide-react'
import type { Topic } from '@/types'

interface Props { topic: Topic }

export function TopicViewer({ topic }: Props) {
  const resources = topic?.resources as Record<string, any> | null

  return (
    <div className="space-y-6">
      {/* Main Content */}
      {topic?.content ? (
        <Card>
          <CardContent className="pt-6">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(topic.content) }} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No content available for this topic yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Video */}
      {topic?.videoUrl && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Video className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Video Lesson</h3>
            </div>
            <Button variant="outline" asChild>
              <a href={topic.videoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Watch Video
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {resources && Object.keys(resources).length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Study Resources</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(resources).map(([key, items]) => (
                <div key={key}>
                  <p className="text-sm font-medium capitalize text-muted-foreground mb-1.5">{key}</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(items) && items.map((item: string, i: number) => (
                      item.startsWith('http') ? (
                        <a key={i} href={item} target="_blank" rel="noopener noreferrer">
                          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {item.replace(/^https?:\/\//, '').split('/')[0]}
                          </Badge>
                        </a>
                      ) : (
                        <Badge key={i} variant="secondary">{item}</Badge>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Very simple markdown → HTML converter
function markdownToHtml(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/gm, '<pre><code>$1</code></pre>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^([^<\n].+)$/gm, (m) => m.startsWith('<') ? m : `<p>${m}</p>`)
}
