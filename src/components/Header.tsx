import React from 'react';
import { 
  Play, 
  Code2, 
  ExternalLink, 
  RefreshCw, 
  Sparkles,
  FileSpreadsheet,
  Copy,
  Check,
  Table as TableIcon,
  TrendingUp
} from 'lucide-react';

interface HeaderProps {
  totalSolutions: number;
  totalCategories: number;
  totalSubcategories: number;
  crawledAt?: string;
  isCrawling: boolean;
  activeView: 'table' | 'trends';
  onToggleView: (view: 'table' | 'trends') => void;
  onOpenCrawlModal: () => void;
  onOpenCodeModal: () => void;
  onExportCsv: () => void;
  onCopyAllTsv: () => void;
  copiedTsv: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalSolutions,
  totalCategories,
  totalSubcategories,
  crawledAt,
  isCrawling,
  activeView,
  onToggleView,
  onOpenCrawlModal,
  onOpenCodeModal,
  onExportCsv,
  onCopyAllTsv,
  copiedTsv
}) => {
  const formattedDate = crawledAt ? new Date(crawledAt).toLocaleString('en-SG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Just now';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title & Badge */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  IMDA SMEs Go Digital
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Solutions Crawler
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Data Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Official Essential Business Solutions catalog</span>
                <span className="text-slate-300">•</span>
                <a 
                  href="https://smesgodigital.gov.sg/web/essential-business-solutions?utm_source=event&utm_medium=qr_code&utm_term=smegd-booth&utm_content=ebs&utm_campaign=2026_smegdday" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-0.5"
                >
                  smesgodigital.gov.sg
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-300">•</span>
                <span>Last updated: {formattedDate}</span>
              </p>
            </div>
          </div>

          {/* Controls: View Switcher + Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View switcher: Table vs Trends Chart */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
              <button
                onClick={() => onToggleView('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Data Table</span>
              </button>
              <button
                onClick={() => onToggleView('trends')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'trends'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trends Chart</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeView === 'trends' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700'
                }`}>
                  New
                </span>
              </button>
            </div>

            <button
              onClick={onOpenCodeModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs"
              title="View standalone Python & Node.js crawler code"
            >
              <Code2 className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Script</span>
            </button>

            <button
              onClick={onCopyAllTsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs"
              title="Copy table to clipboard for pasting directly into Excel or Google Sheets"
            >
              {copiedTsv ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Excel TSV</span>
                </>
              )}
            </button>

            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs"
              title="Download CSV file with Software Name, Company, Price, and comma-separated Features"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>CSV</span>
            </button>

            <button
              onClick={onOpenCrawlModal}
              disabled={isCrawling}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition-all ${
                isCrawling 
                  ? 'bg-rose-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98]'
              }`}
            >
              {isCrawling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Crawling...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Crawl</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
