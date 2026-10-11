import React from 'react';
import {
  HelpCircle,
  BookOpen,
  Keyboard,
  Shield,
  Kanban,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  const guides = [
    {
      icon: Kanban,
      title: 'Kanban Workflow & Drag-and-Drop',
      desc: 'Organize tasks into Backlog, To Do, In Progress, In Review, and Completed. Cards can be dragged across columns with optimistic state rendering and automatic backend synchronization.'
    },
    {
      icon: Shield,
      title: 'Role-Based Access Control (RBAC)',
      desc: 'Workspaces enforce strict tenant roles: Workspace Owner, Workspace Admin, Project Manager, Member, and Viewer. Private projects restrict visibility only to explicitly invited teammates.'
    },
    {
      icon: FileSpreadsheet,
      title: 'Reports & RFC-Compliant CSV Export',
      desc: 'Generate executive status reports with real-time delivery metrics. Export clean CSV records with RFC escaping for project audits and external compliance.'
    },
    {
      icon: BookOpen,
      title: 'Real-time Socket.IO Collaboration',
      desc: 'When teammates change a status, create a task, or post comments, connected clients receive updates immediately through authenticated websocket rooms.'
    }
  ];

  const shortcuts = [
    { key: 'Esc', desc: 'Close any active modal or drawer' },
    { key: 'Enter', desc: 'Submit dialogs and checklists' },
    { key: 'Tab', desc: 'Accessible keyboard navigation between elements' },
    { key: 'Drag', desc: 'Reorder cards inside columns or change task statuses' }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Help & Product Documentation
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Guides, best practices, keyboard navigation, and architecture reference for TaskFlow Pro.
        </p>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guides.map((g, i) => {
          const Icon = g.icon;
          return (
            <div
              key={i}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{g.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{g.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
          <Keyboard className="w-4 h-4 text-brand-600" />
          <span>Keyboard Shortcuts & Accessibility</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs"
            >
              <span className="text-slate-600">{s.desc}</span>
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded shadow-xs font-mono font-bold text-slate-800">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* API Reference summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">API Health & Architecture</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          The TaskFlow Pro backend exposes fully RESTful endpoints under <code className="bg-slate-100 px-1 py-0.5 rounded text-brand-600 font-mono">/api</code>.
          Live system status can be verified anytime via <code className="bg-slate-100 px-1 py-0.5 rounded text-brand-600 font-mono">/health</code>.
        </p>
      </div>
    </div>
  );
};
