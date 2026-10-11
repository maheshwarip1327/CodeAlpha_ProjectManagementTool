import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { ActivityLog } from '../models/ActivityLog.js';

export const getSystemMetrics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const totalWorkspaces = await Workspace.countDocuments();
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password -passwordResetToken -passwordResetExpires');

    const recentWorkspaces = await Workspace.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const memUsage = process.memoryUsage();

    res.status(200).json({
      success: true,
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers
        },
        workspaces: totalWorkspaces,
        projects: totalProjects,
        tasks: {
          total: totalTasks,
          completed: completedTasks
        },
        health: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryRssMB: Math.round(memUsage.rss / 1024 / 1024),
          memoryHeapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          databaseStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
        },
        recentUsers,
        recentWorkspaces
      }
    });
  } catch (err) {
    next(err);
  }
};

export const listAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.systemRole = role;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, systemRole } = req.body;

    if (id === req.user._id.toString() && status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot suspend their own account.'
      });
    }

    const updates = {};
    if (status) updates.status = status;
    if (systemRole) updates.systemRole = systemRole;

    const user = await User.findByIdAndUpdate(id, updates, { new: true })
      .select('-password -passwordResetToken -passwordResetExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user
    });
  } catch (err) {
    next(err);
  }
};

export const listAllWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find()
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      workspaces.map(async (ws) => {
        const projectCount = await Project.countDocuments({ workspace: ws._id });
        const taskCount = await Task.countDocuments({ workspace: ws._id });
        return {
          ...ws.toObject(),
          projectCount,
          taskCount
        };
      })
    );

    res.status(200).json({
      success: true,
      workspaces: enriched
    });
  } catch (err) {
    next(err);
  }
};

export const getSystemAuditLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'name email avatar')
      .populate('workspace', 'name')
      .populate('project', 'name key')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      logs
    });
  } catch (err) {
    next(err);
  }
};
