import React from 'react';
import {
  FileText,
  Users,
  Calendar,
  Search,
  Inbox,
  AlertCircle,
  Star,
  FolderOpen,
} from 'lucide-react';

const iconMap = {
  file: FileText,
  users: Users,
  calendar: Calendar,
  search: Search,
  inbox: Inbox,
  alert: AlertCircle,
  star: Star,
  folder: FolderOpen,
};

const EmptyState = ({
  icon = 'inbox',
  title = 'Aucun élément',
  description = 'Il n\'y a rien à afficher pour le moment.',
  action,
  onAction,
  className = '',
}) => {
  const IconComponent = iconMap[icon] || Inbox;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 animate-fadeIn ${className}`}>
      {/* SVG illustration background */}
      <div className="relative mb-6">
        <svg
          width="120"
          height="100"
          viewBox="0 0 120 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute -top-4 -left-6 opacity-40"
        >
          <ellipse cx="60" cy="50" rx="55" ry="42" fill="#f0fdfa" />
          <circle cx="20" cy="18" r="6" fill="#99f6e4" opacity="0.6" />
          <circle cx="100" cy="72" r="8" fill="#5eead4" opacity="0.4" />
          <circle cx="95" cy="20" r="4" fill="#a7f3d0" opacity="0.5" />
          <circle cx="14" cy="75" r="5" fill="#6ee7b7" opacity="0.4" />
        </svg>

        <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl flex items-center justify-center shadow-sm border border-teal-100">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
            <IconComponent size={24} className="text-white" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-700 mb-2 text-center">{title}</h3>
      <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed mb-6">
        {description}
      </p>

      {action && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-medium rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
        >
          {action}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
