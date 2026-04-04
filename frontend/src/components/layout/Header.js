import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, ChevronDown, Menu, User, Settings, LogOut, X,
  Plus, Calendar, FileText, UserPlus, Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials } from '../../utils/helpers';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Breadcrumb label map
const ROUTE_LABELS = {
  dashboard: 'Tableau de bord',
  beneficiaires: 'Bénéficiaires',
  familles: 'Familles',
  intervenants: 'Intervenants',
  planning: 'Planning',
  leads: 'Leads',
  devis: 'Devis',
  factures: 'Factures',
  qualite: 'Qualité',
  prescripteurs: 'Prescripteurs',
  services: 'Services',
  notifications: 'Notifications',
  settings: 'Paramètres',
};

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Header({ onMobileMenuToggle, notificationCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const userMenuRef = useRef(null);
  const quickActionsRef = useRef(null);
  const now = useClock();

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target)) setShowQuickActions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/beneficiaires?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  // Breadcrumbs
  const segments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: ROUTE_LABELS[seg] || seg,
    path: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));

  const timeStr = format(now, 'HH:mm', { locale: fr });
  const dateStr = format(now, 'EEE d MMM', { locale: fr });

  const initials = getInitials(`${user?.prenom || ''} ${user?.nom || ''}`);

  const QUICK_ACTIONS = [
    { label: 'Nouveau bénéficiaire', icon: UserPlus, path: '/beneficiaires', color: 'text-teal-600' },
    { label: 'Nouvelle intervention', icon: Calendar, path: '/planning', color: 'text-blue-600' },
    { label: 'Nouveau lead', icon: FileText, path: '/leads', color: 'text-amber-600' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 shadow-sm">
      {/* Left: burger + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumbs — desktop */}
        <div className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-teal-600 transition-colors flex-shrink-0"
          >
            <Clock size={14} />
          </button>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.path}>
              <span className="text-slate-300 flex-shrink-0">/</span>
              {crumb.isLast ? (
                <span className="text-slate-700 font-semibold truncate">{crumb.label}</span>
              ) : (
                <button
                  onClick={() => navigate(crumb.path)}
                  className="text-slate-400 hover:text-teal-600 transition-colors truncate"
                >
                  {crumb.label}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Search desktop */}
        <form onSubmit={handleSearch} className="hidden lg:flex items-center ml-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg w-52
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white
                         transition-all duration-200 placeholder:text-slate-400"
            />
          </div>
        </form>
      </div>

      {/* Right: clock + quick actions + notifs + user */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Clock */}
        <div className="hidden xl:flex flex-col items-end mr-2">
          <span className="text-sm font-semibold text-slate-700 tabular-nums">{timeStr}</span>
          <span className="text-xs text-slate-400 capitalize">{dateStr}</span>
        </div>

        {/* Quick actions */}
        <div className="relative" ref={quickActionsRef}>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                       bg-teal-600 text-white hover:bg-teal-700 transition-colors"
          >
            <Plus size={14} />
            <span className="hidden md:inline">Nouveau</span>
          </button>

          {showQuickActions && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-fadeInScale">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.path}
                    onClick={() => { setShowQuickActions(false); navigate(action.path); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Icon size={15} className={action.color} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search mobile */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          {showSearch ? <X size={18} /> : <Search size={18} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover ring-2 ring-teal-200" />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                {initials}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-700 leading-none">{user?.prenom}</p>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role === 'admin' ? 'Admin' : 'Utilisateur'}</p>
            </div>
            <ChevronDown size={12} className="text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-fadeInScale">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">{user?.prenom} {user?.nom}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full capitalize">
                  {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                </span>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User size={14} className="text-slate-400" />
                  Mon profil
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings size={14} className="text-slate-400" />
                  Paramètres
                </button>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={14} />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="lg:hidden absolute top-14 left-0 right-0 bg-white border-b border-slate-200 px-4 py-3 z-20 shadow-md">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Rechercher un bénéficiaire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl w-full
                           focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
