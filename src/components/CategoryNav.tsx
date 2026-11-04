import React from 'react';
import { 
  Megaphone, 
  Users, 
  Settings2, 
  ShieldAlert, 
  Leaf, 
  LayoutGrid
} from 'lucide-react';
import { CategoryInfo, SolutionItem } from '../crawler/types.ts';

interface CategoryNavProps {
  categories: CategoryInfo[];
  solutions: SolutionItem[];
  selectedCategory: string;
  selectedSubcategory: string;
  onSelectCategory: (categoryName: string) => void;
  onSelectSubcategory: (subcategoryName: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Sales & Marketing': Megaphone,
  'Human Resource': Users,
  'Operations': Settings2,
  'Cybersecurity': ShieldAlert,
  'Sustainability': Leaf
};

const CATEGORY_COLORS: Record<string, { active: string; badge: string }> = {
  'Sales & Marketing': {
    active: 'bg-rose-50 border-rose-500 text-rose-700',
    badge: 'bg-rose-100 text-rose-800'
  },
  'Human Resource': {
    active: 'bg-blue-50 border-blue-500 text-blue-700',
    badge: 'bg-blue-100 text-blue-800'
  },
  'Operations': {
    active: 'bg-amber-50 border-amber-500 text-amber-700',
    badge: 'bg-amber-100 text-amber-800'
  },
  'Cybersecurity': {
    active: 'bg-purple-50 border-purple-500 text-purple-700',
    badge: 'bg-purple-100 text-purple-800'
  },
  'Sustainability': {
    active: 'bg-emerald-50 border-emerald-500 text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800'
  }
};

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  solutions,
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory
}) => {
  // Count solutions per category
  const countByCategory = (name: string) => {
    return solutions.filter(s => s.category === name).length;
  };

  // Count solutions per subcategory
  const countBySubcategory = (subName: string) => {
    return solutions.filter(s => s.subcategory === subName).length;
  };

  const activeCategoryObj = categories.find(c => c.name === selectedCategory);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 mb-6">
      {/* Top Main Category Tabs */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Categories ({categories.length})
        </h2>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => {
              onSelectCategory('all');
              onSelectSubcategory('all');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* All Categories Button */}
        <button
          onClick={() => {
            onSelectCategory('all');
            onSelectSubcategory('all');
          }}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
            selectedCategory === 'all'
              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
              : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <LayoutGrid className={`w-4 h-4 shrink-0 ${selectedCategory === 'all' ? 'text-white' : 'text-slate-500'}`} />
            <span className="text-xs font-semibold truncate">All Solutions</span>
          </div>
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ml-1.5 shrink-0 ${
            selectedCategory === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {solutions.length}
          </span>
        </button>

        {/* 5 Specific Categories */}
        {categories.map(cat => {
          const Icon = CATEGORY_ICONS[cat.name] || Settings2;
          const count = countByCategory(cat.name);
          const isSelected = selectedCategory === cat.name;
          const colorStyles = CATEGORY_COLORS[cat.name] || {
            active: 'bg-slate-100 border-slate-400 text-slate-800',
            badge: 'bg-slate-200 text-slate-700'
          };

          return (
            <button
              key={cat.name}
              onClick={() => {
                onSelectCategory(cat.name);
                onSelectSubcategory('all');
              }}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? `${colorStyles.active} border-2 shadow-xs font-bold`
                  : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-current' : 'text-slate-500'}`} />
                <span className="text-xs truncate font-medium">{cat.name}</span>
              </div>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ml-1.5 shrink-0 ${
                isSelected ? colorStyles.badge : 'bg-slate-200 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subcategory Filter Pills */}
      {activeCategoryObj && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-600">
              Subcategories in <span className="font-bold text-slate-900">{activeCategoryObj.name}</span> ({activeCategoryObj.subcategories.length}):
            </span>
            {selectedSubcategory !== 'all' && (
              <button
                onClick={() => onSelectSubcategory('all')}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                Clear subcategory filter
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onSelectSubcategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSubcategory === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All {activeCategoryObj.name} ({countByCategory(activeCategoryObj.name)})
            </button>

            {activeCategoryObj.subcategories.map(sub => {
              const count = countBySubcategory(sub.name);
              const isSubSelected = selectedSubcategory === sub.name;

              return (
                <button
                  key={sub.id}
                  onClick={() => onSelectSubcategory(sub.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    isSubSelected
                      ? 'bg-rose-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSubSelected ? 'bg-rose-700 text-rose-100' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
