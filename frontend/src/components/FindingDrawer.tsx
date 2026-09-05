import React, { useState } from 'react';
import { Finding } from '../types';
import { X, ShieldAlert, Check, Copy, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';

interface FindingDrawerProps {
  finding: Finding | null;
  onClose: () => void;
}

export const FindingDrawer: React.FC<FindingDrawerProps> = ({ finding, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!finding) return null;

  const handleCopy = () => {
    if (finding.remediation_script) {
      navigator.clipboard.writeText(finding.remediation_script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-950/80 text-amber-400 border-amber-500/40';
      case 'LOW':
      default:
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-[#111827] border-l border-gray-800 h-full overflow-y-auto shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Top Bar */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityBadge(finding.severity)}`}>
                {finding.severity}
              </span>
              <span className="text-xs font-mono text-gray-400">{finding.rule_id}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Finding Title & Category */}
          <div className="mt-4">
            <h2 className="text-lg font-bold text-white leading-tight">
              {finding.title}
            </h2>
            <div className="mt-1 flex items-center space-x-3 text-xs text-gray-400">
              <span>Category: <strong className="text-gray-200">{finding.category}</strong></span>
              {finding.cis_reference && (
                <span className="text-blue-400">| {finding.cis_reference}</span>
              )}
            </div>
          </div>

          {/* Technical Explanation ("Why it matters") */}
          <div className="mt-6 space-y-2">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Why this is a risk
            </h4>
            <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-300 leading-relaxed">
              {finding.explanation}
            </div>
          </div>

          {/* Masked Technical Evidence */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Configuration Evidence
              </h4>
              <span className="text-[10px] text-emerald-400 font-medium">🔒 Zero Secret Leakage</span>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 font-mono text-xs text-gray-300 overflow-x-auto">
              {finding.evidence}
            </div>
          </div>

          {/* Recommendation */}
          <div className="mt-6 space-y-2">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Hardening Recommendation
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed bg-blue-950/20 border border-blue-500/20 p-3 rounded-xl">
              {finding.recommendation}
            </p>
          </div>

          {/* Copyable CLI Remediation Script */}
          {finding.remediation_script && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vendor CLI Remediation Snippet</span>
                </h4>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-[11px] font-medium text-gray-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span>Copy Fix</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-gray-950 border border-cyan-500/20 text-cyan-300 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {finding.remediation_script}
              </pre>
            </div>
          )}

          {/* Compliance Framework Standards */}
          <div className="mt-6 pt-4 border-t border-gray-800 space-y-1.5 text-xs text-gray-400">
            <div className="font-semibold text-gray-300 mb-1">Standard Alignment:</div>
            {finding.cis_reference && <div>• CIS Benchmark: <span className="text-gray-200">{finding.cis_reference}</span></div>}
            {finding.nist_reference && <div>• NIST Framework: <span className="text-gray-200">{finding.nist_reference}</span></div>}
            {finding.iso27001_reference && <div>• ISO 27001 Control: <span className="text-gray-200">{finding.iso27001_reference}</span></div>}
          </div>

        </div>

        {/* Footer Close Button */}
        <div className="pt-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
