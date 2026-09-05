import React, { useMemo, useState } from 'react';
import { Search, AlertOctagon, AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { Assessment, Finding, SeverityLevel } from '../types';
import { MOCK_ASSESSMENT } from '../services/mockData';
import { FindingDrawer } from '../components/FindingDrawer';

const SEVERITY_ORDER: SeverityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

const severityStyle: Record<SeverityLevel, { icon: React.ReactNode; badge: string }> = {
  CRITICAL: { icon: <AlertOctagon className="w-4 h-4" />, badge: 'bg-red-950/60 text-red-400 border-red-500/30' },
  HIGH: { icon: <AlertTriangle className="w-4 h-4" />, badge: 'bg-orange-950/60 text-orange-400 border-orange-500/30' },
  MEDIUM: { icon: <AlertCircle className="w-4 h-4" />, badge: 'bg-amber-950/60 text-amber-400 border-amber-500/30' },
  LOW: { icon: <Info className="w-4 h-4" />, badge: 'bg-sky-950/60 text-sky-400 border-sky-500/30' },
  INFO: { icon: <Info className="w-4 h-4" />, badge: 'bg-slate-800/60 text-slate-400 border-slate-600/30' },
};

export const FindingsPage: React.FC = () => {
  const [assessment] = useState<Assessment>(MOCK_ASSESSMENT);
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'ALL'>('ALL');
  const [selected, setSelected] = useState<Finding | null>(null);

  const findings = assessment.findings || [];

  const filtered = useMemo(() => {
    return findings
      .filter((f) => severityFilter === 'ALL' || f.severity === severityFilter)
      .filter((f) => !query || f.title.toLowerCase().includes(query.toLowerCase()) || f.rule_id.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  }, [findings, severityFilter, query]);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Findings</h1>
        <p className="text-sm text-slate-500 mt-1">{findings.length} findings across your workspace.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search findings by title or rule ID..."
            className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
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
      </div>

      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-500">No findings match your filters.</div>
        )}
        {filtered.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelected(f)}
            className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-900/40 transition"
          >
            <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${severityStyle[f.severity].badge}`}>
              {severityStyle[f.severity].icon}
              {f.severity}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">{f.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.rule_id} · {f.category}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
          </button>
        ))}
      </div>

      <FindingDrawer finding={selected} onClose={() => setSelected(null)} />
    </div>
  );
};
