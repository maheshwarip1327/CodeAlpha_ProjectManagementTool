import express from 'express';
import {
  getSystemMetrics,
  listAllUsers,
  updateUserStatus,
  listAllWorkspaces,
  getSystemAuditLogs
} from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/metrics', getSystemMetrics);
router.get('/users', listAllUsers);
router.patch('/users/:id', updateUserStatus);
router.get('/workspaces', listAllWorkspaces);
router.get('/audit-logs', getSystemAuditLogs);

export default router;
