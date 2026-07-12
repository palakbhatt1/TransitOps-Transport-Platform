import React from 'react';

const DOT_COLORS = {
  available: 'bg-green-500',
  on_trip: 'bg-blue-500',
  in_shop: 'bg-orange-500',
  retired: 'bg-red-500',
  off_duty: 'bg-gray-500',
  suspended: 'bg-red-500',
  draft: 'bg-purple-550 text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100', // We can style badges differently if we want, or keep simple dots.
  dispatched: 'bg-indigo-500',
  completed: 'bg-teal-500',
  cancelled: 'bg-red-550'
};

export default function StatusBadge({ status }) {
  const normStatus = (status || '').toLowerCase();
  
  let dotColor = 'bg-gray-400';
  let label = status ? status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown';
  let isBadge = false;
  let badgeClass = '';

  if (normStatus === 'available') {
    dotColor = 'bg-green-500';
    label = 'Available';
  } else if (normStatus === 'on_trip') {
    dotColor = 'bg-blue-500';
    label = 'On Trip';
  } else if (normStatus === 'in_shop') {
    dotColor = 'bg-orange-500';
    label = 'In Shop';
  } else if (normStatus === 'retired') {
    dotColor = 'bg-red-500';
    label = 'Retired';
  } else if (normStatus === 'off_duty') {
    dotColor = 'bg-gray-500';
    label = 'Off Duty';
  } else if (normStatus === 'suspended') {
    dotColor = 'bg-red-500';
    label = 'Suspended';
  } else if (normStatus === 'draft') {
    isBadge = true;
    badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
    label = 'Draft';
  } else if (normStatus === 'dispatched') {
    isBadge = true;
    badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    label = 'Dispatched';
  } else if (normStatus === 'completed') {
    isBadge = true;
    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = 'Completed';
  } else if (normStatus === 'cancelled') {
    isBadge = true;
    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    label = 'Cancelled';
  }

  if (isBadge) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold border ${badgeClass}`}>
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-[13px] text-gray-700">
      <span className={`w-2 h-2 rounded-full mr-2 shrink-0 ${dotColor}`} />
      {label}
    </span>
  );
}

