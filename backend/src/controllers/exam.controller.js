import { prisma } from '../utils/prisma.js';
import { paginate, paginatedResponse } from '../utils/helpers.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

// ─── Shared select/include shapes ─────────────────────────────────────────────

const examCounts = { _count: { select: { subjects: true, questions: true } } };

// Full tree: subjects → chapters → topics (lightweight topic list)
const examFullInclude = {
  subjects: {
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { chapters: true, questions: true } },
      chapters: {
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { topics: true } },
          topics: {
            orderBy: { order: 'asc' },
            select: {
              id: true, title: true, order: true,
              estimatedMins: true, videoUrl: true,
            },
          },
        },
      },
    },
  },
  _count: { select: { subjects: true, questions: true } },
};

// ─── GET /api/exams — list (public) ───────────────────────────────────────────

export const getExams = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = paginate(req.query);
    const { category, search, includeInactive } = req.query;

    const where = {};
    // Only admins can request inactive exams
    if (!(includeInactive === 'true' && req.user?.role === 'ADMIN')) {
      where.isActive = true;
    }
    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip,
        take,
        orderBy: { title: 'asc' },
        include: examCounts,
      }),
      prisma.exam.count({ where }),
    ]);

    return sendSuccess(res, paginatedResponse(exams, total, { page, limit }));
  } catch (err) { next(err); }
};

// ─── GET /api/exams/:id — detail with full subject tree ───────────────────────

export const getExam = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: examFullInclude,
    });

    if (!exam) return sendError(res, 'Exam not found', 404);
    return sendSuccess(res, exam);
  } catch (err) { next(err); }
};

// ─── POST /api/exams — create (ADMIN) ─────────────────────────────────────────

export const createExam = async (req, res, next) => {
  try {
    const { title, description, category } = req.validatedBody;
    const data = { title, category };
    if (description) data.description = description;
    if (req.file)    data.imageUrl = `/uploads/${req.file.filename}`;

    const exam = await prisma.exam.create({ data, include: examCounts });
    return sendCreated(res, exam, 'Exam created successfully');
  } catch (err) { next(err); }
};

// ─── PUT /api/exams/:id — update (ADMIN) ──────────────────────────────────────

export const updateExam = async (req, res, next) => {
  try {
    const data = { ...req.validatedBody };
    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;

    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data,
      include: examCounts,
    });
    return sendSuccess(res, exam, 'Exam updated');
  } catch (err) { next(err); }
};

// ─── DELETE /api/exams/:id — soft delete (ADMIN) ──────────────────────────────

export const deleteExam = async (req, res, next) => {
  try {
    await prisma.exam.update({
      where: { id: req.params.id },
      data:  { isActive: false },
    });
    return sendSuccess(res, null, 'Exam deactivated');
  } catch (err) { next(err); }
};

// ─── POST /api/exams/:id/enroll — student enrolls ─────────────────────────────

export const enrollExam = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where:  { id: req.params.id, isActive: true },
      select: { id: true, title: true },
    });
    if (!exam) return sendError(res, 'Exam not found or not active', 404);

    // Set user's target exam
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { targetExam: exam.title },
    });

    return sendSuccess(
      res,
      { examId: exam.id, examTitle: exam.title },
      `Enrolled in "${exam.title}"`
    );
  } catch (err) { next(err); }
};
