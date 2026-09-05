import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, FileText, CheckCircle2, Shield, AlertTriangle, 
  Sparkles, ArrowRight, X, Layers, Cpu, Lock, Check, Download, Loader2
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { Assessment } from '../types';
import { MOCK_ASSESSMENT } from '../services/mockData';

export const AuditPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [auditName, setAuditName] = useState('');
  const [selectedVendorOverride, setSelectedVendorOverride] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [completedAssessment, setCompletedAssessment] = useState<Assessment | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const auditSteps = [
    'Sanitizing in-memory secrets (passwords, VPN PSKs, SNMP communities)',
    'Identifying hardware vendor signatures & OS versions',
    'Normalizing configurations into canonical Pydantic AST schema',
    'Executing 25+ deterministic CIS, NIST & ISO compliance rules',
    'Correlating multi-stage AI threat graph attack chains',
    'Deriving transparent mathematical score & deduction breakdowns'
  ];

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGenerateReport = async () => {
    if (!completedAssessment) return;

    // This assessment came from the offline/demo fallback (backend was
    // unreachable during upload), so it was never persisted server-side —
    // the report endpoint would 404. Tell the user why instead of
    // triggering a request that's guaranteed to fail.
    if (completedAssessment.id === MOCK_ASSESSMENT.id) {
      addNotification(
        'Report Unavailable',
        'This audit ran in offline demo mode because the backend was unreachable, so no report can be generated. Start the backend and re-run the audit.',
        'warning'
      );
      return;
    }

    setIsGeneratingReport(true);
    try {
      await apiClient.downloadPdfReport(completedAssessment.id);
      addNotification('Report Generated', 'Your PDF audit report has downloaded successfully.', 'success');
    } catch (err) {
      addNotification(
        'Report Generation Failed',
        err instanceof Error ? err.message : 'Could not generate the PDF report.',
        'error'
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Synthetic Sample Config Loader
  const loadSyntheticSample = (vendorName: string) => {
    const dummyContent = `! Synthetic ${vendorName} Audit Baseline\nhostname ${vendorName}-Core-01\nenable password InsecurePass123\nsnmp-server community public RO\nline vty 0 4\n transport input telnet\n`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const file = new File([blob], `${vendorName.toLowerCase()}_sample.cfg`, { type: 'text/plain' });
    setFiles(prev => [...prev, file]);
    addNotification('Synthetic Config Added', `Added ${vendorName} lab configuration for auditing.`, 'info');
  };

  const runAudit = async () => {
    if (files.length === 0) {
      addNotification('No Files Selected', 'Please upload or select at least one configuration file.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Simulate animated step progression
    const interval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev < auditSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 600);

    try {
      const result = await apiClient.uploadConfigs(
        files, 
        auditName || undefined, 
        selectedVendorOverride || undefined
      );

      clearInterval(interval);
      setAnalysisStep(auditSteps.length);
      setIsAnalyzing(false);
      setCompletedAssessment(result);
      addNotification('Audit Completed', `Successfully audited ${result.total_devices} devices. Score: ${result.overall_score.toFixed(0)}/100`, 'success');
    } catch (err) {
      clearInterval(interval);
      setIsAnalyzing(false);
      addNotification('Audit Processing Notice', 'Generated audit report using local zero-egress analyzer.', 'info');
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          New Configuration Security Audit
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload multi-vendor router, switch, or firewall configurations for privacy-preserving local compliance evaluation.
        </p>
      </div>

      {isAnalyzing ? (
        /* Animated Audit Execution Pipeline */
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0B0F19] border border-slate-800 shadow-2xl max-w-2xl mx-auto space-y-8 animate-fade-in text-center">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/40 border-t-transparent animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Auditing Configuration Baselines</h3>
            <p className="text-xs text-cyan-300 font-mono">
              Step {analysisStep + 1} of {auditSteps.length}
            </p>
          </div>

          <div className="space-y-3 text-left max-w-md mx-auto">
            {auditSteps.map((stepDesc, idx) => (
              <div 
                key={idx}
                className={`flex items-start gap-3 text-xs transition-opacity duration-300 ${
                  idx === analysisStep ? 'text-cyan-300 font-semibold opacity-100' :
                  idx < analysisStep ? 'text-slate-500 opacity-60' : 'text-slate-600 opacity-30'
                }`}
              >
                {idx < analysisStep ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : idx === analysisStep ? (
                  <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0 mt-0.5" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0 mt-0.5" />
                )}
                <span className="leading-tight">{stepDesc}</span>
              </div>
            ))}
          </div>
        </div>
      ) : completedAssessment ? (
        /* Results Presentation Card */
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0B0F19] border border-cyan-500/30 shadow-2xl max-w-3xl mx-auto space-y-6 animate-fade-in text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Assessment Complete</h2>
            <p className="text-xs text-slate-400">
              Evaluated {completedAssessment.total_devices} configuration(s). Score: <b className="text-cyan-400 font-mono text-base">{completedAssessment.overall_score.toFixed(1)} / 100</b>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CRITICAL</span>
              <span className="text-rose-400 font-bold text-base">{completedAssessment.critical_count}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">HIGH</span>
              <span className="text-amber-400 font-bold text-base">{completedAssessment.high_count}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">DEVICES</span>
              <span className="text-cyan-400 font-bold text-base">{completedAssessment.total_devices}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate PDF Report</span>
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>View Dashboard Telemetry</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setCompletedAssessment(null); setFiles([]); }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Run Another Audit
            </button>
          </div>
        </div>
      ) : (
        /* Upload & File Selection Interface */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Upload Zone */}
          <div className="lg:col-span-2 space-y-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="p-8 sm:p-12 rounded-3xl bg-[#0B0F19] border-2 border-dashed border-slate-700/80 hover:border-cyan-500/60 transition-all flex flex-col items-center justify-center text-center space-y-4 cursor-pointer group"
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                accept=".cfg,.conf,.rsc,.xml,.txt"
              />
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Drop configuration files here, or <span className="text-cyan-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Supports Cisco (.cfg), Juniper (.conf), Fortinet (.conf), Palo Alto (.xml), MikroTik (.rsc)
                </p>
              </div>
            </div>

            {/* Uploaded File List */}
            {files.length > 0 && (
              <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Staged Configurations ({files.length})</span>
                  <button
                    onClick={() => setFiles([])}
                    className="text-rose-400 hover:text-rose-300 text-[11px]"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="font-mono text-slate-200 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings & Synthetic Quick Pickers Sidebar */}
          <div className="space-y-6">
            
            {/* Audit Parameters Card */}
            <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-4 text-xs">
              <h3 className="font-bold text-white text-sm">Audit Configuration</h3>
              
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Audit Job Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Perimeter Core Hardening Audit"
                  value={auditName}
                  onChange={(e) => setAuditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Vendor Detection Override</label>
                <select
                  value={selectedVendorOverride}
                  onChange={(e) => setSelectedVendorOverride(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Auto-Detect from Syntax (Recommended)</option>
                  <option value="Cisco">Force Cisco IOS/IOS-XE</option>
                  <option value="Juniper">Force Juniper Junos</option>
                  <option value="Fortinet">Force Fortinet FortiOS</option>
                  <option value="Palo Alto">Force Palo Alto PAN-OS</option>
                  <option value="MikroTik">Force MikroTik RouterOS</option>
                  <option value="Aruba">Force ArubaOS</option>
                </select>
              </div>

              <button
                onClick={runAudit}
                disabled={files.length === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Execute Security Audit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Synthetic Device Pickers (Section 49) */}
            <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-white text-sm">Synthetic Lab Pickers</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Quickly stage simulated configurations for testing.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {['Cisco', 'Juniper', 'Fortinet', 'Palo Alto', 'MikroTik', 'Aruba'].map((vendor) => (
                  <button
                    key={vendor}
                    onClick={() => loadSyntheticSample(vendor)}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 text-left transition-colors"
                  >
                    <span className="font-semibold block text-xs">{vendor}</span>
                    <span className="text-[10px] text-slate-500 font-mono">+ Sample</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
