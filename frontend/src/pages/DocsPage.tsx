import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, BookOpen, Key, UploadCloud, Server, 
  Search, Calculator, CheckSquare, FileText, Sparkles, 
  HelpCircle, ChevronRight
} from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
    { id: 'authentication', title: 'Authentication & Workspaces', icon: Key },
    { id: 'uploading', title: 'Uploading Configurations', icon: UploadCloud },
    { id: 'vendors', title: 'Supported Vendors & NOS', icon: Server },
    { id: 'findings', title: 'Understanding Findings & Evidence', icon: Search },
    { id: 'scoring', title: 'Mathematical Scoring Derivation', icon: Calculator },
    { id: 'compliance', title: 'Compliance Standards (CIS / NIST)', icon: CheckSquare },
    { id: 'reports', title: 'Audit Report Generation', icon: FileText },
    { id: 'copilot', title: 'AI Security Copilot', icon: Sparkles },
    { id: 'faq', title: 'Frequently Asked Questions', icon: HelpCircle },
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
          <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-semibold text-xs hover:bg-cyan-500/20">
            Open App
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
        
        {/* Left Table of Contents */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">Documentation</p>
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors ${
                  isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{s.title}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0 bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 sm:p-10 text-xs leading-relaxed text-slate-300 space-y-8">
          
          {activeSection === 'getting-started' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Getting Started with NetGuard AI</h2>
              <p>
                NetGuard AI is a privacy-first, zero-egress multi-vendor network security posture and configuration compliance auditor.
                All parsing, rule evaluations, scoring algorithms, and report generation execute strictly on your local infrastructure.
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-cyan-400">Quick Workflow</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Navigate to <b>New Audit</b> in the left sidebar.</li>
                  <li>Drag and drop network configuration files (.cfg, .conf, .rsc, .xml).</li>
                  <li>Watch the live zero-egress parsing pipeline sanitize secrets and execute compliance audits.</li>
                  <li>Review the overall score, critical exposures, attack chains, and vendor CLI remediation scripts.</li>
                </ol>
              </div>
            </div>
          )}

          {activeSection === 'authentication' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Authentication & Workspaces</h2>
              <p>
                NetGuard AI supports enterprise multi-tenancy using <b>Supabase Auth</b> and <b>Row-Level Security (RLS)</b>.
                Workspaces isolate device inventories, historical audits, and generated compliance reports.
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-[11px]">
                <p className="text-emerald-400"># Production Supabase Configuration (.env)</p>
                <p>VITE_SUPABASE_URL="https://your-project.supabase.co"</p>
                <p>VITE_SUPABASE_ANON_KEY="your-anon-public-key"</p>
              </div>
              <p className="text-slate-400">
                When operating offline or in air-gapped lab environments, NetGuard AI automatically falls back to an in-memory session manager with instant demo login.
              </p>
            </div>
          )}

          {activeSection === 'uploading' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Uploading Configurations</h2>
              <p>
                Configuration files are treated as untrusted input. The ingestion engine enforces:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><b>Path Traversal Sanitization</b>: Strict filename normalization via <code className="text-cyan-400">os.path.basename</code>.</li>
                <li><b>File Size Limits</b>: Hard caps of 20MB per file to prevent memory exhaustion attacks.</li>
                <li><b>No Code Execution</b>: Zero system shell commands or <code className="text-cyan-400">eval()</code> functions are executed.</li>
              </ul>
            </div>
          )}

          {activeSection === 'vendors' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Supported Vendors & NOS</h2>
              <p>
                NetGuard AI ships with extensible parser adapters for:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {['Cisco IOS/IOS-XE', 'Fortinet FortiOS', 'Juniper Junos', 'Palo Alto PAN-OS', 'MikroTik RouterOS', 'Aruba AOS'].map((v, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono text-cyan-300">
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'findings' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Understanding Findings & Evidence</h2>
              <p>
                Each compliance finding contains:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><b>Rule ID</b>: Canonical identifier e.g. <code className="text-cyan-400">NET-MGMT-001</code>.</li>
                <li><b>Masked Evidence</b>: The exact configuration snippet with passwords, keys, and community strings redacted with <code className="text-emerald-400">********</code>.</li>
                <li><b>Security Impact</b>: Clear operational risk breakdown understandable by both CISOs and technicians.</li>
                <li><b>Remediation Script</b>: Copy-and-paste vendor CLI commands to close the finding.</li>
              </ul>
            </div>
          )}

          {activeSection === 'scoring' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Mathematical Scoring Derivation</h2>
              <p>
                The security score is computed using a deterministic deduction formula bounded in $[0, 100]$:
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300">
                Score = max(0, min(100, 100 - sum(Weight(finding_i))))
              </div>
              <p className="text-slate-400">
                Deductions per severity level: Critical (-18.0 pts), High (-10.0 pts), Medium (-5.0 pts), Low (-2.0 pts), Info (0.0 pts).
              </p>
            </div>
          )}

          {activeSection === 'compliance' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Compliance Standards</h2>
              <p>
                Every rule is mapped to standard industry frameworks:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><b>CIS Controls v8</b> & CIS Network Device Benchmarks</li>
                <li><b>NIST SP 800-53 Rev. 5</b> (AC-17, IA-5, AU-2, SC-13, CM-7)</li>
                <li><b>ISO/IEC 27001:2022</b> Annex A Controls</li>
                <li><b>PCI-DSS v4.0</b> Requirement 1 & 2</li>
              </ul>
            </div>
          )}

          {activeSection === 'reports' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Audit Report Generation</h2>
              <p>
                High-resolution, boardroom-ready PDF reports are compiled locally using the ReportLab graphics engine.
                Reports include executive KPI summaries, category score breakdowns, correlated attack graphs, and comprehensive finding tables.
              </p>
            </div>
          )}

          {activeSection === 'copilot' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">AI Security Copilot</h2>
              <p>
                The AI Security Copilot queries active audit findings and device inventories in real time.
                Answers cite specific rule IDs and affected device hostnames without fabricating fictitious results.
              </p>
            </div>
          )}

          {activeSection === 'faq' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-white">Q: Does NetGuard AI connect directly to our routers?</h4>
                  <p className="text-slate-400 mt-0.5">A: No. NetGuard AI is an offline configuration auditor. It parses offline configuration files and backups without opening active network management sessions or SSH tunnels.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Q: Are our configuration secrets sent to external AI servers?</h4>
                  <p className="text-slate-400 mt-0.5">A: Never. In-memory secret masking scrubs credentials before syntax parsing. Threat correlation operates completely offline.</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};
