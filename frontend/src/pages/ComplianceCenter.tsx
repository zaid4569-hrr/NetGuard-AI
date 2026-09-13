import React, { useMemo, useState } from 'react';
import { CheckSquare, ShieldCheck, AlertTriangle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Finding } from '../types';
import { useAssessment } from '../context/AssessmentContext';

type Framework = 'CIS' | 'NIST' | 'ISO27001';

const FRAMEWORK_LABELS: Record<Framework, string> = {
  CIS: 'CIS Benchmarks',
  NIST: 'NIST 800-53',
  ISO27001: 'ISO/IEC 27001',
};

const FRAMEWORK_FIELD: Record<Framework, keyof Finding> = {
  CIS: 'cis_reference',
  NIST: 'nist_reference',
  ISO27001: 'iso27001_reference',
};

export const ComplianceCenter: React.FC = () => {
  const { assessment, loading, isDemoData } = useAssessment();
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const findings = assessment?.findings || [];

  // Real compliance coverage per framework: what fraction of rules mapped
  // to that framework in this audit currently have no open finding.
  const coverage = useMemo(() => {
    const result: Record<Framework, { mapped: number; violated: number }> = {
      CIS: { mapped: 0, violated: 0 },
      NIST: { mapped: 0, violated: 0 },
      ISO27001: { mapped: 0, violated: 0 },
    };
    findings.forEach((f) => {
      (Object.keys(FRAMEWORK_FIELD) as Framework[]).forEach((fw) => {
        if (f[FRAMEWORK_FIELD[fw]]) {
          result[fw].mapped += 1;
          result[fw].violated += 1;
        }
      });
    });
    return result;
  }, [findings]);

  // Group findings by category for the breakdown list
  const byCategory = useMemo(() => {
    const map: Record<string, Finding[]> = {};
    findings.forEach((f) => {
      if (!map[f.category]) map[f.category] = [];
      map[f.category].push(f);
    });
    return map;
  }, [findings]);

  if (loading || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs font-mono">Loading compliance mappings...</p>
      </div>
    );
  }

  const totalMappedFindings = (Object.keys(FRAMEWORK_FIELD) as Framework[]).some((fw) => coverage[fw].mapped > 0);

  return (
    <div className="space-y-8 pb-16 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-cyan-400" />
          Compliance Center
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isDemoData
            ? 'Showing synthetic demo data — run a real audit to see your own compliance exposure.'
            : `Open findings from "${assessment.name}" mapped to industry compliance frameworks.`}
        </p>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.keys(FRAMEWORK_LABELS) as Framework[]).map((fw) => {
          const { mapped, violated } = coverage[fw];
          const hasIssues = violated > 0;
          return (
            <div key={fw} className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{FRAMEWORK_LABELS[fw]}</h3>
                {hasIssues ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className={`text-2xl font-bold font-mono ${hasIssues ? 'text-amber-400' : 'text-emerald-400'}`}>
                {violated}
              </p>
              <p className="text-[11px] text-slate-500">
                open finding{violated === 1 ? '' : 's'} mapped to this framework
              </p>
            </div>
          );
        })}
      </div>

      {!totalMappedFindings && findings.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-xs text-slate-500">
          None of this audit's findings carry a framework reference in the rule catalog yet — see Rule Catalog for coverage by rule.
        </div>
      )}

      {/* Findings by Category */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white">Findings by Control Category</h2>
        {Object.keys(byCategory).length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
            No open findings — this audit is fully compliant against evaluated rules.
          </div>
        ) : (
          Object.entries(byCategory).map(([category, catFindings]) => {
            const isOpen = openCategory === category;
            return (
              <div key={category} className="rounded-2xl bg-[#0B0F19] border border-slate-800 overflow-hidden">
                <button
                  onClick={() => setOpenCategory(isOpen ? null : category)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-900/40 transition"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                    <span className="text-sm font-semibold text-slate-200">{category}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{catFindings.length} finding{catFindings.length === 1 ? '' : 's'}</span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-slate-800/60 border-t border-slate-800/60">
                    {catFindings.map((f) => (
                      <div key={f.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-slate-200">{f.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{f.rule_id} · {f.severity}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-500">
                          {f.cis_reference && <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">CIS {f.cis_reference}</span>}
                          {f.nist_reference && <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">NIST {f.nist_reference}</span>}
                          {f.iso27001_reference && <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">ISO {f.iso27001_reference}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
