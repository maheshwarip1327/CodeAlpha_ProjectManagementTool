import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Server,
  Activity,
  Search,
  Lock,
  Unlock,
  Building
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { formatDate, formatRelativeTime } from '../lib/utils';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [workspacesList, setWorkspacesList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab: 'overview' | 'users' | 'workspaces' | 'audit'
  const [tab, setTab] = useState<'overview' | 'users' | 'workspaces' | 'audit'>('overview');
  const [userSearch, setUserSearch] = useState('');

  // Status toggle confirmation
  const [selectedUserToToggle, setSelectedUserToToggle] = useState<any | null>(null);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [metricsRes, usersRes, wsRes, logsRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get(`/admin/users?search=${encodeURIComponent(userSearch)}`),
        api.get('/admin/workspaces'),
        api.get('/admin/audit-logs')
      ]);

      if (metricsRes.data.success) setMetrics(metricsRes.data.metrics);
      if (usersRes.data.success) setUsersList(usersRes.data.users || []);
      if (wsRes.data.success) setWorkspacesList(wsRes.data.workspaces || []);
      if (logsRes.data.success) setAuditLogs(logsRes.data.logs || []);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.systemRole === 'admin') {
      fetchAdminData();
    }
  }, [user?.systemRole, userSearch]);

  const handleToggleUserStatus = async () => {
    if (!selectedUserToToggle) return;
    const newStatus = selectedUserToToggle.status === 'active' ? 'suspended' : 'active';
    try {
      setIsUpdatingStatus(true);
      const res = await api.patch(`/admin/users/${selectedUserToToggle._id}`, {
        status: newStatus
      });
      if (res.data.success) {
        setUsersList(
          usersList.map((u) => (u._id === selectedUserToToggle._id ? res.data.user : u))
        );
        setShowStatusConfirm(false);
        setSelectedUserToToggle(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (user?.systemRole !== 'admin') {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Restricted Administration Console</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          You must have system administrator privileges to access this area.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Master Administration Console</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System Governance & Operations
          </h2>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs">
          <button
            onClick={() => setTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              tab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('users')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              tab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Users ({usersList.length})
          </button>
          <button
            onClick={() => setTab('workspaces')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              tab === 'workspaces' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Workspaces ({workspacesList.length})
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              tab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Registered Users</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.users.total}</p>
              <span className="text-[11px] text-emerald-600 font-medium">
                {metrics.users.active} active • {metrics.users.suspended} suspended
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Workspaces</span>
              <p className="text-2xl font-extrabold text-brand-600 mt-1">{metrics.workspaces}</p>
              <span className="text-[11px] text-slate-400">Multi-tenant clusters</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Projects</span>
              <p className="text-2xl font-extrabold text-sky-600 mt-1">{metrics.projects}</p>
              <span className="text-[11px] text-slate-400">Active tracking boards</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Task Records</span>
              <p className="text-2xl font-extrabold text-purple-600 mt-1">{metrics.tasks.total}</p>
              <span className="text-[11px] text-emerald-600 font-medium">
                {metrics.tasks.completed} completed
              </span>
            </div>
          </div>

          {/* Operational Health Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Operational System Health</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-1">Database State</span>
                <span className="font-bold text-emerald-600 capitalize">
                  ● {metrics.health.databaseStatus}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-1">Node Runtime</span>
                <span className="font-bold text-slate-800">{metrics.health.nodeVersion}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-1">Uptime</span>
                <span className="font-bold text-slate-800">
                  {Math.floor(metrics.health.uptimeSeconds / 60)} minutes
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-1">Memory (RSS / Heap)</span>
                <span className="font-bold text-slate-800">
                  {metrics.health.memoryRssMB}MB / {metrics.health.memoryHeapUsedMB}MB
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user accounts..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <span className="text-xs text-slate-400">{usersList.length} users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                          u.systemRole === 'admin'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.systemRole}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold capitalize text-[10px] ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {u._id !== user._id && (
                        <button
                          onClick={() => {
                            setSelectedUserToToggle(u);
                            setShowStatusConfirm(true);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            u.status === 'active'
                              ? 'bg-red-50 hover:bg-red-100 text-red-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WORKSPACES TAB */}
      {tab === 'workspaces' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Tenant Workspaces Overview</h3>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {workspacesList.map((ws) => (
              <div key={ws._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-900">{ws.name}</h4>
                  <p className="text-slate-400">
                    Owner: {ws.owner?.name} ({ws.owner?.email})
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-slate-500">
                  <span>{ws.projectCount || 0} projects</span>
                  <span>{ws.taskCount || 0} tasks</span>
                  <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                    {ws.plan} Plan
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {tab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">System Activity Records</h3>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log._id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-800">{log.user?.name}</span>{' '}
                  <span className="text-slate-600">{log.action.replace('_', ' ')}</span>{' '}
                  {log.project?.name && (
                    <span className="text-brand-600 font-medium">in {log.project.name}</span>
                  )}
                </div>
                <span className="text-slate-400">{formatRelativeTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Toggle Modal */}
      <ConfirmationDialog
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={handleToggleUserStatus}
        title="Toggle Account Status"
        message={`Are you sure you want to ${
          selectedUserToToggle?.status === 'active' ? 'suspend' : 'activate'
        } user "${selectedUserToToggle?.name}"?`}
        confirmLabel="Confirm"
        isDestructive={selectedUserToToggle?.status === 'active'}
        isLoading={isUpdatingStatus}
      />
    </div>
  );
};
