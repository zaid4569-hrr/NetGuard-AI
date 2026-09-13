import React, { useMemo, useState } from 'react';
import {
  Wrench, Copy, Check, AlertOctagon, AlertTriangle, AlertCircle,
  Info, ChevronDown, ChevronRight, Loader2, Server
} from 'lucide-react';
import { Finding, SeverityLevel } from '../types';
import { useAssessment } from '../context/AssessmentContext';

const SEVERITY_ORDER: SeverityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

const severityStyle: Record<SeverityLevel, { icon: React.ReactNode; badge: string }> = {
  CRITICAL: { icon: <AlertOctagon className="w-3.5 h-3.5" />, badge: 'bg-red-950/60 text-red-400 border-red-500/30' },
  HIGH: { icon: <AlertTriangle className="w-3.5 h-3.5" />, badge: 'bg-orange-950/60 text-orange-400 border-orange-500/30' },
  MEDIUM: { icon: <AlertCircle className="w-3.5 h-3.5" />, badge: 'bg-amber-950/60 text-amber-400 border-amber-500/30' },
  LOW: { icon: <Info className="w-3.5 h-3.5" />, badge: 'bg-sky-950/60 text-sky-400 border-sky-500/30' },
  INFO: { icon: <Info className="w-3.5 h-3.5" />, badge: 'bg-slate-800/60 text-slate-400 border-slate-600/30' },
};

const RemediationRow: React.FC<{ finding: Finding; deviceName?: string }> = ({ finding, deviceName }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!finding.remediation_script) return;
    navigator.clipboard.writeText(finding.remediation_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-2xl bg-[#0B0F19] border border-slate-800 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-900/40 transition"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium ${severityStyle[finding.severity].badge}`}>
          {severityStyle[finding.severity].icon}
          {finding.severity}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-200 truncate">{finding.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            {deviceName && <span className="flex items-center gap-1"><Server className="w-3 h-3" />{deviceName}</span>}
            <span>{finding.rule_id} · {finding.category}</span>
          </p>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-800/60 pt-3">
          <p className="text-xs text-slate-400 leading-relaxed">{finding.recommendation}</p>
          {finding.remediation_script ? (
            <div className="relative">
              <pre className="p-3 pr-16 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                {finding.remediation_script}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-600 italic">No vendor-specific command captured for this rule — apply the recommendation above manually.</p>
          )}
          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
            {finding.cis_reference && <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">CIS: {finding.cis_reference}</span>}
            {finding.nist_reference && <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">NIST: {finding.nist_reference}</span>}
            {finding.iso27001_reference && <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">ISO 27001: {finding.iso27001_reference}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export const RemediationCenter: React.FC = () => {
  const { assessment, loading, isDemoData } = useAssessment();
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'ALL'>('ALL');

  const deviceNameById = useMemo(() => {
    const map: Record<string, string> = {};
    (assessment?.devices || []).forEach((d) => { map[d.id] = d.hostname || d.filename; });
    return map;
  }, [assessment]);

  const findings = useMemo(() => {
    return (assessment?.findings || [])
      .filter((f) => severityFilter === 'ALL' || f.severity === severityFilter)
      .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  }, [assessment, severityFilter]);

  if (loading || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs font-mono">Loading remediation plan...</p>
      </div>
    );
  }

  const withScripts = findings.filter((f) => f.remediation_script).length;

  return (
    <div className="space-y-6 pb-16 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-cyan-400" />
          Remediation Center
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isDemoData
            ? 'Showing synthetic demo data — run a real audit to get vendor-specific fix commands for your own devices.'
            : `${findings.length} open finding${findings.length === 1 ? '' : 's'} across "${assessment.name}" — ${withScripts} with ready-to-run commands.`}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(['ALL', ...SEVERITY_ORDER] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border whitespace-nowrap transition ${
              severityFilter === sev
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {findings.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
            No open findings match this filter.
          </div>
        ) : (
          findings.map((f) => (
            <RemediationRow key={f.id} finding={f} deviceName={deviceNameById[f.device_id]} />
          ))
        )}
      </div>
    </div>
  );
};
