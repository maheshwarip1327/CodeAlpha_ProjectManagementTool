import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Task, Project, ActivityLogItem } from '../types';
import { DashboardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';
import { formatDate, formatRelativeTime, getPriorityColor, getStatusBadge } from '../lib/utils';

const STATUS_COLORS: Record<string, string> = {
  backlog: '#94A3B8',
  todo: '#6366F1',
  in_progress: '#0284C7',
  in_review: '#A855F7',
  completed: '#10B981'
};

export const DashboardPage: React.FC = () => {
  const { user, currentWorkspace } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);

  // Modals
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!currentWorkspace) return;
    try {
      setIsLoading(true);

      const [reportRes, projectRes, taskRes] = await Promise.all([
        api.get(`/reports?workspaceId=${currentWorkspace._id}`),
        api.get(`/projects?workspaceId=${currentWorkspace._id}`),
        api.get('/tasks/my-tasks')
      ]);

      if (reportRes.data.success) {
        setMetrics(reportRes.data.metrics);
      }
      if (projectRes.data.success) {
        setProjects(projectRes.data.projects || []);
      }
      if (taskRes.data.success) {
        setMyTasks(taskRes.data.tasks || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentWorkspace?._id]);

  useEffect(() => {
    const handleReload = () => fetchDashboardData();
    window.addEventListener('project-created', handleReload);
    window.addEventListener('task-created', handleReload);
    return () => {
      window.removeEventListener('project-created', handleReload);
      window.removeEventListener('task-created', handleReload);
    };
  }, [currentWorkspace?._id]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const statusChartData = metrics?.statusDistribution?.filter((d: any) => d.count > 0) || [];
  const projectChartData =
    metrics?.projectSummary?.map((p: any) => ({
      name: p.key,
      total: p.totalTasks,
      completed: p.completedTasks
    })) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here's what is happening across <span className="font-semibold text-slate-700">{currentWorkspace?.name}</span> today.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateProject(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
          <button
            onClick={() => setShowCreateTask(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-500">Active Projects</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-brand-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {projects.filter((p) => !p.isArchived).length}
          </p>
          <span className="text-[11px] font-medium text-slate-500 flex items-center mt-1">
            <Layers className="w-3 h-3 mr-1 text-slate-400" />
            {projects.length} total registered
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-500">In Progress Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-sky-600 mt-2">
            {metrics?.inProgressTasks || 0}
          </p>
          <span className="text-[11px] font-medium text-slate-500 flex items-center mt-1">
            Total {metrics?.totalTasks || 0} tasks
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-500">Completed Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {metrics?.completedTasks || 0}
          </p>
          <span className="text-[11px] font-medium text-emerald-600 flex items-center mt-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            {metrics?.completionRate || 0}% overall velocity
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-500">Overdue Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-red-600 mt-2">
            {metrics?.overdueTasks || 0}
          </p>
          <span className="text-[11px] font-medium text-slate-500 flex items-center mt-1">
            {metrics?.dueTodayTasks || 0} due today
          </span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project completion bar chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Velocity & Deliverables</h3>
              <p className="text-xs text-slate-400">Total vs. completed tasks per project</p>
            </div>
            <button
              onClick={() => navigate('/app/reports')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center"
            >
              <span>View Reports</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            {projectChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectChartData}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="total" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Total Tasks" />
                  <Bar dataKey="completed" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No project tasks data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Task Status Distribution</h3>
            <p className="text-xs text-slate-400">Active breakdown across workflow lanes</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {statusChartData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || '#6366F1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No active tasks in this workspace.</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {statusChartData.map((d: any) => (
              <div key={d.status} className="flex items-center space-x-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[d.status] || '#6366F1' }}
                />
                <span className="text-slate-600 capitalize text-[11px] truncate">
                  {d.label}: <strong className="text-slate-900">{d.count}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: My Assigned Tasks & Active Projects Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks Preview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">My Assigned Tasks</h3>
            <button
              onClick={() => navigate('/app/my-tasks')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View All ({myTasks.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {myTasks.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                You have no pending tasks assigned. Enjoy the clear plate!
              </p>
            ) : (
              myTasks.slice(0, 5).map((t) => {
                const priority = getPriorityColor(t.priority);
                const status = getStatusBadge(t.status);
                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTaskId(t._id)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="truncate pr-3 space-y-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{t.title}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                        <span className="font-mono text-brand-600 font-medium">
                          {(t.project as any)?.key}-{t.taskNumber}
                        </span>
                        <span>•</span>
                        <span>Due {formatDate(t.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${status.bg}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Projects List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active Projects</h3>
            <button
              onClick={() => navigate('/app/projects')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View Projects
            </button>
          </div>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No projects created yet. Click "New Project" above to get started!
              </div>
            ) : (
              projects.slice(0, 4).map((p) => {
                const progress = p.stats?.progress || 0;
                return (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/app/projects/${p._id}`)}
                    className="p-3.5 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 cursor-pointer transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.color || '#4F46E5' }}
                        />
                        <span className="text-xs font-bold text-slate-800">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">
                          ({p.key})
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-brand-600">{progress}%</span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                      <span>{p.stats?.totalTasks || 0} tasks total</span>
                      <span>Target: {formatDate(p.dueDate)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => fetchDashboardData()}
        onTaskDeleted={() => fetchDashboardData()}
      />

      {/* Modals */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onProjectCreated={() => fetchDashboardData()}
      />

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onTaskCreated={() => fetchDashboardData()}
      />
    </div>
  );
};
