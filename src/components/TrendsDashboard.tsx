import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Sparkles, 
  DollarSign, 
  Layers, 
  Cpu, 
  Filter, 
  Award,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { SolutionItem, CategoryInfo } from '../crawler/types.ts';

interface TrendsDashboardProps {
  solutions: SolutionItem[];
  categories: CategoryInfo[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  onSelectSubcategory: (subcatName: string) => void;
  onSwitchToTable: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Sales & Marketing': '#e11d48',
  'Operations': '#d97706',
  'Cybersecurity': '#7c3aed',
  'Human Resource': '#2563eb',
  'Sustainability': '#059669'
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const TrendsDashboard: React.FC<TrendsDashboardProps> = ({
  solutions,
  categories,
  selectedCategory,
  onSelectCategory,
  onSelectSubcategory,
  onSwitchToTable
}) => {
  const [activeMetricTab, setActiveMetricTab] = useState<'all' | 'ai' | 'price' | 'features'>('all');

  // Filter solutions if a specific category is active
  const filteredSolutions = useMemo(() => {
    if (selectedCategory === 'all') return solutions;
    return solutions.filter(s => s.category === selectedCategory);
  }, [solutions, selectedCategory]);

  // Metric 1: Category distribution & AI penetration
  const categoryStatsData = useMemo(() => {
    return categories.map(cat => {
      const catSolutions = solutions.filter(s => s.category === cat.name);
      const total = catSolutions.length;
      const aiCount = catSolutions.filter(s => s.isAIEnabled).length;
      const traditionalCount = total - aiCount;
      const pricedSolutions = catSolutions.filter(s => s.priceNumber > 0);
      const avgPrice = pricedSolutions.length > 0
        ? Math.round(pricedSolutions.reduce((acc, s) => acc + s.priceNumber, 0) / pricedSolutions.length)
        : 0;

      return {
        name: cat.name,
        total,
        aiCount,
        traditionalCount,
        aiPercentage: total > 0 ? Math.round((aiCount / total) * 100) : 0,
        avgPrice
      };
    }).sort((a, b) => b.total - a.total);
  }, [categories, solutions]);

  // Metric 2: Price tier distribution
  const priceTierData = useMemo(() => {
    const tiers = [
      { name: 'Under $2,500 (Budget)', min: 0, max: 2500, count: 0 },
      { name: '$2,500 - $5,000 (Mid)', min: 2500, max: 5000, count: 0 },
      { name: '$5,000 - $10,000 (Advanced)', min: 5000, max: 10000, count: 0 },
      { name: '$10,000+ (Enterprise)', min: 10000, max: Infinity, count: 0 }
    ];

    filteredSolutions.forEach(s => {
      const p = s.priceNumber || 0;
      if (p < 2500) tiers[0].count++;
      else if (p < 5000) tiers[1].count++;
      else if (p < 10000) tiers[2].count++;
      else tiers[3].count++;
    });

    return tiers.filter(t => t.count > 0);
  }, [filteredSolutions]);

  // Metric 3: Top Trending Features across solutions
  const topFeaturesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSolutions.forEach(s => {
      const allFeats = [...(s.coreFeatures || []), ...(s.additionalFeatures || [])];
      allFeats.forEach(f => {
        const clean = f.trim();
        if (clean) counts[clean] = (counts[clean] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredSolutions]);

  // Metric 4: Top 8 Subcategories by software choice count
  const topSubcategoriesData = useMemo(() => {
    const subcatMap: Record<string, { count: number; category: string }> = {};
    filteredSolutions.forEach(s => {
      if (!subcatMap[s.subcategory]) {
        subcatMap[s.subcategory] = { count: 0, category: s.category };
      }
      subcatMap[s.subcategory].count++;
    });

    return Object.entries(subcatMap)
      .map(([name, val]) => ({
        name: name.length > 24 ? name.substring(0, 22) + '...' : name,
        fullName: name,
        count: val.count,
        category: val.category
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredSolutions]);

  // High-level summary metrics
  const totalCount = filteredSolutions.length;
  const totalAI = filteredSolutions.filter(s => s.isAIEnabled).length;
  const aiRate = totalCount > 0 ? Math.round((totalAI / totalCount) * 100) : 0;
  const pricedItems = filteredSolutions.filter(s => s.priceNumber > 0);
  const avgOverallPrice = pricedItems.length > 0
    ? Math.round(pricedItems.reduce((acc, s) => acc + s.priceNumber, 0) / pricedItems.length)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Insights Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Market Intelligence
              </span>
              <span className="text-xs text-slate-400">
                Data Grounded on 318 IMDA Approved Solutions
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              SMEs Go Digital Technology & Pricing Trends
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Analysis of digital transformation software packages across Singapore SMEs: pricing patterns, AI adoption rates, and highest-density feature offerings.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={onSwitchToTable}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-all shadow-sm"
            >
              <span>Explore Raw Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Trend Snapshot Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Catalog Size</span>
              <Layers className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5">
              {totalCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {selectedCategory === 'all' ? 'Across all 5 domains' : `In ${selectedCategory}`}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>AI Penetration Rate</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300 mt-1.5">
              {aiRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {totalAI} AI & GenAI tools available
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Benchmark Avg Price</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono mt-1.5">
              SGD ${avgOverallPrice.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              87% under SGD $5,000
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Grant Eligibility</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1.5">
              Up to 50%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ESG EDGE Grant & PSG support
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Solution Volume & AI Adoption by Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Solution Volume & AI Adoption by Category
              </h3>
              <p className="text-xs text-slate-500">
                Breakdown of AI-enabled solutions vs traditional digital software
              </p>
            </div>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
              5 Categories
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryStatsData}
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800">
                          <p className="font-bold text-rose-400 mb-1">{data.name}</p>
                          <p className="text-slate-300">Total Solutions: <strong>{data.total}</strong></p>
                          <p className="text-indigo-300">AI-Enabled: <strong>{data.aiCount} ({data.aiPercentage}%)</strong></p>
                          <p className="text-slate-400">Standard: <strong>{data.traditionalCount}</strong></p>
                          <p className="text-amber-300 mt-1 font-mono">Avg Price: SGD ${data.avgPrice.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} 
                />
                <Bar 
                  dataKey="aiCount" 
                  name="AI-Enabled Solutions" 
                  fill="#6366f1" 
                  stackId="a"
                  radius={[0, 0, 0, 0]} 
                />
                <Bar 
                  dataKey="traditionalCount" 
                  name="Standard Digital Software" 
                  fill="#e2e8f0" 
                  stackId="a"
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Average Starting Price Benchmark by Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Average Starting Price by Business Domain
              </h3>
              <p className="text-xs text-slate-500">
                Mean initial investment in Singapore Dollars (SGD)
              </p>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 font-mono">
              SGD / Package
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryStatsData}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={val => `$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800">
                          <p className="font-bold text-amber-400 mb-1">{data.name}</p>
                          <p className="text-slate-300">Average Starting Price: <strong className="font-mono text-white">SGD ${data.avgPrice.toLocaleString()}</strong></p>
                          <p className="text-slate-400 text-[11px] mt-0.5">Calculated across {data.total} solutions</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="avgPrice" 
                  name="Avg Price (SGD)" 
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                >
                  {categoryStatsData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.name] || '#f59e0b'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Pricing Tier Distribution (Donut Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Software Pricing Bracket Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Affordability breakdown across packages in {selectedCategory === 'all' ? 'entire catalog' : selectedCategory}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Affordability Index
            </span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priceTierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {priceTierData.map((entry, index) => (
                    <Cell key={`tier-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pct = Math.round((data.count / totalCount) * 100);
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800">
                          <p className="font-bold text-emerald-400 mb-1">{data.name}</p>
                          <p className="text-slate-200">Software Count: <strong>{data.count} ({pct}%)</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Top 10 Trending Software Features */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Top 10 Most Demanded Features
              </h3>
              <p className="text-xs text-slate-500">
                Highest frequency capabilities included across vendor offerings
              </p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              Feature Demand
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topFeaturesData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={140}
                  tick={{ fontSize: 10, fill: '#334155' }} 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-800">
                          <p className="font-bold text-indigo-300">{data.name}</p>
                          <p className="text-slate-300 mt-0.5">Found in <strong>{data.count}</strong> digital solutions</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="count" 
                  name="Solutions offering this feature" 
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 5: Top Subcategories by Software Variety */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Highest-Density Software Subcategories
            </h3>
            <p className="text-xs text-slate-500">
              Top subcategories by number of pre-approved digital solutions (click any bar to filter)
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Showing top 8 of 26 subcategories
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topSubcategoriesData}
              margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#64748b' }}
                angle={-15}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800">
                        <p className="font-bold text-rose-400 mb-1">{data.fullName}</p>
                        <p className="text-slate-300">Category: <strong>{data.category}</strong></p>
                        <p className="text-emerald-400">Available Solutions: <strong>{data.count}</strong></p>
                        <p className="text-slate-400 text-[10px] mt-1 italic">Click to view in data table</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="count" 
                name="Software Choices" 
                fill="#e11d48"
                radius={[4, 4, 0, 0]}
                onClick={(entry: any) => {
                  const item = entry?.payload || entry;
                  if (item && item.fullName) {
                    onSelectCategory(item.category);
                    onSelectSubcategory(item.fullName);
                    onSwitchToTable();
                  }
                }}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
