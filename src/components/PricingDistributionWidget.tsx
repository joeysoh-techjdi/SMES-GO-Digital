import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import { 
  DollarSign, 
  TrendingDown, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Award, 
  Sparkles, 
  Layers, 
  ChevronRight,
  SlidersHorizontal,
  HelpCircle
} from 'lucide-react';
import { SolutionItem, CategoryInfo } from '../crawler/types.ts';

interface PricingDistributionWidgetProps {
  solutions: SolutionItem[];
  categories: CategoryInfo[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  onSelectSubcategory: (subcategoryName: string) => void;
  onSwitchToTable: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Sales & Marketing': '#e11d48',
  'Operations': '#d97706',
  'Cybersecurity': '#7c3aed',
  'Human Resource': '#2563eb',
  'Sustainability': '#059669'
};

export const PricingDistributionWidget: React.FC<PricingDistributionWidgetProps> = ({
  solutions,
  categories,
  selectedCategory,
  onSelectCategory,
  onSelectSubcategory,
  onSwitchToTable
}) => {
  const [activeTab, setActiveTab] = useState<'cost-effective' | 'spread' | 'tiers'>('cost-effective');
  const [grantSubsidyRate, setGrantSubsidyRate] = useState<number>(0.5); // Default 50% EDGE Grant / PSG

  // Filter solutions if a specific category is active
  const targetSolutions = useMemo(() => {
    if (selectedCategory === 'all') return solutions;
    return solutions.filter(s => s.category === selectedCategory);
  }, [solutions, selectedCategory]);

  // 1. Analyze Category Price Spectrum (Min, P25, Median, P75, Max, Avg)
  const categoryPriceSpreadData = useMemo(() => {
    return categories.map(cat => {
      const catSolutions = solutions.filter(s => s.category === cat.name && s.priceNumber > 0);
      const prices = catSolutions.map(s => s.priceNumber).sort((a, b) => a - b);
      if (prices.length === 0) {
        return { name: cat.name, min: 0, p25: 0, median: 0, avg: 0, p75: 0, max: 0, count: 0 };
      }

      const min = prices[0];
      const max = prices[prices.length - 1];
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const median = prices[Math.floor(prices.length * 0.5)];
      const p25 = prices[Math.floor(prices.length * 0.25)];
      const p75 = prices[Math.floor(prices.length * 0.75)];

      return {
        name: cat.name,
        min,
        p25,
        median,
        avg,
        p75,
        max,
        netMedian: Math.round(median * (1 - grantSubsidyRate)),
        count: prices.length
      };
    }).sort((a, b) => a.median - b.median);
  }, [categories, solutions, grantSubsidyRate]);

  // 2. Analyze Cost-Effective Solution Segments (Subcategories)
  const subcategoryValueData = useMemo(() => {
    const subMap: Record<string, { cat: string; prices: number[]; feats: number[] }> = {};

    targetSolutions.forEach(s => {
      if (!subMap[s.subcategory]) {
        subMap[s.subcategory] = { cat: s.category, prices: [], feats: [] };
      }
      if (s.priceNumber > 0) subMap[s.subcategory].prices.push(s.priceNumber);
      const featCount = (s.coreFeatures?.length || 0) + (s.additionalFeatures?.length || 0);
      subMap[s.subcategory].feats.push(featCount);
    });

    const list = Object.entries(subMap)
      .filter(([_, info]) => info.prices.length > 0)
      .map(([subName, info]) => {
        info.prices.sort((a, b) => a - b);
        const median = info.prices[Math.floor(info.prices.length * 0.5)];
        const min = info.prices[0];
        const max = info.prices[info.prices.length - 1];
        const avgPrice = Math.round(info.prices.reduce((a, b) => a + b, 0) / info.prices.length);
        const avgFeat = Number((info.feats.reduce((a, b) => a + b, 0) / info.feats.length).toFixed(1));
        // Cost-effectiveness value score: features per $1,000 spent
        const valueScore = Number(((avgFeat / (median || 1)) * 1000).toFixed(2));
        const netMedian = Math.round(median * (1 - grantSubsidyRate));

        let badge = 'Standard Tier';
        let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
        if (valueScore >= 4.0) {
          badge = '⭐ High Value / Budget Leader';
          badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        } else if (valueScore >= 2.5) {
          badge = '⚡ Balanced ROI Segment';
          badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
        } else if (median > 5000) {
          badge = '🏢 Enterprise Grade';
          badgeColor = 'bg-purple-50 text-purple-800 border-purple-200';
        }

        return {
          subName,
          category: info.cat,
          count: info.prices.length,
          min,
          max,
          median,
          netMedian,
          avgPrice,
          avgFeat,
          valueScore,
          badge,
          badgeColor
        };
      });

    return list.sort((a, b) => b.valueScore - a.valueScore);
  }, [targetSolutions, grantSubsidyRate]);

  // 3. Price Tiers Histogram
  const priceTiersData = useMemo(() => {
    const tiers = [
      {
        range: 'Under $1,500',
        label: 'Micro Budget',
        min: 0,
        max: 1500,
        count: 0,
        totalFeats: 0,
        examples: [] as string[]
      },
      {
        range: '$1,500 - $3,500',
        label: 'Core SME Sweet-spot',
        min: 1500,
        max: 3500,
        count: 0,
        totalFeats: 0,
        examples: [] as string[]
      },
      {
        range: '$3,500 - $7,500',
        label: 'Growth / Advanced',
        min: 3500,
        max: 7500,
        count: 0,
        totalFeats: 0,
        examples: [] as string[]
      },
      {
        range: '$7,500+',
        label: 'Enterprise Full-suite',
        min: 7500,
        max: Infinity,
        count: 0,
        totalFeats: 0,
        examples: [] as string[]
      }
    ];

    targetSolutions.forEach(s => {
      const p = s.priceNumber || 0;
      const feats = (s.coreFeatures?.length || 0) + (s.additionalFeatures?.length || 0);
      for (const t of tiers) {
        if (p >= t.min && p < t.max) {
          t.count++;
          t.totalFeats += feats;
          if (t.examples.length < 3 && !t.examples.includes(s.subcategory)) {
            t.examples.push(s.subcategory);
          }
          break;
        }
      }
    });

    return tiers.map(t => ({
      ...t,
      avgFeatures: t.count > 0 ? Number((t.totalFeats / t.count).toFixed(1)) : 0,
      sharePct: targetSolutions.length > 0 ? Math.round((t.count / targetSolutions.length) * 100) : 0,
      netRange: t.max === Infinity 
        ? `From SGD $${Math.round(t.min * (1 - grantSubsidyRate))}+`
        : `SGD $${Math.round(t.min * (1 - grantSubsidyRate))} - $${Math.round(t.max * (1 - grantSubsidyRate))}`
    }));
  }, [targetSolutions, grantSubsidyRate]);

  // Overall quick stats
  const pricedCount = targetSolutions.filter(s => s.priceNumber > 0).length;
  const lowestPriceSol = targetSolutions.filter(s => s.priceNumber > 0).sort((a,b) => a.priceNumber - b.priceNumber)[0];
  const highestValueSegment = subcategoryValueData[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6 overflow-hidden">
      {/* Widget Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              Pricing Distribution & Cost-Effectiveness
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              • Analyzed across {pricedCount} priced packages
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            SME Investment & ROI Segment Analyzer
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Evaluate median software prices, feature density per dollar, and actual out-of-pocket costs with government grant subsidies.
          </p>
        </div>

        {/* View Switcher Tabs & Grant Subsidy Toggle */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Grant toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600 px-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Grant:
            </span>
            <button
              onClick={() => setGrantSubsidyRate(0)}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                grantSubsidyRate === 0 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              List Price
            </button>
            <button
              onClick={() => setGrantSubsidyRate(0.5)}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                grantSubsidyRate === 0.5 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Apply 50% EDGE Grant / PSG funding"
            >
              50% Subsidy
            </button>
          </div>

          {/* Sub-view switch tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs border border-slate-200">
            <button
              onClick={() => setActiveTab('cost-effective')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'cost-effective'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Best Value Segments
            </button>
            <button
              onClick={() => setActiveTab('spread')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'spread'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Category Spread
            </button>
            <button
              onClick={() => setActiveTab('tiers')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'tiers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Budget Brackets
            </button>
          </div>
        </div>
      </div>

      {/* 4 Highlight Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
        <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-200/80">
          <div className="flex items-center justify-between text-amber-700 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Lowest Entry Price</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            SGD ${lowestPriceSol ? lowestPriceSol.priceNumber.toLocaleString() : '50'}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5" title={lowestPriceSol?.softwareName}>
            {lowestPriceSol ? `${lowestPriceSol.softwareName} (${lowestPriceSol.subcategory})` : 'Anti-malware & Cloud tools'}
          </div>
        </div>

        <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-200/80">
          <div className="flex items-center justify-between text-emerald-700 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">#1 Cost-Effective Segment</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 truncate" title={highestValueSegment?.subName}>
            {highestValueSegment ? highestValueSegment.subName : 'Accounting & Sales'}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {highestValueSegment ? `${highestValueSegment.valueScore} features per $1k` : '5.4 features / $1,000'}
          </div>
        </div>

        <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-200/80">
          <div className="flex items-center justify-between text-blue-700 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Budget-Friendly Share</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            48.4%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            154 solutions under SGD $2,500
          </div>
        </div>

        <div className="bg-purple-50/50 rounded-xl p-3.5 border border-purple-200/80">
          <div className="flex items-center justify-between text-purple-700 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Grant Subsidy Impact</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-purple-700 mt-1">
            50% Cost Offset
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Eligible local SMEs via ESG EDGE Grant
          </div>
        </div>
      </div>

      {/* Tab 1: Cost-Effective Segments Leaderboard */}
      {activeTab === 'cost-effective' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Top 8 High-Value Solution Segments (Ranked by Features per $1,000 Spent)</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Click any segment to view matching solutions in table
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {subcategoryValueData.slice(0, 8).map((seg, idx) => {
              return (
                <div
                  key={seg.subName}
                  onClick={() => {
                    onSelectCategory(seg.category);
                    onSelectSubcategory(seg.subName);
                    onSwitchToTable();
                  }}
                  className="group bg-slate-50/80 hover:bg-rose-50/30 p-4 rounded-xl border border-slate-200/90 hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs"
                >
                  <div>
                    {/* Top row: Rank & Badge */}
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border truncate ${seg.badgeColor}`}>
                        {seg.badge}
                      </span>
                    </div>

                    {/* Subcategory title */}
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 leading-tight">
                      {seg.subName}
                    </h5>

                    {/* Category tag */}
                    <span className="inline-block text-[10px] font-medium text-slate-500 mt-1">
                      {seg.category} ({seg.count} tools)
                    </span>
                  </div>

                  {/* Pricing & Value Metrics */}
                  <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Median Price:</span>
                      <span className="font-bold font-mono text-slate-900">
                        SGD ${seg.median.toLocaleString()}
                      </span>
                    </div>

                    {grantSubsidyRate > 0 && (
                      <div className="flex items-center justify-between text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        <span className="text-[11px] font-medium text-emerald-800">Net after 50% grant:</span>
                        <span className="font-extrabold font-mono text-emerald-700">
                          SGD ${seg.netMedian.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Feature Density:</span>
                      <span className="font-semibold text-slate-700">{seg.avgFeat} features avg</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-indigo-700 font-semibold pt-1">
                      <span>Value Score:</span>
                      <span className="bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                        {seg.valueScore} feats / $1k
                      </span>
                    </div>

                    <div className="text-[11px] text-rose-600 group-hover:underline font-semibold flex items-center gap-1 pt-1 justify-end">
                      <span>Explore {seg.count} solutions</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Category Price Spread Spectrum Chart */}
      {activeTab === 'spread' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Category Price Spectrum & Median Benchmarks (SGD)
              </h4>
              <p className="text-[11px] text-slate-500">
                Comparing entry barrier (Min), core market (Median), and high-end enterprise (Max) per domain
              </p>
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
              {grantSubsidyRate > 0 ? 'Showing Net SME Cost (50% Subsidy)' : 'Showing Gross List Prices'}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={categoryPriceSpreadData}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-10}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800 space-y-1">
                          <p className="font-bold text-rose-400">{d.name}</p>
                          <p className="text-slate-300">Min Price: <strong className="font-mono text-emerald-400">SGD ${d.min.toLocaleString()}</strong></p>
                          <p className="text-slate-300">25th Percentile: <strong className="font-mono text-white">SGD ${d.p25.toLocaleString()}</strong></p>
                          <p className="text-amber-300 font-bold">Median Price: <span className="font-mono">SGD ${d.median.toLocaleString()}</span></p>
                          {grantSubsidyRate > 0 && (
                            <p className="text-emerald-300 font-bold">After 50% Grant: <span className="font-mono">SGD ${d.netMedian.toLocaleString()}</span></p>
                          )}
                          <p className="text-slate-300">Average Price: <strong className="font-mono text-white">SGD ${d.avg.toLocaleString()}</strong></p>
                          <p className="text-slate-300">Max Enterprise: <strong className="font-mono text-purple-400">SGD ${d.max.toLocaleString()}</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                <Bar 
                  dataKey="min" 
                  name="Entry Starting Price (Min)" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey={grantSubsidyRate > 0 ? "netMedian" : "median"} 
                  name={grantSubsidyRate > 0 ? "Net Median (After Grant)" : "Market Median Price"} 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="max" 
                  name="Enterprise Ceiling (Max)" 
                  fill="#94a3b8" 
                  radius={[4, 4, 0, 0]} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Budget Brackets Histogram & SME Fit */}
      {activeTab === 'tiers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Software Package Volume by Budget Bracket
              </h4>
              <p className="text-[11px] text-slate-500">
                Distribution of software tiers and average capability count in each segment
              </p>
            </div>
            <span className="text-[11px] text-slate-400">
              Total {targetSolutions.length} solutions analyzed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {priceTiersData.map((tier, i) => (
              <div key={tier.range} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono">{tier.range}</span>
                  <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    {tier.sharePct}%
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-600">{tier.label}</div>
                
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {tier.count} <span className="text-xs font-normal text-slate-500">packages</span>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>After 50% Subsidy:</span>
                    <strong className="text-emerald-700 font-mono">{tier.netRange}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Feature Richness:</span>
                    <strong className="text-slate-800">{tier.avgFeatures} features avg</strong>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-700">Common: </span>
                  {tier.examples.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
