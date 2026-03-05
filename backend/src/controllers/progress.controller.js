import { prisma } from '../utils/prisma.js';
import { isSameDay, isYesterday } from '../utils/helpers.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';
import { updateStreak } from '../utils/streak.js';

// ─── GET /api/progress ────────────────────────────────────────────────────────

export const getProgress = async (req, res, next) => {
  try {
    const progress = await prisma.userProgress.findMany({
      where:   { userId: req.user.id },
      include: {
        topic: {
          select: {
            title: true, estimatedMins: true,
            chapter: {
              select: {
                title: true,
                subject: { select: { title: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return sendSuccess(res, progress);
  } catch (err) { next(err); }
};

// ─── GET /api/progress/exam/:examId ───────────────────────────────────────────

export const getExamProgress = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true, title: true,
        subjects: {
          orderBy: { order: 'asc' },
          select: {
            id: true, title: true, icon: true, order: true,
            chapters: {
              orderBy: { order: 'asc' },
              select: {
                id: true, title: true, order: true,
                topics: {
                  orderBy: { order: 'asc' },
                  select: { id: true, title: true, estimatedMins: true, order: true },
                },
              },
            },
          },
        },
      },
    });

    if (!exam) return sendError(res, 'Exam not found', 404);

    // Collect all topic IDs for one-shot progress fetch
    const allTopicIds = exam.subjects.flatMap((s) =>
      s.chapters.flatMap((c) => c.topics.map((t) => t.id))
    );

    const progressList = await prisma.userProgress.findMany({
      where: { userId, topicId: { in: allTopicIds } },
      select: { topicId: true, status: true, notes: true },
    });

    const progressMap = new Map(progressList.map((p) => [p.topicId, p]));

    // Merge progress into the nested structure
    const subjects = exam.subjects.map((subject) => ({
      ...subject,
      chapters: subject.chapters.map((chapter) => ({
        ...chapter,
        topics: chapter.topics.map((topic) => {
          const prog = progressMap.get(topic.id);
          return {
            ...topic,
            status: prog?.status ?? 'NOT_STARTED',
            notes:  prog?.notes  ?? null,
          };
        }),
      })),
    }));

    const totalTopics     = allTopicIds.length;
    const completedTopics = progressList.filter((p) => p.status === 'COMPLETED').length;
    const overallPercent  = totalTopics > 0
      ? Math.round((completedTopics / totalTopics) * 100)
      : 0;

    return sendSuccess(res, {
      examId,
      examTitle: exam.title,
      subjects,
      totalTopics,
      completedTopics,
      overallPercent,
    });
  } catch (err) { next(err); }
};

// ─── PUT /api/progress/topic/:topicId ─────────────────────────────────────────

export const updateProgress = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { status, notes } = req.body;

    if (!status) return sendError(res, 'status is required', 400);

    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return sendError(res, `status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const progress = await prisma.userProgress.upsert({
      where:  { userId_topicId: { userId: req.user.id, topicId } },
      update: { status, notes: notes ?? undefined },
      create: { userId: req.user.id, topicId, status, notes },
    });

    if (status === 'COMPLETED') {
      await updateStreak(req.user.id);
    }

    return sendSuccess(res, progress, 'Progress updated');
  } catch (err) { next(err); }
};

// ─── GET /api/progress/weak-areas ─────────────────────────────────────────────

export const getWeakAreas = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const MIN_ANSWERS = 2;           // require at least this many attempts
    const WEAK_THRESHOLD = 0.5;      // below 50% accuracy

    // Fetch all test answers for this user where the question has a topicId
    const rawAnswers = await prisma.testAnswer.findMany({
      where: {
        session:  { userId },
        question: { topicId: { not: null } },
      },
      select: {
        isCorrect: true,
        question:  { select: { topicId: true } },
      },
    });

    // Aggregate by topicId
    const topicStats = {};
    for (const a of rawAnswers) {
      const tid = a.question.topicId;
      if (!tid) continue;
      if (!topicStats[tid]) topicStats[tid] = { correct: 0, total: 0 };
      topicStats[tid].total++;
      if (a.isCorrect) topicStats[tid].correct++;
    }

    const weakTopicIds = Object.entries(topicStats)
      .filter(([, s]) => s.total >= MIN_ANSWERS && s.correct / s.total < WEAK_THRESHOLD)
      .map(([id]) => id);

    if (weakTopicIds.length === 0) return sendSuccess(res, []);

    const topics = await prisma.topic.findMany({
      where:  { id: { in: weakTopicIds } },
      select: {
        id: true, title: true, estimatedMins: true,
        chapter: {
          select: {
            title: true,
            subject: { select: { title: true } },
          },
        },
      },
    });

    const result = topics.map((t) => ({
      ...t,
      correct:  topicStats[t.id].correct,
      total:    topicStats[t.id].total,
      accuracy: Math.round((topicStats[t.id].correct / topicStats[t.id].total) * 100),
    }));

    // Sort worst performers first
    result.sort((a, b) => a.accuracy - b.accuracy);

    return sendSuccess(res, result);
  } catch (err) { next(err); }
};

// ─── GET /api/progress/stats ──────────────────────────────────────────────────

export const getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [completedTopics, sessionAgg, testSessions] = await Promise.all([
      prisma.userProgress.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.studySession.aggregate({
        where: { userId },
        _sum:  { durationMins: true },
      }),
      prisma.testSession.findMany({
        where:  { userId, status: 'COMPLETED' },
        select: { score: true },
      }),
    ]);

    const totalMinutes  = sessionAgg._sum.durationMins ?? 0;
    const hoursStudied  = Math.round((totalMinutes / 60) * 100) / 100;
    const testsAttempted = testSessions.length;
    const avgScore = testsAttempted > 0
      ? Math.round(
          (testSessions.reduce((s, t) => s + (t.score ?? 0), 0) / testsAttempted) * 100
        ) / 100
      : 0;

    return sendSuccess(res, {
      totalTopicsDone: completedTopics,
      hoursStudied,
      testsAttempted,
      avgScore,
    });
  } catch (err) { next(err); }
};

// ─── GET /api/progress/subject/:subjectId ─────────────────────────────────────

export const getSubjectProgress = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    const [totalTopics, progressData] = await Promise.all([
      prisma.topic.count({ where: { chapter: { subjectId } } }),
      prisma.userProgress.groupBy({
        by:    ['status'],
        where: { userId: req.user.id, topic: { chapter: { subjectId } } },
        _count: { status: true },
      }),
    ]);

    const stats = { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    progressData.forEach(({ status, _count }) => { stats[status] = _count.status; });
    stats.NOT_STARTED = totalTopics - stats.IN_PROGRESS - stats.COMPLETED;

    return sendSuccess(res, { totalTopics, ...stats });
  } catch (err) { next(err); }
};

// ─── POST /api/progress/study-session ────────────────────────────────────────

export const logStudySession = async (req, res, next) => {
  try {
    const { subjectId, durationMins } = req.body;
    if (!subjectId || !durationMins) {
      return sendError(res, 'subjectId and durationMins are required', 400);
    }

    const session = await prisma.studySession.create({
      data: { userId: req.user.id, subjectId, durationMins: parseInt(durationMins) },
      include: { subject: { select: { title: true } } },
    });

    await updateStreak(req.user.id);
    return sendCreated(res, session, 'Study session logged');
  } catch (err) { next(err); }
};

// ─── GET /api/progress/streak ─────────────────────────────────────────────────

export const getStreak = async (req, res, next) => {
  try {
    const streak = await prisma.streak.findUnique({ where: { userId: req.user.id } });
    return sendSuccess(res, streak || { currentStreak: 0, longestStreak: 0 });
  } catch (err) { next(err); }
};
