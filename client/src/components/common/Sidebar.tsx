import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Bell,
  BarChart3,
  Settings,
  User as UserIcon,
  HelpCircle,
  Shield,
  Plus,
  ChevronDown,
  LogOut,
  X,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn, getInitials } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateProject?: () => void;
  onOpenCreateTask?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenCreateProject,
  onOpenCreateTask
}) => {
  const { user, workspaces, currentWorkspace, setCurrentWorkspace, logout } = useAuth();
  const navigate = useNavigate();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = React.useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/app/my-tasks', icon: CheckSquare },
    { name: 'Projects', path: '/app/projects', icon: FolderKanban },
    { name: 'Calendar', path: '/app/calendar', icon: CalendarIcon },
    { name: 'Timeline', path: '/app/timeline', icon: Clock },
    { name: 'Team', path: '/app/team', icon: Users },
    { name: 'Inbox', path: '/app/notifications', icon: Bell },
    { name: 'Reports', path: '/app/reports', icon: BarChart3 }
  ];

  const bottomNavItems = [
    { name: 'Settings', path: '/app/settings', icon: Settings },
    { name: 'Profile', path: '/app/profile', icon: UserIcon },
    { name: 'Help & Docs', path: '/app/help', icon: HelpCircle }
  ];

  if (user?.systemRole === 'admin') {
    bottomNavItems.push({ name: 'Admin Area', path: '/app/admin', icon: Shield });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-950 text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/app/dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight flex items-center">
                TaskFlow <span className="text-cyan-400 font-extrabold ml-1">PRO</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5 tracking-wider uppercase font-medium">
                Workspace Hub
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Switcher */}
        <div className="p-3">
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-left transition-colors"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-6 h-6 rounded-lg bg-brand-600/30 border border-brand-500/40 text-brand-300 flex items-center justify-center text-xs font-semibold">
                  {currentWorkspace?.name ? currentWorkspace.name[0].toUpperCase() : 'W'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentWorkspace?.name || 'Select Workspace'}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize">
                    {currentWorkspace?.plan || 'Free'} Plan
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>

            {/* Switcher dropdown */}
            {showWorkspaceMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden py-1">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Your Workspaces
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      setShowWorkspaceMenu(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-800 transition-colors',
                      currentWorkspace?._id === ws._id ? 'text-brand-400 font-semibold bg-brand-950/40' : 'text-slate-300'
                    )}
                  >
                    <span className="truncate">{ws.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{ws.role || 'member'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="px-3 pb-2 grid grid-cols-2 gap-2">
          <button
            onClick={onOpenCreateTask}
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>
          <button
            onClick={onOpenCreateProject}
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Project</span>
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-600/20 text-brand-300 border-l-2 border-brand-500 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">
            System
          </div>
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-600/20 text-brand-300 border-l-2 border-brand-500 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User profile & logout bar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-2.5 truncate cursor-pointer hover:opacity-90"
              onClick={() => navigate('/app/profile')}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold border border-brand-500">
                  {getInitials(user?.name || '')}
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.title || user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
