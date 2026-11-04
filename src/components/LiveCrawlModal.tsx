import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Layers, 
  Clock, 
  Sparkles
} from 'lucide-react';
import { CategoryInfo, CrawlProgress } from '../crawler/types.ts';

interface LiveCrawlModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryInfo[];
  onCrawlComplete: () => void;
}

export const LiveCrawlModal: React.FC<LiveCrawlModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCrawlComplete
}) => {
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [progress, setProgress] = useState<CrawlProgress>({
    status: 'idle',
    completedSubcategories: 0,
    totalSubcategories: 26,
    totalSolutionsFound: 0,
    logs: []
  });
  const [isStarting, setIsStarting] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Poll progress when modal is open or crawl is running
  useEffect(() => {
    if (!isOpen) return;

    const fetchProgress = async () => {
      try {
        const res = await fetch('/api/crawl/progress');
        if (res.ok) {
          const data: CrawlProgress = await res.json();
          setProgress(data);
          if (data.status === 'completed' && progress.status === 'running') {
            onCrawlComplete();
          }
        }
      } catch (e) {
        console.warn('Failed to fetch progress:', e);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 800);
    return () => clearInterval(interval);
  }, [isOpen, progress.status, onCrawlComplete]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [progress.logs]);

  if (!isOpen) return null;

  const toggleCategory = (catName: string) => {
    setSelectedCats(prev => {
      if (prev.includes(catName)) {
        return prev.filter(c => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
  };

  const selectAllCategories = () => {
    if (selectedCats.length === categories.length) {
      setSelectedCats([]);
    } else {
      setSelectedCats(categories.map(c => c.name));
    }
  };

  const handleStartCrawl = async () => {
    setIsStarting(true);
    try {
      const payload: { categories?: string[] } = {};
      if (selectedCats.length > 0 && selectedCats.length < categories.length) {
        payload.categories = selectedCats;
      }
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data.progress);
      }
    } catch (e) {
      console.error('Failed to start crawl:', e);
    } finally {
      setIsStarting(false);
    }
  };

  const isRunning = progress.status === 'running';
  const percent = progress.totalSubcategories > 0 
    ? Math.round((progress.completedSubcategories / progress.totalSubcategories) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <Play className="w-5 h-5 fill-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Live IMDA Portal Crawler
              </h3>
              <p className="text-xs text-slate-500">
                Crawl official smesgodigital.gov.sg categories, subcategories, and digital solutions tables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Categories to Crawl
              </label>
              <button
                type="button"
                onClick={selectAllCategories}
                disabled={isRunning}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                {selectedCats.length === categories.length ? 'Deselect All' : 'Select All (Default)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map(cat => {
                const isChecked = selectedCats.length === 0 || selectedCats.includes(cat.name);
                return (
                  <label
                    key={cat.name}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-rose-50/40 border-rose-300 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    } ${isRunning ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat.name)}
                        disabled={isRunning}
                        className="rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                      />
                      <span className="font-semibold">{cat.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {cat.subcategories.length} subcategories
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Crawl Status:</span>
                {progress.status === 'running' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Extracting ({percent}%)
                  </span>
                )}
                {progress.status === 'completed' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                )}
                {progress.status === 'error' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                    <AlertCircle className="w-3 h-3" />
                    Error
                  </span>
                )}
                {progress.status === 'idle' && (
                  <span className="text-slate-500">Ready to start</span>
                )}
              </div>

              <div className="font-semibold text-slate-700">
                {progress.totalSolutionsFound} solutions found
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${
                  progress.status === 'completed' ? 'bg-emerald-500' : 'bg-rose-600'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>

            {progress.currentCategory && (
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>
                  Current: <strong className="text-slate-900">{progress.currentCategory}</strong>
                  {progress.currentSubcategory ? ` → ${progress.currentSubcategory}` : ''}
                </span>
                <span>
                  {progress.completedSubcategories} / {progress.totalSubcategories} subcategories
                </span>
              </div>
            )}
          </div>

          {/* Terminal / Live Logs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Live Extraction Logs
              </span>
              <span className="text-[11px] text-slate-400">
                {progress.logs.length} log events
              </span>
            </div>

            <div
              ref={logsContainerRef}
              className="bg-slate-900 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[11px] text-slate-200 border border-slate-800 leading-relaxed shadow-inner"
            >
              {progress.logs.length === 0 ? (
                <div className="text-slate-500 italic py-2">
                  No crawl activity yet. Click "Start Live Crawl" below.
                </div>
              ) : (
                progress.logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 py-0.5">
                    <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                    <span className={
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'error' ? 'text-rose-400' :
                      log.type === 'warn' ? 'text-amber-400' :
                      'text-slate-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleStartCrawl}
            disabled={isRunning || isStarting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-500/20 transition-all"
          >
            {isRunning || isStarting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Crawling in Background...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Live Crawl</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
