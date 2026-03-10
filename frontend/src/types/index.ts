// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'STUDENT'
export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'FILL_IN_BLANK'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
export type TestStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
export type AiRole = 'USER' | 'ASSISTANT'

// ─── Models ──────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  targetExam?: string
  examDate?: string
  hoursPerDay?: number
  createdAt: string
  streak?: Streak
}

export interface Exam {
  id: string
  title: string
  description?: string
  category: string
  imageUrl?: string
  isActive: boolean
  _count?: { subjects: number; questions: number }
}

export interface Subject {
  id: string
  examId: string
  title: string
  order: number
  icon?: string
  chapters?: Chapter[]
  _count?: { chapters: number; questions: number }
}

export interface Chapter {
  id: string
  subjectId: string
  title: string
  order: number
  description?: string
  topics?: Topic[]
  _count?: { topics: number }
}

export interface Topic {
  id: string
  chapterId: string
  title: string
  content?: string
  resources?: Record<string, any>
  videoUrl?: string
  order: number
  estimatedMins?: number
  userProgress?: UserProgress
}

export interface Question {
  id: string
  text: string
  type: QuestionType
  options?: Record<string, string>
  answer: string
  explanation?: string
  difficulty: Difficulty
  tags: string[]
}

export interface TestSession {
  id: string
  userId: string
  examId: string
  startedAt: string
  submittedAt?: string
  totalQuestions: number
  score?: number
  timeTakenSecs?: number
  status: TestStatus
  exam?: Pick<Exam, 'id' | 'title'>
}

export interface TestAnswer {
  id: string
  sessionId: string
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
  timeTakenSecs?: number
  question?: Question
}

export interface UserProgress {
  id: string
  userId: string
  topicId: string
  status: ProgressStatus
  notes?: string
  topic?: Topic
}

export interface StudySession {
  id: string
  userId: string
  subjectId: string
  date: string
  durationMins: number
  subject?: Pick<Subject, 'id' | 'title' | 'icon'>
}

export interface Streak {
  id: string
  userId: string
  currentStreak: number
  longestStreak: number
  lastActiveDate: string
}

export interface AiConversation {
  id: string
  role: AiRole
  message: string
  timestamp: string
}

export interface AiStudyPlan {
  id: string
  userId: string
  examId: string
  examDate: string
  hoursPerDay: number
  plan: StudyPlanData
  generatedAt: string
}

export interface StudyPlanReference {
  title: string
  type: 'book' | 'website' | 'video' | 'article'
  url?: string
}

export interface StudyPlanData {
  overview: string
  totalDays: number
  hoursPerDay: number
  phases: StudyPhase[]
  dailySchedule: Record<string, string>
  weeklyMilestones: Array<{ week: number; goal: string }>
  tips: string[]
  references?: StudyPlanReference[]
}

export interface StudyPhase {
  name: string
  startDay: number
  endDay: number
  goal: string
  subjects: Array<{
    name: string
    dailyHours: number
    chapters: string[]
    techniques: string[]
  }>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface DashboardStats {
  progress: { total: number; completed: number; percentage: number }
  tests: { total: number; avgScore: number }
  recentTests: Array<{
    id: string
    score: number | null
    totalQuestions: number
    submittedAt: string | null
    exam: { id: string; title: string }
  }>
  hoursStudiedThisWeek: number
  streak: Streak | null
  recentStudySessions: StudySession[]
}

export interface ContinueTopic {
  topicId: string
  topicTitle: string
  topicStatus: ProgressStatus
  estimatedMins?: number
  chapterId: string
  chapterTitle: string
  subjectTitle: string
  examId: string
  examTitle: string
  chapterProgress: { completed: number; total: number }
}

export interface EnrolledExam {
  examId: string
  examTitle: string
  examImageUrl?: string
  examCategory: string
  topicsStarted: number
  topicsCompleted: number
  totalTopics: number
  progressPct: number
}

// ─── Admin types ──────────────────────────────────────────────────────────────

export interface DayStat {
  date: string
  count: number
}

export interface AdminTopExam {
  examId: string
  examTitle: string
  enrolledCount: number
  avgScore: number | null
}

export interface AdminStats {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  activeUsersToday: number
  activeUsersThisWeek: number
  totalTestsTaken: number
  testsToday: number
  avgScoreOverall: number
  totalExams: number
  totalQuestions: number
  aiMessagesToday: number
  aiMessagesThisMonth: number
  topExams: AdminTopExam[]
  userGrowth: DayStat[]
  testActivity: DayStat[]
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  isActive: boolean
  createdAt: string
  targetExam?: string
  lastActive: string | null
  _count: { testSessions: number; aiConversations: number }
}

export interface AdminUserDetail extends Omit<AdminUser, '_count'> {
  examDate?: string
  hoursPerDay?: number
  updatedAt: string
  streak?: Streak
  _count: {
    testSessions: number
    userProgress: number
    aiConversations: number
    aiSavedQuestions: number
  }
  userProgress: Array<{
    status: ProgressStatus
    updatedAt: string
    topic: {
      id: string
      title: string
      chapter: { title: string; subject: { title: string; exam: { title: string } } }
    }
  }>
  testSessions: Array<{
    id: string
    score: number | null
    totalQuestions: number
    startedAt: string
    submittedAt: string | null
    timeTakenSecs: number | null
    exam: { id: string; title: string }
  }>
}

export interface AdminContentStats {
  exams: { total: number; active: number; inactive: number }
  subjects: number
  chapters: number
  topics: number
  questions: {
    total: number
    byDifficulty: Record<string, number>
    byType: Record<string, number>
  }
  recentExams: Array<{
    id: string
    title: string
    category: string
    isActive: boolean
    createdAt: string
    _count: { subjects: number; questions: number }
  }>
}
