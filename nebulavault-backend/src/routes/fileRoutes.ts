import { Router } from 'express';
import {
    getUploadUrl,
    getFileLink,
    getFiles,
    toggleStar,
    uploadFileDirect,
    uploadMiddleware,
} from '../controllers/fileController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// 1. Direct fast multipart upload
router.post('/upload', uploadMiddleware.single('file'), uploadFileDirect);

// 2. Request presigned upload ticket (fallback)
router.post('/upload-ticket', getUploadUrl);

// 3. Get active files (with ?folderId= &search= &starred=)
router.get('/', getFiles);

// 4. Get 5-min signed view/download link
router.get('/view/:id', getFileLink);

// 5. Toggle star
router.patch('/star/:id', toggleStar);

export default router;