import React from 'react';
import { ShieldCheck, Lock, Upload, FileText, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'rules' | 'history';
  onSelectTab: (tab: 'dashboard' | 'rules' | 'history') => void;
  onOpenUpload: () => void;
  onDownloadReport?: () => void;
  hasAssessment: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenUpload,
  onDownloadReport,
  hasAssessment
}) => {
  return (
    <header className="border-b border-gray-800 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">NetGuard</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">Multi-Vendor Compliance Auditor</p>
            </div>
          </div>

          {/* Privacy Badge Notice */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>🔒 Local Analysis — Configuration data stays on this machine</span>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-3">
            <nav className="flex space-x-1 bg-gray-900/60 p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </span>
              </button>
              <button
                onClick={() => onSelectTab('rules')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentTab === 'rules'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Security Rules</span>
                </span>
              </button>
            </nav>

            {/* Action Buttons */}
            {hasAssessment && onDownloadReport && (
              <button
                onClick={onDownloadReport}
                className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
                title="Download PDF Audit Report"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Export PDF</span>
              </button>
            )}

            <button
              onClick={onOpenUpload}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Import Configs</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
