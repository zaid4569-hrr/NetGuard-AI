import React, { useState } from 'react';
import { GitCompare, ArrowRight, Loader2, CheckCircle2, AlertTriangle, Minus, Plus } from 'lucide-react';
import { apiClient, CompareResult } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const VENDORS = ['Cisco', 'Juniper', 'Fortinet', 'Palo Alto', 'MikroTik', 'Aruba'];

export const ComparePage: React.FC = () => {
  const [beforeConfig, setBeforeConfig] = useState('');
  const [afterConfig, setAfterConfig] = useState('');
  const [vendorOverride, setVendorOverride] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const { addNotification } = useNotifications();

  const runCompare = async () => {
    if (!beforeConfig.trim() || !afterConfig.trim()) {
      addNotification('Missing Input', 'Paste both a before and after configuration to compare.', 'warning');
      return;
    }
    setIsComparing(true);
    try {
      const res = await apiClient.compareConfigs(beforeConfig, afterConfig, vendorOverride || undefined);
      setResult(res);
    } catch (err) {
      addNotification(
        'Comparison Failed',
        err instanceof Error ? err.message : 'Could not compare these configurations.',
        'error'
      );
    } finally {
      setIsComparing(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-cyan-400' : score >= 40 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="space-y-8 pb-16 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-cyan-400" />
          Configuration Comparison
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Paste a before and after configuration (e.g. pre- and post-remediation) to see the exact security score delta and which findings were resolved or newly introduced.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400">Before Configuration</label>
          <textarea
            value={beforeConfig}
            onChange={(e) => setBeforeConfig(e.target.value)}
            placeholder="Paste original configuration here..."
            className="w-full h-64 px-4 py-3 rounded-2xl bg-[#0B0F19] border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400">After Configuration</label>
          <textarea
            value={afterConfig}
            onChange={(e) => setAfterConfig(e.target.value)}
            placeholder="Paste remediated configuration here..."
            className="w-full h-64 px-4 py-3 rounded-2xl bg-[#0B0F19] border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <select
          value={vendorOverride}
          onChange={(e) => setVendorOverride(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
        >
          <option value="">Auto-Detect Vendor</option>
          {VENDORS.map((v) => (
            <option key={v} value={v}>Force {v}</option>
          ))}
        </select>
        <button
          onClick={runCompare}
          disabled={isComparing}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isComparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
          <span>{isComparing ? 'Comparing...' : 'Run Comparison'}</span>
        </button>
      </div>

      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Score Delta Banner */}
          <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 flex flex-col sm:flex-row items-center justify-around gap-6 text-center">
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-mono mb-1">Before</p>
              <p className={`text-3xl font-bold font-mono ${scoreColor(result.score_before)}`}>{result.score_before.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500 mt-1">{result.total_findings_before} findings · {result.vendor_before}</p>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-600 shrink-0" />
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-mono mb-1">After</p>
              <p className={`text-3xl font-bold font-mono ${scoreColor(result.score_after)}`}>{result.score_after.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500 mt-1">{result.total_findings_after} findings · {result.vendor_after}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl border font-mono text-sm font-bold ${
              result.score_delta >= 0 ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' : 'bg-rose-950/40 border-rose-800 text-rose-400'
            }`}>
              {result.score_delta >= 0 ? '+' : ''}{result.score_delta.toFixed(1)} pts
            </div>
          </div>

          {/* Resolved / New Findings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Resolved ({result.resolved_findings.length})
              </h3>
              {result.resolved_findings.length === 0 ? (
                <p className="text-xs text-slate-500">No findings were resolved.</p>
              ) : (
                <div className="space-y-2">
                  {result.resolved_findings.map((f, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-start gap-2 text-xs">
                      <Minus className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-200 font-medium">{f.title}</p>
                        <p className="text-slate-500 text-[10px] font-mono">{f.rule_id} · {f.category} · {f.severity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Newly Introduced ({result.new_findings.length})
              </h3>
              {result.new_findings.length === 0 ? (
                <p className="text-xs text-slate-500">No new findings were introduced.</p>
              ) : (
                <div className="space-y-2">
                  {result.new_findings.map((f, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-start gap-2 text-xs">
                      <Plus className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-200 font-medium">{f.title}</p>
                        <p className="text-slate-500 text-[10px] font-mono">{f.rule_id} · {f.category} · {f.severity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unified Diff */}
          {result.diff_lines.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Unified Diff</h3>
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto max-h-96 overflow-y-auto font-mono text-[11px]">
                {result.diff_lines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-0.5 whitespace-pre ${
                      line.type === 'added' ? 'bg-emerald-950/40 text-emerald-300' :
                      line.type === 'removed' ? 'bg-rose-950/40 text-rose-300' :
                      'text-slate-500'
                    }`}
                  >
                    {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}{line.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
