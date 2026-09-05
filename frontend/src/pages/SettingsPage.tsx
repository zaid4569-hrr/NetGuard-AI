import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, LogOut, Moon, Sun, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TABS = ['Profile', 'Security', 'Preferences', 'Workspace'] as const;

export const SettingsPage: React.FC = () => {
  const { user, activeWorkspace, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Profile');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [orgName, setOrgName] = useState(user?.organizationName || '');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await updateProfile({ fullName, organizationName: orgName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl space-y-6 pb-16">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account, security, and workspace preferences.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
              tab === t ? 'border-cyan-500 text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && (
        <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <User className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">{user?.email}</p>
              <p className="text-xs text-slate-500">{activeWorkspace?.name}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3" /> Organization</label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-1 w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-sm font-medium hover:bg-cyan-400 transition"
            >
              Save changes
            </button>
            {saved && <span className="text-xs text-emerald-400">Saved.</span>}
          </div>
        </div>
      )}

      {tab === 'Security' && (
        <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-slate-300">
            <Shield className="w-5 h-5 text-cyan-400" />
            <p className="text-sm">Session and authentication controls.</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium hover:bg-rose-500/20 transition"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      )}

      {tab === 'Preferences' && (
        <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-200">Theme</p>
            <p className="text-xs text-slate-500">Choose between dark (SOC) and light mode.</p>
          </div>
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 text-sm text-slate-300 hover:border-slate-700 transition"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      )}

      {tab === 'Workspace' && (
        <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm font-medium text-slate-200">{activeWorkspace?.name}</p>
          <p className="text-xs text-slate-500 mt-1">Role: {activeWorkspace?.role}</p>
        </div>
      )}
    </div>
  );
};
