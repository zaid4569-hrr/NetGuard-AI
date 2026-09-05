import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Shield, LayoutDashboard, AlertOctagon, UploadCloud, Server, 
  Search, GitCompare, Wrench, Sparkles, Network, 
  TrendingUp, CheckSquare, BookOpen, FileText, Layers, 
  Settings, LogOut, ChevronLeft, ChevronRight, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navGroups = [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Security Center', path: '/security-center', icon: AlertOctagon },
      ]
    },
    {
      group: 'Auditing',
      items: [
        { label: 'New Audit', path: '/audit', icon: UploadCloud },
        { label: 'Devices', path: '/devices', icon: Server },
        { label: 'Findings', path: '/findings', icon: Search },
        { label: 'Compare Configs', path: '/compare', icon: GitCompare },
        { label: 'Config Advisor', path: '/remediation', icon: Wrench },
      ]
    },
    {
      group: 'Intelligence',
      items: [
        { label: 'AI Security Copilot', path: '/ai-copilot', icon: Sparkles, badge: 'AI' },
        { label: 'Network Map', path: '/network-map', icon: Network },
        { label: 'Security Trends', path: '/security-trends', icon: TrendingUp },
      ]
    },
    {
      group: 'Governance',
      items: [
        { label: 'Compliance', path: '/compliance', icon: CheckSquare },
        { label: 'Rule Catalog', path: '/rules', icon: BookOpen },
        { label: 'Reports', path: '/reports', icon: FileText },
      ]
    },
    {
      group: 'Resources',
      items: [
        { label: 'Documentation', path: '/docs', icon: Layers },
        { label: 'Vendors', path: '/vendors', icon: Server },
      ]
    }
  ];

  return (
    <aside 
      className={`relative flex flex-col border-r border-slate-800 bg-[#080B11] text-slate-300 transition-all duration-300 z-30 shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <NavLink to="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wider text-white flex items-center gap-1.5">
                NETGUARD <span className="text-cyan-400 font-extrabold text-xs px-1 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-tight">Security Posture v2.0</span>
            </div>
          )}
        </NavLink>

        <button
          onClick={onToggle}
          aria-label="Toggle Sidebar"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden md:flex"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Group Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((grp, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {grp.group}
              </p>
            )}
            {grp.items.map((item, itemIdx) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={itemIdx}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Profile & Settings */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-1">
        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isActive
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {/* User Card */}
        <div className="pt-2 flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || 'Operator'}</p>
                <p className="text-[10px] text-slate-500 truncate font-mono">{user?.email || 'secops@netguard'}</p>
              </div>
            )}
          </div>
          
          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Logout Session"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
