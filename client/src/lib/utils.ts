import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'No date';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatRelativeTime(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return formatDate(dateString);
}

export function getInitials(name: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getPriorityColor(priority: string): { bg: string; text: string; border: string } {
  switch (priority) {
    case 'urgent':
      return { bg: 'bg-red-50 text-red-700', text: 'text-red-700', border: 'border-red-200' };
    case 'high':
      return { bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', border: 'border-amber-200' };
    case 'medium':
      return { bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700', border: 'border-blue-200' };
    case 'low':
    default:
      return { bg: 'bg-slate-100 text-slate-700', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

export function getStatusBadge(status: string): { label: string; bg: string } {
  switch (status) {
    case 'backlog':
      return { label: 'Backlog', bg: 'bg-slate-100 text-slate-700' };
    case 'todo':
      return { label: 'To Do', bg: 'bg-indigo-50 text-indigo-700' };
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-blue-50 text-blue-700' };
    case 'in_review':
      return { label: 'In Review', bg: 'bg-purple-50 text-purple-700' };
    case 'completed':
      return { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700' };
    default:
      return { label: status, bg: 'bg-slate-100 text-slate-700' };
  }
}
