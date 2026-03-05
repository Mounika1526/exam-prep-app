import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

// ─── GET /api/chapters/subject/:subjectId ─────────────────────────────────────

export const getChaptersBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    const subject = await prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true } });
    if (!subject) return sendError(res, 'Subject not found', 404);

    const chapters = await prisma.chapter.findMany({
      where:   { subjectId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { topics: true } } },
    });

    return sendSuccess(res, chapters);
  } catch (err) { next(err); }
};

// ─── GET /api/chapters/:id — chapter with topics ──────────────────────────────

export const getChapter = async (req, res, next) => {
  try {
    const chapter = await prisma.chapter.findUnique({
      where:   { id: req.params.id },
      include: {
        _count:  { select: { topics: true } },
        topics:  { orderBy: { order: 'asc' } },
      },
    });

    if (!chapter) return sendError(res, 'Chapter not found', 404);
    return sendSuccess(res, chapter);
  } catch (err) { next(err); }
};

// ─── POST /api/chapters — create (ADMIN) ──────────────────────────────────────

export const createChapter = async (req, res, next) => {
  try {
    const { subjectId, title, order, description } = req.validatedBody;

    const subject = await prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true } });
    if (!subject) return sendError(res, 'Subject not found', 404);

    const chapter = await prisma.chapter.create({
      data:    { subjectId, title, order: order ?? 0, description },
      include: { _count: { select: { topics: true } } },
    });

    return sendCreated(res, chapter, 'Chapter created');
  } catch (err) { next(err); }
};

// ─── PUT /api/chapters/:id — update (ADMIN) ───────────────────────────────────

export const updateChapter = async (req, res, next) => {
  try {
    const chapter = await prisma.chapter.update({
      where:   { id: req.params.id },
      data:    req.validatedBody,
      include: { _count: { select: { topics: true } } },
    });
    return sendSuccess(res, chapter, 'Chapter updated');
  } catch (err) { next(err); }
};

// ─── DELETE /api/chapters/:id — delete (ADMIN) ────────────────────────────────

export const deleteChapter = async (req, res, next) => {
  try {
    await prisma.chapter.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Chapter deleted');
  } catch (err) { next(err); }
};
