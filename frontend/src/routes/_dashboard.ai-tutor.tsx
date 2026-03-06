import { createFileRoute } from '@tanstack/react-router'
import { AiTutor } from '@/components/ai/AiTutor'
import { StudyPlan } from '@/components/ai/StudyPlan'
import { LiveInterview } from '@/components/ai/LiveInterview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, Calendar, Mic } from 'lucide-react'

export const Route = createFileRoute('/_dashboard/ai-tutor')({
  component: AiTutorPage,
})

function AiTutorPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            color: '#F2F2F0',
            letterSpacing: '-0.025em',
          }}
        >
          AI Assistant
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8B8FA8' }}>
          Chat, plan, and practice with AI
        </p>
      </div>

      <Tabs defaultValue="chat">
        <TabsList style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <TabsTrigger value="chat">
            <Bot className="h-4 w-4 mr-2" />
            AI Tutor
          </TabsTrigger>
          <TabsTrigger value="plan">
            <Calendar className="h-4 w-4 mr-2" />
            Study Plan
          </TabsTrigger>
          <TabsTrigger value="interview">
            <Mic className="h-4 w-4 mr-2" />
            Live Interview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <AiTutor />
        </TabsContent>
        <TabsContent value="plan" className="mt-4">
          <StudyPlan />
        </TabsContent>
        <TabsContent value="interview" className="mt-4">
          <LiveInterview />
        </TabsContent>
      </Tabs>
    </div>
  )
}
