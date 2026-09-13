import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, AlertTriangle, AlertOctagon, Sparkles, Server, 
  ArrowRight, CheckCircle2, ChevronRight, FileText, Wrench,
  Layers, Lock, Terminal, Loader2
} from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';

export const SecurityCenter: React.FC = () => {
  const navigate = useNavigate();
  const { assessment, loading, isDemoData } = useAssessment();

  if (loading || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs font-mono">Loading threat intelligence...</p>
      </div>
    );
  }

  // Correlated multi-stage attack chains, computed server-side by the AI
  // Threat Graph correlator from this assessment's actual findings — not
  // hardcoded narrative text.
  const topRisks = assessment.ai_insights?.correlated_attack_chains || [];
  const criticalChainCount = topRisks.filter((r) => r.severity === 'CRITICAL').length;
  const roadmap = assessment.ai_insights?.remediation_roadmap || [];

  // Ranked vulnerable devices
  const sortedDevices = [...(assessment.devices || [])].sort((a, b) => a.security_score - b.security_score);

  return (
    <div className="space-y-8 pb-16 font-sans">
      
      {/* Header Banner */}
      <div className="bg-[#0B0F19] border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Central Threat Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security Intelligence Center
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {isDemoData
              ? 'Showing synthetic demo data. Run a real audit to see attack chains correlated from your own devices.'
              : `Correlated attack chains and remediation priorities synthesized from "${assessment.name}".`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/remediation')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            <span>Remediation Action Plan</span>
          </button>
        </div>
      </div>

      {/* Top Compound Attack Chains */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Compound Attack Chains</h2>
            <p className="text-xs text-slate-400">Multi-finding attack vectors identified by AI Threat Graph correlation.</p>
          </div>
          {topRisks.length > 0 && (
            <span className="text-xs font-mono text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2.5 py-1 rounded-full font-bold">
              {criticalChainCount} Critical Chain{criticalChainCount === 1 ? '' : 's'} Active
            </span>
          )}
        </div>

        {topRisks.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#0B0F19] border border-dashed border-slate-800 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-medium">No correlated multi-stage attack chains detected.</p>
            <p className="text-xs text-slate-500 mt-1">Individual findings may still exist — check Findings for the full list.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {topRisks.map((risk, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                    <h3 className="text-sm font-bold text-white">{risk.attack_chain_title}</h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold w-fit ${
                    risk.severity === 'CRITICAL' ? 'bg-rose-950/60 text-rose-300 border border-rose-800' :
                    risk.severity === 'HIGH' ? 'bg-amber-950/60 text-amber-300 border border-amber-800' :
                    'bg-blue-950/60 text-blue-300 border border-blue-800'
                  }`}>
                    {risk.severity} EXPOSURE
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {risk.description}
                </p>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Affected Devices:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {risk.affected_devices.map((d, dIdx) => (
                        <span key={dIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/remediation')}
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors self-end sm:self-auto"
                  >
                    <span>Apply Hardening CLI</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Column Section: Ranked Vulnerable Devices + AI Remediation Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ranked Devices */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Vulnerability Ranking</h3>
              <p className="text-xs text-slate-400">Devices sorted from highest risk to hardened baseline.</p>
            </div>
            <button
              onClick={() => navigate('/devices')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>View Fleet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {sortedDevices.map((d, idx) => (
              <div
                key={d.id}
                onClick={() => navigate(`/devices/${d.id}`)}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                  <div>
                    <p className="text-xs font-semibold text-white">{d.hostname || d.filename}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{d.vendor} • {d.device_type}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-bold font-mono ${
                    d.security_score >= 80 ? 'text-emerald-400' :
                    d.security_score >= 60 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {d.security_score.toFixed(0)} <span className="text-[10px] text-slate-500 font-normal">/ 100</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {d.critical_count} crit, {d.high_count} high
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Remediation Roadmap */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Remediation Roadmap</h3>
            <p className="text-xs text-slate-400">Prioritized execution plan generated from this audit's findings.</p>
          </div>

          {roadmap.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
              No roadmap items — this audit had no significant findings to prioritize.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {roadmap.map((step, idx) => {
                const palette = idx === 0
                  ? { bg: 'bg-rose-950/20', border: 'border-rose-900/40', chip: 'bg-rose-900/50 text-rose-300' }
                  : idx === 1
                  ? { bg: 'bg-amber-950/20', border: 'border-amber-900/40', chip: 'bg-amber-900/50 text-amber-300' }
                  : { bg: 'bg-cyan-950/20', border: 'border-cyan-900/40', chip: 'bg-cyan-900/50 text-cyan-300' };
                return (
                  <div key={idx} className={`p-4 rounded-2xl ${palette.bg} border ${palette.border} space-y-2`}>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${palette.chip} font-bold`}>
                      STEP {idx + 1}
                    </span>
                    <p className="text-slate-300">{step}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
