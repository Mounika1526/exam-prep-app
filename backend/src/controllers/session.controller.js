import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';
import { updateStreak } from '../utils/streak.js';

// ─── POST /api/sessions/start ─────────────────────────────────────────────────
// Body: { subjectId }
// Creates a session record with durationMins = 0; the caller stores sessionId
// and later calls PUT /end/:sessionId with the actual duration.

export const startSession = async (req, res, next) => {
  try {
    const { subjectId } = req.body;
    if (!subjectId) return sendError(res, 'subjectId is required', 400);

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return sendError(res, 'Subject not found', 404);

    const session = await prisma.studySession.create({
      data: {
        userId:      req.user.id,
        subjectId,
        durationMins: 0,
      },
      include: { subject: { select: { title: true, icon: true } } },
    });

    return sendCreated(res, { sessionId: session.id, session }, 'Study session started');
  } catch (err) { next(err); }
};

// ─── PUT /api/sessions/end/:sessionId ────────────────────────────────────────
// Body: { durationMins }
// Updates the session duration and triggers a streak update.

export const endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { durationMins } = req.body;

    if (durationMins === undefined || durationMins === null) {
      return sendError(res, 'durationMins is required', 400);
    }
    const mins = parseInt(durationMins);
    if (isNaN(mins) || mins < 0) {
      return sendError(res, 'durationMins must be a non-negative integer', 400);
    }

    const existing = await prisma.studySession.findFirst({
      where: { id: sessionId, userId: req.user.id },
    });
    if (!existing) return sendError(res, 'Session not found', 404);

    const session = await prisma.studySession.update({
      where:   { id: sessionId },
      data:    { durationMins: mins },
      include: { subject: { select: { title: true, icon: true } } },
    });

    if (mins > 0) {
      await updateStreak(req.user.id);
    }

    return sendSuccess(res, session, 'Study session ended');
  } catch (err) { next(err); }
};

// ─── GET /api/sessions/history ────────────────────────────────────────────────
// Query: ?days=30 (default 30)
// Returns sessions grouped by date: [{ date, sessions[], totalMins }]

export const getHistory = async (req, res, next) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sessions = await prisma.studySession.findMany({
      where: {
        userId: req.user.id,
        date:   { gte: since },
        durationMins: { gt: 0 },   // exclude unfinished sessions
      },
      include: { subject: { select: { title: true, icon: true } } },
      orderBy: { date: 'desc' },
    });

    // Group by calendar date (YYYY-MM-DD)
    const byDate = {};
    for (const s of sessions) {
      const key = s.date.toISOString().split('T')[0];
      if (!byDate[key]) byDate[key] = { date: key, sessions: [], totalMins: 0 };
      byDate[key].sessions.push(s);
      byDate[key].totalMins += s.durationMins;
    }

    const grouped = Object.values(byDate).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    return sendSuccess(res, grouped);
  } catch (err) { next(err); }
};
