export interface CategoryInfo {
  name: string;
  subcategories: SubcategoryInfo[];
}

export interface SubcategoryInfo {
  id: string;
  name: string;
  slug: string;
  targetUrl: string;
  benefits?: string[];
}

export interface SolutionItem {
  id: string;
  softwareName: string;
  company: string;
  price: string;
  priceNumber: number;
  actualPrice?: string;
  features: string; // comma separated text
  coreFeatures: string[];
  additionalFeatures: string[];
  category: string;
  subcategory: string;
  subcategoryExtId: string;
  sourceUrl: string;
  description?: string;
  averageRating?: number;
  totalReviews?: number;
  totalPackages?: number;
  tags: string[];
  grants: string[];
  isAIEnabled?: boolean;
}

export interface CrawlProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentCategory?: string;
  currentSubcategory?: string;
  completedSubcategories: number;
  totalSubcategories: number;
  totalSolutionsFound: number;
  logs: { time: string; message: string; type?: 'info' | 'success' | 'warn' | 'error' }[];
  lastUpdated?: string;
}
