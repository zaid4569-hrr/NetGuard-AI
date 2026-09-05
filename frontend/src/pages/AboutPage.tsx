import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, Lock, Code, Heart, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
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
          <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-semibold text-xs hover:bg-cyan-500/20">
            Open App
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>Smart India Hackathon • Cybersecurity Track</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
            About NetGuard AI
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
            A privacy-preserving, AI-driven multi-vendor network security compliance auditor engineered to eliminate manual configuration auditing errors.
          </p>
        </div>

        <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-8 text-xs leading-relaxed text-slate-300">
          
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              The Challenge
            </h3>
            <p className="text-slate-400">
              Modern enterprise network infrastructures are inherently heterogeneous, consisting of switches, routers, and firewalls from multiple vendors.
              Auditing these configurations manually against security benchmarks like CIS Benchmarks, NIST SP 800-53, and ISO 27001 is labor-intensive, error-prone, and slow.
              Furthermore, existing cloud compliance scanners require uploading sensitive configuration files containing plaintext passwords and internal topology maps—violating enterprise data confidentiality.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Our Solution: Local-First Zero-Egress Architecture
            </h3>
            <p className="text-slate-400">
              NetGuard AI runs 100% locally. Configuration parsing, vendor autodetection, credential sanitization, deterministic rule auditing, AI threat graph correlation, and PDF report generation occur strictly in local memory.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-400" />
              Technology Stack
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-center">
                <p className="font-bold text-white">FastAPI</p>
                <p className="text-[10px] text-slate-500">Python 3.11</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-center">
                <p className="font-bold text-white">React 18</p>
                <p className="text-[10px] text-slate-500">TypeScript & Vite</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-center">
                <p className="font-bold text-white">Tailwind CSS</p>
                <p className="text-[10px] text-slate-500">Cybersecurity SOC UI</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-center">
                <p className="font-bold text-white">ReportLab</p>
                <p className="text-[10px] text-slate-500">Local PDF Engine</p>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
