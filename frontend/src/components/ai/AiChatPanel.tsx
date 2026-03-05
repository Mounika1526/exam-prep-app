import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/use-toast'
import {
  Brain, X, Trash2, Send, Bot, Mic, MicOff, Loader2, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AiConversation } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type VoiceState = 'idle' | 'connecting' | 'ready' | 'listening' | 'ai_speaking' | 'error'

interface TranscriptLine {
  role: 'user' | 'ai'
  text: string
}

interface Props {
  topicId?: string
  topicTitle?: string
  examId?: string
}

// ─── Waveform bars — amplitude-driven ────────────────────────────────────────

function WaveformBars({ active, heights }: { active: boolean; heights?: number[] }) {
  const BAR_COUNT = 8
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const amplitude = heights?.[i] ?? 0
        // Map 0-255 analyser range to 6-36px bar height
        const dynamicH = heights ? Math.max(6, Math.round((amplitude / 255) * 36)) : undefined
        return (
          <div
            key={i}
            className="w-1 rounded-full bg-indigo-500 transition-[height] duration-75"
            style={{
              height: dynamicH != null ? `${dynamicH}px` : (active ? undefined : '6px'),
              animation: dynamicH == null && active
                ? `wave 0.8s ease-in-out infinite alternate`
                : 'none',
              animationDelay: `${i * 0.08}s`,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Chat body ────────────────────────────────────────────────────────────────

function ChatBody({
  topicId,
  isOpen,
}: {
  topicId?: string
  isOpen: boolean
}) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const { toast } = useToast()
  const [input, setInput] = useState('')
  const [chatError, setChatError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const initials  = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  const { data: history = [], isLoading } = useQuery<AiConversation[]>({
    queryKey: ['ai-chat-panel', topicId],
    queryFn: () =>
      api.get(`/ai/conversations${topicId ? `?topicId=${topicId}&limit=50` : '?limit=50'}`)
        .then(r => r.data),
    enabled: isOpen,
  })

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      api.post('/ai/chat', { message, topicId }).then(r => r.data),
    onSuccess: () => {
      setChatError(null)
      qc.invalidateQueries({ queryKey: ['ai-chat-panel', topicId] })
    },
    onError: (err: any) => {
      setChatError(err?.response?.data?.message || 'Something went wrong. Please try again.')
    },
  })

  const clearMutation = useMutation({
    mutationFn: () =>
      api.delete(`/ai/conversations${topicId ? `?topicId=${topicId}` : ''}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-chat-panel', topicId] }),
    onError: () => toast({ title: 'Failed to clear chat', variant: 'destructive' }),
  })

  const send = () => {
    if (!input.trim() || chatMutation.isPending) return
    setChatError(null)
    const msg = input.trim()
    setInput('')
    chatMutation.mutate(msg)
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, chatMutation.isPending])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Clear button (header area) */}
      <div className="flex justify-end px-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground gap-1"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending || history.length === 0}
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>
      </div>

      {/* Error banner */}
      {chatError && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {chatError}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-3" ref={scrollRef as any}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 && !chatMutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <Bot className="h-10 w-10 text-indigo-500/40" />
            <p className="text-sm text-muted-foreground">
              Ask me anything about this topic!
            </p>
            <div className="flex flex-col gap-1.5 w-full">
              {[
                'Explain this in simple terms',
                'Give me 3 key points',
                'What are common exam questions?',
              ].map(p => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent transition-colors text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {/* ── Animated message bubbles ── */}
            <AnimatePresence initial={false}>
              {history.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={cn('flex gap-2', msg.role === 'USER' && 'flex-row-reverse')}
                >
                  <div className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    msg.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-indigo-100',
                  )}>
                    {msg.role === 'USER'
                      ? <span className="text-[10px] font-bold">{initials}</span>
                      : <Bot className="h-3.5 w-3.5 text-indigo-600" />}
                  </div>
                  <div className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                    msg.role === 'USER'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm',
                  )}>
                    {msg.role === 'ASSISTANT' ? (
                      <div className="prose prose-sm max-w-none [&>*:last-child]:mb-0 [&>*:first-child]:mt-0">
                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator — animates in/out */}
              {chatMutation.isPending && (
                <motion.div
                  key="typing-indicator"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="flex gap-2"
                >
                  <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3 space-y-1">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
          />
          <Button
            size="icon"
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
            onClick={send}
            disabled={!input.trim() || chatMutation.isPending}
          >
            {chatMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-right">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

// ─── Voice body ───────────────────────────────────────────────────────────────

function VoiceBody({ topicId, examId }: { topicId?: string; examId?: string }) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [barHeights, setBarHeights] = useState<number[]>([])

  const wsRef            = useRef<WebSocket | null>(null)
  const mediaRecRef      = useRef<MediaRecorder | null>(null)
  const audioCtxRef      = useRef<AudioContext | null>(null)
  const analyserRef      = useRef<AnalyserNode | null>(null)
  const animFrameRef     = useRef<number>(0)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      mediaRecRef.current?.stop()
      wsRef.current?.close()
      audioCtxRef.current?.close()
    }
  }, [])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // ── Analyser helpers ──────────────────────────────────────────────────────

  const startAnalyserLoop = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return
    const data   = new Uint8Array(analyser.frequencyBinCount)
    const BAR_COUNT = 8
    const loop = () => {
      analyser.getByteFrequencyData(data)
      const step    = Math.floor(data.length / BAR_COUNT)
      const heights = Array.from({ length: BAR_COUNT }, (_, i) => data[i * step] ?? 0)
      setBarHeights(heights)
      animFrameRef.current = requestAnimationFrame(loop)
    }
    animFrameRef.current = requestAnimationFrame(loop)
  }, [])

  const stopAnalyserLoop = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    setBarHeights([])
  }, [])

  /** Get or create the shared AudioContext + AnalyserNode. */
  const getAnalyser = useCallback(() => {
    const ctx = audioCtxRef.current ?? new AudioContext()
    audioCtxRef.current = ctx
    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      analyser.connect(ctx.destination)
      analyserRef.current = analyser
    }
    return { ctx, analyser: analyserRef.current }
  }, [])

  // ── Audio playback ────────────────────────────────────────────────────────

  const playAudio = useCallback(async (b64: string) => {
    try {
      const { ctx, analyser } = getAnalyser()
      const binaryStr = atob(b64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
      const decoded = await ctx.decodeAudioData(bytes.buffer)
      const source  = ctx.createBufferSource()
      source.buffer = decoded
      source.connect(analyser)   // route through analyser for amplitude data
      source.start()
      startAnalyserLoop()
      source.onended = stopAnalyserLoop
    } catch {
      // Audio decode errors are non-fatal; some chunks may be partial
    }
  }, [getAnalyser, startAnalyserLoop, stopAnalyserLoop])

  // ── WebSocket connect ─────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    setVoiceError(null)
    setVoiceState('connecting')

    let wsUrl: string
    let token: string
    try {
      const { data } = await api.post('/ai/voice-session')
      wsUrl = data.data.wsUrl
      token = data.data.token
    } catch {
      setVoiceError('Failed to start voice session. Please try again.')
      setVoiceState('error')
      return
    }

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token, topicId, examId }))
    }

    ws.onmessage = async (e) => {
      let msg: any
      try { msg = JSON.parse(e.data) } catch { return }

      if (msg.type === 'ready') {
        setVoiceState('ready')
      } else if (msg.type === 'text') {
        setTranscript(prev => [...prev, { role: 'ai', text: msg.data }])
      } else if (msg.type === 'audio') {
        setVoiceState('ai_speaking')
        await playAudio(msg.data)
      } else if (msg.type === 'turn_complete') {
        setVoiceState('ready')
      } else if (msg.type === 'error') {
        setVoiceError(msg.message || 'Voice session error')
        setVoiceState('error')
      }
    }

    ws.onclose = () => {
      if (voiceState !== 'error') setVoiceState('idle')
      mediaRecRef.current?.stop()
      mediaRecRef.current = null
    }

    ws.onerror = () => {
      setVoiceError('WebSocket connection failed.')
      setVoiceState('error')
    }
  }, [topicId, examId, playAudio, voiceState])

  // ── Microphone ────────────────────────────────────────────────────────────

  const startListening = useCallback(async () => {
    if (voiceState !== 'ready' || !wsRef.current) return

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setVoiceError('Microphone access denied. Please allow mic permission and try again.')
      setVoiceState('error')
      return
    }

    // Route the mic through Web Audio so the analyser reads its amplitude
    const { analyser } = getAnalyser()
    const micSource = audioCtxRef.current!.createMediaStreamSource(stream)
    micSource.connect(analyser)
    startAnalyserLoop()

    setVoiceState('listening')

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    const rec = new MediaRecorder(stream, { mimeType })
    mediaRecRef.current = rec

    rec.ondataavailable = async (evt) => {
      if (evt.data.size === 0 || wsRef.current?.readyState !== WebSocket.OPEN) return
      const buf = await evt.data.arrayBuffer()
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
      wsRef.current.send(JSON.stringify({ type: 'audio', data: b64 }))
    }

    rec.start(250)
  }, [voiceState, getAnalyser, startAnalyserLoop])

  const stopListening = useCallback(() => {
    if (mediaRecRef.current?.state === 'recording') {
      mediaRecRef.current.stop()
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_of_turn' }))
    }
    stopAnalyserLoop()
    setVoiceState('ai_speaking')
  }, [stopAnalyserLoop])

  const disconnect = useCallback(() => {
    mediaRecRef.current?.stop()
    wsRef.current?.close()
    stopAnalyserLoop()
    setVoiceState('idle')
    setTranscript([])
    setVoiceError(null)
  }, [stopAnalyserLoop])

  const stateLabel: Record<VoiceState, string> = {
    idle:        'Connect to start voice session',
    connecting:  'Connecting…',
    ready:       'Hold to speak',
    listening:   'Listening…',
    ai_speaking: 'AI is speaking…',
    error:       'Session error',
  }

  const isActive = voiceState === 'listening' || voiceState === 'ai_speaking'

  return (
    <div className="flex flex-col flex-1 min-h-0 items-center px-4 py-6 gap-6">
      {/* Amplitude-driven waveform */}
      <WaveformBars
        active={isActive}
        heights={isActive && barHeights.length > 0 ? barHeights : undefined}
      />

      {/* State label */}
      <p className="text-sm text-muted-foreground font-medium">{stateLabel[voiceState]}</p>

      {/* Error banner */}
      {voiceError && (
        <div className="w-full flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {voiceError}
        </div>
      )}

      {/* Controls */}
      {voiceState === 'idle' || voiceState === 'error' ? (
        <Button onClick={connect} disabled={voiceState === 'connecting'} className="bg-indigo-600 hover:bg-indigo-700">
          <Mic className="h-4 w-4 mr-2" />
          Connect
        </Button>
      ) : voiceState === 'connecting' ? (
        <Button disabled>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Connecting…
        </Button>
      ) : voiceState === 'ready' ? (
        <div className="flex flex-col items-center gap-3">
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            className="h-16 w-16 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center shadow-lg"
          >
            <Mic className="h-7 w-7 text-white" />
          </button>
          <p className="text-xs text-muted-foreground">Hold to speak, release to send</p>
          <Button variant="ghost" size="sm" onClick={disconnect}>
            <MicOff className="h-4 w-4 mr-1.5" />
            Disconnect
          </Button>
        </div>
      ) : voiceState === 'listening' ? (
        <button
          onMouseUp={stopListening}
          onTouchEnd={stopListening}
          className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg animate-pulse"
        >
          <Mic className="h-7 w-7 text-white" />
        </button>
      ) : (
        // ai_speaking
        <Button variant="outline" disabled>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          AI is speaking…
        </Button>
      )}

      {/* Live transcript */}
      {transcript.length > 0 && (
        <div className="w-full flex-1 overflow-y-auto space-y-2 border rounded-lg p-3 text-sm min-h-0 max-h-48">
          {transcript.map((line, i) => (
            <div key={i} className={cn('flex gap-2', line.role === 'user' && 'flex-row-reverse')}>
              <p className={cn(
                'max-w-[85%] rounded-lg px-3 py-1.5 text-xs leading-relaxed',
                line.role === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground',
              )}>
                {line.text}
              </p>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function AiChatPanel({ topicId, topicTitle, examId }: Props) {
  const [isOpen, setIsOpen]           = useState(false)
  const [isVoiceMode, setIsVoiceMode] = useState(false)

  // Close panel with Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg',
          'flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all',
          isOpen && 'hidden',
        )}
        title="Open AI Tutor"
      >
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-30" />
        <Brain className="h-6 w-6 relative" />
      </button>

      {/* ── Backdrop (mobile) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Slide-in panel — glassmorphism style ── */}
      <div className={cn(
        'fixed inset-y-0 right-0 z-40 flex flex-col border-l shadow-2xl',
        'w-full max-w-[400px] transition-transform duration-300 ease-out',
        // Glassmorphism: semi-transparent background with backdrop blur
        'bg-background/90 backdrop-blur-xl',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0 bg-background/60">
          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center">
            <Brain className="h-4 w-4 text-indigo-600" />
          </div>
          <span className="font-semibold text-sm flex-1">AI Tutor</span>

          {topicTitle && (
            <Badge variant="secondary" className="text-xs max-w-[120px] truncate">
              {topicTitle}
            </Badge>
          )}

          <Button
            size="sm"
            variant={isVoiceMode ? 'default' : 'outline'}
            onClick={() => setIsVoiceMode(v => !v)}
            className={cn('h-7 px-2 text-xs gap-1', isVoiceMode && 'bg-indigo-600 hover:bg-indigo-700 border-0')}
          >
            <Mic className="h-3 w-3" />
            Voice
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        {isVoiceMode ? (
          <VoiceBody topicId={topicId} examId={examId} />
        ) : (
          <ChatBody topicId={topicId} isOpen={isOpen} />
        )}
      </div>
    </>
  )
}
