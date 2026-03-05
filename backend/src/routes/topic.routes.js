import { Router } from 'express';
import {
  getTopicsByChapter,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic,
} from '../controllers/topic.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTopicSchema, updateTopicSchema } from '../validations/content.schema.js';

const router = Router();

// ─── Authenticated reads ──────────────────────────────────────────────────────
// optionalAuth on GET /:id so user progress is attached when logged in
router.get('/chapter/:chapterId', authenticate, getTopicsByChapter);
router.get('/:id',                optionalAuth, getTopic);

// ─── Admin writes ─────────────────────────────────────────────────────────────
router.post(  '/',    authenticate, requireAdmin, validate(createTopicSchema), createTopic);
router.put(   '/:id', authenticate, requireAdmin, validate(updateTopicSchema), updateTopic);
router.delete('/:id', authenticate, requireAdmin, deleteTopic);

export default router;
