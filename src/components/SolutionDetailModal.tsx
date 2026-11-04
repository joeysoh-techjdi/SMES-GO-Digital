import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Star, 
  Layers, 
  Building, 
  DollarSign, 
  Tag
} from 'lucide-react';
import { SolutionItem } from '../crawler/types.ts';

interface SolutionDetailModalProps {
  solution: SolutionItem | null;
  onClose: () => void;
}

export const SolutionDetailModal: React.FC<SolutionDetailModalProps> = ({
  solution,
  onClose
}) => {
  const [copiedFeatures, setCopiedFeatures] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!solution) return null;

  const handleCopyFeatures = () => {
    navigator.clipboard.writeText(solution.features);
    setCopiedFeatures(true);
    setTimeout(() => setCopiedFeatures(false), 2000);
  };

  const handleCopyAll = () => {
    const text = `Software: ${solution.softwareName}\nCompany: ${solution.company}\nPrice: ${solution.price}\nCategory: ${solution.category}\nSubcategory: ${solution.subcategory}\nFeatures: ${solution.features}\nURL: ${solution.sourceUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900">
                {solution.softwareName}
              </h3>
              {solution.isAIEnabled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3" />
                  AI-Enabled
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">{solution.company}</span>
              <span>•</span>
              <span>{solution.category} → {solution.subcategory}</span>
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Price & Rating highlight box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Current Price</span>
              <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
                {solution.price}
              </div>
              {solution.actualPrice && solution.actualPrice !== solution.price && (
                <div className="text-xs text-slate-400 line-through">
                  List: {solution.actualPrice}
                </div>
              )}
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Ratings & Reviews</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-base font-bold text-slate-900">
                  {solution.averageRating ? solution.averageRating.toFixed(1) : 'No ratings'}
                </span>
                {solution.totalReviews ? (
                  <span className="text-xs text-slate-500">
                    ({solution.totalReviews} reviews)
                  </span>
                ) : null}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Packages Available</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {solution.totalPackages || 1} Package tier{solution.totalPackages && solution.totalPackages > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Description */}
          {solution.description && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Description
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-200/60">
                {solution.description}
              </p>
            </div>
          )}

          {/* Features as Comma-Separated Text (Exact prompt requirement) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Extracted Features (Comma-Separated Text)
              </h4>
              <button
                onClick={handleCopyFeatures}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                {copiedFeatures ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono leading-relaxed select-all">
              {solution.features || 'No specific features listed.'}
            </div>
          </div>

          {/* Core Features vs Additional Features Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Core Features ({solution.coreFeatures?.length || 0})
              </h4>
              <div className="space-y-1.5">
                {solution.coreFeatures && solution.coreFeatures.length > 0 ? (
                  solution.coreFeatures.map((feat, i) => (
                    <div key={i} className="text-xs text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-200/80">
                      • {feat}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic">No specific core features separated</div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Additional Features ({solution.additionalFeatures?.length || 0})
              </h4>
              <div className="space-y-1.5">
                {solution.additionalFeatures && solution.additionalFeatures.length > 0 ? (
                  solution.additionalFeatures.map((feat, i) => (
                    <div key={i} className="text-xs text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-200/80">
                      • {feat}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic">No additional features listed</div>
                )}
              </div>
            </div>
          </div>

          {/* Tags & Grants */}
          {(solution.tags.length > 0 || solution.grants.length > 0) && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tags & Support Grants
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {solution.grants.map((grant, i) => (
                  <span key={`g-${i}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {grant}
                  </span>
                ))}
                {solution.tags.map((tag, i) => (
                  <span key={`t-${i}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {copiedAll ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied Solution!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy All Details</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>

            <a
              href={solution.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
            >
              <span>Open on smesgodigital.gov.sg</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
