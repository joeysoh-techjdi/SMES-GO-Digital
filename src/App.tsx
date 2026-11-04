import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { StatsCards } from './components/StatsCards.tsx';
import { CategoryNav } from './components/CategoryNav.tsx';
import { DataTable } from './components/DataTable.tsx';
import { TrendsDashboard } from './components/TrendsDashboard.tsx';
import { LiveCrawlModal } from './components/LiveCrawlModal.tsx';
import { SolutionDetailModal } from './components/SolutionDetailModal.tsx';
import { CrawlerCodeModal } from './components/CrawlerCodeModal.tsx';
import { CategoryInfo, SolutionItem } from './crawler/types.ts';
import initialSolutionsData from './data/solutions.json';
import { Database, AlertTriangle, RefreshCw, BarChart2, Table } from 'lucide-react';

export default function App() {
  const [categories, setCategories] = useState<CategoryInfo[]>(
    (initialSolutionsData as any)?.categories || []
  );
  const [solutions, setSolutions] = useState<SolutionItem[]>(
    (initialSolutionsData as any)?.solutions || []
  );
  const [crawledAt, setCrawledAt] = useState<string>(
    (initialSolutionsData as any)?.crawledAt || ''
  );

  const [activeView, setActiveView] = useState<'table' | 'trends'>('table');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  const [isCrawlModalOpen, setIsCrawlModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<SolutionItem | null>(null);

  const [isCrawling, setIsCrawling] = useState(false);
  const [copiedTsv, setCopiedTsv] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch updated data from backend API
  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data.solutions && data.solutions.length > 0) {
          setSolutions(data.solutions);
          setCategories(data.categories || []);
          setCrawledAt(data.crawledAt || new Date().toISOString());
        }
      }
    } catch (e) {
      console.warn('API fetch failed, retaining existing dataset:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Monitor crawl status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/crawl/progress');
        if (res.ok) {
          const data = await res.json();
          setIsCrawling(data.status === 'running');
        }
      } catch (e) {
        // ignore
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Export CSV
  const handleExportCsv = () => {
    showToast('Downloading CSV table with Software Name, Company, Price, and Features...');
    window.location.href = `/api/export/csv?category=${encodeURIComponent(selectedCategory)}&subcategory=${encodeURIComponent(selectedSubcategory)}`;
  };

  // Copy entire current view as TSV (tab-separated values) for Excel or Google Sheets
  const handleCopyAllTsv = () => {
    const filtered = solutions.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedSubcategory !== 'all' && item.subcategory !== selectedSubcategory) return false;
      return true;
    });

    const headers = ['Software Name', 'Company', 'Price', 'Features (Comma-separated text)', 'Category', 'Subcategory', 'Official URL'];
    const rows = filtered.map(s => [
      s.softwareName,
      s.company,
      s.price,
      s.features,
      s.category,
      s.subcategory,
      s.sourceUrl
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvContent);
    setCopiedTsv(true);
    showToast(`Copied ${filtered.length} rows to clipboard! Ready to paste into Excel/Sheets.`);
    setTimeout(() => setCopiedTsv(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        totalSolutions={solutions.length}
        totalCategories={categories.length}
        totalSubcategories={categories.reduce((acc, c) => acc + c.subcategories.length, 0)}
        crawledAt={crawledAt}
        isCrawling={isCrawling}
        activeView={activeView}
        onToggleView={(view) => setActiveView(view)}
        onOpenCrawlModal={() => setIsCrawlModalOpen(true)}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onExportCsv={handleExportCsv}
        onCopyAllTsv={handleCopyAllTsv}
        copiedTsv={copiedTsv}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metric Cards */}
        <StatsCards solutions={solutions} activeCategory={selectedCategory} />

        {/* 5 Categories Navigation & Subcategories Chips */}
        <CategoryNav
          categories={categories}
          solutions={solutions}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          onSelectSubcategory={(sub) => setSelectedSubcategory(sub)}
        />

        {/* Dynamic View: Either Trends Chart or Data Table */}
        {activeView === 'trends' ? (
          <TrendsDashboard
            solutions={solutions}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onSelectSubcategory={(sub) => setSelectedSubcategory(sub)}
            onSwitchToTable={() => setActiveView('table')}
          />
        ) : (
          <DataTable
            solutions={solutions}
            onSelectSolution={(sol) => setSelectedSolution(sol)}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">IMDA SMEs Go Digital Solutions Crawler</span>
            <span>•</span>
            <span>Extracting Digital Solutions, Companies, Pricing, Features, and Market Trends</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveView(activeView === 'table' ? 'trends' : 'table')}
              className="text-rose-600 hover:underline font-semibold"
            >
              {activeView === 'table' ? 'View Trends Charts 📈' : 'View Data Table 📋'}
            </button>
            <button 
              onClick={() => setIsCodeModalOpen(true)}
              className="hover:text-rose-600 transition-colors"
            >
              Standalone Scripts
            </button>
            <a 
              href="/smes_digital_solutions.csv" 
              download 
              className="hover:text-rose-600 transition-colors"
            >
              Raw CSV Download
            </a>
            <a 
              href="https://smesgodigital.gov.sg/web/essential-business-solutions?utm_source=event&utm_medium=qr_code&utm_term=smegd-booth&utm_content=ebs&utm_campaign=2026_smegdday" 
              target="_blank" 
              rel="noreferrer"
              className="text-rose-600 hover:underline"
            >
              Source Portal ↗
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LiveCrawlModal
        isOpen={isCrawlModalOpen}
        onClose={() => setIsCrawlModalOpen(false)}
        categories={categories}
        onCrawlComplete={() => {
          refreshData();
          showToast('Live crawl completed! Dataset updated.');
        }}
      />

      <SolutionDetailModal
        solution={selectedSolution}
        onClose={() => setSelectedSolution(null)}
      />

      <CrawlerCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
}
