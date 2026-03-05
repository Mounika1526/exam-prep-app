import { Router } from 'express';
import {
  getProgress,
  getExamProgress,
  updateProgress,
  getSubjectProgress,
  getWeakAreas,
  getStats,
  logStudySession,
  getStreak,
} from '../controllers/progress.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// ─── Static paths first (before any /:param routes) ──────────────────────────
router.get('/',               getProgress);
router.get('/streak',         getStreak);
router.get('/weak-areas',     getWeakAreas);
router.get('/stats',          getStats);

// ─── Parameterised reads ──────────────────────────────────────────────────────
router.get('/exam/:examId',         getExamProgress);
router.get('/subject/:subjectId',   getSubjectProgress);

// ─── Writes ───────────────────────────────────────────────────────────────────
router.put('/topic/:topicId',  updateProgress);
router.post('/study-session',  logStudySession);

export default router;
