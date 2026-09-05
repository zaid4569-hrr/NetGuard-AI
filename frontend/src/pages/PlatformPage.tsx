import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Server, Lock, Cpu, Sparkles, CheckSquare, GitCompare, FileText, ArrowRight } from 'lucide-react';

export const PlatformPage: React.FC = () => {
  const capabilities = [
    {
      title: 'Heterogeneous AST Normalization',
      icon: Cpu,
      desc: 'Transforms proprietary CLI syntaxes (Cisco IOS, Junos curly/set, FortiOS config blocks, PAN-OS XML, MikroTik /export, and ArubaOS) into a single, canonical Pydantic data schema.'
    },
    {
      title: 'Zero-Egress In-Memory Sanitization',
      icon: Lock,
      desc: 'Built-in high-entropy regular expression filter redacts passwords, pre-shared keys, SNMP community strings, and RSA private keys in memory before parsing. Evidence strings only store masked tokens.'
    },
    {
      title: 'Deterministic Compliance Engine',
      icon: CheckSquare,
      desc: 'Evaluates 25+ hardened baseline rules mapped directly to CIS Controls v8, NIST SP 800-53 Rev. 5, and ISO/IEC 27001 across 8 hardening categories.'
    },
    {
      title: 'Transparent Mathematical Scoring',
      icon: Shield,
      desc: 'Point-deduction derivation bounded strictly in [0, 100]. Severity weights (Critical -18, High -10, Medium -5, Low -2) produce explainable ratings without black-box scores.'
    },
    {
      title: 'AI Threat Graph Attack Chain Correlation',
      icon: Sparkles,
      desc: 'Discovers compound multi-stage attack vectors (e.g. Telnet enabled + weak authentication + unrestricted management = remote administrative takeover).'
    },
    {
      title: 'Vendor-Specific Remediation CLI',
      icon: GitCompare,
      desc: 'Generates direct, copy-and-paste CLI remediation scripts for every detected violation with Before vs After posture verification.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#06090F] text-slate-100 font-sans antialiased">
      
      {/* Header */}
      <nav className="h-20 border-b border-slate-800/80 bg-[#06090F]/80 backdrop-blur-xl px-6 sm:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-base text-white">NETGUARD <span className="text-cyan-400">AI</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-xs text-slate-300 hover:text-white font-medium">Sign In</Link>
          <Link to="/signup" className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16 space-y-16">
        
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">Platform Architecture</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
            Enterprise Security Posture & Configuration Intelligence
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Engineered from first principles for network security architects, SOC analysts, and compliance auditors.
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div key={idx} className="p-8 rounded-3xl bg-[#0B0F19] border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">{cap.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Threat Model Box */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Privacy & Threat Confinement Model</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Zero Cloud Transmission
              </h4>
              <p className="text-slate-400">
                All parsing, rule evaluation, mathematical deduction, and PDF report generation occur strictly on your local infrastructure.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                No Code Execution
              </h4>
              <p className="text-slate-400">
                Configurations are parsed purely as structured syntax tokens. Zero `eval()`, `exec()`, or subshell commands are ever executed.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
