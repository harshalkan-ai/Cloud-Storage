import { Router } from 'express';
import {
    getUploadUrl,
    getFileLink,
    getFiles,
    toggleStar
} from '../controllers/fileController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// 1. Request presigned upload ticket
router.post('/upload-ticket', getUploadUrl);

// 2. Get active files (with ?folderId= &search= &starred=)
router.get('/', getFiles);

// 3. Get 5-min signed view/download link
router.get('/view/:id', getFileLink);

// 4. Toggle star
router.patch('/star/:id', toggleStar);

export default router;