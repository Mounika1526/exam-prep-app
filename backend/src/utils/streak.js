import { prisma } from './prisma.js';
import { isSameDay, isYesterday } from './helpers.js';

/**
 * Update a user's streak record.
 * - Same day  → no change
 * - Yesterday → increment
 * - Older     → reset to 1
 */
export async function updateStreak(userId) {
  const streak = await prisma.streak.findUnique({ where: { userId } });
  if (!streak) return;

  const today = new Date();
  let newCurrent = streak.currentStreak;

  if (isSameDay(streak.lastActiveDate, today)) {
    // Already counted today — nothing to do
  } else if (isYesterday(streak.lastActiveDate)) {
    newCurrent = streak.currentStreak + 1;   // consecutive day
  } else {
    newCurrent = 1;                          // streak broken; restart
  }

  await prisma.streak.update({
    where: { userId },
    data: {
      currentStreak:  newCurrent,
      longestStreak:  Math.max(streak.longestStreak, newCurrent),
      lastActiveDate: today,
    },
  });
}
