import { Router } from 'express';
import {
  getSubjectsByExam,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subject.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSubjectSchema, updateSubjectSchema } from '../validations/content.schema.js';

const router = Router();

// ─── Authenticated reads ──────────────────────────────────────────────────────
router.get('/exam/:examId', authenticate, getSubjectsByExam);
router.get('/:id',          authenticate, getSubject);

// ─── Admin writes ─────────────────────────────────────────────────────────────
router.post(  '/',    authenticate, requireAdmin, validate(createSubjectSchema), createSubject);
router.put(   '/:id', authenticate, requireAdmin, validate(updateSubjectSchema), updateSubject);
router.delete('/:id', authenticate, requireAdmin, deleteSubject);

export default router;
