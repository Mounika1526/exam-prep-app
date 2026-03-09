import { prisma } from '../utils/prisma.js';
import { signAccessToken } from '../utils/jwt.js';
import {
  chat as geminiChat,
  generateQuestions as geminiGenerateQuestions,
  generateStudyPlan as geminiGenerateStudyPlan,
  getTrendingSuggestions,
} from '../services/geminiService.js';
import { generateSuggestionsAi } from '../services/ai.service.js';

// ─── Chat ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * body: { message, topicId?, conversationId? }
 *
 * Loads full topic → chapter → subject → exam context, fetches the last 10
 * messages, calls Gemini, persists both turns, returns { reply, conversationId }.
 */
export const chat = async (req, res, next) => {
  try {
    const { message, topicId, conversationId } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    // conversationId and topicId are the same concept — topics scope conversations
    const scopeId = topicId || conversationId || null;

    // ── Load full topic hierarchy ───────────────────────────────────────────
    let context = {};
    if (scopeId) {
      const topic = await prisma.topic.findUnique({
        where: { id: scopeId },
        select: {
          title: true,
          chapter: {
            select: {
              title: true,
              subject: {
                select: {
                  title: true,
                  exam: { select: { title: true } },
                },
              },
            },
          },
        },
      });

      if (topic) {
        context = {
          topicTitle:   topic.title,
          chapterTitle: topic.chapter?.title,
          subjectTitle: topic.chapter?.subject?.title,
          examTitle:    topic.chapter?.subject?.exam?.title,
          studentName:  req.user.name,
        };
      }
    }

    // ── Last 10 messages (chronological) ───────────────────────────────────
    const history = await prisma.aiConversation.findMany({
      where: { userId: req.user.id, topicId: scopeId ?? undefined },
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: { role: true, message: true },
    });
    history.reverse();

    // ── Call Gemini ─────────────────────────────────────────────────────────
    const messages = [...history, { role: 'USER', message }];
    const reply = await geminiChat(messages, context);

    // ── Persist both turns ──────────────────────────────────────────────────
    await prisma.aiConversation.createMany({
      data: [
        { userId: req.user.id, topicId: scopeId, role: 'USER',      message },
        { userId: req.user.id, topicId: scopeId, role: 'ASSISTANT',  message: reply },
      ],
    });

    res.json({ reply, conversationId: scopeId });
  } catch (err) { next(err); }
};

// ─── Chat History ─────────────────────────────────────────────────────────────

/**
 * GET /api/ai/chat/:topicId/history
 */
export const getChatHistory = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { limit = 50 } = req.query;

    const messages = await prisma.aiConversation.findMany({
      where: { userId: req.user.id, topicId },
      orderBy: { timestamp: 'asc' },
      take: parseInt(limit),
      select: { id: true, role: true, message: true, timestamp: true },
    });

    res.json({ conversationId: topicId, messages });
  } catch (err) { next(err); }
};

/** GET /api/ai/conversations  (legacy) */
export const getConversationHistory = async (req, res, next) => {
  try {
    const { topicId, examId, limit = 50 } = req.query;
    const where = { userId: req.user.id };
    if (topicId) where.topicId = topicId;
    if (examId)  where.examId  = examId;

    const conversations = await prisma.aiConversation.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: parseInt(limit),
    });
    res.json(conversations);
  } catch (err) { next(err); }
};

// ─── Clear Conversation ───────────────────────────────────────────────────────

/**
 * DELETE /api/ai/chat/:conversationId
 */
export const deleteChatConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    await prisma.aiConversation.deleteMany({
      where: { userId: req.user.id, topicId: conversationId },
    });
    res.json({ success: true, message: 'Conversation cleared' });
  } catch (err) { next(err); }
};

/** DELETE /api/ai/conversations  (legacy) */
export const clearConversation = async (req, res, next) => {
  try {
    const { topicId } = req.query;
    const where = { userId: req.user.id };
    if (topicId) where.topicId = topicId;
    await prisma.aiConversation.deleteMany({ where });
    res.json({ success: true, message: 'Conversation cleared' });
  } catch (err) { next(err); }
};

// ─── Question Generation ──────────────────────────────────────────────────────

/**
 * POST /api/ai/generate-questions
 * body: { topicId, count?(5), difficulty?('MEDIUM') }
 * Returns questions without saving.
 */
export const generateQuestions = async (req, res, next) => {
  try {
    const { topicId, count = 5, difficulty = 'MEDIUM' } = req.body;
    if (!topicId) {
      return res.status(400).json({ success: false, message: 'topicId is required' });
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        title: true,
        chapter: {
          select: {
            subject: {
              select: {
                title: true,
                exam: { select: { title: true } },
              },
            },
          },
        },
      },
    });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const raw = await geminiGenerateQuestions(
      topic.title,
      topic.chapter?.subject?.title,
      topic.chapter?.subject?.exam?.title,
      parseInt(count),
      difficulty,
    );

    // Normalize: AI returns `correctAnswer`, frontend expects `answer`
    const questions = raw.map(q => ({
      ...q,
      answer: q.answer ?? q.correctAnswer,
    }));

    res.json({ questions });
  } catch (err) { next(err); }
};

// ─── Save Question ────────────────────────────────────────────────────────────

/**
 * POST /api/ai/save-question
 * body: { question, options, correctAnswer, explanation, topicId?, difficulty? }
 */
export const saveQuestion = async (req, res, next) => {
  try {
    const { topicId, question, options, correctAnswer, explanation, difficulty } = req.body;
    if (!question || !correctAnswer) {
      return res.status(400).json({ success: false, message: 'question and correctAnswer are required' });
    }

    const saved = await prisma.aiSavedQuestion.create({
      data: {
        userId:      req.user.id,
        topicId:     topicId ?? null,
        question,
        options:     options ?? undefined,
        answer:      correctAnswer,
        explanation: explanation ?? null,
        difficulty:  difficulty ?? 'MEDIUM',
      },
    });

    res.status(201).json(saved);
  } catch (err) { next(err); }
};

/** POST /api/ai/saved-questions  (legacy — uses `answer` field) */
export const saveAiQuestion = async (req, res, next) => {
  try {
    const { topicId, question, options, answer, explanation, difficulty } = req.body;
    const saved = await prisma.aiSavedQuestion.create({
      data: {
        userId:      req.user.id,
        topicId:     topicId ?? null,
        question,
        options:     options ?? undefined,
        answer,
        explanation: explanation ?? null,
        difficulty:  difficulty ?? 'MEDIUM',
      },
    });
    res.status(201).json(saved);
  } catch (err) { next(err); }
};

/**
 * GET /api/ai/saved-questions
 */
export const getSavedQuestions = async (req, res, next) => {
  try {
    const { topicId } = req.query;
    const where = { userId: req.user.id };
    if (topicId) where.topicId = topicId;
    const questions = await prisma.aiSavedQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(questions);
  } catch (err) { next(err); }
};

// ─── Study Plan ───────────────────────────────────────────────────────────────

/**
 * POST /api/ai/study-plan
 * body: { examId, examDate, hoursPerDay }
 */
export const generateStudyPlan = async (req, res, next) => {
  try {
    const { examId, examDate, hoursPerDay } = req.body;
    if (!examId || !examDate || !hoursPerDay) {
      return res.status(400).json({
        success: false,
        message: 'examId, examDate, and hoursPerDay are required',
      });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        title: true,
        subjects: {
          select: {
            title: true,
            chapters: { select: { title: true } },
          },
        },
      },
    });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Weak areas: incomplete topics
    const weakProgress = await prisma.userProgress.findMany({
      where: { userId: req.user.id, status: { not: 'COMPLETED' } },
      include: { topic: { select: { title: true } } },
      take: 15,
    });
    const weakAreas = weakProgress.map((p) => p.topic.title);

    const subjects = exam.subjects.map((s) => ({
      name:     s.title,
      chapters: s.chapters.map((c) => c.title),
    }));

    const plan = await geminiGenerateStudyPlan(
      examDate,
      parseFloat(hoursPerDay),
      subjects,
      weakAreas,
    );

    const saved = await prisma.aiStudyPlan.create({
      data: {
        userId:      req.user.id,
        examId,
        examDate:    new Date(examDate),
        hoursPerDay: parseFloat(hoursPerDay),
        plan,
      },
    });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { examDate: new Date(examDate), hoursPerDay: parseFloat(hoursPerDay) },
    });

    res.json(saved);
  } catch (err) { next(err); }
};

/**
 * GET /api/ai/study-plans
 * Returns all saved study plans for the current user.
 */
export const getAllStudyPlans = async (req, res, next) => {
  try {
    const plans = await prisma.aiStudyPlan.findMany({
      where: { userId: req.user.id },
      orderBy: { generatedAt: 'desc' },
      select: { id: true, examId: true, examDate: true, hoursPerDay: true, generatedAt: true, plan: true },
    });
    res.json({ success: true, data: plans });
  } catch (err) { next(err); }
};

/**
 * GET /api/ai/study-plan/:examId
 * Returns the latest saved study plan for this user + exam.
 */
export const getStudyPlan = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const plan = await prisma.aiStudyPlan.findFirst({
      where: { userId: req.user.id, examId },
      orderBy: { generatedAt: 'desc' },
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'No study plan found for this exam' });
    }

    res.json(plan);
  } catch (err) { next(err); }
};

// ─── Suggestions ──────────────────────────────────────────────────────────────

/**
 * GET /api/ai/suggestions?examId=
 */
export const getSuggestions = async (req, res, next) => {
  try {
    const { examId } = req.query;
    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required' });
    }

    const cached = await prisma.aiSuggestion.findFirst({
      where: { userId: req.user.id, examId, expiresAt: { gt: new Date() } },
      orderBy: { generatedAt: 'desc' },
    });
    if (cached) return res.json(cached);

    const weakTopics = await prisma.userProgress.findMany({
      where: { userId: req.user.id, status: { not: 'COMPLETED' } },
      include: { topic: { select: { title: true } } },
      take: 10,
    });

    const suggestions = await generateSuggestionsAi(weakTopics, examId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const saved = await prisma.aiSuggestion.create({
      data: { userId: req.user.id, examId, suggestions, expiresAt },
    });

    res.json(saved);
  } catch (err) { next(err); }
};

// ─── Delete Saved Question ────────────────────────────────────────────────────

/**
 * DELETE /api/ai/saved-questions/:id
 */
export const deleteSavedQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.aiSavedQuestion.deleteMany({ where: { id, userId: req.user.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── Voice Session ────────────────────────────────────────────────────────────

/**
 * POST /api/ai/voice-session
 * Returns the Gemini Live WebSocket URL and a fresh short-lived access token.
 * The client connects to wsUrl and sends the token as its first auth message.
 */
export const voiceSession = async (req, res, next) => {
  try {
    const wsBase = process.env.WS_URL || `ws://localhost:${process.env.PORT || 5000}`;
    const wsUrl  = `${wsBase}/ws/ai-voice`;
    const token  = signAccessToken({ id: req.user.id, role: req.user.role });
    res.json({ success: true, data: { wsUrl, token } });
  } catch (err) { next(err); }
};

/**
 * GET /api/ai/trending?examId=
 */
export const getTrending = async (req, res, next) => {
  try {
    const { examId } = req.query;
    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required' });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { title: true, category: true },
    });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const trending = await getTrendingSuggestions(exam.title, exam.category);
    res.json({ trending });
  } catch (err) { next(err); }
};
