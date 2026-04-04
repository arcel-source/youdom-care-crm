import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Heart, UserCheck, Calendar, TrendingUp,
  FileText, Receipt, Star, Building2, Briefcase, Bell, Settings,
  ChevronLeft, ChevronRight, LogOut, X, Activity, ChevronDown, Calculator
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Navigation groupée par catégories
const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { path: '/beneficiaires', label: 'Bénéficiaires', icon: Users, badge: null },
      { path: '/familles', label: 'Familles', icon: Heart },
      { path: '/intervenants', label: 'Intervenants', icon: UserCheck },
      { path: '/planning', label: 'Planning', icon: Calendar },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { path: '/leads', label: 'Leads', icon: TrendingUp, badge: 3 },
      { path: '/devis', label: 'Devis', icon: FileText },
      { path: '/factures', label: 'Factures', icon: Receipt },
      { path: '/prescripteurs', label: 'Prescripteurs', icon: Building2 },
      { path: '/comptabilite', label: 'Comptabilité', icon: Calculator },
    ],
  },
  {
    label: 'Qualité',
    items: [
      { path: '/qualite', label: 'Qualité', icon: Star, badge: 2 },
      { path: '/notifications', label: 'Notifications', icon: Bell, badge: 5 },
    ],
  },
  {
    label: 'Admin',
    items: [
      { path: '/services', label: 'Services', icon: Briefcase },
      { path: '/settings', label: 'Paramètres', icon: Settings },
    ],
  },
];

function HeartLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="8" fill="rgba(255,255,255,0.15)" />
      <path
        d="M14 21s-7-5.25-7-10a5 5 0 0110 0 5 5 0 0110 0c0 4.75-7 10-7 10z"
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 13h2l1.5-3 1.5 6 1.5-3H19"
        stroke="#34d399"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const { logout, user } = useAuth();
  const location = useLocation();

  const toggleGroup = (label) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    await logout();
  };

  const initials = user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() : 'YC';

  const sidebarContent = (
    <div
      className={`flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}
      style={{
        width: collapsed ? '64px' : '240px',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b px-3 py-4 flex-shrink-0`} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <HeartLogo />
            <div className="min-w-0">
              <span className="text-white font-bold text-sm tracking-tight">Youdom Care</span>
              <p className="text-teal-400 text-xs font-medium">CRM Pro</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <HeartLogo />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
          style={{ marginLeft: collapsed ? 0 : '4px' }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <button
          onClick={onMobileClose}
          className="lg:hidden flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Group header */}
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-2 py-1.5 mb-0.5 group"
              >
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{group.label}</span>
                <ChevronDown
                  size={12}
                  className={`text-slate-600 transition-transform duration-200 ${collapsedGroups[group.label] ? '-rotate-90' : ''}`}
                />
              </button>
            )}

            {!collapsedGroups[group.label] && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onMobileClose}
                      className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 group
                        ${isActive
                          ? 'bg-teal-600/25 text-teal-300'
                          : 'text-slate-400 hover:bg-white/6 hover:text-slate-200'
                        }
                        ${collapsed ? 'justify-center px-2' : ''}
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-teal-400 rounded-full" />
                      )}

                      <Icon
                        size={17}
                        className={`flex-shrink-0 transition-colors ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                      />

                      {!collapsed && (
                        <>
                          <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
                          {/* Notification badge */}
                          {item.badge && (
                            <span className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                              ${isActive ? 'bg-teal-500/40 text-teal-200' : 'bg-rose-500/80 text-white'}`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}

                      {/* Collapsed badge dot */}
                      {collapsed && item.badge && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}

            {/* Separator between groups */}
            {!collapsed && (
              <div className="h-px my-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
            )}
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="flex-shrink-0 p-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.prenom} {user.nom}</p>
              <p className="text-slate-400 text-xs truncate">{user.email}</p>
            </div>
            <Activity size={12} className="text-emerald-400 flex-shrink-0 animate-pulse-subtle" />
          </div>
        )}

        {collapsed && user && (
          <div className="flex justify-center mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              {initials}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-slate-400 hover:bg-white/8 hover:text-rose-400 transition-all text-sm
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut size={15} />
          {!collapsed && <span className="text-sm">Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative flex-shrink-0 animate-slideInLeft">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
