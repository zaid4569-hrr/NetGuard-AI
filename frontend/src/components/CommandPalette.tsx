import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Shield, FileText, Cpu, AlertTriangle, 
  HelpCircle, ArrowRight, X, Command
} from 'lucide-react';
import { MOCK_ASSESSMENT, MOCK_RULES } from '../services/mockData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // handled by parent or toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter items across categories
  const filteredDevices = MOCK_ASSESSMENT.devices.filter(d => 
    (d.hostname || d.filename).toLowerCase().includes(query.toLowerCase()) ||
    d.vendor.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredFindings = MOCK_ASSESSMENT.findings.filter(f =>
    f.title.toLowerCase().includes(query.toLowerCase()) ||
    f.rule_id.toLowerCase().includes(query.toLowerCase()) ||
    f.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredRules = MOCK_RULES.filter(r =>
    r.title.toLowerCase().includes(query.toLowerCase()) ||
    r.rule_id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const quickNav = [
    { label: 'Security Dashboard', path: '/dashboard', icon: Shield },
    { label: 'Security Center (SOC)', path: '/security-center', icon: AlertTriangle },
    { label: 'Run New Configuration Audit', path: '/audit', icon: Cpu },
    { label: 'AI Security Copilot', path: '/ai-copilot', icon: Command },
    { label: 'Compare Baseline Configs', path: '/compare', icon: ArrowRight },
    { label: 'Compliance Frameworks', path: '/compliance', icon: FileText },
    { label: 'Documentation Hub', path: '/docs', icon: HelpCircle },
  ].filter(n => n.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#0B0F19] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 divide-y divide-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 gap-3 bg-slate-900/50">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            placeholder="Search devices, findings, rules, reports, or navigate (Ctrl + K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500 font-sans"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          
          {/* Quick Navigation */}
          {quickNav.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">Quick Navigation</p>
              <div className="space-y-1">
                {quickNav.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-cyan-400" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{item.path}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Devices */}
          {filteredDevices.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">Audited Devices</p>
              <div className="space-y-1">
                {filteredDevices.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect(`/devices/${d.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="font-medium text-slate-200">{d.hostname || d.filename}</p>
                        <p className="text-[10px] text-slate-500">{d.vendor} • Score {d.security_score}/100</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Device</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Findings */}
          {filteredFindings.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">Security Findings</p>
              <div className="space-y-1">
                {filteredFindings.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelect('/findings')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className={`w-4 h-4 ${f.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`} />
                      <div className="truncate max-w-md">
                        <p className="font-medium text-slate-200 truncate">{f.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{f.rule_id} • {f.category}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      f.severity === 'CRITICAL' ? 'bg-rose-950/60 text-rose-300 border border-rose-800' : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                    }`}>
                      {f.severity}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {filteredRules.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">Rule Catalog</p>
              <div className="space-y-1">
                {filteredRules.map((r) => (
                  <button
                    key={r.rule_id}
                    onClick={() => handleSelect('/rules')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-violet-400" />
                      <div>
                        <p className="font-medium text-slate-200">{r.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{r.rule_id} • {r.category}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Rule</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredDevices.length === 0 && filteredFindings.length === 0 && filteredRules.length === 0 && quickNav.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              <p>No matching security assets or commands found for "{query}".</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate with <b>↑</b> <b>↓</b></span>
          <span><b>ESC</b> to close</span>
        </div>
      </div>
    </div>
  );
};
