import { Router } from 'express';
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  enrollExam,
} from '../controllers/exam.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadExamImage } from '../middleware/upload.js';
import { createExamSchema, updateExamSchema } from '../validations/content.schema.js';

const router = Router();

// ─── Public (optional auth so admins see inactive exams) ──────────────────────
router.get('/',    optionalAuth, getExams);
router.get('/:id', optionalAuth, getExam);

// ─── Student ──────────────────────────────────────────────────────────────────
router.post('/:id/enroll', authenticate, enrollExam);

// ─── Admin ────────────────────────────────────────────────────────────────────
// File upload routes: Multer runs first so req.body text fields are parsed,
// then validate runs on the parsed body.
router.post(
  '/',
  authenticate,
  requireAdmin,
  uploadExamImage,
  validate(createExamSchema),
  createExam,
);
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  uploadExamImage,
  validate(updateExamSchema),
  updateExam,
);
router.delete('/:id', authenticate, requireAdmin, deleteExam);

export default router;
