import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      default: '',
      maxlength: 500
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'team'],
      default: 'free'
    }
  },
  {
    timestamps: true
  }
);

workspaceSchema.index({ owner: 1, slug: 1 }, { unique: true });

export const Workspace = mongoose.model('Workspace', workspaceSchema);
