import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    name: z.string().min(2, 'Project name must be at least 2 characters').max(120),
    key: z.string().min(2).max(10).toUpperCase().optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    startDate: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    visibility: z.enum(['workspace', 'private']).optional(),
    tags: z.array(z.string()).optional(),
    color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Invalid color hex code').optional()
  })
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    startDate: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    visibility: z.enum(['workspace', 'private']).optional(),
    tags: z.array(z.string()).optional(),
    color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Invalid color hex code').optional(),
    isArchived: z.boolean().optional()
  })
});

export const addProjectMemberSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    role: z.enum(['manager', 'contributor', 'viewer']).default('contributor')
  })
});
