import React from 'react';
import * as Icons from 'lucide-react';

export default function EmptyState({
  icon = 'Inbox',
  title = 'Aucun résultat',
  description,
  action,
}) {
  const Icon = Icons[icon] || Icons.Inbox;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
