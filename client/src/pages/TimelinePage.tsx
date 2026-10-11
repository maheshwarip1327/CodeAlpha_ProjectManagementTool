import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Task } from '../types';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';
import { formatDate, getPriorityColor, getStatusBadge } from '../lib/utils';
import { EmptyState } from '../components/common/EmptyState';

export const TimelinePage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!currentWorkspace) return;
    try {
      setIsLoading(true);
      const projRes = await api.get(`/projects?workspaceId=${currentWorkspace._id}`);
      if (projRes.data.success) {
        const projectIds = projRes.data.projects.map((p: any) => p._id);
        const responses = await Promise.all(
          projectIds.map((pid: string) => api.get(`/tasks/project/${pid}`))
        );
        const all: Task[] = [];
        responses.forEach((res) => {
          if (res.data.success) all.push(...res.data.tasks);
        });
        // Sort by dueDate
        all.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        setTasks(all);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentWorkspace?._id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Timeline & Milestones
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Chronological overview of deliverables across all active projects.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        {tasks.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No timeline tasks scheduled"
            description="Create projects and tasks with due dates to visualize your team's timeline."
          />
        ) : (
          <div className="relative border-l-2 border-brand-200 ml-4 pl-6 space-y-6 py-2">
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
                <div
                  key={task._id}
                  onClick={() => setSelectedTaskId(task._id)}
                  className="relative group p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer transition-all hover:scale-[1.005]"
                >
                  {/* Timeline Node dot */}
                  <div
                    className={`absolute -left-[31px] top-6 w-3.5 h-3.5 rounded-full border-2 bg-white transition-transform group-hover:scale-125 ${
                      isOverdue
                        ? 'border-red-500'
                        : task.status === 'completed'
                        ? 'border-emerald-500'
                        : 'border-brand-600'
                    }`}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-brand-600">
                          {projectKey}-{task.taskNumber}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-500">{projectName}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-700">
                        {task.title}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.bg}`}>
                        {status.label}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase ${priority.bg} ${priority.border}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                        Due: {formatDate(task.dueDate)}
                      </span>
                    </div>
                    {task.assignee && (
                      <span className="text-slate-400">
                        Assigned to: <strong className="text-slate-700">{task.assignee.name}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TaskDetailsModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => fetchTasks()}
        onTaskDeleted={() => fetchTasks()}
      />
    </div>
  );
};
