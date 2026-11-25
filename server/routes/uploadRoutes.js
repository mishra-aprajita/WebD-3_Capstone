/**
 * uploadRoutes.js
 * POST /api/upload — Upload a single image or video file.
 * Protected: requires a valid JWT access token.
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { anyUpload } from '../middleware/upload.js';
import { uploadFile } from '../controllers/uploadController.js';

const router = express.Router();

/**
 * POST /api/upload
 * Field name: 'file'
 * Returns: { url: string, mediaType: 'image' | 'video' }
 */
router.post('/', protect, anyUpload.single('file'), uploadFile);

export default router;
