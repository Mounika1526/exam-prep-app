import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { updateUserSchema } from '../validations/admin.schema.js';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getContentStats,
  seedDatabase,
} from '../controllers/admin.controller.js';

const router = Router();

// Every admin route requires a valid access token + ADMIN role
router.use(authenticate, requireAdmin);

router.get('/stats',        getDashboardStats);
router.get('/users',        getUsers);
router.get('/users/:id',    getUserById);
router.put('/users/:id',    validate(updateUserSchema), updateUser);
router.delete('/users/:id', deleteUser);
router.get('/content',      getContentStats);
router.post('/seed',        seedDatabase);

export default router;
