import { Router } from 'express';
import {
  chat,
  getChatHistory,
  getConversationHistory,
  deleteChatConversation,
  clearConversation,
  generateQuestions,
  saveQuestion,
  saveAiQuestion,
  getSavedQuestions,
  generateStudyPlan,
  getStudyPlan,
  getAllStudyPlans,
  getSuggestions,
  getTrending,
  voiceSession,
  deleteSavedQuestion,
} from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// ─── Chat ─────────────────────────────────────────────────────────────────────
router.post('/chat',                   chat);
router.get('/chat/:topicId/history',   getChatHistory);
router.delete('/chat/:conversationId', deleteChatConversation);

// ─── Conversations (legacy) ───────────────────────────────────────────────────
router.get('/conversations',           getConversationHistory);
router.delete('/conversations',        clearConversation);

// ─── Question Generation ──────────────────────────────────────────────────────
router.post('/generate-questions',     generateQuestions);
router.post('/save-question',          saveQuestion);
router.post('/saved-questions',        saveAiQuestion);   // legacy alias
router.get('/saved-questions',         getSavedQuestions);
router.delete('/saved-questions/:id',  deleteSavedQuestion);

// ─── Study Plan ───────────────────────────────────────────────────────────────
router.post('/study-plan',             generateStudyPlan);
router.get('/study-plans',             getAllStudyPlans);
router.get('/study-plan/:examId',      getStudyPlan);

// ─── Suggestions & Trending ───────────────────────────────────────────────────
router.get('/suggestions',             getSuggestions);
router.get('/trending',                getTrending);

// ─── Voice Session ────────────────────────────────────────────────────────────
router.post('/voice-session',          voiceSession);

export default router;
