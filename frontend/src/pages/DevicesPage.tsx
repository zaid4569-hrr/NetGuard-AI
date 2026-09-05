import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, ShieldAlert, ChevronRight, UploadCloud } from 'lucide-react';
import { Assessment } from '../types';
import { MOCK_ASSESSMENT } from '../services/mockData';

export const DevicesPage: React.FC = () => {
  const [assessment] = useState<Assessment>(MOCK_ASSESSMENT);
  const navigate = useNavigate();

  const devices = assessment.devices || [];

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-cyan-400' : score >= 40 ? 'text-amber-400' : 'text-rose-400';

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
        <Server className="w-10 h-10 text-slate-600 mb-4" />
        <h1 className="text-lg font-semibold text-slate-100 mb-2">No devices yet</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">Run your first audit to populate your device inventory.</p>
        <button
          onClick={() => navigate('/audit')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-medium text-sm hover:bg-cyan-400 transition"
        >
          <UploadCloud className="w-4 h-4" /> Run Your First Audit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Device Inventory</h1>
        <p className="text-sm text-slate-500 mt-1">All devices audited across your workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <button
            key={device.id}
            onClick={() => navigate(`/devices/${device.id}`)}
            className="text-left bg-[#0B0F19] border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/40 transition group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center">
                <Server className="w-5 h-5 text-slate-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">{device.hostname || device.filename}</h3>
            <p className="text-xs text-slate-500 mt-1">{device.vendor} {device.device_type ? `· ${device.device_type}` : ''}</p>
            <div className="flex items-center justify-between mt-4">
              <span className={`text-2xl font-bold ${scoreColor(device.security_score)}`}>{device.security_score}</span>
              <div className="flex items-center gap-1 text-xs text-rose-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                {device.critical_count} critical
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
