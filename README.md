# ExamPrep — Full-Stack Exam & Interview Prep Application

A full-stack web application for exam preparation and interview practice, powered by Google Gemini AI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, TanStack Router/Query, shadcn/ui |
| Backend | Node.js (ESM), Express, Prisma ORM |
| Database | PostgreSQL 16 |
| AI | Google Gemini 1.5 Flash (REST) + Gemini 2.0 Flash Live (voice/WS) |
| Auth | JWT (access + refresh tokens), bcrypt, Nodemailer OTP |

## Features

- **Authentication** — Register, login, OTP email verification, JWT sessions
- **Exam Catalog** — Browse exams, subjects, chapters, topics
- **Study Mode** — Rich topic viewer with resources, videos, notes
- **Practice Tests** — Timed MCQ/TF/Fill-in-blank tests with analytics
- **AI Tutor** — Chat with Gemini AI about any topic
- **AI Study Plan** — Personalized plans based on exam date and daily hours
- **AI Question Generator** — Generate practice questions on demand
- **Live AI Interview** — Real-time voice/text interview simulation
- **Progress Tracking** — Per-topic status, streaks, study sessions
- **Admin Dashboard** — User management, content stats, charts

---

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- Google AI Studio API key ([aistudio.google.com](https://aistudio.google.com))
- (Optional) Gmail account for email OTP

---

## Quick Start — Docker

```bash
# 1. Clone
git clone <repo-url>
cd exam-prep-app

# 2. Configure backend env
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL, JWT secrets, GEMINI_API_KEY

# 3. Start postgres + backend
docker compose up -d

# 4. Run migrations inside container
docker compose exec backend npx prisma migrate deploy

# 5. Start frontend
cd frontend && npm install && npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

---

## Quick Start — Manual

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with DATABASE_URL, JWT secrets, GEMINI_API_KEY

npm run db:push    # Push schema to DB
npm run dev        # Start with nodemon (hot reload)
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### `backend/.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `JWT_ACCESS_SECRET` | Access token secret (min 32 chars) | required |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | required |
| `JWT_ACCESS_EXPIRES` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `GEMINI_API_KEY` | Google AI Studio key | required |
| `GEMINI_MODEL` | REST model ID | `gemini-1.5-flash` |
| `GEMINI_LIVE_MODEL` | Voice model ID | `models/gemini-2.0-flash-live-001` |
| `WS_URL` | Public WebSocket base URL | `ws://localhost:5000` |
| `CLIENT_URL` | Frontend URL (CORS) | `http://localhost:5173` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | — |
| `EMAIL_PASS` | SMTP password / app password | — |
| `EMAIL_FROM` | From address | — |
| `UPLOAD_DIR` | Upload directory | `uploads` |

> **Note:** Special characters in `DATABASE_URL` passwords must be percent-encoded (e.g. `@` → `%40`).

### `frontend/.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_WS_URL` | WebSocket base URL | `ws://localhost:5000` |
| `VITE_GEMINI_API_KEY` | Client-side Gemini key (optional, for Live Interview) | — |

---

## Development Commands

### Backend (`cd backend`)

```bash
npm run dev          # Start with nodemon (hot reload)
npm start            # Production start
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:migrate   # Create and run a migration
npm run db:push      # Push schema without a migration file
npm run db:seed      # Run prisma/seed.js
npm run db:studio    # Open Prisma Studio GUI
npm run db:reset     # Drop + re-migrate + re-seed
```

### Frontend (`cd frontend`)

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # TypeScript check + production build
npm run lint         # ESLint on src/
npm run preview      # Preview production build
npx shadcn@latest add <component>   # Add a shadcn/ui component
```

---

## Seeding Sample Data

### Option A — Prisma seed script (recommended for first-time setup)

```bash
cd backend
npm run db:seed
```

Creates:
- **Admin**: `admin@examprep.com` / `admin123`
- **Student**: `student@examprep.com` / `student123`
- UPSC, JEE, SDE exams with subjects, chapters, topics, and sample questions

### Option B — API seed endpoint (dev only, requires existing admin token)

```bash
curl -X POST http://localhost:5000/api/admin/seed \
  -H "Authorization: Bearer <admin-access-token>"
```

Creates GATE CS + MERN Interview Prep exams with richer content (3 subjects → 3 chapters → 3 topics → 10 MCQs each) plus sample progress and streak records. The endpoint is **idempotent** — safe to run multiple times.

---

## API Overview

All routes are prefixed with `/api`. Authentication uses `Authorization: Bearer <token>`.

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/health` | GET | — | Health check (uptime, env) |
| `/api/auth/register` | POST | — | Register |
| `/api/auth/login` | POST | — | Login |
| `/api/auth/refresh` | POST | cookie | Refresh access token |
| `/api/auth/logout` | POST | Bearer | Logout |
| `/api/exams` | GET | Bearer | List exams |
| `/api/subjects/:examId` | GET | Bearer | Subjects for exam |
| `/api/topics/:topicId` | GET | Bearer | Topic detail |
| `/api/questions` | GET | Bearer | Browse questions |
| `/api/tests/start` | POST | Bearer | Start test session |
| `/api/tests/:id/submit` | POST | Bearer | Submit answers |
| `/api/progress` | GET | Bearer | User progress |
| `/api/ai/chat` | POST | Bearer | AI tutor chat |
| `/api/ai/study-plan` | POST | Bearer | Generate study plan |
| `/api/admin/stats` | GET | ADMIN | Dashboard stats |
| `/api/admin/users` | GET | ADMIN | Paginated user list |
| `/api/admin/seed` | POST | ADMIN+dev | Seed sample data |

**WebSockets:**
- `ws://localhost:5000/ws/interview` — Text interview
- `ws://localhost:5000/ws/ai-voice` — Gemini Live voice

---

## Project Structure

```
exam-prep-app/
├── backend/
│   ├── server.js               # HTTP + WebSocket entry point
│   ├── Dockerfile
│   ├── src/
│   │   ├── app.js              # Express app (middleware + routes)
│   │   ├── routes/             # Thin route definitions
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # AI, auth, email logic
│   │   ├── middleware/         # auth, validate, error, rateLimiter
│   │   ├── utils/              # prisma singleton, jwt, helpers
│   │   └── validations/        # Zod schemas
│   └── prisma/
│       └── schema.prisma
├── frontend/
│   └── src/
│       ├── routes/             # TanStack Router file-based routes
│       ├── components/         # ai/, layout/, ui/ components
│       ├── contexts/           # AuthContext
│       ├── stores/             # Zustand stores
│       ├── hooks/              # Custom hooks
│       ├── lib/                # api.ts, queryClient, utils
│       └── types/              # Shared TypeScript interfaces
├── docker-compose.yml
└── README.md
```
