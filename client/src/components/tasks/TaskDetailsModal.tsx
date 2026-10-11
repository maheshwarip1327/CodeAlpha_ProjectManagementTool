import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { api } from '../../lib/api';
import { Task, Comment, MemberItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  CheckSquare,
  MessageSquare,
  Paperclip,
  Trash2,
  Calendar,
  User as UserIcon,
  Plus,
  Download,
  Send
} from 'lucide-react';
import { formatDate, formatRelativeTime, getInitials } from '../../lib/utils';

interface TaskDetailsModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted
}) => {
  const { user, currentWorkspace, socket } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<MemberItem[]>([]);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Subtask input
  const [newSubtask, setNewSubtask] = useState('');

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // File upload state
  const [isUploading, setIsUploading] = useState(false);

  // Load task and comments
  const fetchTaskDetails = async () => {
    if (!taskId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/tasks/${taskId}`);
      if (res.data.success) {
        setTask(res.data.task);
      }

      const commentRes = await api.get(`/comments/task/${taskId}`);
      if (commentRes.data.success) {
        setComments(commentRes.data.comments || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    }
  }, [isOpen, taskId]);

  // Load members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentWorkspace) return;
      try {
        const res = await api.get(`/workspaces/${currentWorkspace._id}/members`);
        if (res.data.success) {
          setMembers(res.data.members || []);
        }
      } catch {
        // Ignore
      }
    };
    if (isOpen && currentWorkspace) {
      fetchMembers();
    }
  }, [isOpen, currentWorkspace?._id]);

  // Socket updates
  useEffect(() => {
    if (socket && taskId) {
      const handleCommentAdded = (data: { taskId: string; comment: Comment }) => {
        if (data.taskId === taskId) {
          setComments((prev) => [...prev, data.comment]);
        }
      };

      const handleTaskUpdated = (updatedTask: Task) => {
        if (updatedTask._id === taskId) {
          setTask(updatedTask);
        }
      };

      socket.on('comment:added', handleCommentAdded);
      socket.on('task:updated', handleTaskUpdated);

      return () => {
        socket.off('comment:added', handleCommentAdded);
        socket.off('task:updated', handleTaskUpdated);
      };
    }
  }, [socket, taskId]);

  const handleUpdateField = async (updates: Partial<Task> & { assigneeId?: string | null }) => {
    if (!task) return;
    try {
      const res = await api.put(`/tasks/${task._id}`, updates);
      if (res.data.success) {
        setTask(res.data.task);
        onTaskUpdated(res.data.task);
      }
    } catch {
      // Ignore
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task) return;
    try {
      const res = await api.patch(`/tasks/${task._id}/subtasks/${subtaskId}`);
      if (res.data.success) {
        setTask(res.data.task);
        onTaskUpdated(res.data.task);
      }
    } catch {
      // Ignore
    }
  };

  const handleAddSubtask = async () => {
    if (!task || !newSubtask.trim()) return;
    const currentSubtasks = [...(task.subtasks || []), { title: newSubtask.trim(), completed: false }];
    await handleUpdateField({ subtasks: currentSubtasks });
    setNewSubtask('');
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newComment.trim()) return;
    try {
      setIsPostingComment(true);
      const res = await api.post(`/comments/task/${task._id}`, { content: newComment.trim() });
      if (res.data.success) {
        setComments([...comments, res.data.comment]);
        setNewComment('');
      }
    } catch {
      // Ignore
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter((c) => c._id !== commentId));
    } catch {
      // Ignore
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const res = await api.post(`/attachments/task/${task._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setTask(res.data.task);
        onTaskUpdated(res.data.task);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return;
    try {
      const res = await api.delete(`/attachments/task/${task._id}/${attachmentId}`);
      if (res.data.success) {
        setTask({
          ...task,
          attachments: task.attachments.filter((a) => a._id !== attachmentId)
        });
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    try {
      setIsDeleting(true);
      const res = await api.delete(`/tasks/${task._id}`);
      if (res.data.success) {
        onTaskDeleted(task._id);
        setShowDeleteConfirm(false);
        onClose();
      }
    } catch {
      // Ignore
    } finally {
      setIsDeleting(false);
    }
  };

  if (!task && isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading Task...">
        <div className="p-8 text-center text-slate-500">Loading details...</div>
      </Modal>
    );
  }

  if (!task) return null;

  const projectKey = (task.project as any)?.key || 'PRJ';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${projectKey}-${task.taskNumber}`}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Header Title & Status Controls */}
          <div className="space-y-3">
            <input
              type="text"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              onBlur={() => handleUpdateField({ title: task.title })}
              className="text-lg font-bold text-slate-900 w-full px-2 py-1 -ml-2 rounded-lg border-transparent hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-transparent transition-all"
            />

            {/* Quick Properties Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Status</span>
                <select
                  value={task.status}
                  onChange={(e) => handleUpdateField({ status: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-medium capitalize"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Priority</span>
                <select
                  value={task.priority}
                  onChange={(e) => handleUpdateField({ priority: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-medium capitalize"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Assignee</span>
                <select
                  value={task.assignee?._id || ''}
                  onChange={(e) => handleUpdateField({ assigneeId: e.target.value || null })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-medium"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user._id} value={m.user._id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Due Date</span>
                <input
                  type="date"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    handleUpdateField({
                      dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                    })
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
            <textarea
              rows={3}
              value={task.description || ''}
              placeholder="Add more details about this task..."
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              onBlur={() => handleUpdateField({ description: task.description })}
              className="w-full p-3 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Subtasks / Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-brand-600" />
                <span>
                  Checklist ({task.subtasks?.filter((s) => s.completed).length || 0}/
                  {task.subtasks?.length || 0})
                </span>
              </label>
            </div>

            <div className="space-y-1.5 mb-2">
              {task.subtasks?.map((st) => (
                <div
                  key={st._id}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-xs"
                >
                  <label className="flex items-center space-x-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(st._id!)}
                      className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
                    />
                    <span
                      className={`font-medium ${
                        st.completed ? 'line-through text-slate-400' : 'text-slate-700'
                      }`}
                    >
                      {st.title}
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add checklist item..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium inline-flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Paperclip className="w-4 h-4 text-brand-600" />
                <span>Attachments ({task.attachments?.length || 0})</span>
              </label>
              <label className="cursor-pointer text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center space-x-1">
                <Plus className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {task.attachments && task.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.attachments.map((att) => (
                  <div
                    key={att._id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-slate-800 truncate">{att.originalName}</p>
                        <p className="text-[10px] text-slate-400">
                          {Math.round(att.fileSize / 1024)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <a
                        href={att.path}
                        target="_blank"
                        rel="noreferrer"
                        download={att.originalName}
                        className="p-1 text-slate-400 hover:text-brand-600 rounded"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(att._id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No files attached yet.</p>
            )}
          </div>

          {/* Comments Discussion Section */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <span>Discussion ({comments.length})</span>
            </h4>

            {/* Comments list */}
            <div className="space-y-3 max-h-56 overflow-y-auto mb-3">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex space-x-2.5 text-xs">
                    {c.user?.avatar ? (
                      <img
                        src={c.user.avatar}
                        alt={c.user.name}
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                        {getInitials(c.user?.name || '')}
                      </div>
                    )}
                    <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800">{c.user?.name}</span>
                        <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                          <span>{formatRelativeTime(c.createdAt)}</span>
                          {c.user?._id === user?._id && (
                            <button
                              onClick={() => handleDeleteComment(c._id)}
                              className="text-slate-400 hover:text-red-500 ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="flex space-x-2">
              <input
                type="text"
                placeholder="Write a message or update..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={isPostingComment || !newComment.trim()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 inline-flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-400">
              Created {formatDate(task.createdAt)} by {task.creator?.name}
            </span>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 font-medium inline-flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Task</span>
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to permanently delete task "${task.title}"? This will delete all subtasks and comments.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
};
