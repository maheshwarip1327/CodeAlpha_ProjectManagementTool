import express from 'express';
import {
  createProject,
  getWorkspaceProjects,
  getProjectDetails,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getProjectActivity
} from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.js';
import { checkProjectAccess, requireProjectManager } from '../middleware/projectAuth.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema
} from '../validators/project.validator.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createProjectSchema), createProject);
router.get('/', getWorkspaceProjects);

// Project specific routes with authorization middleware
router.get('/:id', checkProjectAccess, getProjectDetails);
router.put('/:id', checkProjectAccess, requireProjectManager, validate(updateProjectSchema), updateProject);
router.delete('/:id', checkProjectAccess, requireProjectManager, deleteProject);
router.get('/:id/members', checkProjectAccess, getProjectMembers);
router.post('/:id/members', checkProjectAccess, requireProjectManager, validate(addProjectMemberSchema), addProjectMember);
router.delete('/:id/members/:userId', checkProjectAccess, requireProjectManager, removeProjectMember);
router.get('/:id/activity', checkProjectAccess, getProjectActivity);

export default router;
