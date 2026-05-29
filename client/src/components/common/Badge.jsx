import React from 'react';

const statusColors = {
  present: 'bg-green-100 text-green-700',
  late: 'bg-yellow-100 text-yellow-700',
  absent: 'bg-red-100 text-red-700',
  half_day: 'bg-orange-100 text-orange-700',
  on_leave: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  holiday: 'bg-purple-100 text-purple-700',
};

const Badge = ({ status }) => {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colorClass}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

export default Badge;
