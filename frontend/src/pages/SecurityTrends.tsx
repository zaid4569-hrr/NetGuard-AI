import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Loader2, UploadCloud } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAssessment } from '../context/AssessmentContext';

export const SecurityTrends: React.FC = () => {
  const { history, loading } = useAssessment();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs font-mono">Loading audit history...</p>
      </div>
    );
  }

  if (history.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
        <TrendingUp className="w-10 h-10 text-slate-600 mb-4" />
        <h1 className="text-lg font-semibold text-slate-100 mb-2">Not enough audit history yet</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Trends compare your score across multiple audits. Run at least two audits to see how your posture changes over time.
        </p>
        <button
          onClick={() => navigate('/audit')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-medium text-sm hover:bg-cyan-400 transition"
        >
          <UploadCloud className="w-4 h-4" /> Run New Audit
        </button>
      </div>
    );
  }

  // Oldest first so the chart reads left-to-right chronologically
  const chronological = [...history].reverse();
  const chartData = chronological.map((a, idx) => ({
    label: `#${idx + 1}`,
    score: Math.round(a.overall_score),
    name: a.name,
    date: new Date(a.created_at).toLocaleDateString(),
  }));

  const first = chronological[0];
  const latest = chronological[chronological.length - 1];
  const delta = latest.overall_score - first.overall_score;

  return (
    <div className="space-y-8 pb-16 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-cyan-400" />
          Security Trends
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Posture score across your {history.length} audits, oldest to most recent.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[10px] uppercase text-slate-500 font-mono">First Audit</p>
            <p className="text-2xl font-bold text-slate-300 font-mono">{first.overall_score.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500 font-mono">Latest Audit</p>
            <p className="text-2xl font-bold text-cyan-400 font-mono">{latest.overall_score.toFixed(1)}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-sm font-bold ${
            delta > 0 ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' :
            delta < 0 ? 'bg-rose-950/40 border-rose-800 text-rose-400' :
            'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            {delta > 0 ? <TrendingUp className="w-4 h-4" /> : delta < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            {delta > 0 ? '+' : ''}{delta.toFixed(1)} pts overall
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#0B0F19', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
                formatter={(value: number) => [`${value} / 100`, 'Score']}
              />
              <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={2.5} dot={{ fill: '#22d3ee', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit-by-audit list */}
      <div className="space-y-2">
        {chronological.map((a, idx) => (
          <div
            key={a.id}
            onClick={() => navigate(`/dashboard?assessment=${a.id}`)}
            className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
              <div>
                <p className="text-xs font-semibold text-white">{a.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">{new Date(a.created_at).toLocaleDateString()} · {a.total_devices} devices</p>
              </div>
            </div>
            <span className="text-sm font-bold font-mono text-cyan-300">{a.overall_score.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
