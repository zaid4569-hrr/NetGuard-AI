import React, { useState } from 'react';
import { Shield, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface ScoreCardProps {
  score: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalDevices: number;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
  totalDevices
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Determine color and status based on score
  const getScoreDetails = (val: number) => {
    if (val >= 85) {
      return {
        color: 'text-emerald-400',
        stroke: '#10B981',
        bg: 'bg-emerald-950/30',
        border: 'border-emerald-500/30',
        label: 'HARDENED / LOW RISK'
      };
    } else if (val >= 70) {
      return {
        color: 'text-amber-400',
        stroke: '#F59E0B',
        bg: 'bg-amber-950/30',
        border: 'border-amber-500/30',
        label: 'MODERATE RISK'
      };
    } else if (val >= 50) {
      return {
        color: 'text-orange-400',
        stroke: '#F97316',
        bg: 'bg-orange-950/30',
        border: 'border-orange-500/30',
        label: 'HIGH RISK'
      };
    } else {
      return {
        color: 'text-red-400',
        stroke: '#EF4444',
        bg: 'bg-red-950/30',
        border: 'border-red-500/30',
        label: 'CRITICAL RISK'
      };
    }
  };

  const details = getScoreDetails(score);
  const circumference = 2 * Math.PI * 40; // r=40
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
      
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Overall Security Score</h3>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${details.bg} ${details.border} ${details.color}`}>
          {details.label}
        </span>
      </div>

      {/* Main Score Gauge */}
      <div className="flex items-center space-x-6 my-2">
        <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#1F2937"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress Ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={details.stroke}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-extrabold text-white tracking-tight">{score}</span>
            <span className="text-[10px] text-gray-400 font-medium">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          <p className="text-xs text-gray-400 leading-relaxed">
            Composite posture derived from deterministic rule evaluation across <span className="text-gray-200 font-semibold">{totalDevices} device{totalDevices !== 1 ? 's' : ''}</span>.
          </p>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors pt-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>How was this calculated?</span>
            {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Transparent Calculation Dropdown */}
      {showBreakdown && (
        <div className="mt-4 pt-4 border-t border-gray-800 text-xs space-y-2 bg-gray-900/60 p-3 rounded-xl">
          <div className="font-semibold text-gray-300">Transparent Scoring Formula:</div>
          <div className="space-y-1 font-mono text-[11px] text-gray-400">
            <div className="flex justify-between">
              <span>Base Baseline:</span>
              <span className="text-emerald-400">+100.0 pts</span>
            </div>
            <div className="flex justify-between">
              <span>Critical Findings ({criticalCount} × 18 pts):</span>
              <span className="text-red-400">-{criticalCount * 18} pts</span>
            </div>
            <div className="flex justify-between">
              <span>High Findings ({highCount} × 10 pts):</span>
              <span className="text-orange-400">-{highCount * 10} pts</span>
            </div>
            <div className="flex justify-between">
              <span>Medium Findings ({mediumCount} × 5 pts):</span>
              <span className="text-amber-400">-{mediumCount * 5} pts</span>
            </div>
            <div className="flex justify-between">
              <span>Low Findings ({lowCount} × 2 pts):</span>
              <span className="text-blue-400">-{lowCount * 2} pts</span>
            </div>
            <div className="border-t border-gray-700 pt-1 flex justify-between font-bold text-gray-200">
              <span>Final Normalized Score:</span>
              <span className={details.color}>{score} / 100</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
