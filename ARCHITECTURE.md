# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                   │
│         React + TanStack Router + shadcn/ui           │
│   TanStack Query │ React Hook Form │ Recharts │ Zod   │
└─────────────┬───────────────────────────────┬────────┘
              │ HTTP REST (Axios)              │ WebSocket (ws)
              ▼                               ▼
┌─────────────────────────────────────────────────────┐
│                  BACKEND (Node.js)                    │
│              Express.js REST API                      │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐  │
│  │  Auth   │ │  Exams   │ │ Tests  │ │ AI Routes │  │
│  │ Routes  │ │  Routes  │ │ Routes │ │  Routes   │  │
│  └────┬────┘ └────┬─────┘ └───┬────┘ └─────┬─────┘  │
│       └───────────┴───────────┴─────────────┘        │
│                        │                             │
│              ┌──────────┴──────────┐                 │
│              │   Business Logic    │                 │
│              │   (Controllers)     │                 │
│              └──────────┬──────────┘                 │
│                         │                            │
│              ┌──────────┴──────────┐                 │
│              │   Prisma ORM        │                 │
│              └──────────┬──────────┘                 │
└─────────────────────────┼───────────────────────────┘
                          │
             ┌────────────┴────────────┐
             │    PostgreSQL DB         │
             └─────────────────────────┘

             ┌─────────────────────────┐
             │  Google Gemini API       │
             │  (AI Tutor, Plans,       │
             │   Question Gen, Live)    │
             └─────────────────────────┘
```

## Database Schema

```
User ──┬── TestSession ── TestAnswer
       ├── UserProgress ── Topic ── Chapter ── Subject ── Exam
       ├── StudySession
       ├── Streak
       ├── AiConversation
       ├── AiSuggestion
       ├── AiStudyPlan
       └── AiSavedQuestion

Question ──── Topic / Subject / Exam (polymorphic)
```

## Authentication Flow

```
Register/Login → bcrypt hash → JWT issued (7d)
Request → Authorization: Bearer <token>
        → auth middleware → verify JWT
        → attach req.user → controller
```

## AI Integration

### 1. AI Tutor (Chat)
- User sends message + context (topic/exam)
- Backend calls `gemini-1.5-flash` with system prompt
- Streams response back via SSE or returns full
- Stored in `AiConversation` table

### 2. AI Study Plan
- Input: examDate, hoursPerDay, weak subjects
- Output: JSON weekly plan with daily tasks
- Cached in `AiStudyPlan` table (1 per user/exam)

### 3. AI Question Generator
- Input: topic content + difficulty
- Output: MCQ/TF questions with options & explanations
- Saved to `AiSavedQuestion` table

### 4. Live AI Interview (WebSocket)
- WS connection: `ws://localhost:5000/ws/interview`
- Bidirectional text/audio messages
- Gemini Live API for real-time responses

### 5. AI Suggestions
- Weekly suggestions for weak areas
- Cached in `AiSuggestion` table with expiry

## Frontend Architecture

### Routing (TanStack Router)
```
/ (root)
├── /               → Landing / redirect to dashboard
├── /login          → Login page  (_auth layout)
├── /register       → Register page
└── (dashboard)     → _dashboard layout (requires auth)
    ├── /           → Dashboard home
    ├── /exams      → Exam catalog
    ├── /exams/:id  → Exam detail (subjects, chapters)
    ├── /study/:id  → Topic study page
    ├── /test       → Start test
    ├── /test/:id   → Active test session
    ├── /test/:id/results → Test results
    ├── /progress   → Progress overview
    ├── /ai-tutor   → AI chat interface
    └── /profile    → User profile & settings
```

### State Management
- **Server state**: TanStack Query (caching, sync, invalidation)
- **Auth state**: Zustand store + localStorage
- **UI state**: Local component state / Zustand for global UI

### Data Flow
```
Route → useQuery(queryFn) → api.ts (axios) → Backend API
      ← React Query Cache ← JSON response ←
```

## Security

- **Helmet** — HTTP security headers
- **CORS** — Whitelist frontend origin
- **Rate limiting** — 100 req/15min on auth routes
- **JWT** — HS256, 7-day expiry
- **bcrypt** — Password hashing (rounds: 10)
- **Zod** — Input validation on all endpoints
- **Multer** — File type + size validation

## Folder Conventions

### Backend
- `src/controllers/` — Request handlers (thin, delegate to services)
- `src/services/` — Business logic (AI, email)
- `src/routes/` — Route definitions + middleware chains
- `src/middleware/` — Auth, validation, error, upload
- `src/schemas/` — Zod validation schemas
- `src/utils/` — JWT, helpers, constants

### Frontend
- `src/routes/` — File-based pages (TanStack Router)
- `src/components/ui/` — shadcn base components
- `src/components/layout/` — App shell (Sidebar, Header)
- `src/components/{feature}/` — Feature-specific components
- `src/hooks/` — Custom React hooks
- `src/lib/` — API client, utils, query client
- `src/stores/` — Zustand stores
- `src/types/` — TypeScript type definitions
