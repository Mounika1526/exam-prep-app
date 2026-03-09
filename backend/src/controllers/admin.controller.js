import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

// ─── Time helpers ─────────────────────────────────────────────────────────────

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

export const getDashboardStats = async (req, res, next) => {
  try {
    const today   = startOfToday();
    const weekAgo = daysAgo(7);
    const monthAgo = daysAgo(30);

    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsersToday,
      activeUsersThisWeek,
      totalTestsTaken,
      testsToday,
      avgScoreResult,
      totalExams,
      totalQuestions,
      aiMessagesToday,
      aiMessagesThisMonth,
      topExams,
      userGrowth,
      testActivity,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true, createdAt: { gte: today } } }),
      prisma.user.count({ where: { isActive: true, createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { isActive: true, createdAt: { gte: monthAgo } } }),

      // Active = logged in (created a refresh token) within the window
      prisma.user.count({
        where: { isActive: true, refreshTokens: { some: { createdAt: { gte: today } } } },
      }),
      prisma.user.count({
        where: { isActive: true, refreshTokens: { some: { createdAt: { gte: weekAgo } } } },
      }),

      prisma.testSession.count({ where: { status: 'COMPLETED' } }),
      prisma.testSession.count({ where: { status: 'COMPLETED', submittedAt: { gte: today } } }),
      prisma.testSession.aggregate({
        _avg: { score: true },
        where: { status: 'COMPLETED', score: { not: null } },
      }),

      prisma.exam.count(),
      prisma.question.count(),
      prisma.aiConversation.count({ where: { timestamp: { gte: today } } }),
      prisma.aiConversation.count({ where: { timestamp: { gte: monthAgo } } }),

      // Top 5 exams by unique test-takers (uses raw SQL for the aggregation)
      prisma.$queryRaw`
        SELECT
          e.id                                       AS "examId",
          e.title                                    AS "examTitle",
          COUNT(DISTINCT ts."userId")::int           AS "enrolledCount",
          ROUND(AVG(ts.score)::numeric, 2)::float    AS "avgScore"
        FROM exams e
        LEFT JOIN test_sessions ts
          ON ts."examId" = e.id AND ts.status = 'COMPLETED'
        GROUP BY e.id, e.title
        ORDER BY "enrolledCount" DESC
        LIMIT 5
      `,

      // Daily new-user count for the last 30 days
      prisma.$queryRaw`
        SELECT DATE("createdAt")::text AS date, COUNT(*)::int AS count
        FROM users
        WHERE "createdAt" >= ${monthAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,

      // Daily completed-test count for the last 30 days
      prisma.$queryRaw`
        SELECT DATE("submittedAt")::text AS date, COUNT(*)::int AS count
        FROM test_sessions
        WHERE status = 'COMPLETED'
          AND "submittedAt" >= ${monthAgo}
        GROUP BY DATE("submittedAt")
        ORDER BY date ASC
      `,
    ]);

    return sendSuccess(res, {
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsersToday,
      activeUsersThisWeek,
      totalTestsTaken,
      testsToday,
      avgScoreOverall: Math.round((avgScoreResult._avg.score ?? 0) * 100) / 100,
      totalExams,
      totalQuestions,
      aiMessagesToday,
      aiMessagesThisMonth,
      topExams,
      userGrowth,
      testActivity,
    });
  } catch (err) { next(err); }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

export const getUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { search = '', role, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build parameterised WHERE conditions
    const conds = ['1=1'];
    const args  = [];

    if (search) {
      args.push(`%${search}%`);
      conds.push(`(u.name ILIKE $${args.length} OR u.email ILIKE $${args.length})`);
    }
    if (role === 'ADMIN' || role === 'STUDENT') {
      args.push(role);
      conds.push(`u.role::text = $${args.length}`);
    }

    const where = conds.join(' AND ');

    // Whitelist-only ORDER BY to prevent injection
    const sortMap = {
      createdAt:  'u."createdAt"',
      name:       'u.name',
      lastActive: 'MAX(rt."createdAt")',
    };
    const sortExpr = sortMap[sortBy] ?? 'u."createdAt"';
    const dir      = order === 'asc' ? 'ASC' : 'DESC';

    // Append LIMIT / OFFSET as the last two parameters
    const listArgs = [...args, limit, offset];
    const limitIdx  = listArgs.length - 1;  // 1-based
    const offsetIdx = listArgs.length;       // 1-based

    const [rows, counts] = await Promise.all([
      prisma.$queryRawUnsafe(
        `SELECT
           u.id,
           u.name,
           u.email,
           u.role::text               AS role,
           u.avatar,
           u."isActive"               AS "isActive",
           u."createdAt"              AS "createdAt",
           u."targetExam"             AS "targetExam",
           MAX(rt."createdAt")        AS "lastActive",
           COUNT(DISTINCT ts.id)::int AS "testCount",
           COUNT(DISTINCT ac.id)::int AS "aiCount"
         FROM users u
         LEFT JOIN refresh_tokens   rt ON rt."userId" = u.id
         LEFT JOIN test_sessions    ts ON ts."userId" = u.id
         LEFT JOIN ai_conversations ac ON ac."userId" = u.id
         WHERE ${where}
         GROUP BY u.id, u.name, u.email, u.role, u.avatar,
                  u."isActive", u."createdAt", u."targetExam"
         ORDER BY ${sortExpr} ${dir} NULLS LAST
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        ...listArgs,
      ),
      prisma.$queryRawUnsafe(
        `SELECT COUNT(DISTINCT u.id)::int AS count FROM users u WHERE ${where}`,
        ...args,
      ),
    ]);

    const total = Number(counts[0]?.count ?? 0);
    const users = rows.map((u) => ({
      id:          u.id,
      name:        u.name,
      email:       u.email,
      role:        u.role,
      avatar:      u.avatar,
      isActive:    u.isActive,
      createdAt:   u.createdAt,
      targetExam:  u.targetExam,
      lastActive:  u.lastActive,
      _count: { testSessions: u.testCount, aiConversations: u.aiCount },
    }));

    return sendSuccess(res, {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev:  page > 1,
      },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────

export const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        isActive: true, targetExam: true, examDate: true, hoursPerDay: true,
        createdAt: true, updatedAt: true,
        streak: true,
        _count: {
          select: {
            testSessions:    true,
            userProgress:    true,
            aiConversations: true,
            aiSavedQuestions: true,
          },
        },
        userProgress: {
          orderBy: { updatedAt: 'desc' },
          take: 20,
          select: {
            status: true,
            updatedAt: true,
            topic: {
              select: {
                id: true, title: true,
                chapter: {
                  select: {
                    title: true,
                    subject: {
                      select: {
                        title: true,
                        exam: { select: { title: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        testSessions: {
          where:   { status: 'COMPLETED' },
          orderBy: { submittedAt: 'desc' },
          take: 10,
          select: {
            id: true, score: true, totalQuestions: true,
            startedAt: true, submittedAt: true, timeTakenSecs: true,
            exam: { select: { id: true, title: true } },
          },
        },
        refreshTokens: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    if (!user) return sendError(res, 'User not found', 404);

    const { refreshTokens, ...rest } = user;
    return sendSuccess(res, { ...rest, lastActive: refreshTokens[0]?.createdAt ?? null });
  } catch (err) { next(err); }
};

// ─── PUT /api/admin/users/:id ─────────────────────────────────────────────────

export const updateUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id && req.validatedBody.isActive === false) {
      return sendError(res, 'Cannot deactivate your own account', 400);
    }

    const user = await prisma.user.update({
      where:  { id: req.params.id },
      data:   req.validatedBody,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return sendSuccess(res, user, 'User updated');
  } catch (err) { next(err); }
};

// ─── DELETE /api/admin/users/:id — soft-delete ────────────────────────────────

export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return sendError(res, 'Cannot deactivate your own account', 400);
    }

    await prisma.user.update({
      where: { id: req.params.id },
      data:  { isActive: false },
    });
    return sendSuccess(res, null, 'User deactivated');
  } catch (err) { next(err); }
};

// ─── POST /api/admin/seed ─────────────────────────────────────────────────────
// Idempotent — safe to run multiple times. Requires ADMIN token.

export const seedDatabase = async (req, res, next) => {
  try {
    const upsertSubject = (id, examId, title, icon, order) =>
      prisma.subject.upsert({ where: { id }, update: {}, create: { id, examId, title, icon, order } });

    const upsertChapter = (id, subjectId, title, order, description = '') =>
      prisma.chapter.upsert({ where: { id }, update: {}, create: { id, subjectId, title, order, description } });

    const upsertTopic = (id, chapterId, title, content, order, estimatedMins = 45) =>
      prisma.topic.upsert({ where: { id }, update: {}, create: { id, chapterId, title, content, order, estimatedMins } });

    const studentPass = await bcrypt.hash('Student@123', 10);

    // ── Demo users ───────────────────────────────────────────────────────────
    const demoUsers = [
      { email: 'alice@example.com',   name: 'Alice Chen',    targetExam: 'exam-sde',      hoursPerDay: 3 },
      { email: 'bob@example.com',     name: 'Bob Kumar',     targetExam: 'exam-backend',  hoursPerDay: 5 },
      { email: 'charlie@example.com', name: 'Charlie Park',  targetExam: 'exam-devops',   hoursPerDay: 4 },
      { email: 'diana@example.com',   name: 'Diana Sharma',  targetExam: 'exam-frontend', hoursPerDay: 3 },
      { email: 'ethan@example.com',   name: 'Ethan Brown',   targetExam: 'exam-ui',       hoursPerDay: 4 },
    ];

    const students = [];
    for (const u of demoUsers) {
      const examDate = new Date(); examDate.setDate(examDate.getDate() + 90);
      const s = await prisma.user.upsert({
        where:  { email: u.email },
        update: { targetExam: u.targetExam, hoursPerDay: u.hoursPerDay },
        create: { name: u.name, email: u.email, password: studentPass, role: 'STUDENT',
                  targetExam: u.targetExam, hoursPerDay: u.hoursPerDay, examDate },
      });
      students.push(s);
    }

    // ── Exams ────────────────────────────────────────────────────────────────
    await prisma.exam.upsert({ where: { id: 'exam-sde' }, update: {},
      create: { id: 'exam-sde', title: 'SDE Interview Prep',
        description: 'Comprehensive prep for Software Development Engineer interviews at top tech companies.',
        category: 'Engineering', isActive: true } });

    await prisma.exam.upsert({ where: { id: 'exam-frontend' }, update: {},
      create: { id: 'exam-frontend', title: 'Frontend Developer',
        description: 'Master HTML, CSS, JavaScript, React, and modern frontend architecture.',
        category: 'Engineering', isActive: true } });

    await prisma.exam.upsert({ where: { id: 'exam-backend' }, update: {},
      create: { id: 'exam-backend', title: 'Backend Developer',
        description: 'Cover REST APIs, databases, system design, Node.js, and cloud fundamentals.',
        category: 'Engineering', isActive: true } });

    await prisma.exam.upsert({ where: { id: 'exam-ui' }, update: {},
      create: { id: 'exam-ui', title: 'UI/UX Designer',
        description: 'Design principles, user research, Figma, accessibility, and product thinking.',
        category: 'Design', isActive: true } });

    await prisma.exam.upsert({ where: { id: 'exam-devops' }, update: {},
      create: { id: 'exam-devops', title: 'DevOps Engineer',
        description: 'CI/CD, Docker, Kubernetes, cloud platforms, IaC, and SRE fundamentals.',
        category: 'Engineering', isActive: true } });

    // ── SDE subjects / chapters / topics ────────────────────────────────────
    const sdeDsa = await upsertSubject('sde-dsa', 'exam-sde', 'Data Structures & Algorithms', '📊', 1);
    const sdeSd  = await upsertSubject('sde-sd',  'exam-sde', 'System Design',                '🏗️', 2);
    const sdeBeh = await upsertSubject('sde-beh', 'exam-sde', 'Behavioral & HR',               '🤝', 3);
    await upsertChapter('sde-ch1', 'sde-dsa', 'Arrays & Strings',    1); await upsertChapter('sde-ch2', 'sde-dsa', 'Trees & Graphs',      2);
    await upsertChapter('sde-ch3', 'sde-dsa', 'Dynamic Programming', 3); await upsertChapter('sde-ch4', 'sde-sd',  'Scalability Basics',  1);
    await upsertChapter('sde-ch5', 'sde-sd',  'Databases at Scale',  2); await upsertChapter('sde-ch6', 'sde-beh', 'STAR Method',         1);
    await upsertChapter('sde-ch7', 'sde-beh', 'Leadership & Conflict',2);
    const sdeTopics = await Promise.all([
      upsertTopic('sde-t1', 'sde-ch1', 'Two Pointers Technique', 'Two pointer patterns for sorted arrays.', 1, 40),
      upsertTopic('sde-t2', 'sde-ch1', 'Sliding Window', 'Fixed and variable-size window patterns.', 2, 45),
      upsertTopic('sde-t3', 'sde-ch1', 'Prefix Sums', 'Cumulative sums for range queries.', 3, 35),
      upsertTopic('sde-t4', 'sde-ch2', 'Binary Search Trees', 'Insertion, deletion, and traversal.', 1, 50),
      upsertTopic('sde-t5', 'sde-ch2', 'BFS & DFS', 'Graph traversal algorithms.', 2, 55),
      upsertTopic('sde-t6', 'sde-ch3', 'Fibonacci & Memoization', 'Top-down DP with caching.', 1, 40),
      upsertTopic('sde-t7', 'sde-ch3', 'Knapsack Problems', '0/1 knapsack and variations.', 2, 60),
      upsertTopic('sde-t8', 'sde-ch4', 'Load Balancing', 'Round-robin and consistent hashing.', 1, 50),
      upsertTopic('sde-t9', 'sde-ch5', 'Database Sharding', 'Horizontal partitioning strategies.', 1, 55),
      upsertTopic('sde-t10', 'sde-ch6', 'Tell Me About Yourself', 'Crafting a 90-second intro.', 1, 30),
      upsertTopic('sde-t11', 'sde-ch7', 'Handling Disagreements', 'STAR conflict resolution stories.', 1, 35),
    ]);

    // ── Frontend subjects / chapters / topics ────────────────────────────────
    const feCore  = await upsertSubject('fe-core',  'exam-frontend', 'Core Web Technologies', '🌐', 1);
    const feReact = await upsertSubject('fe-react', 'exam-frontend', 'React & Modern JS',     '⚛️', 2);
    const fePer   = await upsertSubject('fe-perf',  'exam-frontend', 'Performance & Testing', '🚀', 3);
    await upsertChapter('fe-ch1', 'fe-core',  'HTML & Accessibility', 1); await upsertChapter('fe-ch2', 'fe-core',  'CSS Fundamentals',    2);
    await upsertChapter('fe-ch3', 'fe-react', 'React Hooks',          1); await upsertChapter('fe-ch4', 'fe-react', 'State Management',    2);
    await upsertChapter('fe-ch5', 'fe-perf',  'Web Performance',      1); await upsertChapter('fe-ch6', 'fe-perf',  'Testing Strategies',  2);
    const feTopics = await Promise.all([
      upsertTopic('fe-t1',  'fe-ch1', 'Semantic HTML5',        'Elements and their meaning.',          1, 35),
      upsertTopic('fe-t2',  'fe-ch1', 'WCAG Accessibility',    'ARIA roles and contrast ratios.',      2, 45),
      upsertTopic('fe-t3',  'fe-ch2', 'Flexbox Layout',        'Main axis, cross axis patterns.',      1, 40),
      upsertTopic('fe-t4',  'fe-ch2', 'CSS Grid',              'fr units, grid-template-areas.',       2, 45),
      upsertTopic('fe-t5',  'fe-ch3', 'useState & useEffect',  'State updates and cleanup.',           1, 50),
      upsertTopic('fe-t6',  'fe-ch3', 'Custom Hooks',          'Extracting reusable logic.',           2, 45),
      upsertTopic('fe-t7',  'fe-ch4', 'Context API',           'createContext and useContext.',        1, 40),
      upsertTopic('fe-t8',  'fe-ch5', 'Core Web Vitals',       'LCP, FID, CLS targets.',               1, 40),
      upsertTopic('fe-t9',  'fe-ch6', 'React Testing Library', 'render, fireEvent, getByRole.',        1, 50),
      upsertTopic('fe-t10', 'fe-ch6', 'Cypress E2E',           'cy.visit, cy.get, cy.intercept.',      2, 55),
    ]);

    // ── Backend subjects / chapters / topics ─────────────────────────────────
    const beApi = await upsertSubject('be-api', 'exam-backend', 'API Design',     '🔌', 1);
    const beDb  = await upsertSubject('be-db',  'exam-backend', 'Databases',       '🗄️', 2);
    const beSec = await upsertSubject('be-sec', 'exam-backend', 'Security & Auth', '🔐', 3);
    await upsertChapter('be-ch1', 'be-api', 'REST Principles',        1); await upsertChapter('be-ch2', 'be-api', 'GraphQL Fundamentals',  2);
    await upsertChapter('be-ch3', 'be-db',  'SQL & Indexing',         1); await upsertChapter('be-ch4', 'be-db',  'NoSQL Databases',        2);
    await upsertChapter('be-ch5', 'be-sec', 'Authentication',         1); await upsertChapter('be-ch6', 'be-sec', 'Common Vulnerabilities', 2);
    const beTopics = await Promise.all([
      upsertTopic('be-t1',  'be-ch1', 'HTTP Methods & Status Codes', 'GET, POST, PUT, PATCH, DELETE.',          1, 40),
      upsertTopic('be-t2',  'be-ch1', 'RESTful Resource Design',     'Naming, versioning, pagination.',          2, 45),
      upsertTopic('be-t3',  'be-ch2', 'GraphQL vs REST',             'N+1 problem and DataLoader.',              1, 50),
      upsertTopic('be-t4',  'be-ch3', 'SQL Joins & Subqueries',      'INNER, LEFT, RIGHT joins.',                1, 55),
      upsertTopic('be-t5',  'be-ch3', 'Database Indexing',           'B-tree and covering indexes.',             2, 50),
      upsertTopic('be-t6',  'be-ch4', 'MongoDB Schema Design',       'Embedding vs referencing.',                1, 45),
      upsertTopic('be-t7',  'be-ch4', 'Redis Caching Patterns',      'Cache-aside, write-through.',              2, 40),
      upsertTopic('be-t8',  'be-ch5', 'JWT Authentication',          'Access tokens, refresh tokens.',           1, 50),
      upsertTopic('be-t9',  'be-ch5', 'OAuth2 & OpenID Connect',     'Authorization code flow, PKCE.',           2, 55),
      upsertTopic('be-t10', 'be-ch6', 'OWASP Top 10',               'Injection, XSS, CSRF and fixes.',           1, 60),
    ]);

    // ── UI/UX subjects / chapters / topics ───────────────────────────────────
    const uiPrinc    = await upsertSubject('ui-princ',    'exam-ui', 'Design Principles',   '🎨', 1);
    const uiResearch = await upsertSubject('ui-research', 'exam-ui', 'User Research',        '🔍', 2);
    const uiTools    = await upsertSubject('ui-tools',    'exam-ui', 'Tools & Prototyping',  '🛠️', 3);
    await upsertChapter('ui-ch1', 'ui-princ',    'Visual Design',          1); await upsertChapter('ui-ch2', 'ui-princ',    'Interaction Design',    2);
    await upsertChapter('ui-ch3', 'ui-research', 'Research Methods',       1); await upsertChapter('ui-ch4', 'ui-research', 'Personas & Journey Maps',2);
    await upsertChapter('ui-ch5', 'ui-tools',    'Figma',                  1); await upsertChapter('ui-ch6', 'ui-tools',    'Design Systems',         2);
    const uiTopics = await Promise.all([
      upsertTopic('ui-t1',  'ui-ch1', 'Typography Fundamentals', 'Type scale, leading, tracking.',           1, 40),
      upsertTopic('ui-t2',  'ui-ch1', 'Colour Theory & Contrast','Hue, saturation, contrast ratios.',        2, 40),
      upsertTopic('ui-t3',  'ui-ch2', 'Gestalt Principles',      'Proximity, similarity, closure.',          1, 45),
      upsertTopic('ui-t4',  'ui-ch2', 'Microinteractions',       'Triggers, rules, feedback, loops.',        2, 35),
      upsertTopic('ui-t5',  'ui-ch3', 'Usability Testing',       'Moderated vs unmoderated testing.',        1, 50),
      upsertTopic('ui-t6',  'ui-ch3', 'UX Surveys & Analytics',  'SUS, NPS, heat maps.',                     2, 45),
      upsertTopic('ui-t7',  'ui-ch4', 'User Personas',           'Goal-directed vs proto-personas.',         1, 40),
      upsertTopic('ui-t8',  'ui-ch5', 'Figma Auto Layout',       'Fill/hug/fixed sizing modes.',             1, 50),
      upsertTopic('ui-t9',  'ui-ch6', 'Design Tokens',           'Colour, spacing, typography tokens.',      1, 45),
      upsertTopic('ui-t10', 'ui-ch6', 'Component Variants',      'Variant properties in Figma.',             2, 45),
    ]);

    // ── DevOps subjects / chapters / topics ──────────────────────────────────
    const doContainers = await upsertSubject('do-containers', 'exam-devops', 'Containers & Orchestration', '🐳', 1);
    const doCicd       = await upsertSubject('do-cicd',       'exam-devops', 'CI/CD & Pipelines',          '⚙️', 2);
    const doCloud      = await upsertSubject('do-cloud',      'exam-devops', 'Cloud & Infrastructure',     '☁️', 3);
    await upsertChapter('do-ch1', 'do-containers', 'Docker',             1); await upsertChapter('do-ch2', 'do-containers', 'Kubernetes',         2);
    await upsertChapter('do-ch3', 'do-cicd',       'Pipeline Design',    1); await upsertChapter('do-ch4', 'do-cicd',       'GitHub Actions',     2);
    await upsertChapter('do-ch5', 'do-cloud',      'AWS Fundamentals',   1); await upsertChapter('do-ch6', 'do-cloud',      'IaC with Terraform', 2);
    const doTopics = await Promise.all([
      upsertTopic('do-t1',  'do-ch1', 'Docker Images & Containers', 'Dockerfile best practices.',               1, 50),
      upsertTopic('do-t2',  'do-ch1', 'Docker Networking',          'Bridge, host, overlay networks.',          2, 40),
      upsertTopic('do-t3',  'do-ch2', 'K8s Pods & Deployments',     'ReplicaSets, rolling updates.',            1, 55),
      upsertTopic('do-t4',  'do-ch2', 'K8s Services & Ingress',     'ClusterIP, NodePort, LoadBalancer.',       2, 55),
      upsertTopic('do-t5',  'do-ch3', 'CI/CD Pipeline Patterns',    'Blue-green, canary deployments.',          1, 50),
      upsertTopic('do-t6',  'do-ch4', 'GitHub Actions Workflows',   'on: triggers, jobs, matrix builds.',       1, 45),
      upsertTopic('do-t7',  'do-ch5', 'AWS Core Services',          'EC2, S3, RDS, IAM, VPC.',                  1, 60),
      upsertTopic('do-t8',  'do-ch5', 'AWS IAM & Security',         'Roles, policies, least-privilege.',        2, 50),
      upsertTopic('do-t9',  'do-ch6', 'Terraform Basics',           'init, plan, apply, state.',                1, 55),
      upsertTopic('do-t10', 'do-ch6', 'Terraform Modules',          'Reusable modules, remote state.',          2, 50),
    ]);

    // ── Questions (MCQ, one per topic) ───────────────────────────────────────
    const questionDefs = [
      { id:'q-sde-1',  examId:'exam-sde',      topicId:'sde-t1', subjectId:'sde-dsa', difficulty:'EASY',   text:'What is the time complexity of two-pointer on a sorted array?',       options:{A:'O(n²)',B:'O(n log n)',C:'O(n)',D:'O(1)'}, answer:'C', explanation:'Each pointer moves at most n steps.' },
      { id:'q-sde-2',  examId:'exam-sde',      topicId:'sde-t5', subjectId:'sde-dsa', difficulty:'EASY',   text:'Which data structure does BFS use?',                                  options:{A:'Stack',B:'Queue',C:'Heap',D:'Set'}, answer:'B', explanation:'BFS uses a queue (FIFO) to explore level by level.' },
      { id:'q-sde-3',  examId:'exam-sde',      topicId:'sde-t5', subjectId:'sde-dsa', difficulty:'HARD',   text:'Time complexity of DFS on a graph with V vertices and E edges?',     options:{A:'O(V)',B:'O(E)',C:'O(V + E)',D:'O(V × E)'}, answer:'C', explanation:'DFS visits every vertex and edge once: O(V + E).' },
      { id:'q-sde-4',  examId:'exam-sde',      topicId:'sde-t7', subjectId:'sde-dsa', difficulty:'MEDIUM', text:'What does "0/1" mean in the 0/1 knapsack problem?',                   options:{A:'Items can be split',B:'Each item is taken or not',C:'Only 0 or 1 items exist',D:'Values are binary'}, answer:'B', explanation:'Each item must be fully included or excluded.' },
      { id:'q-fe-1',   examId:'exam-frontend', topicId:'fe-t1',  subjectId:'fe-core',  difficulty:'EASY',   text:'Which HTML element represents a self-contained piece of content?',   options:{A:'<section>',B:'<article>',C:'<aside>',D:'<div>'}, answer:'B', explanation:'<article> is for independent, self-contained content.' },
      { id:'q-fe-2',   examId:'exam-frontend', topicId:'fe-t3',  subjectId:'fe-core',  difficulty:'EASY',   text:'In flexbox, which property controls spacing along the main axis?',   options:{A:'align-items',B:'justify-content',C:'align-content',D:'flex-direction'}, answer:'B', explanation:'justify-content distributes space along the main axis.' },
      { id:'q-fe-3',   examId:'exam-frontend', topicId:'fe-t5',  subjectId:'fe-react', difficulty:'EASY',   text:'When does useEffect run by default (no dependency array)?',           options:{A:'Only on mount',B:'Only on unmount',C:'After every render',D:'Never'}, answer:'C', explanation:'Without a dep array, useEffect runs after every render.' },
      { id:'q-fe-4',   examId:'exam-frontend', topicId:'fe-t8',  subjectId:'fe-perf',  difficulty:'MEDIUM', text:'What is the "good" threshold for Largest Contentful Paint (LCP)?',   options:{A:'Under 1s',B:'Under 2.5s',C:'Under 4s',D:'Under 5s'}, answer:'B', explanation:'Google defines a good LCP as 2.5 seconds or less.' },
      { id:'q-be-1',   examId:'exam-backend',  topicId:'be-t1',  subjectId:'be-api',   difficulty:'EASY',   text:'Which HTTP method is idempotent but NOT safe?',                       options:{A:'GET',B:'POST',C:'PUT',D:'DELETE'}, answer:'C', explanation:'PUT is idempotent but changes state, so not safe.' },
      { id:'q-be-2',   examId:'exam-backend',  topicId:'be-t4',  subjectId:'be-db',    difficulty:'EASY',   text:'Which JOIN returns only rows with matching values in both tables?',  options:{A:'LEFT JOIN',B:'RIGHT JOIN',C:'INNER JOIN',D:'FULL OUTER JOIN'}, answer:'C', explanation:'INNER JOIN returns the intersection of both tables.' },
      { id:'q-be-3',   examId:'exam-backend',  topicId:'be-t8',  subjectId:'be-sec',   difficulty:'EASY',   text:'What are the three parts of a JWT?',                                 options:{A:'Header, Payload, Signature',B:'Key, Value, Hash',C:'Issuer, Subject, Audience',D:'Token, Secret, Expiry'}, answer:'A', explanation:'JWTs are Base64URL-encoded Header.Payload.Signature.' },
      { id:'q-ui-1',   examId:'exam-ui',       topicId:'ui-t3',  subjectId:'ui-princ', difficulty:'EASY',   text:'Which Gestalt principle explains why nearby items are perceived as a group?', options:{A:'Similarity',B:'Continuity',C:'Proximity',D:'Closure'}, answer:'C', explanation:'Gestalt proximity: nearby objects are seen as related.' },
      { id:'q-ui-2',   examId:'exam-ui',       topicId:'ui-t8',  subjectId:'ui-tools', difficulty:'EASY',   text:'In Figma Auto Layout, what does "hug contents" mean?',               options:{A:'Fixed dimensions',B:'Fills parent',C:'Shrinks to fit contents',D:'Clips overflow'}, answer:'C', explanation:'"Hug contents" wraps the frame tightly around its children.' },
      { id:'q-do-1',   examId:'exam-devops',   topicId:'do-t1',  subjectId:'do-containers', difficulty:'EASY',  text:'Command to build a Docker image from a Dockerfile?',             options:{A:'docker run -build',B:'docker build -t myapp .',C:'docker create myapp',D:'docker image run .'}, answer:'B', explanation:'docker build -t tags the image; . is the build context.' },
      { id:'q-do-2',   examId:'exam-devops',   topicId:'do-t3',  subjectId:'do-containers', difficulty:'EASY',  text:'What is the smallest deployable unit in Kubernetes?',            options:{A:'Container',B:'Node',C:'Pod',D:'Deployment'}, answer:'C', explanation:'A Pod is the smallest unit wrapping one or more containers.' },
      { id:'q-do-3',   examId:'exam-devops',   topicId:'do-t7',  subjectId:'do-cloud',      difficulty:'EASY',  text:'What does AWS IAM stand for?',                                    options:{A:'Internet Access Manager',B:'Identity and Access Management',C:'Internal Application Monitor',D:'Integrated Auth Module'}, answer:'B', explanation:'IAM controls access to AWS resources.' },
    ];

    for (const q of questionDefs) {
      await prisma.question.upsert({ where: { id: q.id }, update: {}, create: q });
    }

    // ── Activity for demo users ───────────────────────────────────────────────
    const subjectsByExam = {
      'exam-sde':      [sdeDsa, sdeSd, sdeBeh],
      'exam-frontend': [feCore, feReact, fePer],
      'exam-backend':  [beApi, beDb, beSec],
      'exam-ui':       [uiPrinc, uiResearch, uiTools],
      'exam-devops':   [doContainers, doCicd, doCloud],
    };
    const topicsByExam = {
      'exam-sde': sdeTopics, 'exam-frontend': feTopics,
      'exam-backend': beTopics, 'exam-ui': uiTopics, 'exam-devops': doTopics,
    };

    for (const student of students) {
      const examId   = student.targetExam ?? 'exam-sde';
      const subjects = subjectsByExam[examId] ?? subjectsByExam['exam-sde'];
      const topics   = topicsByExam[examId]   ?? topicsByExam['exam-sde'];

      await prisma.streak.upsert({
        where:  { userId: student.id },
        update: {},
        create: { userId: student.id, currentStreak: Math.floor(Math.random() * 10) + 1, longestStreak: Math.floor(Math.random() * 20) + 10, lastActiveDate: new Date() },
      });

      for (let i = 0; i < 5; i++) {
        const subj = subjects[Math.floor(Math.random() * subjects.length)];
        const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 14));
        await prisma.studySession.create({
          data: { userId: student.id, subjectId: subj.id, date: d, durationMins: Math.floor(Math.random() * 60) + 20 },
        });
      }

      const statuses = ['COMPLETED', 'IN_PROGRESS', 'NOT_STARTED'];
      for (let i = 0; i < topics.length; i++) {
        await prisma.userProgress.upsert({
          where:  { userId_topicId: { userId: student.id, topicId: topics[i].id } },
          update: {},
          create: { userId: student.id, topicId: topics[i].id, status: statuses[i % statuses.length] },
        });
      }
    }

    const totalUsers     = await prisma.user.count();
    const totalExams     = await prisma.exam.count();
    const totalTopics    = await prisma.topic.count();
    const totalQuestions = await prisma.question.count();

    return sendSuccess(res, { totalUsers, totalExams, totalTopics, totalQuestions }, 'Database seeded successfully');
  } catch (err) { next(err); }
};

// ─── GET /api/admin/content ───────────────────────────────────────────────────

export const getContentStats = async (req, res, next) => {
  try {
    const [
      totalExams, activeExams,
      totalSubjects,
      totalChapters,
      totalTopics,
      totalQuestions,
      byDifficulty,
      byType,
      recentExams,
    ] = await Promise.all([
      prisma.exam.count(),
      prisma.exam.count({ where: { isActive: true } }),
      prisma.subject.count(),
      prisma.chapter.count(),
      prisma.topic.count(),
      prisma.question.count(),
      prisma.question.groupBy({ by: ['difficulty'], _count: { id: true } }),
      prisma.question.groupBy({ by: ['type'],       _count: { id: true } }),
      prisma.exam.findMany({
        take:    5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, category: true, isActive: true, createdAt: true,
          _count: { select: { subjects: true, questions: true } },
        },
      }),
    ]);

    return sendSuccess(res, {
      exams: {
        total:    totalExams,
        active:   activeExams,
        inactive: totalExams - activeExams,
      },
      subjects:  totalSubjects,
      chapters:  totalChapters,
      topics:    totalTopics,
      questions: {
        total:        totalQuestions,
        byDifficulty: Object.fromEntries(byDifficulty.map((r) => [r.difficulty, r._count.id])),
        byType:       Object.fromEntries(byType.map((r) => [r.type, r._count.id])),
      },
      recentExams,
    });
  } catch (err) { next(err); }
};
