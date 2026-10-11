import fs from 'fs';
import path from 'path';
import { Task } from '../models/Task.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { emitToProject } from '../sockets/socketHandler.js';

export const uploadTaskAttachment = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const newAttachment = {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      path: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id,
      createdAt: new Date()
    };

    task.attachments.push(newAttachment);
    await task.save();

    await ActivityLog.create({
      workspace: task.workspace,
      project: task.project,
      task: task._id,
      user: req.user._id,
      action: 'uploaded_attachment',
      details: { fileName: req.file.originalname }
    });

    const populatedTask = await Task.findById(taskId)
      .populate('attachments.uploadedBy', 'name email avatar');

    emitToProject(task.project, 'task:updated', populatedTask);

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully.',
      attachment: newAttachment,
      task: populatedTask
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTaskAttachment = async (req, res, next) => {
  try {
    const { taskId, attachmentId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found.' });
    }

    // Try to remove file from disk
    const filePath = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads', attachment.fileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('Failed to delete physical file:', err.message);
      }
    }

    attachment.deleteOne();
    await task.save();

    emitToProject(task.project, 'task:updated', task);

    res.status(200).json({
      success: true,
      message: 'Attachment removed successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectFiles = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({ project: projectId, 'attachments.0': { $exists: true } })
      .populate('attachments.uploadedBy', 'name email avatar')
      .select('title taskNumber attachments');

    const files = [];
    tasks.forEach((t) => {
      t.attachments.forEach((a) => {
        files.push({
          _id: a._id,
          originalName: a.originalName,
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          path: a.path,
          uploadedBy: a.uploadedBy,
          createdAt: a.createdAt,
          task: {
            _id: t._id,
            title: t.title,
            taskNumber: t.taskNumber
          }
        });
      });
    });

    res.status(200).json({
      success: true,
      files
    });
  } catch (err) {
    next(err);
  }
};
