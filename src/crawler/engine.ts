import type { CategoryInfo, SubcategoryInfo, SolutionItem, CrawlProgress } from './types.ts';

const BASE_URL = 'https://smesgodigital.gov.sg';
const DEFAULT_CSRF = 'T6C+9iB49TLra4jEsMeSckDMNhQ=';
const EBS_API_VERSION = 'osEdm21bu7CAFEIJEa0BWw';
const SOLUTIONS_API_VERSION = 'dQ53DX6kPHLB56XiWwxtHQ';

export async function fetchLatestVersionToken(): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/web/moduleservices/moduleinfo`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.manifest?.versionToken || 'r13sYz63BEDctBBs6oZsmQ';
  } catch (err) {
    console.warn('Failed to fetch dynamic versionToken, using fallback:', err);
    return 'r13sYz63BEDctBBs6oZsmQ';
  }
}

export async function fetchCategories(versionToken?: string): Promise<CategoryInfo[]> {
  const token = versionToken || (await fetchLatestVersionToken());
  const url = `${BASE_URL}/web/screenservices/web/MainFlow/EssentialBusinessSolutions/DataActionGetPageContentData`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json',
      'X-CSRFToken': DEFAULT_CSRF,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    body: JSON.stringify({
      versionInfo: { moduleVersion: token, apiVersion: EBS_API_VERSION },
      viewName: 'MainFlow.EssentialBusinessSolutions',
      screenData: { variables: {} }
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch categories: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (json.exception) {
    throw new Error(`OutSystems error: ${json.exception.message || 'Unknown error'}`);
  }

  const pageContent = json.data?.PageContent;
  if (!pageContent?.BusinessArea) {
    throw new Error('BusinessArea data missing from response');
  }

  const ba = typeof pageContent.BusinessArea === 'string'
    ? JSON.parse(pageContent.BusinessArea)
    : pageContent.BusinessArea;

  const categories: CategoryInfo[] = [];

  for (const item of ba.items || []) {
    const subcats: SubcategoryInfo[] = (item.categories || []).map((c: any) => {
      const extId = String(c.categoryextid || '');
      const rawUrl = c.targeturl || '';
      // extract slug from /web/category/3/customer-relationship-management--crm-
      const slug = rawUrl.replace(`/web/category/${extId}/`, '').replace(/\/$/, '') || 'all';
      return {
        id: extId,
        name: c.name || 'Unnamed Subcategory',
        slug,
        targetUrl: rawUrl.startsWith('http') ? rawUrl : `${BASE_URL}${rawUrl}`,
        benefits: Array.isArray(c.benefits) ? c.benefits : []
      };
    });

    categories.push({
      name: item.name || 'Unnamed Category',
      subcategories: subcats
    });
  }

  return categories;
}

export async function fetchSolutionsForSubcategory(
  categoryName: string,
  subcat: SubcategoryInfo,
  versionToken: string
): Promise<SolutionItem[]> {
  const url = `${BASE_URL}/web/screenservices/web/MainFlow/SolutionsByCategoryV3/DataActionGetData`;

  const payload = {
    versionInfo: { moduleVersion: versionToken, apiVersion: SOLUTIONS_API_VERSION },
    viewName: 'MainFlow.SolutionsByCategoryV3',
    screenData: {
      variables: {
        StartIndex: 0,
        PackagesListToCompare: { List: [] },
        MaxRecords: 100,
        SolutionsListToShow_3: { List: [] },
        DataIsFetched: false,
        SearchText: '',
        CurrentSortBy: 1,
        ReadyForGTMChecks: false,
        FilteredList_2: { List: [] },
        CurrentFiltersState: {
          FeaturesSelected: { List: [] },
          GrantsSelected: { List: [] },
          CategoriesSelected: { List: [] },
          MinPriceSelected: '0',
          MaxPriceSelected: '0'
        },
        SortDropDownOptions: { List: [] },
        ShowBusinessImpactText: false,
        ShowLoginPopup: false,
        SavedSolutionBeforeLogin: '',
        categoryextid: subcat.id,
        _categoryextidInDataFetchStatus: 1,
        categoryslug: subcat.slug,
        _categoryslugInDataFetchStatus: 1,
        feature: '',
        _featureInDataFetchStatus: 1,
        features: '',
        _featuresInDataFetchStatus: 1,
        grant: '',
        _grantInDataFetchStatus: 1,
        categories: '',
        _categoriesInDataFetchStatus: 1,
        min: '',
        _minInDataFetchStatus: 1,
        max: '',
        _maxInDataFetchStatus: 1,
        section: '',
        _sectionInDataFetchStatus: 1,
        GetSiteConfig: {
          AssetPath: '',
          FullSiteName: '',
          RootPath: '',
          ServerDomainName: '',
          ShortSiteName: ''
        }
      }
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json',
      'X-CSRFToken': DEFAULT_CSRF,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch solutions for ${subcat.name}: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (json.exception) {
    throw new Error(`OutSystems error for ${subcat.name}: ${json.exception.message}`);
  }

  const rawList = json.data?.SolutionsList?.List || json.data?.SolutionsList || [];

  return rawList.map((sol: any) => {
    const rawCore = sol.CoreFeatures?.List || sol.CoreFeatures || [];
    const rawAdd = sol.AdditionalFeatures?.List || sol.AdditionalFeatures || [];

    const coreFeatures: string[] = rawCore.map((f: any) => (typeof f === 'string' ? f : f?.Name || '')).filter(Boolean);
    const additionalFeatures: string[] = rawAdd.map((f: any) => (typeof f === 'string' ? f : f?.Name || '')).filter(Boolean);

    // Merge and deduplicate all features
    const allFeatures = Array.from(new Set([...coreFeatures, ...additionalFeatures]));
    const featuresCsv = allFeatures.join(', ');

    const priceNum = parseFloat(sol.CurrentPrice || '0') || 0;
    const priceFormatted = priceNum > 0
      ? `SGD $${priceNum.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'Pricing on Enquiry';

    const actualPriceNum = parseFloat(sol.ActualPrice || '0') || 0;
    const actualPriceFormatted = actualPriceNum > 0
      ? `SGD $${actualPriceNum.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : undefined;

    const tagsList = (sol.FeatureTags?.List || []).map((t: any) => t?.Name || '').filter(Boolean);
    const grantsList = (sol.GrantTags?.List || []).map((g: any) => g?.Name || '').filter(Boolean);

    return {
      id: String(sol.SolutionExtId || Math.random().toString(36).substring(2)),
      softwareName: (sol.TitleText || 'Untitled Solution').trim(),
      company: (sol.VendorText || 'Unknown Company').trim(),
      price: priceFormatted,
      priceNumber: priceNum,
      actualPrice: actualPriceFormatted,
      features: featuresCsv,
      coreFeatures,
      additionalFeatures,
      category: categoryName,
      subcategory: subcat.name,
      subcategoryExtId: subcat.id,
      sourceUrl: subcat.targetUrl,
      description: sol.DescriptionText || '',
      averageRating: parseFloat(sol.AverageRating || '0') || 0,
      totalReviews: parseInt(sol.TotalReviews || '0', 10) || 0,
      totalPackages: parseInt(sol.TotalPackages || '0', 10) || 0,
      tags: tagsList,
      grants: grantsList,
      isAIEnabled: Boolean(sol.IsAIEnabled)
    };
  });
}

export async function crawlAllCategories(
  onProgress?: (progress: CrawlProgress) => void,
  selectedCategoryNames?: string[]
): Promise<{ solutions: SolutionItem[]; categories: CategoryInfo[] }> {
  const versionToken = await fetchLatestVersionToken();
  const allCategories = await fetchCategories(versionToken);

  const targetCategories = selectedCategoryNames && selectedCategoryNames.length > 0
    ? allCategories.filter(c => selectedCategoryNames.includes(c.name))
    : allCategories;

  let totalSubcategories = 0;
  for (const cat of targetCategories) {
    totalSubcategories += cat.subcategories.length;
  }

  const progress: CrawlProgress = {
    status: 'running',
    completedSubcategories: 0,
    totalSubcategories,
    totalSolutionsFound: 0,
    logs: [
      {
        time: new Date().toLocaleTimeString(),
        message: `Crawler started for ${targetCategories.length} categories (${totalSubcategories} subcategories).`,
        type: 'info'
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  if (onProgress) onProgress({ ...progress });

  const allSolutions: SolutionItem[] = [];

  for (const cat of targetCategories) {
    progress.currentCategory = cat.name;
    progress.logs.push({
      time: new Date().toLocaleTimeString(),
      message: `📂 Entering Category: ${cat.name} (${cat.subcategories.length} subcategories)...`,
      type: 'info'
    });
    if (onProgress) onProgress({ ...progress });

    for (const sub of cat.subcategories) {
      progress.currentSubcategory = sub.name;
      try {
        const solutions = await fetchSolutionsForSubcategory(cat.name, sub, versionToken);
        allSolutions.push(...solutions);
        progress.completedSubcategories += 1;
        progress.totalSolutionsFound = allSolutions.length;
        progress.logs.push({
          time: new Date().toLocaleTimeString(),
          message: `  ✓ [${sub.id}] ${sub.name}: Extracted ${solutions.length} solutions`,
          type: 'success'
        });
      } catch (err: any) {
        progress.completedSubcategories += 1;
        progress.logs.push({
          time: new Date().toLocaleTimeString(),
          message: `  ✗ Error fetching ${sub.name}: ${err?.message || err}`,
          type: 'error'
        });
      }

      progress.lastUpdated = new Date().toISOString();
      if (onProgress) onProgress({ ...progress });

      // Polite delay between requests
      await new Promise(r => setTimeout(r, 120));
    }
  }

  progress.status = 'completed';
  progress.logs.push({
    time: new Date().toLocaleTimeString(),
    message: `🎉 Crawl finished! Total ${allSolutions.length} solutions extracted across ${progress.completedSubcategories} subcategories.`,
    type: 'success'
  });
  if (onProgress) onProgress({ ...progress });

  return { solutions: allSolutions, categories: allCategories };
}
