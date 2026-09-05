import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Server, CheckCircle2, Cpu, ArrowRight } from 'lucide-react';

export const VendorsPage: React.FC = () => {
  const vendorData = [
    {
      vendor: 'Cisco Systems',
      logo: 'Cisco',
      deviceTypes: 'Routers (ISR, ASR, Catalyst 8000), Switches (Catalyst 2960, 3850, 9000, Nexus)',
      configFormats: 'Cisco IOS, IOS-XE, NX-OS Running & Startup Configs (.cfg, .txt)',
      categories: ['Remote Management', 'AAA & Auth', 'Logging & Syslog', 'NTP', 'SNMP', 'ACL & Firewall', 'VPN Crypto', 'L2 Services'],
      ruleCount: 25,
      status: 'Production Ready',
      confidenceAvg: '99%'
    },
    {
      vendor: 'Juniper Networks',
      logo: 'Juniper',
      deviceTypes: 'Security Gateways (SRX series), Core Routers (MX series), Switches (EX/QFX)',
      configFormats: 'Junos OS Hierarchical Curly-Bracket & Flat Set Commands (.conf, .txt)',
      categories: ['Remote Management', 'Root Authentication', 'Logging & Syslog', 'NTP Authentication', 'SNMPv3', 'Security Policies', 'IKE Proposals'],
      ruleCount: 22,
      status: 'Production Ready',
      confidenceAvg: '98%'
    },
    {
      vendor: 'Fortinet',
      logo: 'Fortinet',
      deviceTypes: 'Next-Generation Firewalls (FortiGate 60E - 1000F, VM Series)',
      configFormats: 'FortiOS Block Syntax Config / Export Backups (.conf)',
      categories: ['System Global & Timeout', 'Admin Trusthosts', 'Firewall Policies', 'Syslog & FortiAnalyzer', 'SNMP Community', 'VPN Phase1/2'],
      ruleCount: 23,
      status: 'Production Ready',
      confidenceAvg: '99%'
    },
    {
      vendor: 'Palo Alto Networks',
      logo: 'Palo Alto',
      deviceTypes: 'Next-Generation Firewalls (PA-220, PA-800, PA-3200, VM-Series, Panorama)',
      configFormats: 'PAN-OS XML Configuration & CLI Set Commands (.xml, .set, .txt)',
      categories: ['Interface Management Profiles', 'Security Rulebase Any-Any', 'Admin Roles & Idle Timeout', 'Syslog Settings', 'NTP & SNMP'],
      ruleCount: 20,
      status: 'Production Ready',
      confidenceAvg: '98%'
    },
    {
      vendor: 'MikroTik',
      logo: 'MikroTik',
      deviceTypes: 'Cloud Router Switches (CRS), Cloud Core Routers (CCR), hEX & hAP series',
      configFormats: 'RouterOS v6 & v7 /export Script Backups (.rsc, .txt)',
      categories: ['/ip service hardening', 'Default Admin User', 'Firewall Filter Input/Forward', 'SNMP Community', 'Remote Logging Action'],
      ruleCount: 18,
      status: 'Production Ready',
      confidenceAvg: '95%'
    },
    {
      vendor: 'Aruba Networks',
      logo: 'Aruba',
      deviceTypes: 'Enterprise Campus Switches (AOS-S 2930, 3810, AOS-CX 6000, 6300)',
      configFormats: 'ArubaOS CLI Configuration Files (.cfg, .txt)',
      categories: ['Telnet / HTTP Insecure Management', 'Manager Passwords', 'VLAN Access Lists', 'SNMP Security', 'Syslog & SNTP'],
      ruleCount: 18,
      status: 'Production Ready',
      confidenceAvg: '95%'
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

      <main className="max-w-7xl mx-auto px-6 py-16 space-y-12">
        
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">Multi-Vendor Coverage</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
            Heterogeneous Hardware & NOS Support Matrix
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            NetGuard AI normalizes disparate vendor configuration syntaxes into a unified canonical security model without relying on generic string searches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendorData.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{item.vendor}</h3>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">{item.status}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {item.ruleCount} Rules
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Device Types:</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{item.deviceTypes}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Supported Formats:</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed font-mono text-[11px]">{item.configFormats}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Audit Domains:</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.categories.map((c, cIdx) => (
                        <span key={cIdx} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Autodetection Accuracy:</span>
                <span className="font-mono font-bold text-emerald-400">{item.confidenceAvg}</span>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};
