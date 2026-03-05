import { Router } from 'express';
import { startSession, endSession, getHistory } from '../controllers/session.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// NOTE: /history must come before /end/:sessionId to avoid route conflict
router.get('/history',           getHistory);
router.post('/start',            startSession);
router.put('/end/:sessionId',    endSession);

export default router;
