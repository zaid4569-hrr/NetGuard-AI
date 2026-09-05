import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Check, ArrowRight, ArrowLeft, Server, 
  Building2, Beaker, Cloud, GraduationCap, Lock, 
  FileCheck, Key, ShieldCheck, Eye, Terminal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [environmentType, setEnvironmentType] = useState('Enterprise environment');
  const [orgName, setOrgName] = useState('Acme Global Defense');
  const [selectedVendors, setSelectedVendors] = useState<string[]>(['Cisco', 'Fortinet', 'Juniper']);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([
    'Network hardening', 'Compliance', 'Access control'
  ]);
  const [loading, setLoading] = useState(false);

  const { completeOnboarding, user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const toggleVendor = (v: string) => {
    setSelectedVendors(prev => 
      prev.includes(v) ? prev.filter(item => item !== v) : [...prev, v]
    );
  };

  const togglePriority = (p: string) => {
    setSelectedPriorities(prev => 
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    await completeOnboarding({
      organizationName: orgName,
      preferredVendors: selectedVendors,
      securityPriorities: selectedPriorities
    });
    setLoading(false);
    addNotification('Workspace Configured', 'Security Center initialized with your infrastructure baselines.', 'success');
    navigate('/security-center');
  };

  const environments = [
    { title: 'Network infrastructure', desc: 'Core routers, distribution switches & WAN links', icon: Server },
    { title: 'Enterprise environment', desc: 'Multi-site corporate network with firewalls & DMZ', icon: Building2 },
    { title: 'Lab environment', desc: 'Isolated sandbox or cyber range for testing', icon: Beaker },
    { title: 'Cloud/network hybrid', desc: 'On-premise hardware connected to cloud VPCs', icon: Cloud },
    { title: 'Learning environment', desc: 'Student, research, or academy cybersecurity lab', icon: GraduationCap },
  ];

  const vendorList = [
    { name: 'Cisco', desc: 'IOS, IOS-XE, Catalyst & Nexus' },
    { name: 'Juniper', desc: 'Junos OS SRX, MX, EX series' },
    { name: 'Fortinet', desc: 'FortiOS & FortiGate firewalls' },
    { name: 'Palo Alto Networks', desc: 'PAN-OS NGFW & Panorama' },
    { name: 'Aruba', desc: 'AOS-S & AOS-CX switches' },
    { name: 'MikroTik', desc: 'RouterOS v6 & v7 routers' },
  ];

  const priorityList = [
    { name: 'Network hardening', desc: 'Eliminate legacy protocols and default configurations', icon: ShieldCheck },
    { name: 'Compliance', desc: 'Map posture to CIS Benchmarks, NIST SP 800-53, ISO 27001', icon: FileCheck },
    { name: 'Access control', desc: 'Enforce strict ACLs, anti-spoofing and least privilege', icon: Key },
    { name: 'Encryption', desc: 'Verify IPsec ciphers, DH groups and TLS configurations', icon: Lock },
    { name: 'Logging', desc: 'Ensure SIEM remote syslog telemetry and millisecond logs', icon: Eye },
    { name: 'Management security', desc: 'Restrict vty lines, MOTD banners and inactivity timeouts', icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-[#06090F] flex flex-col justify-center items-center px-4 py-12 text-slate-100 relative font-sans">
      
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 space-y-8">
        
        {/* Progress Bar & Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>

          <div className="flex justify-center items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-12 bg-cyan-400 shadow-sm shadow-cyan-400/50' : 
                  s < step ? 'w-6 bg-cyan-600' : 'w-6 bg-slate-800'
                }`}
              />
            ))}
          </div>

          <p className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            Step {step} of 4 • SecOps Workspace Configuration
          </p>
        </div>

        {/* Wizard Step Card */}
        <div className="bg-[#0B0F19]/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* STEP 1: Welcome & Org */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-white">Welcome to NetGuard AI, {user?.fullName || 'Operator'}</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Let's set up your posture intelligence baseline. NetGuard AI analyzes heterogeneous network configurations locally in memory with zero cloud egress.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Organization or Security Workspace Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Enterprise SecOps"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-3">
                <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">Zero-Egress Security Commitment</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Passwords, VPN pre-shared keys, SNMP community strings, and RSA private keys are masked in memory before rule parsing. No raw files ever leave your system.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: What are you securing? */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-white">What are you securing?</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Select the operational environment that best describes your network fleet.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {environments.map((env) => {
                  const Icon = env.icon;
                  const isSelected = environmentType === env.title;
                  return (
                    <div
                      key={env.title}
                      onClick={() => setEnvironmentType(env.title)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{env.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{env.desc}</p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Which vendors do you use? */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-white">Which vendors do you use?</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  NetGuard AI features native AST adapters and syntax normalizers for multiple enterprise vendors.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vendorList.map((v) => {
                  const isSelected = selectedVendors.includes(v.name);
                  return (
                    <div
                      key={v.name}
                      onClick={() => toggleVendor(v.name)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{v.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{v.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                        isSelected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Choose your security priorities */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-white">Choose your security priorities</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  NetGuard AI will tailor compliance weightings and AI threat graph correlations to your focus areas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {priorityList.map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPriorities.includes(p.name);
                  return (
                    <div
                      key={p.name}
                      onClick={() => togglePriority(p.name)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold">{p.name}</p>
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            isSelected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-700'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinish}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter Security Center</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
