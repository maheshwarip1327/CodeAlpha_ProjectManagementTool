import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    title: z.string().min(2, 'Task title is required').max(200),
    description: z.string().max(5000).optional(),
    status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'completed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assigneeId: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
    subtasks: z.array(z.object({
      title: z.string().min(1),
      completed: z.boolean().optional()
    })).optional()
  })
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(5000).optional(),
    status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'completed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assigneeId: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
    subtasks: z.array(z.object({
      _id: z.string().optional(),
      title: z.string().min(1),
      completed: z.boolean().optional()
    })).optional(),
    order: z.number().optional()
  })
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'completed']),
    order: z.number().optional()
  })
});
