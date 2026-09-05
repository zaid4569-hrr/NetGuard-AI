import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SeverityDistributionProps {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
}

export const SeverityDistribution: React.FC<SeverityDistributionProps> = ({
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
  infoCount
}) => {
  const data = [
    { name: 'Critical', value: criticalCount, color: '#EF4444' },
    { name: 'High', value: highCount, color: '#F97316' },
    { name: 'Medium', value: mediumCount, color: '#F59E0B' },
    { name: 'Low', value: lowCount, color: '#10B981' },
  ].filter(d => d.value > 0);

  const total = criticalCount + highCount + mediumCount + lowCount + infoCount;

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
          Finding Severity Breakdown
        </h3>

        {/* Severity Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          
          <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{criticalCount}</div>
              <div className="text-[11px] text-red-400/80 font-medium">Critical</div>
            </div>
          </div>

          <div className="bg-orange-950/20 border border-orange-500/20 rounded-xl p-3 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{highCount}</div>
              <div className="text-[11px] text-orange-400/80 font-medium">High</div>
            </div>
          </div>

          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{mediumCount}</div>
              <div className="text-[11px] text-amber-400/80 font-medium">Medium</div>
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{lowCount}</div>
              <div className="text-[11px] text-emerald-400/80 font-medium">Low / Info</div>
            </div>
          </div>

        </div>
      </div>

      {/* Donut Chart */}
      <div className="h-32 relative">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={54}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  borderColor: '#374151', 
                  borderRadius: '0.5rem',
                  fontSize: '12px' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-gray-500">
            No compliance violations identified.
          </div>
        )}
      </div>

    </div>
  );
};
