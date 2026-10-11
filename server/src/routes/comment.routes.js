import express from 'express';
import {
  getTaskComments,
  createComment,
  deleteComment
} from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/task/:taskId', getTaskComments);
router.post('/task/:taskId', createComment);
router.delete('/:id', deleteComment);

export default router;
