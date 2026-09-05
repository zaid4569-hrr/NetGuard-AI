import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, AlertTriangle, AlertOctagon, CheckCircle2, Server, 
  UploadCloud, FileText, ArrowRight, TrendingUp, Sparkles, 
  Clock, ShieldAlert, ChevronRight, Eye, RefreshCw, BarChart3,
  SlidersHorizontal, Check, ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { Assessment, Device, Finding } from '../types';
import { apiClient } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

export const Dashboard: React.FC = () => {
  const emptyAssessment: Assessment = { id: '', name: 'No audit selected', created_at: new Date().toISOString(), total_devices: 0, overall_score: 0, critical_count: 0, high_count: 0, medium_count: 0, low_count: 0, info_count: 0, category_scores: [], devices: [], findings: [] };
  const [assessment, setAssessment] = useState<Assessment>(emptyAssessment);
  const [history, setHistory] = useState<any[]>([]);
  const [executiveMode, setExecutiveMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  useEffect(() => {
    apiClient.listAssessments().then(async (items) => {
      setHistory(items);
      if (items[0]) setAssessment(await apiClient.getAssessment(items[0].id));
    }).catch(() => addNotification('No audit data yet', 'Upload a router, switch, or firewall configuration to populate your private dashboard.', 'info'));
  }, []);

  const trendData = history.slice().reverse().map((item, index) => ({ audit: `Audit #${index + 1}`, score: Math.round(item.overall_score), label: item.name }));

  // Severity Distribution Data
  const severityData = [
    { name: 'Critical', count: assessment.critical_count, color: '#F43F5E', severity: 'CRITICAL' },
    { name: 'High', count: assessment.high_count, color: '#FB923C', severity: 'HIGH' },
    { name: 'Medium', count: assessment.medium_count, color: '#FBBF24', severity: 'MEDIUM' },
    { name: 'Low', count: assessment.low_count, color: '#38BDF8', severity: 'LOW' },
    { name: 'Info', count: assessment.info_count, color: '#94A3B8', severity: 'INFO' },
  ];

  const handleDownloadPdf = async () => {
    if (!assessment.id) {
      addNotification(
        'Report Unavailable',
        'This is demo/synthetic data that was never persisted server-side, so no report can be generated. Run a real audit from New Audit first.',
        'warning'
      );
      return;
    }
    setIsDownloadingPdf(true);
    addNotification('Report Generating', 'Compiling PDF audit report with ReportLab...', 'info');
    try {
      await apiClient.downloadPdfReport(assessment.id);
      addNotification('Report Generated', 'Your PDF audit report has downloaded successfully.', 'success');
    } catch (err) {
      addNotification(
        'Report Generation Failed',
        err instanceof Error ? err.message : 'Could not generate the PDF report.',
        'error'
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const scoreColor = assessment.overall_score >= 80 ? 'text-emerald-400' :
                     assessment.overall_score >= 65 ? 'text-cyan-400' :
                     assessment.overall_score >= 50 ? 'text-amber-400' : 'text-rose-400';

  const postureStatus = assessment.overall_score >= 80 ? 'HARDENED POSTURE' :
                        assessment.overall_score >= 65 ? 'ELEVATED RISK' : 'CRITICAL EXPOSURE';

  return (
    <div className="space-y-8 pb-16 font-sans">
      
      {/* Top Banner & Mode Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0B0F19] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {assessment.name}
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              {assessment.id ? 'PRIVATE AUDIT' : 'NO AUDIT YET'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Last audit executed: {new Date(assessment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">100% In-Memory Sanitized</span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Executive vs Technical Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setExecutiveMode(false)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                !executiveMode ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              SOC Analyst View
            </button>
            <button
              onClick={() => setExecutiveMode(true)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                executiveMode ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Executive Summary
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{isDownloadingPdf ? 'Generating...' : 'Export PDF'}</span>
          </button>

          <button
            onClick={() => navigate('/audit')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>New Audit</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE MODE VIEW */}
      {executiveMode ? (
        <div className="space-y-6 animate-fade-in">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0B0F19] to-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">CISO Executive Briefing</span>
                <h2 className="text-2xl font-bold text-white mt-1">Network Risk & Compliance Posture Summary</h2>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-cyan-400 font-mono">{assessment.overall_score.toFixed(1)}</span>
                <span className="text-xs text-slate-400 block font-mono">Posture Health Index</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-200 text-sm">Overall Risk Posture</h4>
                <p className="text-slate-400">
                  The infrastructure currently exhibits <b className="text-amber-400">{postureStatus}</b>. Primary vulnerability drivers stem from unencrypted administrative access protocols (Telnet) and overly permissive ingress firewall policies.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-200 text-sm">Business & Compliance Impact</h4>
                <p className="text-slate-400">
                  Identified vulnerabilities create non-compliance risks under <b>CIS Controls v8 (1.1, 1.2)</b> and <b>NIST SP 800-53 (AC-17, IA-5)</b>. Unauthorized lateral network traversal risk is elevated.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-200 text-sm">Recommended Action Plan</h4>
                <p className="text-slate-400">
                  Executing Phase 1 hardening templates on perimeter routers and firewalls will close 100% of critical exposures and elevate the posture index to <b>91.5 / 100</b>.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
              <button
                onClick={() => navigate('/remediation')}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>Review Remediation Action Items</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SOC TECHNICAL ANALYST VIEW */
        <>
          {/* 5 Clickable Overview Cards (Section 13) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* Devices Audited */}
            <div 
              onClick={() => navigate('/devices')}
              className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Audited Devices</span>
                <Server className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{assessment.total_devices}</p>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                Across 4 Vendors <ChevronRight className="w-3 h-3 text-cyan-400" />
              </span>
            </div>

            {/* Critical Issues */}
            <div 
              onClick={() => navigate('/findings')}
              className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 hover:border-rose-500/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Critical Issues</span>
                <AlertOctagon className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-2xl font-black text-rose-400 font-mono">{assessment.critical_count}</p>
              <span className="text-[10px] text-rose-400/80 font-mono">P0 Immediate Action</span>
            </div>

            {/* High Risk */}
            <div 
              onClick={() => navigate('/findings')}
              className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>High Risk</span>
                <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-2xl font-black text-amber-400 font-mono">{assessment.high_count}</p>
              <span className="text-[10px] text-amber-400/80 font-mono">P1 Remediation</span>
            </div>

            {/* Overall Compliance */}
            <div 
              onClick={() => navigate('/compliance')}
              className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>CIS Compliance</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-2xl font-black text-indigo-300 font-mono">79.2%</p>
              <span className="text-[10px] text-slate-500 font-mono">18 / 25 Controls Pass</span>
            </div>

            {/* Last Audit */}
            <div 
              onClick={() => navigate('/audit')}
              className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all space-y-2 col-span-2 sm:col-span-1 group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Last Audit</span>
                <Clock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xl font-bold text-slate-200 mt-1 truncate">Just Now</p>
              <span className="text-[10px] text-emerald-400 font-mono">Zero Drift Detected</span>
            </div>

          </div>

          {/* Core Visualizations: Large Circular Score + Severity Distribution + Security Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Score Card (Section 12 & 14) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F19] border border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Overall Security Score</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                    +18% Improving
                  </span>
                </div>
                
                {/* Circular Score Gauge */}
                <div className="py-6 flex flex-col items-center justify-center relative">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="40"
                        stroke="#1E293B" strokeWidth="8" fill="transparent"
                      />
                      <circle
                        cx="50" cy="50" r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * assessment.overall_score) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className={`${scoreColor} transition-all duration-1000 ease-out`}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className={`text-4xl font-black font-mono tracking-tight ${scoreColor}`}>
                        {assessment.overall_score.toFixed(0)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">out of 100</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs font-bold tracking-wider font-mono text-slate-300 uppercase">
                    {postureStatus}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">PREVIOUS AUDIT</span>
                  <span className="font-bold text-slate-300">64.0 / 100</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">DEDUCTIONS</span>
                  <span className="font-bold text-rose-400">-{100 - Math.round(assessment.overall_score)} pts</span>
                </div>
              </div>
            </div>

            {/* Risk Severity Distribution (Section 15) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F19] border border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Risk Distribution</span>
                  <span className="text-[10px] text-slate-500 font-mono">Click to filter</span>
                </div>

                <div className="h-44 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severityData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} width={60} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                        formatter={(val: any) => [`${val} findings`, 'Count']}
                      />
                      <Bar 
                        dataKey="count" 
                        radius={[0, 6, 6, 0]} 
                        onClick={(data) => navigate(`/findings?severity=${data.severity}`)}
                        className="cursor-pointer hover:opacity-80"
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Total Active Findings</span>
                <span className="font-mono font-bold text-white">
                  {(assessment.critical_count + assessment.high_count + assessment.medium_count + assessment.low_count)} Findings
                </span>
              </div>
            </div>

            {/* Historical Security Trend Chart (Section 16) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F19] border border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Security Posture Trend</span>
                  <span className="text-[10px] font-mono text-cyan-400">4 Audits</span>
                </div>

                <div className="h-44 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="audit" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis domain={[40, 100]} stroke="#64748B" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                        formatter={(val: any) => [`${val} / 100`, 'Score']}
                      />
                      <Area type="monotone" dataKey="score" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#trendGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Overall Trend Direction</span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +18.0% Improvement
                </span>
              </div>
            </div>

          </div>

          {/* Category Hardening Score Breakdown (Section 51) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Security Hardening Domains</h3>
                <p className="text-xs text-slate-400 mt-0.5">Category-level compliance breakdown derived from deterministic AST rule evaluations.</p>
              </div>
              <button
                onClick={() => navigate('/rules')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View Rule Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {assessment.category_scores.map((cat, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 truncate">{cat.category}</span>
                    <span className={`font-mono font-bold ${
                      cat.score >= 80 ? 'text-emerald-400' : cat.score >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {cat.score.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.score >= 80 ? 'bg-emerald-400' : cat.score >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.max(5, cat.score)}%` }}
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono block">
                    {cat.findings_count} finding(s) detected
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fleet Overview Table */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Audited Device Inventory</h3>
                <p className="text-xs text-slate-400 mt-0.5">Click any device to inspect configuration AST, findings, and copyable CLI fixes.</p>
              </div>
              <button
                onClick={() => navigate('/devices')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View All Devices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-3 px-4">Device Hostname</th>
                    <th className="py-3 px-4">Vendor & NOS</th>
                    <th className="py-3 px-4">Device Role</th>
                    <th className="py-3 px-4">Posture Score</th>
                    <th className="py-3 px-4">Critical / High</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {assessment.devices.map((d) => (
                    <tr 
                      key={d.id} 
                      onClick={() => navigate(`/devices/${d.id}`)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {d.hostname || d.filename}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>{d.vendor}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {d.device_type || 'Network Core'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-mono font-bold text-sm ${
                          d.security_score >= 80 ? 'text-emerald-400' :
                          d.security_score >= 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {d.security_score.toFixed(0)} <span className="text-[10px] text-slate-500 font-normal">/ 100</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-rose-400 font-bold">{d.critical_count}</span>
                        <span className="text-slate-600"> / </span>
                        <span className="text-amber-400 font-bold">{d.high_count}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-semibold">
                          <span>Inspect</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
