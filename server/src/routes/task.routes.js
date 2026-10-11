import express from 'express';
import {
  createTask,
  getProjectTasks,
  getMyTasks,
  getTaskDetails,
  updateTask,
  updateTaskStatus,
  deleteTask,
  toggleSubtask
} from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.js';
import { checkProjectAccess } from '../middleware/projectAuth.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema
} from '../validators/task.validator.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createTaskSchema), createTask);
router.get('/my-tasks', getMyTasks);
router.get('/project/:projectId', checkProjectAccess, getProjectTasks);
router.get('/:id', getTaskDetails);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.patch('/:id/status', validate(updateTaskStatusSchema), updateTaskStatus);
router.delete('/:id', deleteTask);
router.patch('/:id/subtasks/:subtaskId', toggleSubtask);

export default router;
