import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle
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
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { DashboardSkeleton } from '../components/common/LoadingSkeleton';

const STATUS_COLORS: Record<string, string> = {
  backlog: '#94A3B8',
  todo: '#6366F1',
  in_progress: '#0284C7',
  in_review: '#A855F7',
  completed: '#10B981'
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#94A3B8',
  medium: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444'
};

export const ReportsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();

  const [metrics, setMetrics] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReports = async () => {
    if (!currentWorkspace) return;
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        workspaceId: currentWorkspace._id,
        ...(selectedProjectId && { projectId: selectedProjectId })
      });

      const [reportRes, projRes] = await Promise.all([
        api.get(`/reports?${params.toString()}`),
        api.get(`/projects?workspaceId=${currentWorkspace._id}`)
      ]);

      if (reportRes.data.success) {
        setMetrics(reportRes.data.metrics);
      }
      if (projRes.data.success) {
        setProjects(projRes.data.projects || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentWorkspace?._id, selectedProjectId]);

  const handleExportCsv = async () => {
    if (!currentWorkspace) return;
    try {
      setIsExporting(true);
      const params = new URLSearchParams({
        workspaceId: currentWorkspace._id,
        ...(selectedProjectId && { projectId: selectedProjectId })
      });

      const response = await api.get(`/reports/export-csv?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TaskFlow-Report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      alert('Failed to export CSV report.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading || !metrics) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header and Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Reports & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Execution metrics, sprint completion, and team workload for {currentWorkspace?.name}.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-xs"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors inline-flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Tasks</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.totalTasks}</p>
          <span className="text-[11px] text-slate-400">Scoped to selection</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Completion Rate</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {metrics.completionRate}%
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {metrics.completedTasks} tasks done
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500">In Progress</span>
          <p className="text-2xl font-extrabold text-sky-600 mt-1">{metrics.inProgressTasks}</p>
          <span className="text-[11px] text-slate-400">Currently active</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Overdue Tasks</span>
          <p className="text-2xl font-extrabold text-red-600 mt-1">{metrics.overdueTasks}</p>
          <span className="text-[11px] text-red-500 font-medium">Requires attention</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Task Volume by Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.statusDistribution}>
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Task Volume by Priority</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.priorityDistribution}>
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0284C7" radius={[6, 6, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team Workload Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Team Workload Distribution</h3>
          <span className="text-xs text-slate-400">
            {metrics.teamWorkload?.length || 0} members recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Total Assigned</th>
                <th className="px-4 py-3">In Progress</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Velocity Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.teamWorkload?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    No workload data available.
                  </td>
                </tr>
              ) : (
                metrics.teamWorkload.map((member: any, i: number) => {
                  const rate =
                    member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{member.name}</td>
                      <td className="px-4 py-3">{member.total}</td>
                      <td className="px-4 py-3 text-sky-600 font-semibold">{member.inProgress}</td>
                      <td className="px-4 py-3 text-emerald-600 font-semibold">{member.completed}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-brand-600 h-1.5 rounded-full"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
