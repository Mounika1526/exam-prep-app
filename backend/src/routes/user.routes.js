import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  getDashboardStats,
  getStudyHistory,
  getContinueTopic,
  getEnrolledExams,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', uploadAvatar, updateProfile);
router.patch('/password', updatePassword);
router.get('/dashboard', getDashboardStats);
router.get('/study-history', getStudyHistory);
router.get('/continue-topic', getContinueTopic);
router.get('/enrolled-exams', getEnrolledExams);

export default router;
