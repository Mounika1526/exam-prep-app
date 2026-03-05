import { useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Sparkles, RefreshCw } from 'lucide-react'

interface TrendingItem {
  skill?: string
  title?: string
  topic?: string
  reason?: string
  description?: string
  relevance?: string
}

interface Props {
  examId?: string
}

// ─── Shimmer pill ─────────────────────────────────────────────────────────────

function ShimmerPill({ label, tip }: { label: string; tip: string }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          className="relative overflow-hidden rounded-full inline-flex"
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.15 }}
        >
          {/* Shimmer sweep — slides from left to right on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.span
                className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                initial={{ x: '-110%' }}
                animate={{ x: '210%' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: 'linear' }}
              />
            )}
          </AnimatePresence>

          <Badge
            variant="outline"
            className="relative z-10 cursor-default hover:bg-primary/10 hover:border-primary transition-colors text-xs py-1 px-3"
          >
            {label}
          </Badge>
        </motion.div>
      </TooltipTrigger>
      {tip && (
        <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
          {tip}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export function AiTrendingWidget({ examId }: Props) {
  const qc = useQueryClient()

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['ai-trending', examId],
    queryFn: () => api.get(`/ai/trending?examId=${examId}`).then(r => r.data),
    enabled: !!examId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })

  const trending: TrendingItem[] = data?.trending || []

  const daysSinceUpdate = dataUpdatedAt
    ? Math.floor((Date.now() - dataUpdatedAt) / (1000 * 60 * 60 * 24))
    : null

  if (!examId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Trending in Your Domain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a target exam in your profile to see trending topics.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Trending in Your Domain
          </CardTitle>
          <div className="flex items-center gap-2">
            {daysSinceUpdate !== null && (
              <span className="text-xs text-muted-foreground">
                {daysSinceUpdate === 0 ? 'Updated today' : `Updated ${daysSinceUpdate}d ago`}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => qc.invalidateQueries({ queryKey: ['ai-trending', examId] })}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trending topics found.</p>
        ) : (
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              {trending.slice(0, 8).map((item, i) => {
                const label = item.skill || item.title || item.topic || `Topic ${i + 1}`
                const tip   = item.reason || item.description || item.relevance || ''
                return <ShimmerPill key={i} label={label} tip={tip} />
              })}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
