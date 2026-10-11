import { Project } from '../models/Project.js';
import { WorkspaceMembership } from '../models/WorkspaceMembership.js';
import { ProjectMembership } from '../models/ProjectMembership.js';

export const checkProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // System admins bypass
    if (req.user.systemRole === 'admin') {
      req.project = project;
      req.projectRole = 'manager';
      return next();
    }

    // Verify workspace membership first
    const workspaceMember = await WorkspaceMembership.findOne({
      workspace: project.workspace,
      user: req.user._id
    });

    if (!workspaceMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this workspace.'
      });
    }

    // Workspace owner or workspace admin has full access
    if (workspaceMember.role === 'owner' || workspaceMember.role === 'admin') {
      req.project = project;
      req.workspaceRole = workspaceMember.role;
      req.projectRole = 'manager';
      return next();
    }

    // If project is owned by current user
    if (project.owner.toString() === req.user._id.toString()) {
      req.project = project;
      req.projectRole = 'manager';
      return next();
    }

    // If project is workspace-visible
    if (project.visibility === 'workspace') {
      // Find explicit project membership role if defined
      const projectMember = await ProjectMembership.findOne({
        project: project._id,
        user: req.user._id
      });
      req.project = project;
      req.projectRole = projectMember ? projectMember.role : (workspaceMember.role === 'viewer' ? 'viewer' : 'contributor');
      return next();
    }

    // If project is private, user MUST be an explicit member
    const directMember = await ProjectMembership.findOne({
      project: project._id,
      user: req.user._id
    });

    if (!directMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to access this private project.'
      });
    }

    req.project = project;
    req.projectRole = directMember.role;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireProjectManager = (req, res, next) => {
  if (req.user.systemRole === 'admin') return next();
  if (req.projectRole === 'manager') return next();
  return res.status(403).json({
    success: false,
    message: 'Access denied: Project manager permissions required.'
  });
};
