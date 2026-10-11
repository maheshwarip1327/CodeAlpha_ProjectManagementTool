import mongoose from 'mongoose';

const projectMembershipSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
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
      enum: ['manager', 'contributor', 'viewer'],
      default: 'contributor',
      required: true
    }
  },
  {
    timestamps: true
  }
);

projectMembershipSchema.index({ project: 1, user: 1 }, { unique: true });

export const ProjectMembership = mongoose.model('ProjectMembership', projectMembershipSchema);
