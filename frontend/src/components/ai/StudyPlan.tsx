import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Calendar,
  Sparkles,
  Target,
  Lightbulb,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { StudyPlanData } from "@/types";
import ReactMarkdown from "react-markdown";

export function StudyPlan() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [examId, setExamId] = useState("");
  const [examDate, setExamDate] = useState(
    (user as any)?.examDate?.split("T")[0] || "",
  );
  const [hoursPerDay, setHoursPerDay] = useState(
    String((user as any)?.hoursPerDay || 4),
  );
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  const { data: examsData } = useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get("/exams?limit=50").then((r) => r.data),
  });
  const exams = examsData?.data?.data || [];

  // Load all previously saved plans on mount
  const { data: allPlansData, isLoading: allPlansLoading } = useQuery({
    queryKey: ["study-plans-all"],
    queryFn: () => api.get("/ai/study-plans").then((r) => r.data),
  });
  const allPlans: any[] = allPlansData?.data || [];

  // Load plan for selected exam
  const { data: savedPlanData, isLoading: planLoading } = useQuery({
    queryKey: ["study-plan", examId],
    queryFn: () => api.get(`/ai/study-plan/${examId}`).then((r) => r.data),
    enabled: !!examId,
    retry: false,
  });
  const savedPlan = savedPlanData?.plan as StudyPlanData | undefined;

  const generateMutation = useMutation({
    mutationFn: () =>
      api
        .post("/ai/study-plan", {
          examId,
          examDate:
            examDate ||
            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          hoursPerDay: parseFloat(hoursPerDay),
        })
        .then((r) => r.data),
    onSuccess: () => {
      setSelectedSavedId(null);
      qc.invalidateQueries({ queryKey: ["study-plan", examId] });
      qc.invalidateQueries({ queryKey: ["study-plans-all"] });
    },
    onError: () =>
      toast({ title: "Failed to generate plan", variant: "destructive" }),
  });

  // Determine which plan to display
  const selectedFromList = selectedSavedId
    ? allPlans.find((p) => p.id === selectedSavedId)?.plan
    : null;
  const plan = (selectedFromList ?? generateMutation.data?.plan ?? savedPlan) as StudyPlanData | undefined;

  const examTitle = (id: string) =>
    exams.find((e: any) => e.id === id)?.title || id;

  return (
    <div className="space-y-6">
      {/* Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Generate Study Plan
          </CardTitle>
          <CardDescription>
            AI will create a personalized plan based on your exam date and
            availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Target Exam</Label>
              <Select value={examId} onValueChange={(v) => { setExamId(v); setSelectedSavedId(null); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exam Date</Label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hours/Day</Label>
              <Select value={hoursPerDay} onValueChange={setHoursPerDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5", "6", "8"].map((h) => (
                    <SelectItem key={h} value={h}>
                      {h} hours
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={!examId || generateMutation.isPending}
              onClick={() => generateMutation.mutate()}
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {savedPlan ? "Regenerate Plan" : "Generate Plan"}
            </Button>
            {plan && !generateMutation.isPending && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => generateMutation.mutate()}
                disabled={!examId || generateMutation.isPending}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Previously Saved Plans */}
      {allPlansLoading && <Skeleton className="h-20" />}
      {!allPlansLoading && allPlans.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Your Saved Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allPlans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedSavedId(p.id);
                    setExamId(p.examId);
                  }}
                  className="text-left"
                >
                  <Badge
                    variant={selectedSavedId === p.id ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5 text-xs"
                  >
                    {examTitle(p.examId)} · {new Date(p.generatedAt).toLocaleDateString()}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {(generateMutation.isPending || planLoading) && (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
          <Skeleton className="h-36" />
        </div>
      )}

      {/* Plan Display */}
      {plan && !generateMutation.isPending && (
        <div className="space-y-4">
          {/* Overview */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{plan.overview}</ReactMarkdown>
              </div>
              <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                <span>📅 {plan.totalDays} days</span>
                <span>⏰ {plan.hoursPerDay} hrs/day</span>
              </div>
            </CardContent>
          </Card>

          {/* Phases */}
          {plan.phases?.map((phase, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {phase.name}
                  </CardTitle>
                  <Badge variant="outline">
                    Day {phase.startDay}–{phase.endDay}
                  </Badge>
                </div>
                <CardDescription>{phase.goal}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phase.subjects?.map((subj, j) => (
                    <div key={j} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{subj.name}</p>
                        <Badge variant="secondary">{subj.dailyHours}h/day</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {subj.chapters?.map((ch, k) => (
                          <Badge key={k} variant="outline" className="text-xs">
                            {ch}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Tips */}
          {plan.tips?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{tip}</ReactMarkdown>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
