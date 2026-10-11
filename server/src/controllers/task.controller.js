import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Comment } from '../models/Comment.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { emitToProject, emitToUser } from '../sockets/socketHandler.js';

export const createTask = async (req, res, next) => {
  try {
    const {
      projectId,
      title,
      description,
      status,
      priority,
      assigneeId,
      startDate,
      dueDate,
      labels,
      subtasks
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Determine next task number for this project
    const latestTask = await Task.findOne({ project: projectId }).sort({ taskNumber: -1 });
    const nextNumber = latestTask ? latestTask.taskNumber + 1 : 1;

    // Check max order in column
    const taskStatus = status || 'todo';
    const highestOrderTask = await Task.findOne({ project: projectId, status: taskStatus }).sort({ order: -1 });
    const order = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const task = await Task.create({
      project: projectId,
      workspace: project.workspace,
      taskNumber: nextNumber,
      title,
      description: description || '',
      status: taskStatus,
      priority: priority || 'medium',
      order,
      creator: req.user._id,
      assignee: assigneeId || null,
      startDate: startDate || null,
      dueDate: dueDate || null,
      labels: labels || [],
      subtasks: subtasks || []
    });

    const populatedTask = await Task.findById(task._id)
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar title')
      .populate('project', 'name key color');

    await ActivityLog.create({
      workspace: project.workspace,
      project: project._id,
      task: task._id,
      user: req.user._id,
      action: 'created_task',
      details: { title: task.title, taskKey: `${project.key}-${task.taskNumber}` }
    });

    // Notify assignee if assigned to someone else
    if (assigneeId && assigneeId !== req.user._id.toString()) {
      const notif = await Notification.create({
        recipient: assigneeId,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you to "${task.title}" in ${project.name}.`,
        entityType: 'task',
        entityId: task._id,
        link: `/app/projects/${project._id}?task=${task._id}`
      });
      emitToUser(assigneeId, 'notification:new', notif);
    }

    emitToProject(project._id, 'task:created', populatedTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: populatedTask
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignee, search, sort } = req.query;

    const query = { project: projectId };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOptions = { order: 1, createdAt: -1 };
    if (sort === 'dueDate') sortOptions = { dueDate: 1 };
    if (sort === 'priority') sortOptions = { priority: 1 };
    if (sort === 'updatedAt') sortOptions = { updatedAt: -1 };

    const tasks = await Task.find(query)
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar title')
      .populate('project', 'name key color')
      .sort(sortOptions);

    res.status(200).json({
      success: true,
      tasks
    });
  } catch (err) {
    next(err);
  }
};

export const getMyTasks = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;

    const query = { assignee: req.user._id };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const tasks = await Task.find(query)
      .populate('project', 'name key color workspace')
      .populate('creator', 'name email avatar')
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      tasks
    });
  } catch (err) {
    next(err);
  }
};

export const getTaskDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar title')
      .populate('project', 'name key color workspace')
      .populate('attachments.uploadedBy', 'name email avatar');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      startDate,
      dueDate,
      labels,
      subtasks,
      order
    } = req.body;

    const task = await Task.findById(id).populate('project', 'name key');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const prevAssignee = task.assignee ? task.assignee.toString() : null;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assigneeId !== undefined) task.assignee = assigneeId || null;
    if (startDate !== undefined) task.startDate = startDate || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (labels) task.labels = labels;
    if (subtasks) task.subtasks = subtasks;
    if (order !== undefined) task.order = order;

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar title')
      .populate('project', 'name key color');

    await ActivityLog.create({
      workspace: task.workspace,
      project: task.project._id,
      task: task._id,
      user: req.user._id,
      action: 'updated_task',
      details: { title: task.title }
    });

    // Notify newly assigned user
    if (assigneeId && assigneeId !== prevAssignee && assigneeId !== req.user._id.toString()) {
      const notif = await Notification.create({
        recipient: assigneeId,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you to "${task.title}".`,
        entityType: 'task',
        entityId: task._id,
        link: `/app/projects/${task.project._id}?task=${task._id}`
      });
      emitToUser(assigneeId, 'notification:new', notif);
    }

    emitToProject(task.project._id, 'task:updated', updatedTask);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task: updatedTask
    });
  } catch (err) {
    next(err);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, order } = req.body;

    const task = await Task.findById(id).populate('project', 'name key');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const previousStatus = task.status;
    task.status = status;
    if (order !== undefined) task.order = order;
    await task.save();

    await ActivityLog.create({
      workspace: task.workspace,
      project: task.project._id,
      task: task._id,
      user: req.user._id,
      action: 'status_changed',
      details: { from: previousStatus, to: status, title: task.title }
    });

    // Notify assignee if someone else moved it
    if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        recipient: task.assignee,
        sender: req.user._id,
        type: 'status_changed',
        title: 'Task Status Updated',
        message: `${req.user.name} changed status of "${task.title}" to ${status.replace('_', ' ')}.`,
        entityType: 'task',
        entityId: task._id,
        link: `/app/projects/${task.project._id}?task=${task._id}`
      });
      emitToUser(task.assignee, 'notification:new', notif);
    }

    emitToProject(task.project._id, 'task:status_changed', {
      taskId: task._id,
      status,
      order: task.order
    });

    res.status(200).json({
      success: true,
      message: 'Status updated.',
      task
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    await Comment.deleteMany({ task: id });
    await Task.findByIdAndDelete(id);

    await ActivityLog.create({
      workspace: task.workspace,
      project: task.project,
      user: req.user._id,
      action: 'deleted_task',
      details: { title: task.title }
    });

    emitToProject(task.project, 'task:deleted', { taskId: id });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const toggleSubtask = async (req, res, next) => {
  try {
    const { id, subtaskId } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({ success: false, message: 'Subtask not found.' });
    }

    subtask.completed = !subtask.completed;
    await task.save();

    emitToProject(task.project, 'task:updated', task);

    res.status(200).json({
      success: true,
      task
    });
  } catch (err) {
    next(err);
  }
};
