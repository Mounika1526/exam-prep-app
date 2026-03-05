import { Router } from 'express';
import {
  createTest,
  getSession,
  submitAnswer,
  submitTest,
  getResult,
  getUserSessions,
} from '../controllers/test.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// ─── Static paths first ───────────────────────────────────────────────────────
// IMPORTANT: /create must come before /:sessionId to avoid the param swallowing it
router.get('/',        getUserSessions);
router.post('/create', createTest);

// ─── Session lifecycle ────────────────────────────────────────────────────────
router.get( '/:sessionId',        getSession);
router.post('/:sessionId/answer', submitAnswer);
router.post('/:sessionId/submit', submitTest);
router.get( '/:sessionId/result', getResult);

export default router;
