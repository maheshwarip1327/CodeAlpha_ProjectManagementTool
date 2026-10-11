import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { MemberItem } from '../types';
import { Modal } from '../components/common/Modal';
import { getInitials, formatDate } from '../lib/utils';

export const TeamPage: React.FC = () => {
  const { currentWorkspace, user } = useAuth();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'project_manager' | 'member' | 'viewer'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const fetchTeamData = async () => {
    if (!currentWorkspace) return;
    try {
      setIsLoading(true);
      const [membersRes, invitesRes] = await Promise.all([
        api.get(`/workspaces/${currentWorkspace._id}/members`),
        api.get('/invitations/my-invites')
      ]);

      if (membersRes.data.success) {
        setMembers(membersRes.data.members || []);
      }
      if (invitesRes.data.success) {
        setPendingInvites(invitesRes.data.invitations || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [currentWorkspace?._id]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    try {
      setIsSubmitting(true);
      setError('');
      setInviteSuccessMsg('');

      const res = await api.post(`/workspaces/${currentWorkspace._id}/invite`, {
        email: inviteEmail,
        role: inviteRole
      });

      if (res.data.success) {
        setInviteSuccessMsg(`Invitation created for ${inviteEmail}! Token: ${res.data.invitation.token}`);
        setInviteEmail('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptInvite = async (token: string) => {
    try {
      await api.post(`/invitations/token/${token}/accept`);
      alert('Invitation accepted! Please refresh to switch workspaces.');
      fetchTeamData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept invitation.');
    }
  };

  const handleDeclineInvite = async (token: string) => {
    try {
      await api.post(`/invitations/token/${token}/decline`);
      setPendingInvites(pendingInvites.filter((i) => i.token !== token));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decline invitation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Team Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage teammates, roles, and collaboration permissions in {currentWorkspace?.name}.
          </p>
        </div>

        <button
          onClick={() => {
            setShowInviteModal(true);
            setInviteSuccessMsg('');
            setError('');
          }}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors inline-flex items-center space-x-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Pending Workspace Invitations Received by User */}
      {pendingInvites.length > 0 && (
        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-800">
            <Clock className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Pending Invitations For You
            </h3>
          </div>
          <div className="divide-y divide-amber-200/60">
            {pendingInvites.map((inv) => (
              <div
                key={inv._id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-amber-900"
              >
                <div>
                  <span className="font-bold">{inv.invitedBy?.name}</span> invited you to join{' '}
                  <strong className="underline">{inv.workspace?.name}</strong> as a{' '}
                  <span className="capitalize font-semibold">{inv.role}</span>.
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAcceptInvite(inv.token)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold inline-flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.token)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold inline-flex items-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Active Workspace Members</h3>
          <span className="text-xs text-slate-400">{members.length} members</span>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div
              key={m._id}
              className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-3.5">
                {m.user?.avatar ? (
                  <img
                    src={m.user.avatar}
                    alt={m.user.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {getInitials(m.user?.name || '')}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-slate-900">{m.user?.name}</h4>
                    {m.user?._id === user?._id && (
                      <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.2 rounded font-semibold">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                    <span>{m.user?.email}</span>
                    <span>•</span>
                    <span>{m.user?.title || 'Team Member'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full capitalize border ${
                    m.role === 'owner'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : m.role === 'admin'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {m.role.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 hidden md:inline">
                  Joined {formatDate(m.joinedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite New Member"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">
              {error}
            </div>
          )}

          {inviteSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs space-y-1">
              <p className="font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Invitation Dispatched
              </p>
              <p className="break-all">{inviteSuccessMsg}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Workspace Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl capitalize"
            >
              <option value="member">Member (Can create & work on tasks)</option>
              <option value="project_manager">Project Manager (Can create & manage projects)</option>
              <option value="admin">Admin (Can manage workspace settings & team)</option>
              <option value="viewer">Viewer (Read-only access)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
