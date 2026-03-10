import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Play, BookOpen, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@tanstack/react-router";

const searchSchema = z.object({ examId: z.string().optional() });

export const Route = createFileRoute("/_dashboard/test/setup")({
  validateSearch: (search: Record<string, unknown>) =>
    searchSchema.parse(search),
  component: TestSetupPage,
});

const COUNT_OPTIONS = ["10", "20", "30", "50"] as const;
const DIFF_OPTIONS = [
  { value: "ANY", label: "Any difficulty" },
  { value: "EASY", label: "Easy only" },
  { value: "MEDIUM", label: "Medium only" },
  { value: "HARD", label: "Hard only" },
];
const LIMIT_OPTIONS = [
  { value: "NONE", label: "No time limit" },
  { value: "10", label: "10 minutes" },
  { value: "20", label: "20 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
];

function TestSetupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const search = Route.useSearch();
  const presetExamId = (search as any)?.examId ?? "";

  const [examId, setExamId] = useState(presetExamId);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("ANY");
  const [count, setCount] = useState("20");
  const [timeLimitMins, setTimeLimitMins] = useState("NONE");

  // Only enrolled exams (exams the student has started studying)
  const { data: enrolledData } = useQuery({
    queryKey: ["enrolled-exams"],
    queryFn: () => api.get("/users/enrolled-exams").then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
  const exams: any[] = (enrolledData ?? []).map((e: any) => ({
    id: e.examId,
    title: e.examTitle,
    progressPct: e.progressPct,
  }));

  const { data: examDetail, isLoading: loadingSubjects } = useQuery({
    queryKey: ["exam-subjects", examId],
    queryFn: () =>
      api.get(`/exams/${examId}/subjects`).then((r) => r.data.data ?? r.data),
    enabled: !!examId,
    staleTime: 5 * 60 * 1000,
  });
  const subjects: any[] = examDetail?.subjects ?? [];

  useEffect(() => {
    setSubjectIds([]);
  }, [examId]);

  const toggleSubject = (id: string) => {
    setSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const startMutation = useMutation({
    mutationFn: () =>
      api
        .post("/tests/create", {
          examId,
          subjectIds: subjectIds.length ? subjectIds : undefined,
          difficulty: difficulty !== "ANY" ? difficulty : undefined,
          questionCount: parseInt(count),
          timeLimitMins:
            timeLimitMins !== "NONE" ? parseInt(timeLimitMins) : undefined,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      navigate({
        to: "/test/$sessionId",
        params: { sessionId: data.data.sessionId },
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Could not start test";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/test">
          <Button variant="ghost" size="icon" style={{ color: "#8B8FA8" }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: "#F2F2F0",
              letterSpacing: "-0.025em",
            }}
          >
            New Practice Test
          </h1>
          <p className="text-sm" style={{ color: "#8B8FA8" }}>
            Configure your session
          </p>
        </div>
      </div>

      <Card className="glass-card border-0" style={{ borderRadius: 16 }}>
        <CardHeader>
          <CardTitle style={{ color: "#F2F2F0" }}>Test Settings</CardTitle>
          <CardDescription style={{ color: "#8B8FA8" }}>
            Select exam, topics, and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Exam */}
          <div className="space-y-2">
            <Label style={{ color: "#F2F2F0" }}>
              Exam <span style={{ color: "#F87171" }}>*</span>
            </Label>
            {exams.length === 0 ? (
              <div
                className="rounded-md px-3 py-2.5 text-sm"
                style={{
                  background: "rgba(245,166,35,0.08)",
                  border: "1px solid rgba(245,166,35,0.25)",
                  color: "#F5A623",
                }}
              >
                No enrolled exams yet.{" "}
                <a href="/exams" className="underline font-medium">
                  Browse exams
                </a>{" "}
                to get started.
              </div>
            ) : (
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an enrolled exam…" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="flex items-center justify-between w-full gap-3">
                        {e.title}
                        {e.progressPct != null && (
                          <span
                            className="text-xs font-medium ml-auto"
                            style={{ color: "#00E5CC" }}
                          >
                            {e.progressPct}%
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Subjects filter */}
          {examId && (
            <div className="space-y-2">
              <Label style={{ color: "#F2F2F0" }}>
                Subjects
                <span
                  className="ml-1.5 text-xs font-normal"
                  style={{ color: "#8B8FA8" }}
                >
                  (leave blank = all subjects)
                </span>
              </Label>
              {loadingSubjects ? (
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-24 rounded-full animate-pulse"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                  ))}
                </div>
              ) : subjects.length ? (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s: any) => {
                    const active = subjectIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSubject(s.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-150"
                        style={
                          active
                            ? {
                                background: "rgba(0,229,204,0.15)",
                                border: "1px solid rgba(0,229,204,0.4)",
                                color: "#00E5CC",
                                fontWeight: 600,
                              }
                            : {
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#8B8FA8",
                              }
                        }
                      >
                        {s.icon && <span>{s.icon}</span>}
                        {s.title}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "#8B8FA8" }}>
                  No subjects found for this exam.
                </p>
              )}
              {subjectIds.length > 0 && (
                <p className="text-xs" style={{ color: "#8B8FA8" }}>
                  {subjectIds.length} subject{subjectIds.length > 1 ? "s" : ""}{" "}
                  selected
                </p>
              )}
            </div>
          )}

          {/* Questions + Difficulty row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label style={{ color: "#F2F2F0" }}>Questions</Label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNT_OPTIONS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n} questions
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label style={{ color: "#F2F2F0" }}>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Any difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFF_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time limit */}
          <div className="space-y-2">
            <Label style={{ color: "#F2F2F0" }}>Time Limit</Label>
            <Select value={timeLimitMins} onValueChange={setTimeLimitMins}>
              <SelectTrigger>
                <SelectValue placeholder="No time limit" />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_OPTIONS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div
            className="rounded-xl px-4 py-3 space-y-2 text-sm"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex flex-wrap gap-3">
              <span
                className="flex items-center gap-1.5"
                style={{ color: "#00E5CC" }}
              >
                <BookOpen className="h-3.5 w-3.5" />
                {count} questions
              </span>
              {difficulty !== "ANY" && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(245,166,35,0.12)",
                    color: "#F5A623",
                    border: "1px solid rgba(245,166,35,0.3)",
                  }}
                >
                  {difficulty}
                </span>
              )}
              {timeLimitMins !== "NONE" && (
                <span style={{ color: "#8B8FA8" }}>⏱ {timeLimitMins} min</span>
              )}
              {subjectIds.length === 0 && (
                <span style={{ color: "#8B8FA8" }}>All subjects</span>
              )}
            </div>
            {subjectIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {subjects
                  .filter((s: any) => subjectIds.includes(s.id))
                  .map((s: any) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(0,229,204,0.08)",
                        color: "#00E5CC",
                        border: "1px solid rgba(0,229,204,0.2)",
                      }}
                    >
                      {s.icon && <span className="mr-1">{s.icon}</span>}
                      {s.title}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <Button
            className="w-full ep-shimmer-btn ds-btn-shimmer"
            size="lg"
            disabled={!examId || startMutation.isPending}
            onClick={() => startMutation.mutate()}
            style={{
              background: !examId
                ? "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg, #00E5CC, #00B8A5)",
              color: !examId ? "#8B8FA8" : "#0D0F1A",
              border: "none",
              fontWeight: 700,
              fontSize: "15px",
            }}
          >
            {startMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting…
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" /> Start Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
