import { prisma } from '../utils/prisma.js';
import { isSameDay } from '../utils/helpers.js';
import { sendSuccess } from '../utils/response.js';

// ─── GET /api/streaks ─────────────────────────────────────────────────────────
// Returns current streak data + a 30-day activity calendar.
// A day is marked active if the user completed a study session (durationMins > 0)
// or completed a topic on that day.

export const getStreak = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const CALENDAR_DAYS = 180;

    const today = new Date();
    const since = new Date();
    since.setDate(since.getDate() - (CALENDAR_DAYS - 1));
    since.setHours(0, 0, 0, 0);

    const [streak, studySessions, completedProgress] = await Promise.all([
      prisma.streak.findUnique({ where: { userId } }),

      prisma.studySession.findMany({
        where: { userId, date: { gte: since }, durationMins: { gt: 0 } },
        select: { date: true, durationMins: true },
      }),

      prisma.userProgress.findMany({
        where: { userId, status: 'COMPLETED', updatedAt: { gte: since } },
        select: { updatedAt: true },
      }),
    ]);

    // Build a map of date → total durationMins and a set of active days
    const durationByDay = new Map();
    for (const s of studySessions) {
      const key = s.date.toISOString().split('T')[0];
      durationByDay.set(key, (durationByDay.get(key) ?? 0) + s.durationMins);
    }

    const activeDays = new Set([
      ...studySessions.map((s) => s.date.toISOString().split('T')[0]),
      ...completedProgress.map((p) => p.updatedAt.toISOString().split('T')[0]),
    ]);

    // Build the calendar array: oldest → newest
    const calendar = [];
    for (let i = CALENDAR_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      calendar.push({
        date: key,
        active: activeDays.has(key),
        durationMins: durationByDay.get(key) ?? 0,
      });
    }

    const todayKey    = today.toISOString().split('T')[0];
    const isActiveToday = activeDays.has(todayKey);

    return sendSuccess(res, {
      currentStreak:  streak?.currentStreak  ?? 0,
      longestStreak:  streak?.longestStreak  ?? 0,
      lastActiveDate: streak?.lastActiveDate ?? null,
      isActiveToday,
      calendar,
    });
  } catch (err) { next(err); }
};
