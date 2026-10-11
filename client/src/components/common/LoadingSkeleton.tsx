import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-3">
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
      <div className="h-4 bg-slate-200 rounded-full w-12"></div>
    </div>
    <div className="h-5 bg-slate-200 rounded w-3/4"></div>
    <div className="h-3 bg-slate-100 rounded w-full"></div>
    <div className="h-3 bg-slate-100 rounded w-5/6"></div>
    <div className="pt-3 flex justify-between items-center border-t border-slate-100">
      <div className="h-6 w-6 rounded-full bg-slate-200"></div>
      <div className="h-4 bg-slate-200 rounded w-20"></div>
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4 animate-pulse">
    <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex space-x-4 py-3 border-b border-slate-100">
        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
        <div className="h-4 bg-slate-200 rounded w-2/6"></div>
        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-slate-200 rounded w-1/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 h-28"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 h-80"></div>
      <div className="bg-white rounded-2xl border border-slate-200 h-80"></div>
    </div>
  </div>
);
