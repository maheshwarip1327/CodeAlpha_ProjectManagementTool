import { Project } from '../models/Project.js';
import { ProjectMembership } from '../models/ProjectMembership.js';
import { WorkspaceMembership } from '../models/WorkspaceMembership.js';
import { Task } from '../models/Task.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { emitToWorkspace, emitToProject } from '../sockets/socketHandler.js';

export const createProject = async (req, res, next) => {
  try {
    const {
      workspaceId,
      name,
      key,
      description,
      status,
      priority,
      startDate,
      dueDate,
      visibility,
      tags,
      color
    } = req.body;

    // Verify workspace membership
    const wsMember = await WorkspaceMembership.findOne({
      workspace: workspaceId,
      user: req.user._id
    });

    if (!wsMember && req.user.systemRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace.'
      });
    }

    if (wsMember && wsMember.role === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'Viewers cannot create new projects.'
      });
    }

    // Generate project key if not given
    let projectKey = key;
    if (!projectKey) {
      const initials = name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
      projectKey = (initials.length >= 2 ? initials : name.slice(0, 3).toUpperCase()) || 'PRJ';
    }

    // Ensure key uniqueness within workspace
    let uniqueKey = projectKey;
    let counter = 1;
    while (await Project.findOne({ workspace: workspaceId, key: uniqueKey })) {
      uniqueKey = `${projectKey}${counter++}`;
    }

    const project = await Project.create({
      workspace: workspaceId,
      name,
      key: uniqueKey,
      description: description || '',
      status: status || 'active',
      priority: priority || 'medium',
      startDate: startDate || null,
      dueDate: dueDate || null,
      owner: req.user._id,
      visibility: visibility || 'workspace',
      tags: tags || [],
      color: color || '#4F46E5'
    });

    // Add creator as manager
    await ProjectMembership.create({
      project: project._id,
      user: req.user._id,
      role: 'manager'
    });

    await ActivityLog.create({
      workspace: workspaceId,
      project: project._id,
      user: req.user._id,
      action: 'created_project',
      details: { name: project.name, key: project.key }
    });

    emitToWorkspace(workspaceId, 'project:created', project);

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project
    });
  } catch (err) {
    next(err);
  }
};

export const getWorkspaceProjects = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspaceId query parameter is required.' });
    }

    const wsMember = await WorkspaceMembership.findOne({
      workspace: workspaceId,
      user: req.user._id
    });

    if (!wsMember && req.user.systemRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: not in workspace.' });
    }

    const isWsAdmin = wsMember?.role === 'owner' || wsMember?.role === 'admin' || req.user.systemRole === 'admin';

    const { status, priority, search, isArchived } = req.query;
    const query = {
      workspace: workspaceId,
      isArchived: isArchived === 'true'
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Filter private projects if not ws admin
    if (!isWsAdmin) {
      const myMemberships = await ProjectMembership.find({ user: req.user._id }).select('project');
      const myProjectIds = new Set(myMemberships.map((m) => m.project.toString()));

      projects = projects.filter((p) => {
        if (p.visibility === 'workspace') return true;
        if (p.owner._id.toString() === req.user._id.toString()) return true;
        return myProjectIds.has(p._id.toString());
      });
    }

    // Attach task summary metrics to each project
    const projectIds = projects.map((p) => p._id);
    const taskStats = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: '$project',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const statsMap = {};
    taskStats.forEach((s) => {
      statsMap[s._id.toString()] = {
        totalTasks: s.totalTasks,
        completedTasks: s.completedTasks,
        progress: s.totalTasks > 0 ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0
      };
    });

    const enriched = projects.map((p) => ({
      ...p.toObject(),
      stats: statsMap[p._id.toString()] || { totalTasks: 0, completedTasks: 0, progress: 0 }
    }));

    res.status(200).json({
      success: true,
      projects: enriched
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectDetails = async (req, res, next) => {
  try {
    const project = await Project.findById(req.project._id).populate('owner', 'name email avatar title');

    // Aggregate statistics
    const totalTasks = await Task.countDocuments({ project: project._id });
    const completedTasks = await Task.countDocuments({ project: project._id, status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ project: project._id, status: 'in_progress' });
    const overdueTasks = await Task.countDocuments({
      project: project._id,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' }
    });

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      project: {
        ...project.toObject(),
        role: req.projectRole,
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          overdueTasks,
          progress
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, startDate, dueDate, visibility, tags, color, isArchived } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (startDate !== undefined) updates.startDate = startDate;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (visibility) updates.visibility = visibility;
    if (tags) updates.tags = tags;
    if (color) updates.color = color;
    if (isArchived !== undefined) updates.isArchived = isArchived;

    const updated = await Project.findByIdAndUpdate(req.project._id, updates, {
      new: true,
      runValidators: true
    }).populate('owner', 'name email avatar');

    await ActivityLog.create({
      workspace: updated.workspace,
      project: updated._id,
      user: req.user._id,
      action: 'updated_project',
      details: updates
    });

    emitToProject(updated._id, 'project:updated', updated);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      project: updated
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    // Only owner or workspace admin can delete
    if (
      req.project.owner.toString() !== req.user._id.toString() &&
      req.workspaceRole !== 'owner' &&
      req.user.systemRole !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or workspace owner can delete this project.'
      });
    }

    const projectId = req.project._id;
    const workspaceId = req.project.workspace;

    await Task.deleteMany({ project: projectId });
    await ProjectMembership.deleteMany({ project: projectId });
    await Project.findByIdAndDelete(projectId);

    await ActivityLog.create({
      workspace: workspaceId,
      user: req.user._id,
      action: 'deleted_project',
      details: { projectName: req.project.name }
    });

    emitToWorkspace(workspaceId, 'project:deleted', { projectId });

    res.status(200).json({
      success: true,
      message: 'Project and all related tasks have been deleted.'
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectMembers = async (req, res, next) => {
  try {
    const members = await ProjectMembership.find({ project: req.project._id })
      .populate('user', 'name email avatar title')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      members: members.filter((m) => m.user)
    });
  } catch (err) {
    next(err);
  }
};

export const addProjectMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Ensure user is in the workspace
    const wsMember = await WorkspaceMembership.findOne({
      workspace: req.project.workspace,
      user: userId
    });

    if (!wsMember) {
      return res.status(400).json({
        success: false,
        message: 'User must be a member of the workspace before being assigned to this project.'
      });
    }

    const membership = await ProjectMembership.findOneAndUpdate(
      { project: req.project._id, user: userId },
      { role: role || 'contributor' },
      { upsert: true, new: true }
    ).populate('user', 'name email avatar title');

    emitToProject(req.project._id, 'project:member_added', membership);

    res.status(200).json({
      success: true,
      message: 'Project member updated successfully.',
      member: membership
    });
  } catch (err) {
    next(err);
  }
};

export const removeProjectMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project owner from the project.'
      });
    }

    await ProjectMembership.findOneAndDelete({
      project: req.project._id,
      user: userId
    });

    emitToProject(req.project._id, 'project:member_removed', { userId });

    res.status(200).json({
      success: true,
      message: 'Member removed from project.'
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectActivity = async (req, res, next) => {
  try {
    const activities = await ActivityLog.find({ project: req.project._id })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      activities
    });
  } catch (err) {
    next(err);
  }
};
