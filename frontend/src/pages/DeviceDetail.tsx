import React, { useState } from 'react';
import { Device, Finding } from '../types';
import { ArrowLeft, Server, Shield, Terminal, AlertOctagon, AlertTriangle, AlertCircle, Info, ChevronRight, Copy, Check } from 'lucide-react';
import { FindingDrawer } from '../components/FindingDrawer';

interface DeviceDetailProps {
  device: Device;
  findings: Finding[];
  onBack: () => void;
}

export const DeviceDetail: React.FC<DeviceDetailProps> = ({
  device,
  findings,
  onBack
}) => {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const deviceFindings = findings.filter(f => f.device_id === device.id || !f.device_id);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          icon: <AlertOctagon className="w-4 h-4 text-red-400" />,
          badge: 'bg-red-950/60 text-red-400 border-red-500/30'
        };
      case 'HIGH':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
          badge: 'bg-orange-950/60 text-orange-400 border-orange-500/30'
        };
      case 'MEDIUM':
        return {
          icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
          badge: 'bg-amber-950/60 text-amber-400 border-amber-500/30'
        };
      case 'LOW':
      default:
        return {
          icon: <Info className="w-4 h-4 text-emerald-400" />,
          badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
        };
    }
  };

  const copyScript = (script: string, id: string) => {
    navigator.clipboard.writeText(script);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Back Navigation Bar */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fleet Overview</span>
        </button>
      </div>

      {/* Device Overview Banner */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Server className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                {device.hostname || device.filename}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {device.vendor} ({(device.vendor_confidence * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-400 space-x-4">
              <span>File: <strong className="font-mono text-gray-300">{device.filename}</strong></span>
              <span>OS: <strong className="text-gray-300">{device.os_version || 'N/A'}</strong></span>
              <span>Role: <strong className="text-gray-300">{device.device_type || 'Network Device'}</strong></span>
            </div>
          </div>
        </div>

        {/* Device Score & Risk Metric */}
        <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-6">
          <div className="text-center">
            <div className="text-2xl font-black text-white font-mono">{device.security_score}%</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Security Score</div>
          </div>

          <div className="space-y-1 text-xs font-mono">
            <div className="text-red-400">{device.critical_count} Critical</div>
            <div className="text-orange-400">{device.high_count} High</div>
            <div className="text-amber-400">{device.medium_count} Medium</div>
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
              Detected Security Findings ({deviceFindings.length})
            </h3>
            <p className="text-xs text-gray-400">
              Click any finding to inspect technical evidence and copy automated hardening commands.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {deviceFindings.length > 0 ? (
            deviceFindings.map((f) => {
              const { icon, badge } = getSeverityBadge(f.severity);
              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFinding(f)}
                  className="bg-gray-900/60 hover:bg-gray-800/60 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">{icon}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge}`}>
                            {f.severity}
                          </span>
                          <span className="text-xs font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                            {f.title}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400 line-clamp-1">
                          {f.explanation}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">{f.rule_id}</span>
                      <button className="p-1.5 rounded-lg bg-gray-800 text-gray-400 group-hover:text-white group-hover:bg-blue-600 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                  {/* Masked Evidence Quick Preview */}
                  <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="font-mono truncate max-w-md">Evidence: {f.evidence}</span>
                    <span className="text-blue-400 font-medium group-hover:underline">Inspect Details →</span>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-gray-400 text-xs">
              No compliance violations detected on this device. Configuration satisfies CIS benchmark baseline!
            </div>
          )}
        </div>
      </div>

      {/* Finding Slide-Over Inspector */}
      <FindingDrawer
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
      />

    </div>
  );
};
