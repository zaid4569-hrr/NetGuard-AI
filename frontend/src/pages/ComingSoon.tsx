import React from 'react';
import { LucideIcon, Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title, description, icon: Icon = Construction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
      <div className="w-14 h-14 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-cyan-400" />
      </div>
      <h1 className="text-xl font-semibold text-slate-100 mb-2">{title}</h1>
      <p className="text-sm text-slate-400 max-w-md">{description}</p>
      <span className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-amber-500/30 bg-amber-950/40 text-amber-400">
        Coming Soon
      </span>
    </div>
  );
};
