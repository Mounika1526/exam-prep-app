import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, Bot, Trash2, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import type { AiConversation } from '@/types'
import ReactMarkdown from 'react-markdown'

interface Props {
  topicId?: string
  topicTitle?: string
}

const STARTER_PROMPTS = [
  'Explain this topic in simple terms',
  'Give me 3 key points to remember',
  'What are common exam questions on this?',
  'Create a quick summary',
]

export function AiTutor({ topicId, topicTitle }: Props) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['ai-conversations', topicId],
    queryFn: () =>
      api.get(`/ai/conversations${topicId ? `?topicId=${topicId}&limit=50` : '?limit=50'}`)
        .then(r => r.data),
  })

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      api.post('/ai/chat', { message, topicId }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-conversations', topicId] })
    },
  })

  const clearMutation = useMutation({
    mutationFn: () =>
      api.delete(`/ai/conversations${topicId ? `?topicId=${topicId}` : ''}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-conversations', topicId] })
    },
  })

  const send = () => {
    if (!input.trim() || chatMutation.isPending) return
    const msg = input.trim()
    setInput('')
    chatMutation.mutate(msg)
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, chatMutation.isPending])

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">AI Tutor</p>
            {topicTitle && (
              <p className="text-xs text-muted-foreground">Topic: {topicTitle}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending || history.length === 0}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Bot className="h-10 w-10 mx-auto mb-2 text-primary/40" />
              <p className="text-sm text-muted-foreground">
                Ask me anything about {topicTitle || 'your exam topics'}!
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTER_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => { setInput(p); }}
                  className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {(history as AiConversation[]).map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'USER' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {msg.role === 'USER'
                    ? <span className="text-xs font-medium">{initials}</span>
                    : <Bot className="h-4 w-4" />}
                </div>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'USER'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  {msg.role === 'USER'
                    ? <p className="whitespace-pre-wrap">{msg.message}</p>
                    : <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{msg.message}</ReactMarkdown></div>
                  }
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3 space-y-2">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <Button
            size="icon"
            onClick={send}
            disabled={!input.trim() || chatMutation.isPending}
          >
            {chatMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-right">Enter to send • Shift+Enter for new line</p>
      </div>
    </Card>
  )
}
