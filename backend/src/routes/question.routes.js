import { Router } from 'express';
import {
  getQuestions,
  getRandomQuestions,
  getQuestion,
  createQuestion,
  bulkCreateQuestions,
  updateQuestion,
  deleteQuestion,
} from '../controllers/question.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createQuestionSchema,
  updateQuestionSchema,
  bulkQuestionsSchema,
} from '../validations/content.schema.js';

const router = Router();

// ─── Authenticated reads ──────────────────────────────────────────────────────
// NOTE: /random and /bulk must come BEFORE /:id to avoid route conflicts
router.get('/random', authenticate, getRandomQuestions);
router.get('/',       authenticate, getQuestions);
router.get('/:id',    authenticate, getQuestion);

// ─── Admin writes ─────────────────────────────────────────────────────────────
router.post('/bulk',  authenticate, requireAdmin, validate(bulkQuestionsSchema),    bulkCreateQuestions);
router.post('/',      authenticate, requireAdmin, validate(createQuestionSchema),    createQuestion);
router.put( '/:id',   authenticate, requireAdmin, validate(updateQuestionSchema),    updateQuestion);
router.delete('/:id', authenticate, requireAdmin, deleteQuestion);

export default router;
