# Backend Structure

## Directory Layout

```
backend/
├── server.js                    # Entry point (HTTP + WebSocket server)
├── package.json
├── .env.example
├── prisma/
│   ├── schema.prisma            # Full Prisma schema (15 models)
│   └── seed.js                  # Demo data seeder
└── src/
    ├── app.js                   # Express app (middleware, routes)
    ├── middleware/
    │   ├── auth.js              # JWT authentication / admin guard
    │   ├── validate.js          # Zod body/query validation factory
    │   ├── upload.js            # Multer file upload config
    │   └── error.js             # Global error handler
    ├── routes/
    │   ├── index.js             # Route aggregator (/api)
    │   ├── auth.routes.js       # POST /auth/register, /login, /refresh
    │   ├── user.routes.js       # GET/PATCH /users/profile, /dashboard
    │   ├── exam.routes.js       # CRUD /exams
    │   ├── subject.routes.js    # CRUD /subjects
    │   ├── chapter.routes.js    # CRUD /chapters
    │   ├── topic.routes.js      # CRUD /topics
    │   ├── question.routes.js   # CRUD /questions + bulk
    │   ├── test.routes.js       # POST /tests/start, answer, submit
    │   ├── progress.routes.js   # GET/POST /progress
    │   └── ai.routes.js         # POST /ai/chat, /study-plan, etc.
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── user.controller.js
    │   ├── exam.controller.js
    │   ├── subject.controller.js
    │   ├── chapter.controller.js
    │   ├── topic.controller.js
    │   ├── question.controller.js
    │   ├── test.controller.js
    │   ├── progress.controller.js
    │   └── ai.controller.js
    ├── services/
    │   ├── ai.service.js        # Gemini API integration + WS interview
    │   └── email.service.js     # Nodemailer email templates
    ├── schemas/
    │   ├── auth.schema.js       # Zod schemas for auth endpoints
    │   ├── exam.schema.js       # Zod schemas for exam CRUD
    │   └── question.schema.js   # Zod schemas for questions
    └── utils/
        ├── prisma.js            # Prisma client singleton
        ├── jwt.js               # signToken / verifyToken
        └── helpers.js           # paginate, calcScore, isSameDay, etc.
```

## API Reference

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | ✗ | Create account |
| POST | `/login` | ✗ | Login, returns JWT |
| GET | `/me` | ✓ | Current user |
| POST | `/refresh` | ✓ | Refresh JWT |

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | ✓ | Get profile |
| PATCH | `/profile` | ✓ | Update profile (supports avatar upload) |
| PATCH | `/password` | ✓ | Change password |
| GET | `/dashboard` | ✓ | Stats, streak, activity |
| GET | `/study-history` | ✓ | Study session history |

### Exams — `/api/exams`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✗ | List exams (paginated, filterable) |
| GET | `/:id` | ✗ | Exam details |
| GET | `/:id/subjects` | ✓ | Exam with full subject tree |
| POST | `/` | ADMIN | Create exam |
| PUT | `/:id` | ADMIN | Update exam |
| DELETE | `/:id` | ADMIN | Delete exam |

### Subjects, Chapters, Topics

All follow the same CRUD pattern:
- `GET /` — list (filterable by parent ID)
- `GET /:id` — single with children
- `POST /` — create (ADMIN)
- `PUT /:id` — update (ADMIN)
- `DELETE /:id` — delete (ADMIN)

### Questions — `/api/questions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✓ | List (filter by exam/subject/topic/difficulty/type) |
| GET | `/:id` | ✓ | Single question |
| POST | `/` | ADMIN | Create |
| POST | `/bulk` | ADMIN | Bulk create |
| PUT | `/:id` | ADMIN | Update |
| DELETE | `/:id` | ADMIN | Delete |

### Tests — `/api/tests`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/start` | ✓ | Start session (returns randomized questions) |
| POST | `/:sessionId/answer` | ✓ | Submit single answer (reveals correctness) |
| POST | `/:sessionId/submit` | ✓ | Submit test, calculate score |
| GET | `/sessions` | ✓ | User's test history |
| GET | `/sessions/:id` | ✓ | Session details |
| GET | `/sessions/:id/results` | ✓ | Full results with analytics |

### Progress — `/api/progress`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✓ | All user progress |
| GET | `/streak` | ✓ | Streak info |
| GET | `/subject/:id` | ✓ | Subject completion stats |
| POST | `/topic/:id` | ✓ | Update topic status |
| POST | `/study-session` | ✓ | Log a study session |

### AI — `/api/ai`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat` | ✓ | Chat with AI tutor |
| GET | `/conversations` | ✓ | Conversation history |
| DELETE | `/conversations` | ✓ | Clear conversation |
| POST | `/study-plan` | ✓ | Generate AI study plan |
| POST | `/generate-questions` | ✓ | Generate questions for a topic |
| POST | `/saved-questions` | ✓ | Save AI-generated question |
| GET | `/saved-questions` | ✓ | List saved questions |
| GET | `/suggestions` | ✓ | AI improvement suggestions |

### WebSocket — `ws://localhost:5000/ws/interview`

Messages:
```json
// Client → Server
{ "type": "message", "message": "Your answer text" }
{ "type": "reset" }

// Server → Client
{ "type": "greeting", "message": "Hello! I'm your AI interviewer..." }
{ "type": "response", "message": "AI response text" }
{ "type": "reset", "message": "Session reset" }
{ "type": "error", "message": "Error description" }
```

## Environment Variables

```env
DATABASE_URL            PostgreSQL connection string
JWT_SECRET              Secret for JWT signing (min 32 chars)
JWT_EXPIRES_IN          Token expiry (default: 7d)
PORT                    Server port (default: 5000)
NODE_ENV                development | production
GEMINI_API_KEY          Google AI Studio API key
GEMINI_MODEL            Model name (default: gemini-1.5-flash)
EMAIL_HOST              SMTP host
EMAIL_PORT              SMTP port
EMAIL_USER              SMTP username
EMAIL_PASS              SMTP password / app password
EMAIL_FROM              From address
CLIENT_URL              Frontend URL (for CORS)
MAX_FILE_SIZE           Max upload bytes (default: 5242880)
UPLOAD_DIR              Upload directory (default: uploads)
```

## Database Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations (development)
npm run db:push        # Push schema without migration
npm run db:seed        # Seed demo data
npm run db:studio      # Open Prisma Studio (GUI)
npm run db:reset       # Reset and re-seed
```
