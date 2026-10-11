import mongoose from 'mongoose';

const workspaceMembershipSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'project_manager', 'member', 'viewer'],
      default: 'member',
      required: true
    }
  },
  {
    timestamps: true
  }
);

workspaceMembershipSchema.index({ workspace: 1, user: 1 }, { unique: true });

export const WorkspaceMembership = mongoose.model('WorkspaceMembership', workspaceMembershipSchema);
