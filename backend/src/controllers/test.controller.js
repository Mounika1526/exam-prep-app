import { prisma } from '../utils/prisma.js';
import { calcScore, paginate, paginatedResponse } from '../utils/helpers.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';
import { updateStreak } from '../utils/streak.js';

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Fisher-Yates in-place shuffle */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Reorder an array of objects by a reference ID array */
function orderById(items, ids) {
  const map = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

// ─── POST /api/tests/create ───────────────────────────────────────────────────
// Body: { examId, subjectIds[], topicIds[], difficulty, questionCount, timeLimitMins }

export const createTest = async (req, res, next) => {
  try {
    const {
      examId,
      subjectIds,
      topicIds,
      difficulty,
      questionCount = 20,
      timeLimitMins,
    } = req.body;

    if (!examId) return sendError(res, 'examId is required', 400);

    const count = Math.min(200, Math.max(1, parseInt(questionCount) || 20));

    // Build filter: must match examId; optionally filter by difficulty;
    // optionally restrict to subjectIds OR topicIds
    const where = { examId };
    if (difficulty) where.difficulty = difficulty;

    const orFilters = [];
    if (Array.isArray(subjectIds) && subjectIds.length) {
      orFilters.push({ subjectId: { in: subjectIds } });
    }
    if (Array.isArray(topicIds) && topicIds.length) {
      orFilters.push({ topicId: { in: topicIds } });
    }
    if (orFilters.length) where.OR = orFilters;

    // Fetch only IDs for shuffling efficiency
    const pool = await prisma.question.findMany({
      where,
      select: { id: true },
    });

    if (pool.length === 0) {
      return sendError(res, 'No questions found matching the given filters', 404);
    }

    const selectedIds = shuffle(pool.map((q) => q.id)).slice(0, count);

    const session = await prisma.testSession.create({
      data: {
        userId:         req.user.id,
        examId,
        totalQuestions: selectedIds.length,
        questionIds:    selectedIds,
        timeLimitMins:  timeLimitMins ? parseInt(timeLimitMins) : null,
      },
    });

    // Return questions without correct answers or explanations
    const questions = await prisma.question.findMany({
      where:  { id: { in: selectedIds } },
      select: {
        id: true, text: true, type: true, options: true, difficulty: true,
        topic: { select: { id: true, title: true } },
      },
    });

    return sendCreated(res, {
      sessionId:      session.id,
      timeLimitMins:  session.timeLimitMins ?? null,
      totalQuestions: session.totalQuestions,
      questions:      orderById(questions, selectedIds),
    }, 'Test created');
  } catch (err) { next(err); }
};

// ─── GET /api/tests/:sessionId ────────────────────────────────────────────────
// Resume: returns questions (no answers), timeRemaining, and answers saved so far

export const getSession = async (req, res, next) => {
  try {
    const session = await prisma.testSession.findFirst({
      where:   { id: req.params.sessionId, userId: req.user.id },
      include: {
        exam:        { select: { title: true } },
        testAnswers: { select: { questionId: true, selectedAnswer: true } },
      },
    });
    if (!session) return sendError(res, 'Session not found', 404);

    if (session.status === 'COMPLETED') {
      return sendError(res, 'Session already submitted — use GET /:sessionId/result', 400);
    }

    // Questions without correct answers / explanations
    const rawQuestions = await prisma.question.findMany({
      where:  { id: { in: session.questionIds } },
      select: {
        id: true, text: true, type: true, options: true, difficulty: true,
        topic: { select: { id: true, title: true } },
      },
    });

    const questions = orderById(rawQuestions, session.questionIds);

    // Seconds remaining (null if no time limit)
    let timeRemaining = null;
    if (session.timeLimitMins) {
      const elapsedSecs = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
      timeRemaining = Math.max(0, session.timeLimitMins * 60 - elapsedSecs);
    }

    // answers keyed by questionId
    const answers = Object.fromEntries(
      session.testAnswers.map((a) => [a.questionId, a.selectedAnswer])
    );

    return sendSuccess(res, {
      sessionId:      session.id,
      examId:         session.examId,
      examTitle:      session.exam.title,
      status:         session.status,
      startedAt:      session.startedAt,
      timeLimitMins:  session.timeLimitMins ?? null,
      timeRemaining,
      totalQuestions: session.totalQuestions,
      answeredCount:  session.testAnswers.length,
      questions,
      answers,
    });
  } catch (err) { next(err); }
};

// ─── POST /api/tests/:sessionId/answer ───────────────────────────────────────
// Auto-save a single answer. Does NOT reveal correctness to the client.

export const submitAnswer = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { questionId, selectedAnswer, timeTakenSecs } = req.body;

    if (!questionId || selectedAnswer === undefined || selectedAnswer === null) {
      return sendError(res, 'questionId and selectedAnswer are required', 400);
    }

    const session = await prisma.testSession.findFirst({
      where:  { id: sessionId, userId: req.user.id, status: 'IN_PROGRESS' },
      select: { id: true, questionIds: true, totalQuestions: true },
    });
    if (!session) return sendError(res, 'Active session not found', 404);

    if (!session.questionIds.includes(questionId)) {
      return sendError(res, 'Question does not belong to this session', 400);
    }

    const question = await prisma.question.findUnique({
      where:  { id: questionId },
      select: { answer: true },
    });
    if (!question) return sendError(res, 'Question not found', 404);

    await prisma.testAnswer.upsert({
      where:  { sessionId_questionId: { sessionId, questionId } },
      update: { selectedAnswer, isCorrect: question.answer === selectedAnswer, timeTakenSecs: timeTakenSecs ?? null },
      create: { sessionId, questionId, selectedAnswer, isCorrect: question.answer === selectedAnswer, timeTakenSecs: timeTakenSecs ?? null },
    });

    const answeredCount = await prisma.testAnswer.count({ where: { sessionId } });

    return sendSuccess(res, {
      questionId,
      answeredCount,
      totalQuestions: session.totalQuestions,
    }, 'Answer saved');
  } catch (err) { next(err); }
};

// ─── POST /api/tests/:sessionId/submit ────────────────────────────────────────
// Finalize the test: grades all answers, calculates score, triggers streak.

export const submitTest = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.testSession.findFirst({
      where:   { id: sessionId, userId: req.user.id, status: 'IN_PROGRESS' },
      include: { testAnswers: { select: { isCorrect: true } } },
    });
    if (!session) return sendError(res, 'Active session not found', 404);

    const correct       = session.testAnswers.filter((a) => a.isCorrect).length;
    const incorrect     = session.testAnswers.length - correct;
    const unanswered    = session.questionIds.length - session.testAnswers.length;
    const score         = calcScore(correct, session.totalQuestions);
    const timeTakenSecs = Math.round((Date.now() - session.startedAt.getTime()) / 1000);

    await prisma.testSession.update({
      where: { id: sessionId },
      data:  { status: 'COMPLETED', submittedAt: new Date(), score, timeTakenSecs },
    });

    await updateStreak(req.user.id);

    return sendSuccess(res, {
      sessionId,
      score,
      correct,
      incorrect,
      unanswered,
      total:    session.totalQuestions,
      timeTakenSecs,
    }, 'Test submitted — use GET /:sessionId/result for full review');
  } catch (err) { next(err); }
};

// ─── GET /api/tests/:sessionId/result ────────────────────────────────────────
// Full review: questions with correct answers, explanations, and user's answers.

export const getResult = async (req, res, next) => {
  try {
    const session = await prisma.testSession.findFirst({
      where:   { id: req.params.sessionId, userId: req.user.id, status: 'COMPLETED' },
      include: {
        exam:        { select: { title: true } },
        testAnswers: {
          select: { questionId: true, selectedAnswer: true, isCorrect: true, timeTakenSecs: true },
        },
      },
    });
    if (!session) return sendError(res, 'Completed session not found', 404);

    const answeredIds   = new Set(session.testAnswers.map((a) => a.questionId));
    const unansweredIds = session.questionIds.filter((id) => !answeredIds.has(id));

    // Fetch question data for all questions in the session
    const [answeredQData, unansweredQData] = await Promise.all([
      answeredIds.size
        ? prisma.question.findMany({
            where:  { id: { in: [...answeredIds] } },
            select: {
              id: true, text: true, type: true, options: true,
              answer: true, explanation: true, difficulty: true,
              topic: { select: { id: true, title: true } },
            },
          })
        : [],
      unansweredIds.length
        ? prisma.question.findMany({
            where:  { id: { in: unansweredIds } },
            select: {
              id: true, text: true, type: true, options: true,
              answer: true, explanation: true, difficulty: true,
              topic: { select: { id: true, title: true } },
            },
          })
        : [],
    ]);

    const answerMap = new Map(session.testAnswers.map((a) => [a.questionId, a]));
    const qDataMap  = new Map([...answeredQData, ...unansweredQData].map((q) => [q.id, q]));

    // Build ordered questions list with user answers merged in
    const questions = session.questionIds.map((id) => {
      const q = qDataMap.get(id);
      if (!q) return null;
      const a = answerMap.get(id);
      return {
        ...q,
        userAnswer:    a?.selectedAnswer ?? null,
        isCorrect:     a?.isCorrect      ?? false,
        timeTakenSecs: a?.timeTakenSecs  ?? null,
      };
    }).filter(Boolean);

    // Analytics breakdown by difficulty
    const byDifficulty = {};
    for (const q of questions) {
      const d = q.difficulty;
      if (!byDifficulty[d]) byDifficulty[d] = { correct: 0, total: 0, accuracy: 0 };
      byDifficulty[d].total++;
      if (q.isCorrect) byDifficulty[d].correct++;
    }
    for (const d of Object.keys(byDifficulty)) {
      byDifficulty[d].accuracy = byDifficulty[d].total > 0
        ? Math.round((byDifficulty[d].correct / byDifficulty[d].total) * 100)
        : 0;
    }

    const correct    = session.testAnswers.filter((a) => a.isCorrect).length;
    const unanswered = unansweredIds.length;
    const incorrect  = session.testAnswers.length - correct;

    return sendSuccess(res, {
      sessionId:      session.id,
      examTitle:      session.exam.title,
      startedAt:      session.startedAt,
      submittedAt:    session.submittedAt,
      timeTakenSecs:  session.timeTakenSecs,
      timeLimitMins:  session.timeLimitMins ?? null,
      score:          session.score,
      correct,
      incorrect,
      unanswered,
      total:          session.totalQuestions,
      questions,
      analytics: { byDifficulty },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/tests ───────────────────────────────────────────────────────────
// Paginated history of the user's test sessions.

export const getUserSessions = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = paginate(req.query);

    const [sessions, total] = await Promise.all([
      prisma.testSession.findMany({
        where:   { userId: req.user.id },
        skip, take,
        orderBy: { startedAt: 'desc' },
        select: {
          // Deliberately omit questionIds (can be large, not needed for list)
          id: true, examId: true, startedAt: true, submittedAt: true,
          totalQuestions: true, score: true, timeTakenSecs: true,
          timeLimitMins: true, status: true,
          exam: { select: { title: true } },
        },
      }),
      prisma.testSession.count({ where: { userId: req.user.id } }),
    ]);

    return sendSuccess(res, paginatedResponse(sessions, total, { page, limit }));
  } catch (err) { next(err); }
};
