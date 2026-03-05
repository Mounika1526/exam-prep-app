import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

// ─── GET /api/topics/chapter/:chapterId ───────────────────────────────────────

export const getTopicsByChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;

    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
    if (!chapter) return sendError(res, 'Chapter not found', 404);

    const topics = await prisma.topic.findMany({
      where:   { chapterId },
      orderBy: { order: 'asc' },
      select: {
        id: true, chapterId: true, title: true, order: true,
        estimatedMins: true, videoUrl: true, createdAt: true,
        _count: { select: { questions: true } },
      },
    });

    return sendSuccess(res, topics);
  } catch (err) { next(err); }
};

// ─── GET /api/topics/:id — topic detail with resources ────────────────────────

export const getTopic = async (req, res, next) => {
  try {
    const topic = await prisma.topic.findUnique({
      where:   { id: req.params.id },
      include: {
        chapter: {
          select: {
            id: true, title: true,
            subject: {
              select: {
                id: true, title: true,
                exam: { select: { id: true, title: true } },
              },
            },
          },
        },
        _count: { select: { questions: true } },
      },
    });

    if (!topic) return sendError(res, 'Topic not found', 404);

    // Attach user's progress if authenticated
    let userProgress = null;
    if (req.user) {
      userProgress = await prisma.userProgress.findUnique({
        where: { userId_topicId: { userId: req.user.id, topicId: topic.id } },
      });
    }

    return sendSuccess(res, { ...topic, userProgress });
  } catch (err) { next(err); }
};

// ─── POST /api/topics — create (ADMIN) ────────────────────────────────────────

export const createTopic = async (req, res, next) => {
  try {
    const { chapterId, title, content, resources, videoUrl, order, estimatedMins } = req.validatedBody;

    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
    if (!chapter) return sendError(res, 'Chapter not found', 404);

    const topic = await prisma.topic.create({
      data: {
        chapterId, title,
        content:      content ?? null,
        resources:    resources ?? undefined,
        videoUrl:     videoUrl ?? null,
        order:        order ?? 0,
        estimatedMins: estimatedMins ?? null,
      },
      include: { _count: { select: { questions: true } } },
    });

    return sendCreated(res, topic, 'Topic created');
  } catch (err) { next(err); }
};

// ─── PUT /api/topics/:id — update (ADMIN) ─────────────────────────────────────

export const updateTopic = async (req, res, next) => {
  try {
    const topic = await prisma.topic.update({
      where:   { id: req.params.id },
      data:    req.validatedBody,
      include: { _count: { select: { questions: true } } },
    });
    return sendSuccess(res, topic, 'Topic updated');
  } catch (err) { next(err); }
};

// ─── DELETE /api/topics/:id — delete (ADMIN) ──────────────────────────────────

export const deleteTopic = async (req, res, next) => {
  try {
    await prisma.topic.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Topic deleted');
  } catch (err) { next(err); }
};
