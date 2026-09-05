import React, { useState, useEffect } from 'react';
import { ComplianceRule } from '../types';
import { apiClient } from '../services/api';
import { BookOpen, Search, ShieldCheck, Tag, ExternalLink } from 'lucide-react';

export const RuleCatalog: React.FC = () => {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    const loadRules = async () => {
      const data = await apiClient.listRules();
      setRules(data);
    };
    loadRules();
  }, []);

  const categories = Array.from(new Set(rules.map((r) => r.category)));

  const filteredRules = rules.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rule_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchSev = severityFilter === 'ALL' || r.severity === severityFilter;
    return matchSearch && matchCat && matchSev;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-950/60 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-950/60 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-950/60 text-amber-400 border-amber-500/30';
      case 'LOW':
      default:
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Compliance & Security Rule Catalog
            </h1>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {rules.length} vendor-aware deterministic rules mapped to CIS Benchmarks, NIST CSF, and ISO/IEC 27001 controls.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search rule ID / keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48 sm:w-60"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => (
          <div
            key={rule.rule_id}
            className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-gray-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(rule.severity)}`}>
                  {rule.severity}
                </span>
                <span className="text-xs font-mono font-bold text-gray-400">{rule.rule_id}</span>
              </div>

              <h3 className="text-sm font-bold text-gray-100 mb-1 leading-snug">
                {rule.title}
              </h3>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                {rule.description}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-800 text-xs">
              <div>
                <span className="text-gray-500 text-[11px]">Hardening Action:</span>
                <p className="text-gray-300 text-xs mt-0.5">{rule.remediation}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-1.5 text-[11px] text-gray-400">
                  <Tag className="w-3 h-3 text-blue-400" />
                  <span>{rule.category}</span>
                </div>
                {rule.cis_benchmark_ref && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-500/20">
                    {rule.cis_benchmark_ref}
                  </span>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
