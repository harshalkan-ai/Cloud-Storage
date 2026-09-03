import { Router } from 'express';
import { createFolder, getFolders } from '../controllers/folderController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// We apply the 'authenticate' middleware to ALL folder routes
// This means you MUST be logged in to use any of these
router.use(authenticate);

// POST /api/folders -> Create a folder
router.post('/', createFolder);

// GET /api/folders -> Get folders (use ?parentId=ID for subfolders)
router.get('/', getFolders);

export default router;