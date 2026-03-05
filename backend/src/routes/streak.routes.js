import { Router } from 'express';
import { getStreak } from '../controllers/streak.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getStreak);

export default router;
