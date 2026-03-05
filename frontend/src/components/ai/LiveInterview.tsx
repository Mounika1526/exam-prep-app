import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Send, RotateCcw, Bot, Circle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface Message {
  role: 'USER' | 'AI'
  text: string
  timestamp: Date
}

export function LiveInterview() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000'

  const connect = () => {
    setIsConnecting(true)
    const ws = new WebSocket(`${WS_URL}/ws/interview`)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      setIsConnecting(false)
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'greeting' || data.type === 'response') {
        setMessages(prev => [...prev, { role: 'AI', text: data.message, timestamp: new Date() }])
      } else if (data.type === 'reset') {
        setMessages([{ role: 'AI', text: data.message, timestamp: new Date() }])
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      setIsConnecting(false)
    }

    ws.onerror = () => {
      setIsConnected(false)
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    wsRef.current?.close()
    setIsConnected(false)
    setMessages([])
  }

  const reset = () => {
    wsRef.current?.send(JSON.stringify({ type: 'reset' }))
  }

  const send = () => {
    if (!input.trim() || !isConnected) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'USER', text: msg, timestamp: new Date() }])
    wsRef.current?.send(JSON.stringify({ type: 'message', message: msg }))
  }

  useEffect(() => {
    return () => wsRef.current?.close()
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Live AI Interview
            </CardTitle>
            <CardDescription>Practice with an AI interviewer in real-time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
              <Circle className={`h-2 w-2 fill-current ${isConnected ? 'text-green-400' : ''}`} />
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
            {isConnected && (
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 min-h-0 pb-4">
        {!isConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Start Your Mock Interview</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect to begin a real-time interview session with AI
              </p>
            </div>
            <Button onClick={connect} disabled={isConnecting} size="lg">
              <Mic className="h-5 w-5 mr-2" />
              {isConnecting ? 'Connecting...' : 'Start Interview'}
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1" ref={scrollRef as any}>
              <div className="space-y-3 pr-2">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'USER' ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {msg.role === 'USER'
                        ? <span className="text-xs font-medium">{initials}</span>
                        : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your answer..."
                className="min-h-[44px] max-h-[100px] resize-none text-sm"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              />
              <div className="flex flex-col gap-1">
                <Button size="icon" onClick={send} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={disconnect}>
                  <MicOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
