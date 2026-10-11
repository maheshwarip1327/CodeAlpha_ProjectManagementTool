import { Invitation } from '../models/Invitation.js';
import { WorkspaceMembership } from '../models/WorkspaceMembership.js';
import { ActivityLog } from '../models/ActivityLog.js';

export const getInvitationByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: Date.now() }
    })
      .populate('workspace', 'name description')
      .populate('invitedBy', 'name email avatar');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation is invalid, has already been used, or has expired.'
      });
    }

    res.status(200).json({
      success: true,
      invitation
    });
  } catch (err) {
    next(err);
  }
};

export const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: Date.now() }
    });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invitation is invalid or has expired.'
      });
    }

    // Check if membership already exists
    let membership = await WorkspaceMembership.findOne({
      workspace: invitation.workspace,
      user: req.user._id
    });

    if (!membership) {
      membership = await WorkspaceMembership.create({
        workspace: invitation.workspace,
        user: req.user._id,
        role: invitation.role
      });
    }

    invitation.status = 'accepted';
    await invitation.save();

    await ActivityLog.create({
      workspace: invitation.workspace,
      user: req.user._id,
      action: 'joined_workspace',
      details: { role: invitation.role }
    });

    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully.',
      workspaceId: invitation.workspace
    });
  } catch (err) {
    next(err);
  }
};

export const declineInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({
      token,
      status: 'pending'
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found.'
      });
    }

    invitation.status = 'declined';
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'Invitation declined.'
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingUserInvitations = async (req, res, next) => {
  try {
    const invitations = await Invitation.find({
      email: req.user.email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: Date.now() }
    })
      .populate('workspace', 'name description')
      .populate('invitedBy', 'name email avatar');

    res.status(200).json({
      success: true,
      invitations
    });
  } catch (err) {
    next(err);
  }
};
