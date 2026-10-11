export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  title?: string;
  systemRole: 'user' | 'admin';
  status: 'active' | 'suspended';
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    emailNotifications?: boolean;
    taskUpdates?: boolean;
  };
  createdAt: string;
}

export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  owner: string | User;
  plan: 'free' | 'pro' | 'team';
  role?: 'owner' | 'admin' | 'project_manager' | 'member' | 'viewer';
  memberCount?: number;
  createdAt: string;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks?: number;
  overdueTasks?: number;
  progress: number;
}

export interface Project {
  _id: string;
  workspace: string;
  name: string;
  key: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  dueDate?: string;
  owner: User;
  visibility: 'workspace' | 'private';
  tags: string[];
  color: string;
  isArchived: boolean;
  role?: 'manager' | 'contributor' | 'viewer';
  stats?: ProjectStats;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  _id?: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  _id: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  path: string;
  uploadedBy: User;
  createdAt: string;
  task?: {
    _id: string;
    title: string;
    taskNumber: number;
  };
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  _id: string;
  project: Project | { _id: string; name: string; key: string; color: string; workspace?: string };
  workspace: string;
  taskNumber: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  creator: User;
  assignee?: User | null;
  startDate?: string;
  dueDate?: string;
  labels: string[];
  subtasks: Subtask[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  task: string;
  project: string;
  user: User;
  content: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  recipient: string;
  sender?: User;
  type: 'task_assigned' | 'status_changed' | 'comment_added' | 'invitation_received' | 'deadline_approaching' | 'task_overdue';
  title: string;
  message: string;
  entityType: 'task' | 'project' | 'workspace' | 'comment';
  entityId?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLogItem {
  _id: string;
  workspace: string;
  project?: { _id: string; name: string; key: string };
  task?: { _id: string; title: string };
  user: User;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface MemberItem {
  _id: string;
  user: User;
  role: 'owner' | 'admin' | 'project_manager' | 'member' | 'viewer' | 'manager' | 'contributor';
  joinedAt: string;
}
