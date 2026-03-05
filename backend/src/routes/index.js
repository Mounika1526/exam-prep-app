import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import examRoutes from './exam.routes.js';
import subjectRoutes from './subject.routes.js';
import chapterRoutes from './chapter.routes.js';
import topicRoutes from './topic.routes.js';
import questionRoutes from './question.routes.js';
import testRoutes from './test.routes.js';
import progressRoutes from './progress.routes.js';
import sessionRoutes from './session.routes.js';
import streakRoutes from './streak.routes.js';
import aiRoutes from './ai.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth',     authRoutes);
router.use('/users',    userRoutes);
router.use('/exams',    examRoutes);
router.use('/subjects', subjectRoutes);
router.use('/chapters', chapterRoutes);
router.use('/topics',   topicRoutes);
router.use('/questions',questionRoutes);
router.use('/tests',    testRoutes);
router.use('/progress', progressRoutes);
router.use('/sessions', sessionRoutes);
router.use('/streaks',  streakRoutes);
router.use('/ai',       aiRoutes);
router.use('/admin',    adminRoutes);

export default router;
