import { Router } from 'express';
import { moveToTrash, restoreFromTrash, getTrashItems } from '../controllers/trashController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All Trash routes are protected and require user authentication
router.use(authenticate);

// 1. GET /api/trash -> List all deleted files and folders for the logged-in user
router.get('/', getTrashItems);

// 2. PATCH /api/trash/move/:id -> Move a file or folder to trash (body: { resourceType: 'file' | 'folder' })
router.patch('/move/:id', moveToTrash);

// 3. PATCH /api/trash/restore/:id -> Restore a file or folder back to active drive (body: { resourceType: 'file' | 'folder' })
router.patch('/restore/:id', restoreFromTrash);

export default router;