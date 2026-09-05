import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, AlertTriangle, AlertOctagon, Sparkles, Server, 
  ArrowRight, CheckCircle2, ChevronRight, FileText, Wrench,
  Layers, Lock, Terminal
} from 'lucide-react';
import { MOCK_ASSESSMENT } from '../services/mockData';

export const SecurityCenter: React.FC = () => {
  const navigate = useNavigate();
  const assessment = MOCK_ASSESSMENT;

  const topRisks = [
    {
      title: 'Cleartext Management Sniffing & Administrative Takeover',
      severity: 'CRITICAL',
      devices: ['Cisco-Core-Router-01', 'JunOS-Edge-Router-01'],
      description: 'Telnet transport enabled globally on vty lines combined with missing access-class filters. Adversaries can capture unencrypted plaintext credentials.',
      remediation: 'Disable Telnet transport globally and restrict SSHv2 access to the SOC bastion host subnet.'
    },
    {
      title: 'Perimeter Firewall Bypass & Undetected Ingress',
      severity: 'CRITICAL',
      devices: ['FortiGate-Edge-FW-01'],
      description: 'Ingress policy permits all traffic (srcaddr any, dstaddr any) while centralized remote syslog forwarding is disabled, leaving zero forensic trace.',
      remediation: 'Revoke broad permit any firewall policies and activate centralized syslog forwarding to SIEM.'
    },
    {
      title: 'SNMP Community Reconnaissance & Configuration Tampering',
      severity: 'HIGH',
      devices: ['Cisco-Core-Router-01', 'FortiGate-Edge-FW-01'],
      description: 'Default community strings ("public" and "private") are configured with Read-Write privileges, exposing device MIBs and route tables.',
      remediation: 'Delete default public/private community strings and migrate to SNMPv3 with authPriv.'
    },
    {
      title: 'VPN Cryptographic Interception & Sweet32 Exposure',
      severity: 'HIGH',
      devices: ['JunOS-Edge-Router-01'],
      description: 'IPsec Phase 1 proposal utilizes deprecated 3DES ciphers alongside weak Diffie-Hellman Group 2 (1024-bit).',
      remediation: 'Upgrade IKE proposals to AES-256-GCM and enforce Diffie-Hellman Group 19 (ECP-256) or Group 14.'
    },
    {
      title: 'Forensic Audit Blind Spot via Clock Drift',
      severity: 'MEDIUM',
      devices: ['Cisco-Core-Router-01'],
      description: 'NTP cryptographic peer authentication is missing and syslog timestamps lack millisecond granularity.',
      remediation: 'Configure authoritative NTP servers with md5 authentication and enable millisecond timestamp logging.'
    }
  ];

  // Ranked vulnerable devices
  const sortedDevices = [...assessment.devices].sort((a, b) => a.security_score - b.security_score);

  return (
    <div className="space-y-8 pb-16 font-sans">
      
      {/* Header Banner */}
      <div className="bg-[#0B0F19] border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Central Threat Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security Intelligence Center
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Correlated attack chains, blast-radius risk modeling, and multi-stage remediation priorities synthesized from active configuration AST audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/remediation')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            <span>Remediation Action Plan</span>
          </button>
        </div>
      </div>

      {/* Top 5 Immediate Threat Chains (Section 17) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Top 5 Compound Attack Chains</h2>
            <p className="text-xs text-slate-400">Multi-finding attack vectors identified by AI Threat Graph correlation.</p>
          </div>
          <span className="text-xs font-mono text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2.5 py-1 rounded-full font-bold">
            2 Critical Chains Active
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {topRisks.map((risk, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                  <h3 className="text-sm font-bold text-white">{risk.title}</h3>
                </div>
                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold w-fit ${
                  risk.severity === 'CRITICAL' ? 'bg-rose-950/60 text-rose-300 border border-rose-800' :
                  risk.severity === 'HIGH' ? 'bg-amber-950/60 text-amber-300 border border-amber-800' :
                  'bg-blue-950/60 text-blue-300 border border-blue-800'
                }`}>
                  {risk.severity} EXPOSURE
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {risk.description}
              </p>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Affected Devices:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {risk.devices.map((d, dIdx) => (
                      <span key={dIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/remediation')}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors self-end sm:self-auto"
                >
                  <span>Apply Hardening CLI</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Ranked Vulnerable Devices + AI 3-Phase Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ranked Devices */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Vulnerability Ranking</h3>
              <p className="text-xs text-slate-400">Devices sorted from highest risk to hardened baseline.</p>
            </div>
            <button
              onClick={() => navigate('/devices')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>View Fleet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {sortedDevices.map((d, idx) => (
              <div
                key={d.id}
                onClick={() => navigate(`/devices/${d.id}`)}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                  <div>
                    <p className="text-xs font-semibold text-white">{d.hostname || d.filename}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{d.vendor} • {d.device_type}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-bold font-mono ${
                    d.security_score >= 80 ? 'text-emerald-400' :
                    d.security_score >= 60 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {d.security_score.toFixed(0)} <span className="text-[10px] text-slate-500 font-normal">/ 100</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {d.critical_count} crit, {d.high_count} high
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3-Phase Remediation Roadmap */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">3-Phase Action Roadmap</h3>
            <p className="text-xs text-slate-400">Synthesized execution plan to elevate posture above 90/100.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/50 text-rose-300 font-bold">
                PHASE 1 • IMMEDIATE (0 - 24 HOURS)
              </span>
              <p className="text-slate-300">
                Disable unencrypted Telnet management across all vty lines. Apply trusted management access-class filters and revoke broad permit any any ingress firewall policies.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40 space-y-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 font-bold">
                PHASE 2 • SHORT TERM (1 - 7 DAYS)
              </span>
              <p className="text-slate-300">
                Rotate and delete default SNMP community strings ('public'/'private'). Migrate monitoring agents to SNMPv3 with authPriv. Upgrade IPsec proposals to AES-256-GCM.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-900/40 space-y-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 font-bold">
                PHASE 3 • SUSTAINABILITY (PLANNED CYCLES)
              </span>
              <p className="text-slate-300">
                Configure centralized remote syslog forwarding with sub-second millisecond timestamps. Synchronize time with authenticated redundant NTP servers.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
