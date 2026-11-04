import React from 'react';
import { Layers, Briefcase, Bot, ShieldCheck, DollarSign } from 'lucide-react';
import { SolutionItem } from '../crawler/types.ts';

interface StatsCardsProps {
  solutions: SolutionItem[];
  activeCategory: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ solutions, activeCategory }) => {
  const currentSolutions = activeCategory === 'all'
    ? solutions
    : solutions.filter(s => s.category === activeCategory);

  const totalCount = currentSolutions.length;
  const aiEnabledCount = currentSolutions.filter(s => s.isAIEnabled).length;
  const grantCount = currentSolutions.filter(s => s.grants && s.grants.length > 0).length;
  
  // Calculate average starting price for solutions with known pricing
  const priced = currentSolutions.filter(s => s.priceNumber > 0);
  const avgPrice = priced.length > 0
    ? Math.round(priced.reduce((acc, curr) => acc + curr.priceNumber, 0) / priced.length)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {activeCategory === 'all' ? 'Total' : `${activeCategory}`}
          </span>
          <span className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <Layers className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {totalCount}
          </span>
          <span className="text-xs text-slate-500">
            {activeCategory === 'all' ? 'across 26 subcategories' : 'software packages'}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            AI-Enabled Tools
          </span>
          <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Bot className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {aiEnabledCount}
          </span>
          <span className="text-xs text-indigo-600 font-medium">
            {totalCount > 0 ? `${Math.round((aiEnabledCount / totalCount) * 100)}% of items` : '0%'}
          </span>
        </div>
      </div>

      <div className="bg-[#cade45] p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Grant Supported
          </span>
          <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {grantCount}
          </span>
          <span className="text-xs text-slate-500">
            EDGE / PSG eligible
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Price
          </span>
          <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <DollarSign className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            SGD ${avgPrice.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">
            starting price
          </span>
        </div>
      </div>
    </div>
  );
};
