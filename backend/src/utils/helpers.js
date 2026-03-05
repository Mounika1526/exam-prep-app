/**
 * Paginate a Prisma query result.
 */
export const paginate = (query = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

/**
 * Build a paginated response envelope.
 */
export const paginatedResponse = (data, total, { page, limit }) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});

/**
 * Pick only specified keys from an object.
 */
export const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {});

/**
 * Calculate percentage score.
 */
export const calcScore = (correct, total) =>
  total === 0 ? 0 : Math.round((correct / total) * 100 * 100) / 100;

/**
 * Check if two dates are on the same calendar day.
 */
export const isSameDay = (d1, d2) => {
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

/**
 * Check if a date is yesterday relative to today.
 */
export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};
