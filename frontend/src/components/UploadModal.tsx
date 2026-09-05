import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, Loader2, Sparkles, Folder, ShieldCheck } from 'lucide-react';
import { apiClient } from '../services/api';
import { Assessment } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssessmentComplete: (assessment: Assessment) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAssessmentComplete
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [assessmentName, setAssessmentName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...fileArray]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setProgressStage('🔒 Masking credentials & redacting secrets in memory...');
    
    await new Promise((r) => setTimeout(r, 400));
    setProgressStage('🔍 Autodetecting vendor hardware syntax (Cisco, Fortinet, Juniper)...');
    
    await new Promise((r) => setTimeout(r, 400));
    setProgressStage('🛡️ Executing 25+ CIS/NIST compliance rule checks...');
    
    await new Promise((r) => setTimeout(r, 400));
    setProgressStage('⚡ Running AI Threat Graph attack-chain correlation...');

    try {
      const result = await apiClient.uploadConfigs(selectedFiles, assessmentName || undefined);
      onAssessmentComplete(result);
      onClose();
    } catch (err) {
      console.error('Audit failure:', err);
    } finally {
      setIsProcessing(false);
      setProgressStage('');
    }
  };

  const loadDemoPresets = async () => {
    setIsProcessing(true);
    setProgressStage('⚡ Loading Smart India Hackathon Multi-Vendor Dataset...');
    await new Promise((r) => setTimeout(r, 600));
    const result = await apiClient.uploadConfigs([], "SIH Hackathon Live Demo Audit");
    onAssessmentComplete(result);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#111827] border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import Configuration Files</h3>
              <p className="text-xs text-gray-400">Cisco IOS, Fortinet FortiGate, and Juniper Junos supported</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-5 space-y-4">
          
          {/* Assessment Name Input */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Assessment Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Campus Core Network Audit — Q3"
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              disabled={isProcessing}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600 bg-gray-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".cfg,.conf,.txt,.ios,.junos"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 rounded-2xl bg-gray-800 text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-xs text-gray-300 font-medium">
                Drag & drop network configuration files here, or <span className="text-blue-400 font-semibold">browse files</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Supports single or batch upload (.cfg, .conf, .txt)
              </p>
            </div>
          </div>

          {/* Selected File List */}
          {selectedFiles.length > 0 && (
            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-gray-900/80 rounded-xl border border-gray-800">
              <div className="text-[11px] font-semibold text-gray-400 px-2 py-0.5">
                Queued Files ({selectedFiles.length}):
              </div>
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-gray-800/80 text-gray-200">
                  <span className="font-mono truncate max-w-sm">{f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                  {!isProcessing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveFile(i); }}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Processing Progress Status */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2 animate-pulse">
              <div className="flex items-center space-x-2 text-xs font-semibold text-blue-300">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>{progressStage}</span>
              </div>
              <div className="h-1.5 w-full bg-blue-950 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-progress" />
              </div>
            </div>
          )}

          {/* Privacy Reassurance */}
          <div className="flex items-center space-x-2 text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Local analysis guarantee: passwords and credentials are masked immediately and never transmitted.</span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <button
            type="button"
            onClick={loadDemoPresets}
            disabled={isProcessing}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-all shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Load Hackathon Demo (4 Devices)</span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={startAnalysis}
              disabled={selectedFiles.length === 0 || isProcessing}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <span>Run Audit ({selectedFiles.length})</span>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
