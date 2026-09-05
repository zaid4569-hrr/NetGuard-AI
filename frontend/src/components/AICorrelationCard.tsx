import React from 'react';
import { Sparkles, Network, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { AIInsights } from '../types';

interface AICorrelationCardProps {
  aiInsights?: AIInsights;
  onSelectAttackChain?: (chain: any) => void;
}

export const AICorrelationCard: React.FC<AICorrelationCardProps> = ({
  aiInsights,
  onSelectAttackChain
}) => {
  if (!aiInsights) return null;

  return (
    <div className="bg-gradient-to-b from-[#111827] to-[#0D131F] border border-blue-900/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              AI Threat Graph & Correlation Engine
            </h3>
            <p className="text-[11px] text-gray-400">
              Deterministic attack-chain analysis operating 100% offline
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Zero-Egress AI
        </span>
      </div>

      {/* Executive Summary Briefing */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 mb-4">
        <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
          <span>Executive Audit Briefing</span>
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed">
          {aiInsights.executive_summary}
        </p>
      </div>

      {/* Correlated Multi-Stage Attack Chains */}
      {aiInsights.correlated_attack_chains.length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Network className="w-3.5 h-3.5 text-orange-400" />
            <span>Correlated Multi-Stage Attack Chains ({aiInsights.correlated_attack_chains.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiInsights.correlated_attack_chains.map((chain, idx) => (
              <div
                key={idx}
                className="bg-gray-900/60 border border-orange-500/20 hover:border-orange-500/40 rounded-xl p-3.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-500/30">
                      {chain.severity} ATTACK VECTOR
                    </span>
                    <span className="text-[11px] font-mono text-orange-400 font-semibold">
                      {chain.remediation_priority.split('-')[0]}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-gray-100 mb-1 leading-snug">
                    {chain.attack_chain_title}
                  </h5>
                  <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                    {chain.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-800/80">
                  <div className="text-[10px] text-gray-500 mb-1">Affected Devices:</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {chain.affected_devices.map((d, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1">
                    {chain.action_steps.slice(0, 2).map((step, i) => (
                      <div key={i} className="text-[11px] text-gray-300 flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Remediation Roadmap */}
      {aiInsights.remediation_roadmap.length > 0 && (
        <div className="border-t border-gray-800/80 pt-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Actionable Remediation Roadmap
          </div>
          <div className="space-y-1.5">
            {aiInsights.remediation_roadmap.map((phase, i) => (
              <div key={i} className="text-xs text-gray-300 flex items-start space-x-2 bg-gray-900/40 p-2 rounded-lg border border-gray-800/50">
                <ArrowRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>{phase}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
