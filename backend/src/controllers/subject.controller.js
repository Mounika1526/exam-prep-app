import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

const subjectInclude = {
  _count: { select: { chapters: true, questions: true } },
};

// ─── GET /api/subjects/exam/:examId ───────────────────────────────────────────

export const getSubjectsByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { id: true } });
    if (!exam) return sendError(res, 'Exam not found', 404);

    const subjects = await prisma.subject.findMany({
      where:   { examId },
      orderBy: { order: 'asc' },
      include: subjectInclude,
    });

    return sendSuccess(res, subjects);
  } catch (err) { next(err); }
};

// ─── GET /api/subjects/:id — subject with chapters ────────────────────────────

export const getSubject = async (req, res, next) => {
  try {
    const subject = await prisma.subject.findUnique({
      where:   { id: req.params.id },
      include: {
        _count: { select: { chapters: true, questions: true } },
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { topics: true } },
            topics: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, estimatedMins: true },
            },
          },
        },
      },
    });

    if (!subject) return sendError(res, 'Subject not found', 404);
    return sendSuccess(res, subject);
  } catch (err) { next(err); }
};

// ─── POST /api/subjects — create (ADMIN) ──────────────────────────────────────

export const createSubject = async (req, res, next) => {
  try {
    const { examId, title, order, icon } = req.validatedBody;

    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { id: true } });
    if (!exam) return sendError(res, 'Exam not found', 404);

    const subject = await prisma.subject.create({
      data:    { examId, title, order: order ?? 0, icon },
      include: subjectInclude,
    });

    return sendCreated(res, subject, 'Subject created');
  } catch (err) { next(err); }
};

// ─── PUT /api/subjects/:id — update (ADMIN) ───────────────────────────────────

export const updateSubject = async (req, res, next) => {
  try {
    const subject = await prisma.subject.update({
      where:   { id: req.params.id },
      data:    req.validatedBody,
      include: subjectInclude,
    });
    return sendSuccess(res, subject, 'Subject updated');
  } catch (err) { next(err); }
};

// ─── DELETE /api/subjects/:id — delete (ADMIN) ────────────────────────────────

export const deleteSubject = async (req, res, next) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Subject deleted');
  } catch (err) { next(err); }
};
