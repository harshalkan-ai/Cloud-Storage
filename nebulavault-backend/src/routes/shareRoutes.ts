import { Router } from 'express';
import { shareResource } from '../controllers/shareController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All sharing operations require a logged-in user
router.use(authenticate);

// POST /api/shares -> Share a file or folder with another user by email
router.post('/', shareResource);

export default router;