import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  Sparkles, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Star,
  FileDown
} from 'lucide-react';
import { SolutionItem } from '../crawler/types.ts';

interface DataTableProps {
  solutions: SolutionItem[];
  onSelectSolution: (solution: SolutionItem) => void;
  selectedCategory: string;
  selectedSubcategory: string;
}

type SortField = 'softwareName' | 'company' | 'priceNumber' | 'featuresCount' | 'averageRating';
type SortOrder = 'asc' | 'desc';

export const DataTable: React.FC<DataTableProps> = ({
  solutions,
  onSelectSolution,
  selectedCategory,
  selectedSubcategory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('softwareName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterAIOnly, setFilterAIOnly] = useState(false);
  const [filterGrantOnly, setFilterGrantOnly] = useState(false);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Clipboard copy state tracker
  const [copiedFeatureId, setCopiedFeatureId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter solutions
  const filteredSolutions = useMemo(() => {
    return solutions.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Subcategory filter
      if (selectedSubcategory !== 'all' && item.subcategory !== selectedSubcategory) {
        return false;
      }
      // AI filter
      if (filterAIOnly && !item.isAIEnabled) {
        return false;
      }
      // Grant filter
      if (filterGrantOnly && (!item.grants || item.grants.length === 0)) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.softwareName.toLowerCase().includes(query);
        const matchesCompany = item.company.toLowerCase().includes(query);
        const matchesFeatures = item.features.toLowerCase().includes(query);
        const matchesSubcat = item.subcategory.toLowerCase().includes(query);
        if (!matchesName && !matchesCompany && !matchesFeatures && !matchesSubcat) {
          return false;
        }
      }
      return true;
    });
  }, [solutions, selectedCategory, selectedSubcategory, filterAIOnly, filterGrantOnly, searchQuery]);

  // Sort solutions
  const sortedSolutions = useMemo(() => {
    return [...filteredSolutions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'softwareName') {
        comparison = a.softwareName.localeCompare(b.softwareName);
      } else if (sortField === 'company') {
        comparison = a.company.localeCompare(b.company);
      } else if (sortField === 'priceNumber') {
        comparison = (a.priceNumber || 0) - (b.priceNumber || 0);
      } else if (sortField === 'featuresCount') {
        const countA = (a.coreFeatures?.length || 0) + (a.additionalFeatures?.length || 0);
        const countB = (b.coreFeatures?.length || 0) + (b.additionalFeatures?.length || 0);
        comparison = countA - countB;
      } else if (sortField === 'averageRating') {
        comparison = (a.averageRating || 0) - (b.averageRating || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredSolutions, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedSolutions.length / pageSize);
  const paginatedSolutions = useMemo(() => {
    if (pageSize === -1) return sortedSolutions;
    const start = (currentPage - 1) * pageSize;
    return sortedSolutions.slice(start, start + pageSize);
  }, [sortedSolutions, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const copyFeaturesToClipboard = (features: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(features);
    setCopiedFeatureId(id);
    setTimeout(() => setCopiedFeatureId(null), 2000);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedSolutions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedSolutions.map(s => s.id)));
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportSelectedCsv = () => {
    const listToExport = selectedIds.size > 0 
      ? solutions.filter(s => selectedIds.has(s.id))
      : sortedSolutions;

    const headers = ['Software Name', 'Company', 'Price', 'Features (Comma-separated)', 'Category', 'Subcategory', 'Official URL'];
    const rows = listToExport.map(s => [
      `"${(s.softwareName || '').replace(/"/g, '""')}"`,
      `"${(s.company || '').replace(/"/g, '""')}"`,
      `"${(s.price || '').replace(/"/g, '""')}"`,
      `"${(s.features || '').replace(/"/g, '""')}"`,
      `"${(s.category || '').replace(/"/g, '""')}"`,
      `"${(s.subcategory || '').replace(/"/g, '""')}"`,
      `"${(s.sourceUrl || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smes_solutions_filtered_${listToExport.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Table Controls Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Search input */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search software name, company, or features (e.g. Chatbot, Lead, Payroll)..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
        </div>

        {/* Right: Quick filter toggles & actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterAIOnly(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterAIOnly 
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold' 
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI-Enabled Only</span>
          </button>

          <button
            onClick={() => setFilterGrantOnly(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterGrantOnly 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold' 
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Grant Support</span>
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={exportSelectedCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Selected ({selectedIds.size})</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto lg:ml-2">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>All ({sortedSolutions.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={paginatedSolutions.length > 0 && selectedIds.size === paginatedSolutions.length}
                  onChange={toggleSelectAll}
                  className="rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
              </th>
              
              <th 
                onClick={() => handleSort('softwareName')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Software Name</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('company')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Company (Vendor)</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('priceNumber')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors w-36"
              >
                <div className="flex items-center gap-1.5">
                  <span>Price (SGD)</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('featuresCount')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors min-w-[340px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Features (Comma-Separated Text)</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-4 w-44">
                <span>Category / Subcategory</span>
              </th>

              <th className="py-3 px-3 text-right w-24">
                <span>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {paginatedSolutions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No digital solutions found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try clearing your search query or category filters.</p>
                </td>
              </tr>
            ) : (
              paginatedSolutions.map((item, idx) => {
                const isSelected = selectedIds.has(item.id);
                const hasFeatures = Boolean(item.features && item.features.trim());
                const isCopied = copiedFeatureId === item.id;

                return (
                  <tr 
                    key={`${item.id}-${idx}`}
                    onClick={() => onSelectSolution(item)}
                    className={`group hover:bg-rose-50/30 transition-colors cursor-pointer ${
                      isSelected ? 'bg-rose-50/50' : idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => toggleSelectRow(item.id, e as any)}
                        className="rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                      />
                    </td>

                    {/* Software Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-start gap-1.5">
                        <span className="group-hover:text-rose-600 transition-colors font-bold text-slate-900 leading-tight">
                          {item.softwareName}
                        </span>
                        {item.isAIEnabled && (
                          <span 
                            title="AI-Enabled Solution"
                            className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold shrink-0"
                          >
                            AI
                          </span>
                        )}
                      </div>
                      {item.averageRating && item.averageRating > 0 ? (
                        <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{item.averageRating.toFixed(1)}</span>
                          {item.totalReviews ? (
                            <span className="text-slate-400">({item.totalReviews})</span>
                          ) : null}
                        </div>
                      ) : null}
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      <div className="leading-tight text-slate-800">
                        {item.company}
                      </div>
                      {item.grants && item.grants.length > 0 && (
                        <span className="inline-block mt-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          {item.grants[0]}
                        </span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className={`font-bold inline-block px-2 py-1 rounded-md text-xs ${
                        item.priceNumber > 0 
                          ? 'bg-slate-100 text-slate-900 border border-slate-200 font-mono' 
                          : 'bg-slate-50 text-slate-500 border border-slate-200 italic'
                      }`}>
                        {item.price}
                      </div>
                      {item.actualPrice && item.actualPrice !== item.price && (
                        <div className="text-[10px] text-slate-400 line-through mt-0.5">
                          List: {item.actualPrice}
                        </div>
                      )}
                    </td>

                    {/* Features as Comma-Separated Text */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="relative group/feat pr-6">
                        <p className="line-clamp-2 text-xs leading-relaxed text-slate-700 font-normal">
                          {hasFeatures ? item.features : <span className="italic text-slate-400">Standard core module suite</span>}
                        </p>

                        {/* Quick Copy Feature button */}
                        {hasFeatures && (
                          <button
                            onClick={e => copyFeaturesToClipboard(item.features, item.id, e)}
                            title="Copy features as comma-separated text"
                            className={`absolute right-0 top-0 p-1 rounded transition-all ${
                              isCopied
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'opacity-0 group-hover/feat:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Category & Subcategory */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] leading-tight">
                      <div className="font-semibold text-slate-800 truncate" title={item.category}>
                        {item.category}
                      </div>
                      <div className="text-slate-500 truncate mt-0.5" title={item.subcategory}>
                        {item.subcategory}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectSolution(item)}
                          title="View complete details"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open official page on smesgodigital.gov.sg"
                          className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
        <div>
          Showing{' '}
          <span className="font-bold text-slate-900">
            {sortedSolutions.length === 0 ? 0 : pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-bold text-slate-900">
            {pageSize === -1 ? sortedSolutions.length : Math.min(currentPage * pageSize, sortedSolutions.length)}
          </span>{' '}
          of <span className="font-bold text-slate-900">{sortedSolutions.length}</span> solutions
          {filteredSolutions.length !== solutions.length && (
            <span className="text-slate-400 ml-1">
              (filtered from {solutions.length} total)
            </span>
          )}
        </div>

        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="px-2 font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
