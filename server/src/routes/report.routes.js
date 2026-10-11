import express from 'express';
import { getWorkspaceReports, exportTasksCsv } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getWorkspaceReports);
router.get('/export-csv', exportTasksCsv);

export default router;
