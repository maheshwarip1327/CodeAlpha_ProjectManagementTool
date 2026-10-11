import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    role: {
      type: String,
      enum: ['admin', 'project_manager', 'member', 'viewer'],
      default: 'member'
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

invitationSchema.index({ workspace: 1, email: 1, status: 1 });

export const Invitation = mongoose.model('Invitation', invitationSchema);
