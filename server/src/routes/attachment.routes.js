import express from 'express';
import {
  uploadTaskAttachment,
  deleteTaskAttachment,
  getProjectFiles
} from '../controllers/attachment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

router.post('/task/:taskId', upload.single('file'), uploadTaskAttachment);
router.delete('/task/:taskId/:attachmentId', deleteTaskAttachment);
router.get('/project/:projectId', getProjectFiles);

export default router;
