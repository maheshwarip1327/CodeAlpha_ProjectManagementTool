import crypto from 'crypto';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMembership } from '../models/WorkspaceMembership.js';
import { User } from '../models/User.js';
import { Invitation } from '../models/Invitation.js';
import { Notification } from '../models/Notification.js';
import { emitToUser } from '../sockets/socketHandler.js';

export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description, plan } = req.body;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const workspace = await Workspace.create({
      name,
      slug,
      description: description || '',
      owner: req.user._id,
      plan: plan || 'free'
    });

    await WorkspaceMembership.create({
      workspace: workspace._id,
      user: req.user._id,
      role: 'owner'
    });

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully.',
      workspace
    });
  } catch (err) {
    next(err);
  }
};

export const getUserWorkspaces = async (req, res, next) => {
  try {
    const memberships = await WorkspaceMembership.find({ user: req.user._id })
      .populate('workspace')
      .sort({ createdAt: -1 });

    const workspaces = memberships
      .filter((m) => m.workspace)
      .map((m) => ({
        ...m.workspace.toObject(),
        role: m.role
      }));

    res.status(200).json({
      success: true,
      workspaces
    });
  } catch (err) {
    next(err);
  }
};

export const getWorkspaceDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const membership = await WorkspaceMembership.findOne({
      workspace: id,
      user: req.user._id
    });

    if (!membership && req.user.systemRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this workspace.'
      });
    }

    const workspace = await Workspace.findById(id).populate('owner', 'name email avatar title');
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    const memberCount = await WorkspaceMembership.countDocuments({ workspace: id });

    res.status(200).json({
      success: true,
      workspace: {
        ...workspace.toObject(),
        memberCount,
        role: membership ? membership.role : 'admin'
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, plan } = req.body;

    const membership = await WorkspaceMembership.findOne({
      workspace: id,
      user: req.user._id
    });

    if (
      (!membership || !['owner', 'admin'].includes(membership.role)) &&
      req.user.systemRole !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only workspace owners and admins can update settings.'
      });
    }

    const workspace = await Workspace.findByIdAndUpdate(
      id,
      { name, description, plan },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully.',
      workspace
    });
  } catch (err) {
    next(err);
  }
};

export const getWorkspaceMembers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const membership = await WorkspaceMembership.findOne({
      workspace: id,
      user: req.user._id
    });

    if (!membership && req.user.systemRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this workspace.'
      });
    }

    const members = await WorkspaceMembership.find({ workspace: id })
      .populate('user', 'name email avatar title status createdAt')
      .sort({ createdAt: 1 });

    const formatted = members
      .filter((m) => m.user)
      .map((m) => ({
        _id: m._id,
        user: m.user,
        role: m.role,
        joinedAt: m.createdAt
      }));

    res.status(200).json({
      success: true,
      members: formatted
    });
  } catch (err) {
    next(err);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const membership = await WorkspaceMembership.findOne({
      workspace: id,
      user: req.user._id
    });

    if (
      (!membership || !['owner', 'admin'].includes(membership.role)) &&
      req.user.systemRole !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only workspace owners or admins can invite new members.'
      });
    }

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    // Check if user is already a member
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (targetUser) {
      const existingMember = await WorkspaceMembership.findOne({
        workspace: id,
        user: targetUser._id
      });
      if (existingMember) {
        return res.status(409).json({
          success: false,
          message: 'User is already a member of this workspace.'
        });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      workspace: id,
      email: email.toLowerCase(),
      role: role || 'member',
      token,
      invitedBy: req.user._id,
      expiresAt
    });

    // If recipient has an account, send internal notification directly
    if (targetUser) {
      const notification = await Notification.create({
        recipient: targetUser._id,
        sender: req.user._id,
        type: 'invitation_received',
        title: 'Workspace Invitation',
        message: `${req.user.name} invited you to join "${workspace.name}" as a ${role || 'member'}.`,
        entityType: 'workspace',
        entityId: workspace._id,
        link: `/app/team?invite=${token}`
      });
      emitToUser(targetUser._id, 'notification:new', notification);
    }

    res.status(201).json({
      success: true,
      message: `Invitation generated for ${email}.`,
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        inviteUrl: `/invite/${token}`
      }
    });
  } catch (err) {
    next(err);
  }
};
