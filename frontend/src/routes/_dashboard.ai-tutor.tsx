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
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground">Chat, plan, and practice with AI</p>
      </div>

      <Tabs defaultValue="chat">
        <TabsList>
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
