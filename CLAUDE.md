# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`cd backend`)
```bash
npm run dev          # Start with nodemon (watches src/ + server.js)
npm start            # Production start
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:migrate   # Run migrations (dev)
npm run db:push      # Push schema without migration file (quick iteration)
npm run db:seed      # Seed the database
npm run db:studio    # Open Prisma Studio GUI
npm run db:reset     # Drop + re-migrate + re-seed
```

### Frontend (`cd frontend`)
```bash
npm run dev     # Vite dev server (http://localhost:5173)
npm run build   # TypeScript check + Vite production build
npm run lint    # ESLint on src/ (ts, tsx)
npm run preview # Preview production build
npx shadcn@latest add <component-name>  # Add a new shadcn/ui component
```

There are no test suites configured.

## Ports

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5173
- **Health check**: http://localhost:5000/api/health (returns `{ status, uptime, timestamp, env }`)
- **WebSocket (text interview)**: ws://localhost:5000/ws/interview
- **WebSocket (voice/Gemini Live)**: ws://localhost:5000/ws/ai-voice

## Architecture

### Backend (Node.js ESM + Express)

The entry point is `server.js`, which creates an HTTP server, mounts the Express app from `src/app.js`, and attaches two WebSocket servers: `/ws/interview` (text interview) and `/ws/ai-voice` (Gemini Live voice proxy).

**Middleware stack order in `src/app.js`:**
```
compression → helmet (CSP) → cors → rateLimit → morgan → cookieParser
→ json/urlencoded body → string-trim sanitizer → static files
→ /health + /api/health → /api router → 404 → errorHandler
```

**Request lifecycle:**
```
Route → rateLimiter? → authenticate? → validate(schema)? → controller → [service] → Prisma → DB
                                                                                  ↓
                                                                           errorHandler (global)
```

- **Routes** (`src/routes/`): Thin — just middleware chains and controller references. All routes are mounted under `/api` via `src/routes/index.js`.
- **Controllers** (`src/controllers/`): Handle req/res, call services or Prisma directly.
- **Services** (`src/services/`):
  - `geminiService.js` — core REST AI calls used by controllers (chat, study plan, question gen, trending).
  - `ai.service.js` — legacy AI helpers (`generateSuggestionsAi`, `handleInterviewWS` for text interview WS).
  - `geminiLiveService.js` — Gemini Live voice proxy (`handleVoiceWS`): authenticates via first-message JWT, opens server-side WS to Gemini Live API, transforms client↔Gemini message formats, saves transcript to `AiConversation` on disconnect.
  - `authService.js` — OTP/email logic. `email.service.js` — Nodemailer templates.
- **Middleware** (`src/middleware/`):
  - `auth.js` — `authenticate` (required), `optionalAuth`, `requireAdmin`. Attaches `req.user`. Rejects deactivated users with HTTP 403.
  - `validate.js` — `validate(zodSchema)` for body (result in `req.validatedBody`), `validateQuery(zodSchema)` for query params (result in `req.validatedQuery`).
  - `error.js` — Global error handler; handles Prisma codes (`P2002`, `P2025`, `P2003`), Multer, JWT errors, and generic errors.
  - `rateLimiter.js` — Per-route limiters (auth, refresh, forgot-password).
  - `role.js` — `requireAdmin` for ADMIN-only routes.
  - `upload.js` — Multer config for avatar/file uploads (type + size validation).
- **Validations** (`src/validations/`): Zod schemas used by `validate()`. Schemas for auth and content.
- **Schemas** (`src/schemas/`): Separate Zod schemas for exams and questions (used independently from validation middleware).

**Auth model:** Dual-token system. Short-lived access token (15 min JWT, sent as `Authorization: Bearer`). Long-lived refresh token (7 days JWT, stored in httpOnly cookie + `refresh_tokens` DB table). Refresh via `POST /api/auth/refresh`.

**Admin seed endpoint:** `POST /api/admin/seed` — requires ADMIN token, only works when `NODE_ENV=development`. Idempotent (safe to re-run). Creates 4 users (`admin@examprep.com / Admin@123`, alice/bob/charlie `@example.com / Student@123`), two exams (GATE CS, MERN Interview Prep), each with 3 subjects → 3 chapters → 3 topics → 10 MCQ questions, plus UserProgress and Streak records.

### Frontend (React + Vite + TypeScript)

**App bootstrap** (`src/main.tsx`): `ErrorBoundary` → `QueryClientProvider` → `AuthProvider` → `RouterProvider`.

**Routing** (TanStack Router, file-based at `src/routes/`):
- `_auth.tsx` — Layout for unauthenticated pages. Redirects to dashboard if already logged in.
- `_dashboard.tsx` — Layout for authenticated pages. Manages `SearchModal` state + `Ctrl+K` shortcut, renders `Sidebar`, `Header`, `BackToTop`, and `SearchModal`. Redirects to `/login` if not authenticated.
- `admin.tsx` — Admin layout (ADMIN-only guard + `AdminSidebar`). Also manages its own `SearchModal` + `Ctrl+K`.
- Files prefixed `_auth.` are auth pages; files prefixed `_dashboard.` are app pages.
- `routeTree.gen.ts` is auto-generated by the `@tanstack/router-plugin` Vite plugin — never edit manually.

**Auth state** (two-layer):
- `AuthContext` (`src/contexts/AuthContext.tsx`): On mount, calls `POST /auth/refresh` to restore the session and stores the access token in JS memory via `setAccessToken`. Provides `login`, `logout`, `user`, `isLoading`.
- `useAuthStore` (Zustand, `src/stores/authStore.ts`): Persists the user profile object to `localStorage` (`exam-prep-user` key) for instant UI hydration on page load. Access token is **never** persisted to storage.

**API client** (`src/lib/api.ts`):
- Axios instance with `withCredentials: true` (sends httpOnly cookie automatically).
- Request interceptor attaches the in-memory access token as `Authorization: Bearer`.
- Response interceptor handles 401s: queues concurrent requests, calls `/auth/refresh`, drains queue with the new token.

**Data fetching:** TanStack Query (staleTime: 5 min, gcTime: 10 min, refetchOnWindowFocus: false). Query keys and `queryClient` are in `src/lib/queryClient.ts`.

**Types** (`src/types/index.ts`): All shared TypeScript interfaces mirroring Prisma models. Use these — don't redefine inline.

**Admin module:**
- Routes: `admin.tsx` (layout), `admin.index.tsx` (`/admin` dashboard), `admin.users.tsx` (`/admin/users` paginated user table + UserDetailModal).
- Uses a separate Axios instance `src/lib/adminApi.ts` (same interceptor pattern as `api.ts`).
- Components live in `src/components/admin/`.
- Backend: `src/controllers/admin.controller.js` + `src/routes/admin.routes.js`. All admin routes require `authenticate` + `requireAdmin`.

**Frontend AI components** (`src/components/ai/`): Seven components handle all AI features.

| Component | Route/Usage | Description |
|-----------|-------------|-------------|
| `AiChatPanel` | `study/$topicId` | Self-contained floating panel — renders its own trigger button (Brain icon, bottom-right). Include on any page with topic context. Chat + voice modes. |
| `AiQuestionGenerator` | `study/$topicId` content tab | Generate/reveal/save MCQ question cards for a topic. |
| `AiTrendingWidget` | Dashboard bottom row | Trending skill/topic pills with Tooltip, linked to `examId`. |
| `AiTutor` | `/ai-tutor` page | Full-page chat tutor (legacy, kept for the dedicated AI page). |
| `AiSuggestions` | (replaced on dashboard) | Priority suggestions list; kept for direct use if needed. |
| `StudyPlan` | `/ai-tutor` plan tab | Phase-based study plan viewer. |
| `LiveInterview` | `/ai-tutor` interview tab | Text-mode interview session. |

`react-markdown` is installed in the frontend (used in `AiChatPanel` for assistant message rendering with the `.prose` CSS class).

**Layout components** (`src/components/layout/`):

| Component | Description |
|-----------|-------------|
| `Sidebar` | Desktop nav — `hidden md:flex`. Contains `NAV_ITEMS` array. |
| `Header` | Requires `onSearchOpen: () => void` prop. Renders hamburger (mobile) + search icon button + user dropdown. |
| `MobileNav` | Slide-out drawer, same links as `Sidebar`. Controlled via `open`/`onClose` props. Closes on Escape or backdrop click. |
| `SearchModal` | Command-palette style dialog. Debounced search (300ms) against `/exams` + `/topics`. Arrow key + Enter navigation. Controlled via `open`/`onClose` props. |

**Reusable UI utilities** (`src/components/ui/`):

| Component | Usage |
|-----------|-------|
| `EmptyState` | `<EmptyState icon={X} title="..." description="..." action={<Button/>} />` |
| `PageSkeleton` | `<PageSkeleton.Stats />`, `<PageSkeleton.List rows={5} />`, `<PageSkeleton.Detail />` |
| `BackToTop` | Drop inside a `<main>` element — listens to its scroll position, appears at > 400px. |

**Hooks** (`src/hooks/`):
- `useKeyboardShortcuts(handlers)` — registers global `keydown` listeners. Keys formatted as `"ctrl+k"`, `"alt+s"`, etc.
- `use-toast.ts` — `toast({ title, description, variant })`. Variants: `default | destructive | success | warning | info`.

**Page transitions:** The `.page-enter` CSS class (defined in `globals.css`) applies a 200ms fade-in+slide animation. Applied to `<main>` in `_dashboard.tsx` and `admin.tsx`.

### Database (PostgreSQL + Prisma)

Schema is at `backend/prisma/schema.prisma`. Core hierarchy:
```
Exam → Subject → Chapter → Topic → Question
User → TestSession → TestAnswer
User → UserProgress (per Topic)
User → AiConversation / AiStudyPlan / AiSavedQuestion / AiSuggestion
User → RefreshToken / OtpToken
```

Questions are polymorphic: optionally linked to `topicId`, `subjectId`, or `examId`.

Indexes exist on: `RefreshToken(userId)`, `OtpToken(userId)`, `TestSession(userId)`, `TestSession(examId)`, `TestSession(userId, status)`, `UserProgress(userId, status)`, `StudySession(userId, date)`, `AiConversation(userId)`, `AiConversation(userId, topicId)`, `AiSuggestion(userId, examId)`.

### AI Integration (Google Gemini)

Three services split the AI work:

| Feature | Service | Transport |
|---------|---------|-----------|
| AI Tutor chat | `geminiService.js` → `chat()` | REST |
| Study Plan | `geminiService.js` → `generateStudyPlan()` | REST |
| Question Generator | `geminiService.js` → `generateQuestions()` | REST |
| Trending suggestions | `geminiService.js` → `getTrendingSuggestions()` | REST |
| Weekly suggestions | `ai.service.js` → `generateSuggestionsAi()` | REST |
| Text Interview | `ai.service.js` → `handleInterviewWS()` | WS `/ws/interview` |
| **Voice (Gemini Live)** | `geminiLiveService.js` → `handleVoiceWS()` | WS `/ws/ai-voice` |

**Voice proxy protocol** (`geminiLiveService.js`):
1. Client sends `{ type:"auth", token, topicId?, examId? }` as first WS message.
2. Server verifies JWT, loads context, opens a server→Gemini WS, sends `setup` message.
3. Server sends `{ type:"ready" }` once Gemini confirms `setupComplete`.
4. Client sends `{ type:"audio", data:b64 }` and `{ type:"end_of_turn" }`.
5. Server relays back `{ type:"audio" }`, `{ type:"text" }`, `{ type:"turn_complete" }`.
6. On disconnect, AI text turns are saved to `AiConversation`.

Models: `gemini-1.5-flash` (REST, `GEMINI_MODEL` env) and `gemini-2.0-flash-live-001` (voice, `GEMINI_LIVE_MODEL` env).

## Key Conventions

- **Backend uses ESM** (`"type": "module"`) — always use `import`/`export`, never `require`.
- **Prisma client** is imported from `src/utils/prisma.js` (singleton). Never instantiate `new PrismaClient()` elsewhere.
- **JWT utilities** are in `src/utils/jwt.js`. Use `signAccessToken`/`verifyAccessToken` and `signRefreshToken`/`verifyRefreshToken`.
- **Helper utilities** are in `src/utils/helpers.js`: `paginate`, `calcScore`, `isSameDay`, etc.
- **Path alias** `@/` maps to `src/` in the frontend (configured in `vite.config.ts`).
- **shadcn/ui components** live in `src/components/ui/` — these are copied, not imported from a package. Edit them directly when needed.
- **Feature components** go in `src/components/{feature}/` (e.g., `exam/`, `test/`, `ai/`).
- **File naming**: `PascalCase.tsx` for React components, `camelCase.ts` for utilities/hooks/stores, `kebab-case.tsx` for TanStack Router route files.
- **Response shape** on the backend is always `{ success: true, data: ... }` for success, and `{ success: false, message: string, details?: any }` for errors (enforced by the global error handler).
- **`Header` requires `onSearchOpen` prop** — both `_dashboard.tsx` and `admin.tsx` own `SearchModal` state and pass the setter down.

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL              PostgreSQL connection string
                          ⚠ Special chars in passwords must be percent-encoded
                            e.g. @ → %40, so "Admin@1234" becomes "Admin%401234"
JWT_ACCESS_SECRET         Secret for access token signing (min 32 chars)
JWT_REFRESH_SECRET        Secret for refresh token signing (min 32 chars)
JWT_ACCESS_EXPIRES        Access token TTL (default: 15m)
JWT_REFRESH_EXPIRES       Refresh token TTL (default: 7d)
PORT                      Server port (default: 5000)
NODE_ENV                  development | production
GEMINI_API_KEY            Google AI Studio API key
GEMINI_MODEL              REST model (default: gemini-1.5-flash)
GEMINI_LIVE_MODEL         Voice model (default: models/gemini-2.0-flash-live-001)
WS_URL                    Public WS base URL returned by /api/ai/voice-session (default: ws://localhost:PORT)
EMAIL_HOST/PORT/USER/PASS/FROM  SMTP config
CLIENT_URL                Frontend URL (for CORS)
UPLOAD_DIR                Upload directory (default: uploads)
```

### Frontend (`frontend/.env`)
```
VITE_API_URL            Backend API base URL (default: http://localhost:5000/api)
VITE_WS_URL             WebSocket URL (default: ws://localhost:5000)
VITE_GEMINI_API_KEY     Gemini key for client-side Live Interview (optional)
```
