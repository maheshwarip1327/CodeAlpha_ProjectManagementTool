import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Task } from '../types';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';

export const CalendarPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!currentWorkspace) return;
    try {
      // Fetch projects then tasks
      const projRes = await api.get(`/projects?workspaceId=${currentWorkspace._id}`);
      if (projRes.data.success) {
        const projectIds = projRes.data.projects.map((p: any) => p._id);
        const taskPromises = projectIds.map((pid: string) => api.get(`/tasks/project/${pid}`));
        const responses = await Promise.all(taskPromises);
        const allTasks: Task[] = [];
        responses.forEach((res) => {
          if (res.data.success) allTasks.push(...res.data.tasks);
        });
        setTasks(allTasks);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentWorkspace?._id]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Workspace Calendar
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deadlines and deliverables scheduled across {currentWorkspace?.name}.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 text-slate-600 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 text-slate-600 shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-800 ml-2">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Day Header */}
        <div className="grid grid-cols-7 gap-px bg-slate-200 border-b border-slate-200 text-center font-bold text-xs text-slate-600 py-2.5 bg-slate-50">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white p-2 min-h-[110px] opacity-40" />
          ))}

          {/* Actual days */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = new Date(year, month, dayNum).toISOString().split('T')[0];
            const isToday =
              new Date().toISOString().split('T')[0] === dateStr;

            const dayTasks = tasks.filter((t) => t.dueDate && t.dueDate.startsWith(dateStr));

            return (
              <div
                key={`day-${dayNum}`}
                className={`bg-white p-2 min-h-[110px] space-y-1.5 transition-colors ${
                  isToday ? 'bg-brand-50/20' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-bold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center -ml-1'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-20">
                  {dayTasks.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => setSelectedTaskId(t._id)}
                      className="p-1 rounded-md bg-indigo-50/80 hover:bg-indigo-100 text-brand-700 text-[10px] font-medium truncate cursor-pointer transition-colors"
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TaskDetailsModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => fetchTasks()}
        onTaskDeleted={() => fetchTasks()}
      />
    </div>
  );
};
