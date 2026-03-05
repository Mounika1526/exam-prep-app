import { Router } from 'express';
import {
  getChaptersBySubject,
  getChapter,
  createChapter,
  updateChapter,
  deleteChapter,
} from '../controllers/chapter.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createChapterSchema, updateChapterSchema } from '../validations/content.schema.js';

const router = Router();

// ─── Authenticated reads ──────────────────────────────────────────────────────
router.get('/subject/:subjectId', authenticate, getChaptersBySubject);
router.get('/:id',                authenticate, getChapter);

// ─── Admin writes ─────────────────────────────────────────────────────────────
router.post(  '/',    authenticate, requireAdmin, validate(createChapterSchema), createChapter);
router.put(   '/:id', authenticate, requireAdmin, validate(updateChapterSchema), updateChapter);
router.delete('/:id', authenticate, requireAdmin, deleteChapter);

export default router;
