import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
    plan: z.enum(['free', 'pro', 'team']).optional()
  })
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    plan: z.enum(['free', 'pro', 'team']).optional()
  })
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required'),
    role: z.enum(['admin', 'project_manager', 'member', 'viewer']).default('member')
  })
});
