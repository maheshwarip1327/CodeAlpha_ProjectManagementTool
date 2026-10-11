import React from 'react';
import { Calendar, CheckSquare, Paperclip } from 'lucide-react';
import { Task } from '../../types';
import { getPriorityColor, getInitials, formatDate } from '../../lib/utils';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, isDragging }) => {
  const priorityStyle = getPriorityColor(task.priority);

  // Check if overdue
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'completed';

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const projectKey =
    typeof task.project === 'object' && task.project !== null
      ? (task.project as any).key || 'PRJ'
      : 'PRJ';

  return (
    <div
      onClick={onClick}
      className={`group relative p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer select-none space-y-2.5 ${
        isDragging ? 'shadow-xl ring-2 ring-brand-500/50 scale-[1.02] opacity-95' : ''
      }`}
    >
      {/* Top row: Key & Priority */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-semibold text-slate-400 group-hover:text-brand-600 transition-colors">
          {projectKey}-{task.taskNumber}
        </span>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${priorityStyle.bg} ${priorityStyle.border}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-brand-700 transition-colors">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((l, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
            >
              {l}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] px-1 py-0.5 text-slate-400">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Bottom meta row */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-slate-400 text-[11px]">
        <div className="flex items-center space-x-2.5">
          {/* Due date */}
          {task.dueDate && (
            <div
              className={`flex items-center space-x-1 font-medium ${
                isOverdue ? 'text-red-600' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          {/* Subtasks counter */}
          {totalSubtasks > 0 && (
            <div className="flex items-center space-x-1 text-slate-500">
              <CheckSquare className="w-3 h-3" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}

          {/* Attachments counter */}
          {task.attachments?.length > 0 && (
            <div className="flex items-center space-x-1 text-slate-500">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        <div>
          {task.assignee ? (
            task.assignee.avatar ? (
              <img
                src={task.assignee.avatar}
                alt={task.assignee.name}
                className="w-5 h-5 rounded-full object-cover border border-slate-200"
                title={task.assignee.name}
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[9px] font-bold"
                title={task.assignee.name}
              >
                {getInitials(task.assignee.name)}
              </div>
            )
          ) : (
            <div className="w-5 h-5 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-300">
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
