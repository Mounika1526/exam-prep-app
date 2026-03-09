import { prisma } from '../utils/prisma.js';
import { comparePassword, hashPassword } from '../utils/hash.js';
import { sendSuccess, sendError } from '../utils/response.js';

const userSelect = {
  id: true, name: true, email: true, role: true, avatar: true,
  targetExam: true, examDate: true, hoursPerDay: true, createdAt: true,
};

// ─── GET /api/users/profile ───────────────────────────────────────────────────

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { ...userSelect, streak: true },
    });
    return sendSuccess(res, user);
  } catch (err) { next(err); }
};

// ─── PUT /api/users/profile ───────────────────────────────────────────────────

export const updateProfile = async (req, res, next) => {
  try {
    const { name, targetExam, examDate, hoursPerDay } = req.body;
    const data = {};
    if (name !== undefined)        data.name = name;
    if (targetExam !== undefined)  data.targetExam = targetExam;
    if (examDate !== undefined)    data.examDate = examDate ? new Date(examDate) : null;
    if (hoursPerDay !== undefined) data.hoursPerDay = parseFloat(hoursPerDay);
    if (req.file)                  data.avatar = `/uploads/${req.file.filename}`;

    const user = await prisma.user.update({
      where:  { id: req.user.id },
      data,
      select: userSelect,
    });
    return sendSuccess(res, user, 'Profile updated');
  } catch (err) { next(err); }
};

// ─── PUT /api/users/password ──────────────────────────────────────────────────

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 'currentPassword and newPassword are required', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) return sendError(res, 'Current password is incorrect', 401);

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    return sendSuccess(res, null, 'Password updated successfully');
  } catch (err) { next(err); }
};

// ─── GET /api/users/dashboard ─────────────────────────────────────────────────

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const [
      totalProgress, completedTopics, testSessions,
      recentTests, streak, studySessions, weeklyStudy,
    ] = await Promise.all([
      prisma.userProgress.count({ where: { userId } }),
      prisma.userProgress.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.testSession.findMany({
        where:   { userId, status: 'COMPLETED' },
        select:  { score: true, startedAt: true },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
      prisma.testSession.findMany({
        where:   { userId, status: 'COMPLETED' },
        select:  {
          id: true, score: true, totalQuestions: true, submittedAt: true,
          exam: { select: { id: true, title: true } },
        },
        orderBy: { submittedAt: 'desc' },
        take: 3,
      }),
      prisma.streak.findUnique({ where: { userId } }),
      prisma.studySession.findMany({
        where:   { userId },
        orderBy: { date: 'desc' },
        take: 7,
        include: { subject: { select: { title: true } } },
      }),
      prisma.studySession.aggregate({
        where: { userId, date: { gte: weekAgo } },
        _sum:  { durationMins: true },
      }),
    ]);

    const avgScore =
      testSessions.length > 0
        ? testSessions.reduce((s, t) => s + (t.score || 0), 0) / testSessions.length
        : 0;

    return sendSuccess(res, {
      progress: {
        total:      totalProgress,
        completed:  completedTopics,
        percentage: totalProgress > 0
          ? Math.round((completedTopics / totalProgress) * 100)
          : 0,
      },
      tests: {
        total:    testSessions.length,
        avgScore: Math.round(avgScore * 100) / 100,
      },
      recentTests,
      hoursStudiedThisWeek: Math.round(((weeklyStudy._sum.durationMins ?? 0) / 60) * 10) / 10,
      streak,
      recentStudySessions: studySessions,
    });
  } catch (err) { next(err); }
};

// ─── GET /api/users/continue-topic ────────────────────────────────────────────

export const getContinueTopic = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const lastProgress = await prisma.userProgress.findFirst({
      where:   { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        status: true,
        topic: {
          select: {
            id: true, title: true, estimatedMins: true,
            chapter: {
              select: {
                id: true, title: true,
                subject: {
                  select: {
                    title: true,
                    exam: { select: { id: true, title: true } },
                  },
                },
                topics: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!lastProgress) return sendSuccess(res, null);

    const topicIds = lastProgress.topic.chapter.topics.map((t) => t.id);
    const completedInChapter = await prisma.userProgress.count({
      where: { userId, topicId: { in: topicIds }, status: 'COMPLETED' },
    });

    return sendSuccess(res, {
      topicId:       lastProgress.topic.id,
      topicTitle:    lastProgress.topic.title,
      topicStatus:   lastProgress.status,
      estimatedMins: lastProgress.topic.estimatedMins,
      chapterId:     lastProgress.topic.chapter.id,
      chapterTitle:  lastProgress.topic.chapter.title,
      subjectTitle:  lastProgress.topic.chapter.subject.title,
      examId:        lastProgress.topic.chapter.subject.exam.id,
      examTitle:     lastProgress.topic.chapter.subject.exam.title,
      chapterProgress: {
        completed: completedInChapter,
        total:     topicIds.length,
      },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/users/enrolled-exams ────────────────────────────────────────────

export const getEnrolledExams = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const allProgress = await prisma.userProgress.findMany({
      where:  { userId },
      select: {
        status: true,
        topic:  {
          select: {
            chapter: {
              select: {
                subject: {
                  select: {
                    exam: { select: { id: true, title: true, imageUrl: true, category: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (allProgress.length === 0) return sendSuccess(res, []);

    // Aggregate per exam
    const examMap = new Map();
    for (const p of allProgress) {
      const exam = p.topic.chapter.subject.exam;
      if (!examMap.has(exam.id)) {
        examMap.set(exam.id, { exam, total: 0, completed: 0 });
      }
      const entry = examMap.get(exam.id);
      entry.total += 1;
      if (p.status === 'COMPLETED') entry.completed += 1;
    }

    // Fetch total topic counts per exam from DB
    const examIds = [...examMap.keys()];
    const topicCounts = await prisma.$queryRaw`
      SELECT e.id AS "examId", COUNT(t.id)::int AS "totalTopics"
      FROM exams e
      JOIN subjects s ON s."examId" = e.id
      JOIN chapters c ON c."subjectId" = s.id
      JOIN topics   t ON t."chapterId" = c.id
      WHERE e.id = ANY(${examIds})
      GROUP BY e.id
    `;
    const countMap = new Map(topicCounts.map((r) => [r.examId, r.totalTopics]));

    const result = [...examMap.values()].map(({ exam, total, completed }) => {
      const totalTopics = countMap.get(exam.id) ?? total;
      return {
        examId:          exam.id,
        examTitle:       exam.title,
        examImageUrl:    exam.imageUrl,
        examCategory:    exam.category,
        topicsStarted:   total,
        topicsCompleted: completed,
        totalTopics,
        progressPct:     Math.round((completed / totalTopics) * 100),
      };
    });

    return sendSuccess(res, result);
  } catch (err) { next(err); }
};

// ─── GET /api/users/study-history ────────────────────────────────────────────

export const getStudyHistory = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const sessions = await prisma.studySession.findMany({
      where:   { userId: req.user.id, date: { gte: since } },
      include: { subject: { select: { title: true, icon: true } } },
      orderBy: { date: 'desc' },
    });
    return sendSuccess(res, sessions);
  } catch (err) { next(err); }
};
