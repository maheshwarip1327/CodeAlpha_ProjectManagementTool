import express from 'express';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceDetails,
  updateWorkspace,
  getWorkspaceMembers,
  inviteMember
} from '../controllers/workspace.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema
} from '../validators/workspace.validator.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createWorkspaceSchema), createWorkspace);
router.get('/', getUserWorkspaces);
router.get('/:id', getWorkspaceDetails);
router.put('/:id', validate(updateWorkspaceSchema), updateWorkspace);
router.get('/:id/members', getWorkspaceMembers);
router.post('/:id/invite', validate(inviteMemberSchema), inviteMember);

export default router;
