import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { WorkspaceMembership } from '../models/WorkspaceMembership.js';
import { User } from '../models/User.js';

export const getWorkspaceReports = async (req, res, next) => {
  try {
    const { workspaceId, projectId, startDate, endDate } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspaceId is required.' });
    }

    const wsMember = await WorkspaceMembership.findOne({
      workspace: workspaceId,
      user: req.user._id
    });

    if (!wsMember && req.user.systemRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: not in workspace.' });
    }

    // Build base task filter
    const taskFilter = { workspace: workspaceId };
    if (projectId) {
      taskFilter.project = projectId;
    }
    if (startDate || endDate) {
      taskFilter.createdAt = {};
      if (startDate) taskFilter.createdAt.$gte = new Date(startDate);
      if (endDate) taskFilter.createdAt.$lte = new Date(endDate);
    }

    // Fetch all matched tasks
    const tasks = await Task.find(taskFilter).populate('assignee', 'name email').populate('project', 'name key');

    // 1. Status breakdown
    const statusCounts = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      in_review: 0,
      completed: 0
    };

    // 2. Priority breakdown
    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };

    // 3. Overdue & deadlines
    let overdueCount = 0;
    let dueTodayCount = 0;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 4. Team workload
    const workloadMap = {};

    tasks.forEach((t) => {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
      if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;

      if (t.dueDate) {
        const due = new Date(t.dueDate);
        if (due < now && t.status !== 'completed') {
          overdueCount++;
        }
        if (due >= todayStart && due <= todayEnd && t.status !== 'completed') {
          dueTodayCount++;
        }
      }

      const assigneeName = t.assignee ? t.assignee.name : 'Unassigned';
      if (!workloadMap[assigneeName]) {
        workloadMap[assigneeName] = { total: 0, completed: 0, inProgress: 0 };
      }
      workloadMap[assigneeName].total++;
      if (t.status === 'completed') workloadMap[assigneeName].completed++;
      if (t.status === 'in_progress') workloadMap[assigneeName].inProgress++;
    });

    const teamWorkload = Object.entries(workloadMap).map(([name, data]) => ({
      name,
      ...data
    }));

    // 5. Project metrics
    const projects = await Project.find({ workspace: workspaceId, isArchived: false });
    const projectSummary = projects.map((p) => {
      const pTasks = tasks.filter((t) => t.project?._id?.toString() === p._id.toString());
      const total = pTasks.length;
      const completed = pTasks.filter((t) => t.status === 'completed').length;
      return {
        id: p._id,
        name: p.name,
        key: p.key,
        totalTasks: total,
        completedTasks: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });

    res.status(200).json({
      success: true,
      metrics: {
        totalTasks: tasks.length,
        completedTasks: statusCounts.completed,
        inProgressTasks: statusCounts.in_progress,
        overdueTasks: overdueCount,
        dueTodayTasks: dueTodayCount,
        completionRate: tasks.length > 0 ? Math.round((statusCounts.completed / tasks.length) * 100) : 0,
        statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          label: status.replace('_', ' ').toUpperCase()
        })),
        priorityDistribution: Object.entries(priorityCounts).map(([priority, count]) => ({
          priority,
          count,
          label: priority.toUpperCase()
        })),
        teamWorkload,
        projectSummary
      }
    });
  } catch (err) {
    next(err);
  }
};

export const exportTasksCsv = async (req, res, next) => {
  try {
    const { workspaceId, projectId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspaceId is required.' });
    }

    const wsMember = await WorkspaceMembership.findOne({
      workspace: workspaceId,
      user: req.user._id
    });

    if (!wsMember && req.user.systemRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const filter = { workspace: workspaceId };
    if (projectId) filter.project = projectId;

    const tasks = await Task.find(filter)
      .populate('project', 'name key')
      .populate('assignee', 'name email')
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = [
      'Task Key',
      'Title',
      'Project',
      'Status',
      'Priority',
      'Assignee',
      'Creator',
      'Due Date',
      'Created At'
    ];

    const rows = tasks.map((t) => [
      escapeCsv(`${t.project?.key || 'PRJ'}-${t.taskNumber}`),
      escapeCsv(t.title),
      escapeCsv(t.project?.name || 'Unknown'),
      escapeCsv(t.status),
      escapeCsv(t.priority),
      escapeCsv(t.assignee?.name || 'Unassigned'),
      escapeCsv(t.creator?.name || 'Unknown'),
      escapeCsv(t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'None'),
      escapeCsv(new Date(t.createdAt).toISOString().split('T')[0])
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="taskflow-tasks-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
