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

export const seedDatabase = async (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return sendError(res, 'Seed endpoint only available in development', 403);
  }

  try {
    const adminPass   = await bcrypt.hash('Admin@123', 10);
    const studentPass = await bcrypt.hash('Student@123', 10);

    // ── Users ────────────────────────────────────────────────────────────────
    const [admin, alice, bob, charlie] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'admin@examprep.com' },
        update: {},
        create: { name: 'Admin', email: 'admin@examprep.com', password: adminPass, role: 'ADMIN' },
      }),
      prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: { name: 'Alice Student', email: 'alice@example.com', password: studentPass, targetExam: 'GATE CS' },
      }),
      prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: { name: 'Bob Student', email: 'bob@example.com', password: studentPass, targetExam: 'MERN Interview Prep' },
      }),
      prisma.user.upsert({
        where: { email: 'charlie@example.com' },
        update: {},
        create: { name: 'Charlie Student', email: 'charlie@example.com', password: studentPass },
      }),
    ]);

    const students = [alice, bob, charlie];

    // ── Exam 1: GATE CS ──────────────────────────────────────────────────────
    let gateExam = await prisma.exam.findFirst({ where: { title: 'GATE CS' } });
    if (!gateExam) {
      gateExam = await prisma.exam.create({
        data: { title: 'GATE CS', category: 'Engineering', description: 'Graduate Aptitude Test in Engineering - Computer Science' },
      });
    }

    const gateSubjectDefs = [
      { title: 'Algorithms', icon: '⚡', chapters: ['Sorting & Searching', 'Dynamic Programming', 'Graph Algorithms'] },
      { title: 'Networks',   icon: '🌐', chapters: ['OSI Model', 'TCP/IP', 'Routing Protocols'] },
      { title: 'DBMS',       icon: '🗄️', chapters: ['Relational Model', 'SQL & Queries', 'Transactions & Concurrency'] },
    ];

    // ── Exam 2: MERN Interview Prep ──────────────────────────────────────────
    let mernExam = await prisma.exam.findFirst({ where: { title: 'MERN Interview Prep' } });
    if (!mernExam) {
      mernExam = await prisma.exam.create({
        data: { title: 'MERN Interview Prep', category: 'Web Development', description: 'Full-stack MERN interview preparation' },
      });
    }

    const mernSubjectDefs = [
      { title: 'MongoDB',  icon: '🍃', chapters: ['Schema Design', 'Aggregation Pipeline', 'Indexes & Performance'] },
      { title: 'React',    icon: '⚛️',  chapters: ['Hooks & State', 'Component Patterns', 'Performance Optimization'] },
      { title: 'Node.js',  icon: '🟢', chapters: ['Event Loop', 'Express Middleware', 'Streams & Buffers'] },
    ];

    const allTopicIds = [];

    for (const [exam, subjectDefs] of [[gateExam, gateSubjectDefs], [mernExam, mernSubjectDefs]]) {
      for (let si = 0; si < subjectDefs.length; si++) {
        const sd = subjectDefs[si];
        let subject = await prisma.subject.findFirst({ where: { examId: exam.id, title: sd.title } });
        if (!subject) {
          subject = await prisma.subject.create({ data: { examId: exam.id, title: sd.title, icon: sd.icon, order: si } });
        }

        for (let ci = 0; ci < sd.chapters.length; ci++) {
          const chTitle = sd.chapters[ci];
          let chapter = await prisma.chapter.findFirst({ where: { subjectId: subject.id, title: chTitle } });
          if (!chapter) {
            chapter = await prisma.chapter.create({ data: { subjectId: subject.id, title: chTitle, order: ci } });
          }

          for (let ti = 0; ti < 3; ti++) {
            const topicTitle = `${chTitle} — Part ${ti + 1}`;
            let topic = await prisma.topic.findFirst({ where: { chapterId: chapter.id, title: topicTitle } });
            if (!topic) {
              topic = await prisma.topic.create({
                data: { chapterId: chapter.id, title: topicTitle, order: ti, estimatedMins: 20,
                  content: `This topic covers key concepts in **${topicTitle}**.\n\nStudy the fundamentals, practice problems, and review common interview questions for this area.` },
              });
            }

            allTopicIds.push(topic.id);

            // 10 questions per topic
            const existingQCount = await prisma.question.count({ where: { topicId: topic.id } });
            if (existingQCount < 10) {
              await prisma.question.createMany({
                data: Array.from({ length: 10 - existingQCount }, (_, qi) => ({
                  topicId: topic.id,
                  examId:  exam.id,
                  text:    `Sample question ${existingQCount + qi + 1} for ${topicTitle}?`,
                  type:    'MCQ',
                  options: ['Option A', 'Option B', 'Option C', 'Option D'],
                  answer:  'Option A',
                  explanation: 'Option A is correct because it best represents the concept.',
                  difficulty: ['EASY', 'MEDIUM', 'HARD'][qi % 3],
                })),
              });
            }
          }
        }
      }
    }

    // ── UserProgress + Streak + StudySession for each student ────────────────
    const sampleTopicIds = allTopicIds.slice(0, 12); // use first 12 topics for sample progress
    const statuses = ['COMPLETED', 'IN_PROGRESS', 'NOT_STARTED'];

    for (const student of students) {
      for (let i = 0; i < sampleTopicIds.length; i++) {
        await prisma.userProgress.upsert({
          where:  { userId_topicId: { userId: student.id, topicId: sampleTopicIds[i] } },
          update: {},
          create: { userId: student.id, topicId: sampleTopicIds[i], status: statuses[i % 3] },
        });
      }

      await prisma.streak.upsert({
        where:  { userId: student.id },
        update: {},
        create: { userId: student.id, currentStreak: Math.floor(Math.random() * 14) + 1, longestStreak: Math.floor(Math.random() * 30) + 14 },
      });
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
