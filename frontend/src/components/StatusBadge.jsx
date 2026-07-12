import React from 'react';

const STATUS_STYLES = {
  // Vehicle statuses
  available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  on_trip: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_shop: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  retired: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',

  // Driver statuses
  off_duty: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  suspended: 'bg-rose-500/10 text-rose-400 border-rose-500/20',

  // Trip statuses
  draft: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  dispatched: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  completed: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20'
};

const DOT_COLORS = {
  available: 'bg-emerald-400 shadow-emerald-400/50',
  on_trip: 'bg-blue-400 shadow-blue-400/50',
  in_shop: 'bg-amber-400 shadow-amber-400/50',
  retired: 'bg-zinc-400 shadow-zinc-400/50',
  off_duty: 'bg-slate-400 shadow-slate-400/50',
  suspended: 'bg-rose-400 shadow-rose-400/50',
  draft: 'bg-violet-400 shadow-violet-400/50',
  dispatched: 'bg-indigo-400 shadow-indigo-400/50',
  completed: 'bg-teal-400 shadow-teal-400/50',
  cancelled: 'bg-red-400 shadow-red-400/50'
};

export default function StatusBadge({ status }) {
  const normStatus = (status || '').toLowerCase();
  const styleClass = STATUS_STYLES[normStatus] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  const dotColor = DOT_COLORS[normStatus] || 'bg-zinc-400';
  const label = status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styleClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shadow-[0_0_8px_rgba(255,255,255,0.2)] animate-pulse`} />
      {label}
    </span>
  );
}
