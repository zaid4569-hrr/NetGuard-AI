import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, Eye, Trash2, Loader2, ShieldAlert,
  AlertTriangle, Clock, Server, RefreshCw
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

interface AssessmentSummary {
  id: string;
  name: string;
  created_at: string;
  total_devices: number;
  overall_score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<AssessmentSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const loadReports = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiClient.listAssessments();
      setReports(data);
    } catch (err) {
      setReports([]);
      setErrorMsg('Could not load your audit history. Check that the backend is running and you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      await apiClient.downloadPdfReport(id);
      addNotification('Report Downloaded', 'Your PDF audit report has downloaded successfully.', 'success');
    } catch (err) {
      addNotification(
        'Download Failed',
        err instanceof Error ? err.message : 'Could not generate the PDF report.',
        'error'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await apiClient.deleteAssessment(id);
      setReports((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
      addNotification('Report Deleted', `"${name}" has been removed.`, 'success');
    } catch (err) {
      addNotification('Delete Failed', 'Could not delete this report. Please try again.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-400' : score >= 65 ? 'text-cyan-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="space-y-8 pb-16 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Report Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Every audit you've run is listed here. Reports are private to your account.
          </p>
        </div>
        <button
          onClick={loadReports}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs font-mono">Loading your audit history...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-8 rounded-3xl bg-[#0B0F19] border border-rose-900/60 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-300 font-medium">{errorMsg}</p>
        </div>
      ) : reports && reports.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0B0F19] border border-slate-800 text-center space-y-4">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <div>
            <p className="text-sm font-semibold text-white">No audits yet</p>
            <p className="text-xs text-slate-500 mt-1">Run your first configuration audit to see reports here.</p>
          </div>
          <button
            onClick={() => navigate('/audit')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/25"
          >
            Run New Audit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reports?.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{report.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Server className="w-3 h-3" />
                      {report.total_devices} device{report.total_devices === 1 ? '' : 's'}
                    </span>
                    <span className={`font-mono font-semibold ${scoreColor(report.overall_score)}`}>
                      {report.overall_score.toFixed(1)} / 100
                    </span>
                    {report.critical_count > 0 && (
                      <span className="text-rose-400 font-mono">{report.critical_count} critical</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/dashboard?assessment=${report.id}`)}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </button>
                <button
                  onClick={() => handleDownload(report.id)}
                  disabled={downloadingId === report.id}
                  className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {downloadingId === report.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  PDF
                </button>
                <button
                  onClick={() => handleDelete(report.id, report.name)}
                  disabled={deletingId === report.id}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-900 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-50"
                  title="Delete report"
                >
                  {deletingId === report.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
