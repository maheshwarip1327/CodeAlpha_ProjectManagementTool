import crypto from 'crypto';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMembership } from '../models/WorkspaceMembership.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, title } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      title: title || 'Team Member'
    });

    // Auto-create initial default workspace for the user
    const workspaceName = `${name.split(' ')[0]}'s Workspace`;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const workspace = await Workspace.create({
      name: workspaceName,
      slug,
      description: `Default workspace for ${name}`,
      owner: user._id,
      plan: 'free'
    });

    await WorkspaceMembership.create({
      workspace: workspace._id,
      user: user._id,
      role: 'owner'
    });

    const token = generateToken({ id: user._id, email: user.email });
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user,
      defaultWorkspace: workspace
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended. Please contact support.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken({ id: user._id, email: user.email });
    setAuthCookie(res, token);

    // Fetch user's workspaces
    const memberships = await WorkspaceMembership.find({ user: user._id }).populate('workspace');
    const workspaces = memberships.map((m) => ({
      ...m.workspace.toObject(),
      membershipRole: m.role
    }));

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user,
      workspaces
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const memberships = await WorkspaceMembership.find({ user: req.user._id }).populate('workspace');
    const workspaces = memberships
      .filter((m) => m.workspace)
      .map((m) => ({
        ...m.workspace.toObject(),
        membershipRole: m.role
      }));

    res.status(200).json({
      success: true,
      user: req.user,
      workspaces
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Security: do not leak whether account exists
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset token has been issued.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    console.log(`[Auth Reset] Password reset token for ${email}: ${resetToken}`);

    // Return the reset token in JSON for development/evaluation environments
    res.status(200).json({
      success: true,
      message: 'Password reset token generated. In this development environment, the token is provided below for direct testing.',
      devResetToken: resetToken,
      resetUrl: `/reset-password/${resetToken}`
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.'
      });
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.'
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, title, avatar, preferences } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (title !== undefined) updates.title = title;
    if (avatar !== undefined) updates.avatar = avatar;
    if (preferences) {
      updates.preferences = {
        ...req.user.preferences?.toObject(),
        ...preferences
      };
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
};
