import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Search, Bell, Sun, Moon, Shield, ChevronDown, 
  Menu, User, Settings, Layers, LogOut, CheckCircle2, 
  Building2, Command
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

interface TopHeaderProps {
  onOpenSearch: () => void;
  onToggleSidebarMobile: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ 
  onOpenSearch, 
  onToggleSidebarMobile 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, workspaces, activeWorkspace, switchWorkspace, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Generate breadcrumb titles from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentTitle = pathParts.length > 0 
    ? pathParts[pathParts.length - 1].replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#080B11]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0">
      
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <Link to="/dashboard" className="text-slate-400 hover:text-cyan-400 transition-colors">
            SEC-OPS
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-semibold tracking-wide">{currentTitle}</span>
        </div>
      </div>

      {/* Right: Search, Workspace Selector, Notifications, Theme, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Global Search trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-xs"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick search...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono border border-slate-700">
            Ctrl K
          </kbd>
        </button>

        {/* Workspace Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/40 text-slate-300 hover:text-white text-xs transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden md:inline-block max-w-[130px] truncate font-medium">
              {activeWorkspace?.name || 'Default Workspace'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isWorkspaceOpen && (
            <div 
              className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0B0F19] border border-slate-700 shadow-2xl p-2 z-50 animate-fade-in"
              onClick={() => setIsWorkspaceOpen(false)}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Active Workspaces
              </p>
              <div className="space-y-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => switchWorkspace(ws.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                      ws.id === activeWorkspace?.id
                        ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                      {ws.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl border border-slate-700/80 bg-slate-900/40 text-slate-400 hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center border-2 border-[#080B11]">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div 
              className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0B0F19] border border-slate-700 shadow-2xl overflow-hidden z-50 animate-fade-in divide-y divide-slate-800"
            >
              <div className="p-3 bg-slate-900/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Security Telemetry Alerts</span>
                <span className="text-[10px] text-slate-400 font-mono">{notifications.length} events</span>
              </div>
              <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      n.read ? 'bg-transparent text-slate-400' : 'bg-slate-800/40 text-slate-200 border-l-2 border-cyan-400'
                    }`}
                  >
                    <p className="font-semibold text-slate-200 text-xs">{n.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[9px] text-slate-500 font-mono mt-1 block">{n.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-700/80 bg-slate-900/40 text-slate-400 hover:text-amber-300 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-700/80 bg-slate-900/40 hover:bg-slate-800/60 transition-colors"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0B0F19] border border-slate-700 shadow-2xl p-2 z-50 animate-fade-in space-y-1 divide-y divide-slate-800"
              onClick={() => setIsUserMenuOpen(false)}
            >
              <div className="px-2.5 py-2">
                <p className="text-xs font-semibold text-slate-200">{user?.fullName || 'SecOps Operator'}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{user?.email || 'operator@netguard'}</p>
              </div>

              <div className="pt-1 space-y-1">
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Profile & Workspace</span>
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Security Preferences</span>
                </button>
                <button
                  onClick={() => navigate('/docs')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Documentation</span>
                </button>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
