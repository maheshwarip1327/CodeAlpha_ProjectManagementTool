import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { NotificationItem } from '../../types';
import { getInitials, formatRelativeTime } from '../../lib/utils';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, currentWorkspace, socket, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine current page title
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/app/dashboard')) return 'Dashboard';
    if (p.includes('/app/my-tasks')) return 'My Tasks';
    if (p.includes('/app/projects/')) return 'Project Workspace';
    if (p.includes('/app/projects')) return 'Projects';
    if (p.includes('/app/calendar')) return 'Calendar';
    if (p.includes('/app/timeline')) return 'Timeline';
    if (p.includes('/app/team')) return 'Team Directory';
    if (p.includes('/app/notifications')) return 'Inbox';
    if (p.includes('/app/reports')) return 'Reports & Analytics';
    if (p.includes('/app/settings')) return 'Workspace Settings';
    if (p.includes('/app/profile')) return 'My Profile';
    if (p.includes('/app/help')) return 'Help & Documentation';
    if (p.includes('/app/admin')) return 'Administration';
    return 'TaskFlow Pro';
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user?._id]);

  // Real-time notification updates
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notif: NotificationItem) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
      };
      socket.on('notification:new', handleNewNotification);
      return () => {
        socket.off('notification:new', handleNewNotification);
      };
    }
  }, [socket]);

  const markAsRead = async (id: string, link?: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (link) {
        navigate(link);
        setShowNotifications(false);
      }
    } catch {
      // Ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Left: Mobile toggle & Breadcrumb */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-sm">
          <span className="font-medium text-slate-400">
            {currentWorkspace?.name || 'Workspace'}
          </span>
          <span className="text-slate-300">/</span>
          <h1 className="font-semibold text-slate-800 tracking-tight text-base">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, tasks, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
          />
        </form>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center space-x-3">
        {/* Notifications dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications yet. You're completely up to date!
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markAsRead(n._id, n.link)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-3 ${
                        !n.isRead ? 'bg-brand-50/40' : ''
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-brand-600">
                        {!n.isRead && <span className="block w-2 h-2 rounded-full bg-brand-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-600 truncate mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    navigate('/app/notifications');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center space-x-1"
                >
                  <span>Open Notification Center</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold shadow-xs">
                {getInitials(user?.name || '')}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-700 hidden sm:block">
              {user?.name.split(' ')[0]}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  navigate('/app/profile');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                My Profile
              </button>
              <button
                onClick={() => {
                  navigate('/app/settings');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Workspace Settings
              </button>
              {user?.systemRole === 'admin' && (
                <button
                  onClick={() => {
                    navigate('/app/admin');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-brand-600 font-medium hover:bg-brand-50 transition-colors"
                >
                  Admin Console
                </button>
              )}
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
