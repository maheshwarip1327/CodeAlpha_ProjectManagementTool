import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api';
import { Task } from '../types';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { formatDate, getPriorityColor, getStatusBadge } from '../lib/utils';

export const MyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchMyTasks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter })
      });
      const res = await api.get(`/tasks/my-tasks?${params.toString()}`);
      if (res.data.success) {
        setTasks(res.data.tasks || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [search, statusFilter, priorityFilter]);

  if (isLoading) {
    return <TableSkeleton />;
  }

  const overdueCount = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Assigned Tasks
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and complete all deliverables assigned to you across all projects.
          </p>
        </div>

        {overdueCount > 0 && (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <AlertCircle className="w-4 h-4" />
            <span>{overdueCount} Overdue Task{overdueCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[200px] max-w-md relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search your assigned tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks assigned"
            description="You currently don't have any tasks assigned matching your filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Task ID</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => {
                  const status = getStatusBadge(task.status);
                  const priority = getPriorityColor(task.priority);
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    task.status !== 'completed';

                  const projectKey = (task.project as any)?.key || 'PRJ';
                  const projectName = (task.project as any)?.name || 'Project';

                  return (
                    <tr
                      key={task._id}
                      onClick={() => setSelectedTaskId(task._id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-brand-600">
                        {projectKey}-{task.taskNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {projectName}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {task.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${status.bg}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold border uppercase ${priority.bg} ${priority.border}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-medium ${
                            isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TaskDetailsModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => fetchMyTasks()}
        onTaskDeleted={() => fetchMyTasks()}
      />
    </div>
  );
};
