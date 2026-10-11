import { Comment } from '../models/Comment.js';
import { Task } from '../models/Task.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { emitToProject, emitToUser } from '../sockets/socketHandler.js';

export const getTaskComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .populate('user', 'name email avatar title')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      comments
    });
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    const task = await Task.findById(taskId).populate('project', 'name _id');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const comment = await Comment.create({
      task: taskId,
      project: task.project._id,
      user: req.user._id,
      content: content.trim()
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'user',
      'name email avatar title'
    );

    // Notify assignee or creator if comment is by another person
    const recipientId =
      task.assignee && task.assignee.toString() !== req.user._id.toString()
        ? task.assignee
        : task.creator.toString() !== req.user._id.toString()
        ? task.creator
        : null;

    if (recipientId) {
      const notif = await Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        type: 'comment_added',
        title: 'New Comment',
        message: `${req.user.name} commented on "${task.title}": "${content.slice(0, 60)}${content.length > 60 ? '...' : ''}"`,
        entityType: 'task',
        entityId: task._id,
        link: `/app/projects/${task.project._id}?task=${task._id}`
      });
      emitToUser(recipientId, 'notification:new', notif);
    }

    await ActivityLog.create({
      workspace: task.workspace,
      project: task.project._id,
      task: task._id,
      user: req.user._id,
      action: 'added_comment',
      details: { taskTitle: task.title }
    });

    emitToProject(task.project._id, 'comment:added', {
      taskId: task._id,
      comment: populatedComment
    });

    res.status(201).json({
      success: true,
      message: 'Comment added.',
      comment: populatedComment
    });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    if (
      comment.user.toString() !== req.user._id.toString() &&
      req.user.systemRole !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments.'
      });
    }

    await Comment.findByIdAndDelete(id);

    emitToProject(comment.project, 'comment:deleted', { commentId: id, taskId: comment.task });

    res.status(200).json({
      success: true,
      message: 'Comment deleted.'
    });
  } catch (err) {
    next(err);
  }
};
