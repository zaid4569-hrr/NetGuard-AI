import React from 'react';
import { CategoryScore } from '../types';
import { Key, Terminal, FileText, Clock, Radio, ShieldAlert, Lock, Cpu } from 'lucide-react';

interface CategoryScoresProps {
  categoryScores: CategoryScore[];
}

export const CategoryScores: React.FC<CategoryScoresProps> = ({ categoryScores }) => {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'authentication':
        return <Key className="w-4 h-4 text-purple-400" />;
      case 'remote management':
        return <Terminal className="w-4 h-4 text-blue-400" />;
      case 'logging & auditing':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'time synchronization':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'snmp security':
        return <Radio className="w-4 h-4 text-emerald-400" />;
      case 'access control & firewall':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'cryptography':
        return <Lock className="w-4 h-4 text-indigo-400" />;
      case 'network services':
      default:
        return <Cpu className="w-4 h-4 text-slate-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500 text-emerald-400';
    if (score >= 70) return 'bg-amber-500 text-amber-400';
    if (score >= 50) return 'bg-orange-500 text-orange-400';
    return 'bg-red-500 text-red-400';
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
      <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
        Compliance Domain Benchmarks
      </h3>

      <div className="space-y-4">
        {categoryScores.map((cat) => {
          const colorClass = getScoreColor(cat.score);
          const textColor = colorClass.split(' ')[1];
          const barColor = colorClass.split(' ')[0];

          return (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(cat.category)}
                  <span className="font-medium text-gray-200">{cat.category}</span>
                </div>
                <div className="flex items-center space-x-3">
                  {cat.findings_count > 0 && (
                    <span className="text-[11px] text-gray-400 font-mono">
                      {cat.findings_count} finding{cat.findings_count !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className={`font-bold font-mono ${textColor}`}>{cat.score}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-700 rounded-full`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
