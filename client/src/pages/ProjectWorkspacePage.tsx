import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult
} from '@hello-pangea/dnd';
import {
  Kanban,
  List,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Paperclip,
  Activity,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Globe,
  Trash2,
  Archive,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Project, Task, TaskStatus, MemberItem, Attachment, ActivityLogItem } from '../types';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import {
  formatDate,
  formatRelativeTime,
  getInitials,
  getPriorityColor,
  getStatusBadge
} from '../lib/utils';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'border-slate-300' },
  { id: 'todo', label: 'To Do', color: 'border-indigo-400' },
  { id: 'in_progress', label: 'In Progress', color: 'border-sky-400' },
  { id: 'in_review', label: 'In Review', color: 'border-purple-400' },
  { id: 'completed', label: 'Completed', color: 'border-emerald-400' }
];

export const ProjectWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, currentWorkspace, socket } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'board' | 'list' | 'calendar' | 'timeline' | 'members' | 'files' | 'activity' | 'settings'
  >('board');

  // Search and filter inside project
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Modals state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(searchParams.get('task') || null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [defaultColumnStatus, setDefaultColumnStatus] = useState<TaskStatus>('todo');

  // Members state
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<MemberItem[]>([]);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');

  // Files & Activity state
  const [projectFiles, setProjectFiles] = useState<Attachment[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);

  // Project Settings & Deletion
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<any>('medium');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calendar month state
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchProjectData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);

      if (projRes.data.success) {
        setProject(projRes.data.project);
        setEditName(projRes.data.project.name);
        setEditDescription(projRes.data.project.description || '');
        setEditPriority(projRes.data.project.priority);
      }
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.tasks || []);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert('Access denied: You are not authorized to view this project.');
        navigate('/app/projects');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  // Load members when tab is active
  useEffect(() => {
    if (activeTab === 'members' && id) {
      api.get(`/projects/${id}/members`).then((res) => {
        if (res.data.success) setProjectMembers(res.data.members || []);
      });
      if (currentWorkspace) {
        api.get(`/workspaces/${currentWorkspace._id}/members`).then((res) => {
          if (res.data.success) setWorkspaceMembers(res.data.members || []);
        });
      }
    }

    if (activeTab === 'files' && id) {
      api.get(`/attachments/project/${id}`).then((res) => {
        if (res.data.success) setProjectFiles(res.data.files || []);
      });
    }

    if (activeTab === 'activity' && id) {
      api.get(`/projects/${id}/activity`).then((res) => {
        if (res.data.success) setActivities(res.data.activities || []);
      });
    }
  }, [activeTab, id, currentWorkspace?._id]);

  // Socket room joining & real-time events
  useEffect(() => {
    if (socket && id) {
      socket.emit('join:project', id);

      const handleTaskCreated = (newTask: Task) => {
        setTasks((prev) => [newTask, ...prev]);
      };

      const handleTaskUpdated = (updatedTask: Task) => {
        setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
      };

      const handleTaskDeleted = (data: { taskId: string }) => {
        setTasks((prev) => prev.filter((t) => t._id !== data.taskId));
      };

      const handleTaskStatusChanged = (data: { taskId: string; status: TaskStatus; order: number }) => {
        setTasks((prev) =>
          prev.map((t) => (t._id === data.taskId ? { ...t, status: data.status, order: data.order } : t))
        );
      };

      socket.on('task:created', handleTaskCreated);
      socket.on('task:updated', handleTaskUpdated);
      socket.on('task:deleted', handleTaskDeleted);
      socket.on('task:status_changed', handleTaskStatusChanged);

      return () => {
        socket.emit('leave:project', id);
        socket.off('task:created', handleTaskCreated);
        socket.off('task:updated', handleTaskUpdated);
        socket.off('task:deleted', handleTaskDeleted);
        socket.off('task:status_changed', handleTaskStatusChanged);
      };
    }
  }, [socket, id]);

  // Drag and drop handler
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const targetStatus = destination.droppableId as TaskStatus;
    const taskToMove = tasks.find((t) => t._id === draggableId);
    if (!taskToMove) return;

    // Snapshot for rollback
    const originalTasks = [...tasks];

    // Optimistic UI update
    const updatedTasks = tasks.map((t) =>
      t._id === draggableId ? { ...t, status: targetStatus, order: destination.index } : t
    );
    setTasks(updatedTasks);

    try {
      const res = await api.patch(`/tasks/${draggableId}/status`, {
        status: targetStatus,
        order: destination.index
      });
      if (!res.data.success) {
        setTasks(originalTasks);
      }
    } catch {
      // Rollback on network failure
      setTasks(originalTasks);
    }
  };

  const handleAddMember = async () => {
    if (!id || !selectedMemberToAdd) return;
    try {
      const res = await api.post(`/projects/${id}/members`, {
        userId: selectedMemberToAdd,
        role: 'contributor'
      });
      if (res.data.success) {
        setProjectMembers([...projectMembers, res.data.member]);
        setSelectedMemberToAdd('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setProjectMembers(projectMembers.filter((m) => m.user?._id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleUpdateProjectSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const res = await api.put(`/projects/${id}`, {
        name: editName,
        description: editDescription,
        priority: editPriority
      });
      if (res.data.success) {
        setProject(res.data.project);
        alert('Project updated successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update project.');
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      await api.delete(`/projects/${id}`);
      navigate('/app/projects');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete project.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !project) {
    return <TableSkeleton />;
  }

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = !priorityFilter || t.priority === priorityFilter;
    const matchesAssignee = !assigneeFilter || t.assignee?._id === assigneeFilter;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: project.color || '#4F46E5' }}
              />
              <span className="font-mono text-xs font-bold text-slate-400">{project.key}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {project.status.replace('_', ' ')}
              </span>
              {project.visibility === 'private' && (
                <span className="inline-flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                  <Lock className="w-3 h-3 mr-1" />
                  Private
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              {project.description || 'No detailed description provided.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <button
              onClick={() => {
                setDefaultColumnStatus('todo');
                setShowCreateTask(true);
              }}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-100 pt-3 overflow-x-auto">
          {[
            { id: 'board', label: 'Board', icon: Kanban },
            { id: 'list', label: 'List', icon: List },
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'overview', label: 'Overview', icon: CheckCircle2 },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'files', label: 'Files', icon: Paperclip },
            { id: 'activity', label: 'Activity', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: KANBAN BOARD */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent border-none focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Kanban DnD Canvas */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
              {COLUMNS.map((column) => {
                const columnTasks = filteredTasks
                  .filter((t) => t.status === column.id)
                  .sort((a, b) => a.order - b.order);

                return (
                  <div
                    key={column.id}
                    className="flex flex-col bg-slate-100/70 rounded-2xl border border-slate-200/60 p-3 min-w-[260px] kanban-column"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-1 py-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full border-2 ${column.color}`} />
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          {column.label}
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-400 px-1.5 py-0.2 rounded-full bg-slate-200/60">
                          {columnTasks.length}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setDefaultColumnStatus(column.id);
                          setShowCreateTask(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
                        title={`Add task to ${column.label}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Droppable Area */}
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 space-y-2.5 min-h-[150px] p-1 rounded-xl transition-colors ${
                            snapshot.isDraggingOver ? 'bg-brand-50/50 ring-2 ring-brand-400/30' : ''
                          }`}
                        >
                          {columnTasks.map((task, index) => (
                            <Draggable key={task._id} draggableId={task._id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    isDragging={dragSnapshot.isDragging}
                                    onClick={() => setSelectedTaskId(task._id)}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* TAB 2: LIST VIEW */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Task Inventory</h3>
            <span className="text-xs text-slate-400">{filteredTasks.length} tasks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Task Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No tasks found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const status = getStatusBadge(t.status);
                    const priority = getPriorityColor(t.priority);
                    return (
                      <tr
                        key={t._id}
                        onClick={() => setSelectedTaskId(t._id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-brand-600">
                          {project.key}-{t.taskNumber}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{t.title}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${status.bg}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold border uppercase ${priority.bg} ${priority.border}`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {t.assignee ? (
                            <span className="text-slate-700">{t.assignee.name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(t.dueDate)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
                }
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Today
              </button>
              <button
                onClick={() =>
                  setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
                }
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200 text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="bg-slate-50 p-2 text-center font-bold text-slate-500">
                {day}
              </div>
            ))}
            {/* Generate calendar cells */}
            {(() => {
              const year = calendarDate.getFullYear();
              const month = calendarDate.getMonth();
              const firstDay = new Date(year, month, 1).getDay();
              const totalDays = new Date(year, month + 1, 0).getDate();
              const cells = [];

              for (let i = 0; i < firstDay; i++) {
                cells.push(<div key={`empty-${i}`} className="bg-white p-2 min-h-[90px] opacity-40" />);
              }

              for (let d = 1; d <= totalDays; d++) {
                const currentCellDate = new Date(year, month, d).toISOString().split('T')[0];
                const dayTasks = tasks.filter((t) => t.dueDate && t.dueDate.startsWith(currentCellDate));

                cells.push(
                  <div key={`day-${d}`} className="bg-white p-2 min-h-[90px] space-y-1 hover:bg-slate-50/50">
                    <span className="font-bold text-slate-700 block mb-1">{d}</span>
                    <div className="space-y-1">
                      {dayTasks.map((t) => (
                        <div
                          key={t._id}
                          onClick={() => setSelectedTaskId(t._id)}
                          className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-brand-700 text-[10px] truncate cursor-pointer font-medium"
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: TIMELINE VIEW */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Task Schedule & Deliverables</h3>
            <p className="text-xs text-slate-400">Chronological mapping of project tasks</p>
          </div>

          <div className="space-y-3 pt-2">
            {tasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No tasks available for timeline visualization.
              </div>
            ) : (
              tasks.map((t) => {
                const status = getStatusBadge(t.status);
                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTaskId(t._id)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-brand-600 font-bold">
                          {project.key}-{t.taskNumber}
                        </span>
                        <span className="font-semibold text-slate-800">{t.title}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                        <span>Start: {formatDate(t.startDate)}</span>
                        <span>•</span>
                        <span>Due: {formatDate(t.dueDate)}</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full font-semibold ${status.bg}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 5: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Project Highlights</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-xs text-slate-500">Total Tasks</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{tasks.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-xs text-slate-500">Completion</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {tasks.length > 0
                    ? Math.round(
                        (tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-600 pt-2">
              <p>
                <strong>Owner:</strong> {project.owner?.name} ({project.owner?.email})
              </p>
              <p>
                <strong>Created:</strong> {formatDate(project.createdAt)}
              </p>
              <p>
                <strong>Target Due Date:</strong> {formatDate(project.dueDate)}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Project Tags</h3>
            <div className="flex flex-wrap gap-2">
              {project.tags?.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MEMBERS */}
      {activeTab === 'members' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Team Members</h3>
              <p className="text-xs text-slate-400">Assigned members who can contribute to tasks</p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedMemberToAdd}
                onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">Add workspace member...</option>
                {workspaceMembers.map((m) => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.name} ({m.user.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedMemberToAdd}
                className="px-3 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {projectMembers.map((m) => (
              <div key={m._id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  {m.user?.avatar ? (
                    <img
                      src={m.user.avatar}
                      alt={m.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
                      {getInitials(m.user?.name || '')}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">{m.user?.name}</p>
                    <p className="text-[10px] text-slate-400">{m.user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="capitalize px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {m.role}
                  </span>
                  {m.user?._id !== project.owner._id && (
                    <button
                      onClick={() => handleRemoveMember(m.user._id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Remove from project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: FILES */}
      {activeTab === 'files' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Project Files & Attachments</h3>
            <p className="text-xs text-slate-400">All assets uploaded across this project's tasks</p>
          </div>

          {projectFiles.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400">
              No files uploaded to this project yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {projectFiles.map((file) => (
                <div
                  key={file._id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <p className="font-semibold text-slate-800 truncate">{file.originalName}</p>
                    <p className="text-[10px] text-slate-400">
                      Task: {file.task?.title || 'Unknown'}
                    </p>
                  </div>
                  <a
                    href={file.path}
                    target="_blank"
                    rel="noreferrer"
                    download={file.originalName}
                    className="p-1 text-slate-400 hover:text-brand-600 rounded"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: ACTIVITY AUDIT FEED */}
      {activeTab === 'activity' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Activity & Audit Trail</h3>
            <p className="text-xs text-slate-400">Complete log of changes inside this project</p>
          </div>

          <div className="space-y-3 pt-2">
            {activities.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No activity recorded yet.</p>
            ) : (
              activities.map((act) => (
                <div
                  key={act._id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{act.user?.name}</span>{' '}
                    <span className="text-slate-600">{act.action.replace('_', ' ')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {formatRelativeTime(act.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 9: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Project Configuration</h3>
            <p className="text-xs text-slate-400">Update general project details and visibility</p>
          </div>

          <form onSubmit={handleUpdateProjectSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl"
            >
              Save Changes
            </button>
          </form>

          {/* Danger zone */}
          <div className="pt-6 border-t border-red-100 space-y-2">
            <h4 className="text-xs font-bold text-red-600 uppercase">Danger Zone</h4>
            <p className="text-xs text-slate-500">
              Permanently delete this project and all affiliated tasks, comments, and attachments.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl"
            >
              Delete Project
            </button>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      <TaskDetailsModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => {
          setSelectedTaskId(null);
          setSearchParams({});
        }}
        onTaskUpdated={(updatedTask) => {
          setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
        }}
        onTaskDeleted={(taskId) => {
          setTasks((prev) => prev.filter((t) => t._id !== taskId));
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        defaultProjectId={project._id}
        defaultStatus={defaultColumnStatus}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [newTask, ...prev]);
        }}
      />

      {/* Delete Project Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete Project"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
