import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, ArrowRight, Sparkles, CheckCircle2, Server, 
  Cpu, FileCheck, GitCompare, TrendingUp, Lock, 
  ChevronRight, Terminal, EyeOff, Layers, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, loginAsDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    if (!isAuthenticated) {
      await loginAsDemoUser();
    }
    navigate('/dashboard');
  };

  const vendors = [
    { name: 'Cisco', os: 'IOS / IOS-XE' },
    { name: 'Juniper', os: 'Junos OS' },
    { name: 'Fortinet', os: 'FortiOS' },
    { name: 'Palo Alto', os: 'PAN-OS' },
    { name: 'Aruba', os: 'AOS-S / CX' },
    { name: 'MikroTik', os: 'RouterOS' },
  ];

  const steps = [
    { num: '01', title: 'Upload Configs', desc: 'Drag and drop heterogeneous switch, router, and firewall configurations.' },
    { num: '02', title: 'Zero-Egress Parse', desc: 'Passwords and sensitive keys are masked in-memory before syntax normalization.' },
    { num: '03', title: 'Audit & Correlate', desc: 'Evaluates 25+ CIS/NIST hardening rules and discovers compound attack chains.' },
    { num: '04', title: 'Remediate with CLI', desc: 'Review prioritized copyable vendor CLI fixes with before/after diff verification.' },
    { num: '05', title: 'Export Audit Reports', desc: 'Generate executive PDF compliance briefings with transparent point derivation.' },
  ];

  return (
    <div className="min-h-screen bg-[#06090F] text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      
      {/* Top Navbar */}
      <nav className="h-20 border-b border-slate-800/80 bg-[#06090F]/80 backdrop-blur-xl sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-base tracking-wider text-white flex items-center gap-1.5">
            NETGUARD <span className="text-cyan-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
          <Link to="/platform" className="hover:text-cyan-400 transition-colors">Platform</Link>
          <Link to="/vendors" className="hover:text-cyan-400 transition-colors">Supported Vendors</Link>
          <Link to="/docs" className="hover:text-cyan-400 transition-colors">Documentation</Link>
          <Link to="/about" className="hover:text-cyan-400 transition-colors">About</Link>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>Security Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                Sign In
              </Link>
              <button
                onClick={handleDemoClick}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5"
              >
                <span>Explore Demo</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-indigo-600/0 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-6 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI-Driven Multi-Vendor Configuration Intelligence</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]">
          Secure Your Network Before Attackers Find the Weakness.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          NetGuard AI analyzes heterogeneous network configurations in memory, detects compound multi-stage attack chains, maps compliance risks, and generates copyable vendor CLI fixes.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Start Free Audit</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={handleDemoClick}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Explore Demo (4 Devices)</span>
          </button>
        </div>

        {/* Privacy Highlight Strip */}
        <div className="mt-8 flex items-center gap-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>100% In-Memory Sanitization</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-emerald-400" />
            <span>Zero Configuration Egress</span>
          </div>
        </div>

        {/* Stylized Hero Mockup Preview */}
        <div className="mt-14 w-full max-w-5xl rounded-3xl border border-slate-800 bg-[#0B0F19]/90 shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative group">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">NetGuard SOC Posture Telemetry • Live Assessment View</span>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              AUDIT STATUS: COMPLETE
            </span>
          </div>

          {/* Metrics Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-6 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-[11px] font-mono text-slate-400">Security Score</p>
              <p className="text-2xl font-black text-cyan-400 mt-1">82 <span className="text-xs font-normal text-slate-500">/ 100</span></p>
              <span className="text-[10px] text-emerald-400 font-mono">+18% Posture Gain</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-[11px] font-mono text-slate-400">Critical Exposures</p>
              <p className="text-2xl font-black text-rose-400 mt-1">2</p>
              <span className="text-[10px] text-slate-500 font-mono">P0 Immediate Fix</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-[11px] font-mono text-slate-400">High Risk Issues</p>
              <p className="text-2xl font-black text-amber-400 mt-1">7</p>
              <span className="text-[10px] text-slate-500 font-mono">P1 Action Items</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-[11px] font-mono text-slate-400">Compliance</p>
              <p className="text-2xl font-black text-indigo-400 mt-1">87%</p>
              <span className="text-[10px] text-slate-500 font-mono">CIS / NIST CSF</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
              <p className="text-[11px] font-mono text-slate-400">Audited Fleet</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">24</p>
              <span className="text-[10px] text-slate-500 font-mono">Devices Across 6 Vendors</span>
            </div>
          </div>

        </div>

      </section>

      {/* Trusted Vendor Support Strip */}
      <section className="py-12 border-y border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-8">
            Native Multi-Vendor AST Parsing & Hardening Baselines
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {vendors.map((v) => (
              <div
                key={v.name}
                className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center justify-center text-center hover:border-slate-700 transition-colors"
              >
                <Server className="w-5 h-5 text-cyan-400 mb-2" />
                <p className="text-xs font-bold text-white">{v.name}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{v.os}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">How It Works</h2>
          <h3 className="text-3xl font-extrabold text-white">5-Step Automated Posture Journey</h3>
          <p className="text-xs text-slate-400">From disparate multi-vendor configuration files to boardroom-ready compliance intelligence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/80 flex flex-col justify-between hover:border-cyan-500/40 transition-colors"
            >
              <div>
                <span className="text-2xl font-black text-cyan-500/40 font-mono">{s.num}</span>
                <h4 className="text-sm font-bold text-white mt-3">{s.title}</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-950/20 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">Intelligence Modules</h2>
          <h3 className="text-3xl font-extrabold text-white">Engineered for Enterprise Network Defenders</h3>
          <p className="text-xs text-slate-400">Comprehensive capabilities designed to eliminate audit fatigue and remediate root causes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">AI Security Copilot</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Query audit telemetry in plain English. Ask which device to patch first, explain obscure configuration flags, or generate executive summaries.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Deterministic Compliance</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              25+ built-in compliance rules mapped to CIS Benchmarks, NIST SP 800-53, and ISO/IEC 27001 across 8 hardening categories.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Before vs After Diff Engine</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compare candidate hardening templates against active baselines. Verify mathematical score increases before applying changes to production.
            </p>
          </div>

        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6 sm:px-12 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl p-10 sm:p-14 bg-gradient-to-br from-slate-900 to-[#0B0F19] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Ready to harden your multi-vendor network?
            </h3>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Upload configurations or explore the interactive demo environment with synthetic devices.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/signup"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all"
              >
                Create Free Account
              </Link>
              <button
                onClick={handleDemoClick}
                className="px-8 py-3.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-white font-bold text-xs transition-all"
              >
                Launch Instant Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 sm:px-12 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-bold">NETGUARD AI</span>
            <span>• Enterprise Network Posture & Configuration Intelligence</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/platform" className="hover:text-slate-300">Platform</Link>
            <Link to="/vendors" className="hover:text-slate-300">Vendors</Link>
            <Link to="/docs" className="hover:text-slate-300">Docs</Link>
            <Link to="/about" className="hover:text-slate-300">About</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
