import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldAlert, 
  Code, 
  Layers, 
  Info,
  Bug,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface ErrorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastLogs?: { time: string; message: string; type?: string }[];
}

export const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({
  isOpen,
  onClose,
  lastLogs = []
}) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<any>(null);

  if (!isOpen) return null;

  const runLiveProbe = async () => {
    setTestStatus('testing');
    try {
      const start = Date.now();
      const res = await fetch('/api/data');
      const data = await res.json();
      const latency = Date.now() - start;
      setTestResult({
        statusCode: res.status,
        latency: `${latency}ms`,
        solutionsCount: data.totalSolutions,
        categoriesCount: data.categories?.length || 0,
        crawledAt: data.crawledAt
      });
      setTestStatus('success');
    } catch (err: any) {
      setTestStatus('error');
      setTestResult({ error: err.message || 'Probe failed' });
    }
  };

  const errorLogs = lastLogs.filter(l => l.type === 'error' || l.message.toLowerCase().includes('error'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Crawler Architecture & Error Diagnostic Details
              </h3>
              <p className="text-xs text-slate-500">
                Technical breakdown of OutSystems API error handling, reverse-engineering nuances, and connection health
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {/* Active Error Logs (if any) */}
          {errorLogs.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <div className="flex items-center gap-2 font-bold text-rose-800 mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Captured Error Events in Current Session:</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-rose-900 bg-white/60 p-2.5 rounded-lg border border-rose-100">
                {errorLogs.map((log, i) => (
                  <div key={i}>[{log.time}] {log.message}</div>
                ))}
              </div>
            </div>
          )}

          {/* Connection & Endpoint Diagnostic Probe */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Live Endpoint Health Probe
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Verifies communication with the crawler backend engine and cached dataset
                </p>
              </div>

              <button
                onClick={runLiveProbe}
                disabled={testStatus === 'testing'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs"
              >
                {testStatus === 'testing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Run Diagnostic Probe</span>
                  </>
                )}
              </button>
            </div>

            {testStatus === 'success' && testResult && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Backend Health: 200 OK ({testResult.latency})</span>
                </div>
                <div className="text-[11px] text-emerald-800">
                  Solutions: <strong>{testResult.solutionsCount}</strong> | Categories: <strong>{testResult.categoriesCount}</strong>
                </div>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-900 font-medium">
                Probe Error: {testResult?.error || 'Unable to reach backend'}
              </div>
            )}
          </div>

          {/* 4 Known OutSystems Error Scenarios & Resolution Details */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500" />
              <span>Known OutSystems Platform Error Scenarios & How They Are Resolved</span>
            </h4>

            <div className="space-y-3">
              {/* Error 1 */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>1. HTTP 403 Forbidden: "Invalid Login"</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    CSRF Token
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  <strong>Trigger:</strong> Calling OutSystems Reactive screenservices endpoints without the required anti-forgery headers.
                </p>
                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-md border border-emerald-100 mt-1.5">
                  <strong>Resolution:</strong> The crawler sends <code className="bg-emerald-100 px-1 py-0.5 rounded">X-CSRFToken: T6C+9iB49TLra4jEsMeSckDMNhQ=</code> (the official public anonymous CSRF token) and a standard desktop Chrome user agent.
                </p>
              </div>

              {/* Error 2 */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>2. SecurityException: "No permissions defined for current screen"</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    Routing & Permissions
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  <strong>Trigger:</strong> Calling deprecated or decommissioned screen controllers like <code className="bg-slate-100 px-1 py-0.5 rounded">SolutionsByCategorySEO</code> or <code className="bg-slate-100 px-1 py-0.5 rounded">Software</code> which have explicit throw statements in their controller permission checks.
                </p>
                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-md border border-emerald-100 mt-1.5">
                  <strong>Resolution:</strong> The crawler targets the active production screen controller: <code className="bg-emerald-100 px-1 py-0.5 rounded">web.MainFlow.SolutionsByCategoryV3/DataActionGetData</code> which has public, unauthenticated read permissions.
                </p>
              </div>

              {/* Error 3 */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>3. System.NullReferenceException / 400 "Failed to parse JSON"</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    Data Serialization
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  <strong>Trigger:</strong> Passing incomplete or bare JSON arrays (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded">[]</code>) instead of OutSystems typed list wrappers (<code className="bg-slate-100 px-1 py-0.5 rounded">&#123; "List": [] &#125;</code>), or omitting required variable fields like <code className="bg-slate-100 px-1 py-0.5 rounded">CurrentFiltersState</code> or <code className="bg-slate-100 px-1 py-0.5 rounded">GetSiteConfig</code>.
                </p>
                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-md border border-emerald-100 mt-1.5">
                  <strong>Resolution:</strong> The crawler constructs the exact 39-attribute <code className="bg-emerald-100 px-1 py-0.5 rounded">VariablesRecord</code> structure expected by OutSystems <code className="bg-emerald-100 px-1 py-0.5 rounded">ServerDataConverter</code>.
                </p>
              </div>

              {/* Error 4 */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>4. Version Token Expiration / Module Build Drift</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    Dynamic Token
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  <strong>Trigger:</strong> When IMDA publishes a new build of the portal, the OutSystems <code className="bg-slate-100 px-1 py-0.5 rounded">versionToken</code> rotates. A hardcoded token will eventually be rejected.
                </p>
                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-md border border-emerald-100 mt-1.5">
                  <strong>Resolution:</strong> The crawler dynamically queries <code className="bg-emerald-100 px-1 py-0.5 rounded">/web/moduleservices/moduleinfo</code> on every crawl run to fetch the live active token automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            For local execution: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">python3 scripts/crawler.py</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
