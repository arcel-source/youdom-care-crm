import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Heart, UserCheck, Calendar, TrendingUp,
  FileText, Receipt, Star, Building2, Briefcase, Bell, Settings,
  ChevronLeft, ChevronRight, LogOut, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ICON_MAP = {
  LayoutDashboard, Users, Heart, UserCheck, Calendar, TrendingUp,
  FileText, Receipt, Star, Building2, Briefcase, Bell, Settings
};

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard' },
  { path: '/beneficiaires', label: 'Bénéficiaires', icon: 'Users' },
  { path: '/familles', label: 'Familles', icon: 'Heart' },
  { path: '/intervenants', label: 'Intervenants', icon: 'UserCheck' },
  { path: '/planning', label: 'Planning', icon: 'Calendar' },
  { path: '/leads', label: 'Leads', icon: 'TrendingUp' },
  { path: '/devis', label: 'Devis', icon: 'FileText' },
  { path: '/factures', label: 'Factures', icon: 'Receipt' },
  { path: '/qualite', label: 'Qualité', icon: 'Star' },
  { path: '/prescripteurs', label: 'Prescripteurs', icon: 'Building2' },
  { path: '/services', label: 'Services', icon: 'Briefcase' },
  { path: '/notifications', label: 'Notifications', icon: 'Bell' },
  { path: '/settings', label: 'Paramètres', icon: 'Settings' },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-gradient-to-b from-indigo-900 to-indigo-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-indigo-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-indigo-700 font-bold text-sm">YC</span>
            </div>
            <div>
              <span className="text-white font-bold text-sm">Youdom Care</span>
              <p className="text-indigo-300 text-xs">CRM</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto">
            <span className="text-indigo-700 font-bold text-sm">YC</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex text-indigo-300 hover:text-white transition-colors p-1 rounded"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <button
          onClick={onMobileClose}
          className="lg:hidden text-indigo-300 hover:text-white transition-colors p-1 rounded"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 group
                ${isActive
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon size={18} className={isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white'} />}
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-indigo-700 p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {user.prenom?.[0]}{user.nom?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.prenom} {user.nom}</p>
              <p className="text-indigo-300 text-xs truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-indigo-300 hover:bg-white/10 hover:text-white transition-colors text-sm
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut size={16} />
          {!collapsed && <span>Déconnexion</span>}
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
            className="fixed inset-0 bg-black/50"
            onClick={onMobileClose}
          />
          <div className="relative flex-shrink-0">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
