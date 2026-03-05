import { prisma } from '../utils/prisma.js';
import { paginate, paginatedResponse } from '../utils/helpers.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

// ─── Shared select shape ───────────────────────────────────────────────────────

const questionSelect = {
  id: true, text: true, type: true, options: true, answer: true,
  explanation: true, difficulty: true, tags: true,
  topicId: true, subjectId: true, examId: true,
  createdAt: true, updatedAt: true,
};

// ─── Build where clause from query params ─────────────────────────────────────

function buildWhere(query) {
  const { examId, subjectId, topicId, difficulty, type, search, tags } = query;
  const where = {};

  if (examId)    where.examId    = examId;
  if (subjectId) where.subjectId = subjectId;
  if (topicId)   where.topicId   = topicId;
  if (difficulty) where.difficulty = difficulty;
  if (type)      where.type      = type;

  if (search) {
    where.OR = [
      { text:        { contains: search, mode: 'insensitive' } },
      { explanation: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (tags) {
    // tags=arrays,comma,separated  OR  tags[]=a&tags[]=b
    const tagList = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    if (tagList.length) where.tags = { hasSome: tagList };
  }

  return where;
}

// ─── GET /api/questions — list with filters ────────────────────────────────────

export const getQuestions = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = paginate(req.query);
    const where = buildWhere(req.query);

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select:  questionSelect,
      }),
      prisma.question.count({ where }),
    ]);

    return sendSuccess(res, paginatedResponse(questions, total, { page, limit }));
  } catch (err) { next(err); }
};

// ─── GET /api/questions/random — random questions for test mode ───────────────
// Query: examId (req), count (default 20), difficulty, subjectId

export const getRandomQuestions = async (req, res, next) => {
  try {
    const { examId, subjectId, topicId, difficulty, count = '20' } = req.query;

    if (!examId && !subjectId && !topicId) {
      return sendError(res, 'examId, subjectId, or topicId is required', 400);
    }

    const requestedCount = Math.min(100, Math.max(1, parseInt(count) || 20));
    const where = buildWhere({ examId, subjectId, topicId, difficulty });

    // Fetch all matching, then shuffle client-side (avoids raw SQL)
    const all = await prisma.question.findMany({
      where,
      select: {
        id: true, text: true, type: true, options: true,
        difficulty: true, tags: true,
      },
    });

    if (all.length === 0) {
      return sendError(res, 'No questions found for the given filters', 404);
    }

    // Fisher-Yates shuffle, then slice
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }

    return sendSuccess(res, {
      questions: all.slice(0, requestedCount),
      total:     all.length,
      returned:  Math.min(requestedCount, all.length),
    });
  } catch (err) { next(err); }
};

// ─── GET /api/questions/:id ────────────────────────────────────────────────────

export const getQuestion = async (req, res, next) => {
  try {
    const question = await prisma.question.findUnique({
      where:  { id: req.params.id },
      select: questionSelect,
    });
    if (!question) return sendError(res, 'Question not found', 404);
    return sendSuccess(res, question);
  } catch (err) { next(err); }
};

// ─── POST /api/questions — create (ADMIN) ─────────────────────────────────────

export const createQuestion = async (req, res, next) => {
  try {
    const { text, type, options, answer, explanation, difficulty, tags, topicId, subjectId, examId } =
      req.validatedBody;

    const question = await prisma.question.create({
      data: {
        text, type, answer, difficulty,
        tags:        tags ?? [],
        options:     options ?? undefined,
        explanation: explanation ?? null,
        topicId:     topicId   ?? null,
        subjectId:   subjectId ?? null,
        examId:      examId    ?? null,
        createdBy:   req.user.id,
      },
      select: questionSelect,
    });

    return sendCreated(res, question, 'Question created');
  } catch (err) { next(err); }
};

// ─── POST /api/questions/bulk — bulk create (ADMIN) ───────────────────────────

export const bulkCreateQuestions = async (req, res, next) => {
  try {
    const { questions } = req.validatedBody;

    const data = questions.map((q) => ({
      text:        q.text,
      type:        q.type ?? 'MCQ',
      options:     q.options ?? undefined,
      answer:      q.answer,
      explanation: q.explanation ?? null,
      difficulty:  q.difficulty ?? 'MEDIUM',
      tags:        q.tags ?? [],
      topicId:     q.topicId   ?? null,
      subjectId:   q.subjectId ?? null,
      examId:      q.examId    ?? null,
      createdBy:   req.user.id,
    }));

    const result = await prisma.question.createMany({ data, skipDuplicates: true });

    return sendCreated(res, { created: result.count, submitted: questions.length }, 'Questions created');
  } catch (err) { next(err); }
};

// ─── PUT /api/questions/:id — update (ADMIN) ──────────────────────────────────

export const updateQuestion = async (req, res, next) => {
  try {
    const question = await prisma.question.update({
      where:  { id: req.params.id },
      data:   req.validatedBody,
      select: questionSelect,
    });
    return sendSuccess(res, question, 'Question updated');
  } catch (err) { next(err); }
};

// ─── DELETE /api/questions/:id — delete (ADMIN) ───────────────────────────────

export const deleteQuestion = async (req, res, next) => {
  try {
    await prisma.question.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Question deleted');
  } catch (err) { next(err); }
};
