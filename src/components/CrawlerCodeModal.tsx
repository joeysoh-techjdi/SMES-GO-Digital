import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, Cpu } from 'lucide-react';

interface CrawlerCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrawlerCodeModal: React.FC<CrawlerCodeModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'python' | 'node' | 'curl'>('python');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonCode = `#!/usr/bin/env python3
"""
IMDA SMEs Go Digital Essential Business Solutions Crawler (Zero-dependency Python 3 standard library)
Extracts software name, company, price, and features (comma separated text) across:
  - Sales & Marketing
  - Human Resource
  - Operations
  - Cybersecurity
  - Sustainability
"""

import urllib.request
import json
import csv
import time

BASE_URL = "https://smesgodigital.gov.sg"
DEFAULT_CSRF = "T6C+9iB49TLra4jEsMeSckDMNhQ="
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"

def post_json(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json; charset=UTF-8",
            "Accept": "application/json",
            "X-CSRFToken": DEFAULT_CSRF,
            "User-Agent": USER_AGENT
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_latest_version_token():
    try:
        req = urllib.request.Request(
            f"{BASE_URL}/web/moduleservices/moduleinfo",
            headers={"Accept": "application/json", "User-Agent": USER_AGENT}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("manifest", {}).get("versionToken", "r13sYz63BEDctBBs6oZsmQ")
    except Exception as e:
        print(f"Using default version token: {e}")
        return "r13sYz63BEDctBBs6oZsmQ"

def crawl_categories(version_token):
    url = f"{BASE_URL}/web/screenservices/web/MainFlow/EssentialBusinessSolutions/DataActionGetPageContentData"
    payload = {
        "versionInfo": {"moduleVersion": version_token, "apiVersion": "osEdm21bu7CAFEIJEa0BWw"},
        "viewName": "MainFlow.EssentialBusinessSolutions",
        "screenData": {"variables": {}}
    }
    res_data = post_json(url, payload)
    ba_raw = res_data["data"]["PageContent"]["BusinessArea"]
    ba = json.loads(ba_raw) if isinstance(ba_raw, str) else ba_raw
    return ba.get("items", [])

def crawl_solutions_for_subcat(cat_name, subcat, version_token):
    url = f"{BASE_URL}/web/screenservices/web/MainFlow/SolutionsByCategoryV3/DataActionGetData"
    ext_id = str(subcat.get("categoryextid", ""))
    target_url = subcat.get("targeturl", "")
    slug = target_url.replace(f"/web/category/{ext_id}/", "").strip("/")

    payload = {
        "versionInfo": {"moduleVersion": version_token, "apiVersion": "dQ53DX6kPHLB56XiWwxtHQ"},
        "viewName": "MainFlow.SolutionsByCategoryV3",
        "screenData": {
            "variables": {
                "StartIndex": 0,
                "PackagesListToCompare": {"List": []},
                "MaxRecords": 100,
                "SolutionsListToShow_3": {"List": []},
                "DataIsFetched": False,
                "SearchText": "",
                "CurrentSortBy": 1,
                "ReadyForGTMChecks": False,
                "FilteredList_2": {"List": []},
                "CurrentFiltersState": {
                    "FeaturesSelected": {"List": []},
                    "GrantsSelected": {"List": []},
                    "CategoriesSelected": {"List": []},
                    "MinPriceSelected": "0",
                    "MaxPriceSelected": "0"
                },
                "SortDropDownOptions": {"List": []},
                "ShowBusinessImpactText": False,
                "ShowLoginPopup": False,
                "SavedSolutionBeforeLogin": "",
                "categoryextid": ext_id,
                "_categoryextidInDataFetchStatus": 1,
                "categoryslug": slug,
                "_categoryslugInDataFetchStatus": 1,
                "feature": "", "_featureInDataFetchStatus": 1,
                "features": "", "_featuresInDataFetchStatus": 1,
                "grant": "", "_grantInDataFetchStatus": 1,
                "categories": "", "_categoriesInDataFetchStatus": 1,
                "min": "", "_minInDataFetchStatus": 1,
                "max": "", "_maxInDataFetchStatus": 1,
                "section": "", "_sectionInDataFetchStatus": 1,
                "GetSiteConfig": {
                    "AssetPath": "", "FullSiteName": "", "RootPath": "", "ServerDomainName": "", "ShortSiteName": ""
                }
            }
        }
    }
    data = post_json(url, payload)
    solutions_list = data.get("data", {}).get("SolutionsList", {}).get("List", [])

    items = []
    for sol in solutions_list:
        core = [f if isinstance(f, str) else f.get("Name", "") for f in sol.get("CoreFeatures", {}).get("List", [])]
        add = [f if isinstance(f, str) else f.get("Name", "") for f in sol.get("AdditionalFeatures", {}).get("List", [])]
        all_features = list(dict.fromkeys(core + add))
        features_csv = ", ".join(filter(None, all_features))

        price_num = float(sol.get("CurrentPrice", 0) or 0)
        price_str = f"SGD \${price_num:,.2f}" if price_num > 0 else "Pricing on Enquiry"

        items.append({
            "software_name": sol.get("TitleText", "").strip(),
            "company": sol.get("VendorText", "").strip(),
            "price": price_str,
            "features": features_csv,
            "category": cat_name,
            "subcategory": subcat.get("name", "").strip(),
            "url": f"{BASE_URL}{target_url}"
        })
    return items

def main():
    print("=" * 65)
    print("IMDA SMEs Go Digital Solutions Crawler (Python Standard Library)")
    print("=" * 65)
    token = get_latest_version_token()
    categories = crawl_categories(token)
    all_results = []

    for cat in categories:
        cat_name = cat.get("name")
        subcats = cat.get("categories", [])
        print(f"\\n📂 [{cat_name}] ({len(subcats)} subcategories)")
        for sub in subcats:
            sub_name = sub.get("name")
            print(f"  -> Scraping: {sub_name}...", end="", flush=True)
            try:
                sols = crawl_solutions_for_subcat(cat_name, sub, token)
                all_results.extend(sols)
                print(f" [{len(sols)} solutions]")
            except Exception as e:
                print(f" [ERROR: {e}]")
            time.sleep(0.1)

    print(f"\\nTotal {len(all_results)} digital solutions extracted.")

    out_csv = "smes_digital_solutions.csv"
    with open(out_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["software_name", "company", "price", "features", "category", "subcategory", "url"]
        )
        writer.writeheader()
        writer.writerows(all_results)
    print(f"Saved results to: {out_csv}")

if __name__ == "__main__":
    main()
`;

  const nodeCode = `// Run via: npm run crawl  OR  npx tsx scripts/crawl.ts
import fs from 'fs';
import path from 'path';
import { crawlAllCategories } from './src/crawler/engine.ts';

async function run() {
  console.log('Starting IMDA Solutions Crawler...');
  const { solutions } = await crawlAllCategories(progress => {
    const last = progress.logs[progress.logs.length - 1];
    if (last) console.log(last.message);
  });

  const csvHeaders = ['Software Name', 'Company', 'Price', 'Features (Comma-separated)', 'Category', 'Subcategory', 'Official URL'];
  const csvRows = solutions.map(s => [
    \`"\${(s.softwareName || '').replace(/"/g, '""')}"\`,
    \`"\${(s.company || '').replace(/"/g, '""')}"\`,
    \`"\${(s.price || '').replace(/"/g, '""')}"\`,
    \`"\${(s.features || '').replace(/"/g, '""')}"\`,
    \`"\${(s.category || '').replace(/"/g, '""')}"\`,
    \`"\${(s.subcategory || '').replace(/"/g, '""')}"\`,
    \`"\${(s.sourceUrl || '').replace(/"/g, '""')}"\`
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\\n');
  fs.writeFileSync('smes_digital_solutions.csv', csvContent, 'utf-8');
  console.log(\`Successfully saved \${solutions.length} solutions to smes_digital_solutions.csv\`);
}

run();
`;

  const curlCode = `# 1. Fetch categories & subcategories from IMDA OutSystems API
curl -X POST "https://smesgodigital.gov.sg/web/screenservices/web/MainFlow/EssentialBusinessSolutions/DataActionGetPageContentData" \\
  -H "Content-Type: application/json; charset=UTF-8" \\
  -H "Accept: application/json" \\
  -H "X-CSRFToken: T6C+9iB49TLra4jEsMeSckDMNhQ=" \\
  -d '{"versionInfo":{"moduleVersion":"r13sYz63BEDctBBs6oZsmQ","apiVersion":"osEdm21bu7CAFEIJEa0BWw"},"viewName":"MainFlow.EssentialBusinessSolutions","screenData":{"variables":{}}}'

# 2. Fetch Digital Solutions for CRM (CategoryExtId: 3)
curl -X POST "https://smesgodigital.gov.sg/web/screenservices/web/MainFlow/SolutionsByCategoryV3/DataActionGetData" \\
  -H "Content-Type: application/json; charset=UTF-8" \\
  -H "Accept: application/json" \\
  -H "X-CSRFToken: T6C+9iB49TLra4jEsMeSckDMNhQ=" \\
  -d '{
    "versionInfo":{"moduleVersion":"r13sYz63BEDctBBs6oZsmQ","apiVersion":"dQ53DX6kPHLB56XiWwxtHQ"},
    "viewName":"MainFlow.SolutionsByCategoryV3",
    "screenData":{
      "variables":{
        "StartIndex":0,
        "PackagesListToCompare":{"List":[]},
        "MaxRecords":100,
        "SolutionsListToShow_3":{"List":[]},
        "DataIsFetched":false,
        "SearchText":"",
        "CurrentSortBy":1,
        "ReadyForGTMChecks":false,
        "FilteredList_2":{"List":[]},
        "CurrentFiltersState":{"FeaturesSelected":{"List":[]},"GrantsSelected":{"List":[]},"CategoriesSelected":{"List":[]},"MinPriceSelected":"0","MaxPriceSelected":"0"},
        "SortDropDownOptions":{"List":[]},
        "ShowBusinessImpactText":false,
        "ShowLoginPopup":false,
        "SavedSolutionBeforeLogin":"",
        "categoryextid":"3",
        "_categoryextidInDataFetchStatus":1,
        "categoryslug":"customer-relationship-management--crm-",
        "_categoryslugInDataFetchStatus":1,
        "feature":"","_featureInDataFetchStatus":1,
        "features":"","_featuresInDataFetchStatus":1,
        "grant":"","_grantInDataFetchStatus":1,
        "categories":"","_categoriesInDataFetchStatus":1,
        "min":"","_minInDataFetchStatus":1,
        "max":"","_maxInDataFetchStatus":1,
        "section":"","_sectionInDataFetchStatus":1,
        "GetSiteConfig":{"AssetPath":"","FullSiteName":"","RootPath":"","ServerDomainName":"","ShortSiteName":""}
      }
    }
  }'
`;

  const activeContent = activeTab === 'python' ? pythonCode : activeTab === 'node' ? nodeCode : curlCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Standalone Crawler Scripts
              </h3>
              <p className="text-xs text-slate-400">
                Run directly in Terminal, Python 3, or Node.js environment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'python'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Python 3 (Zero Dependencies)
            </button>
            <button
              onClick={() => setActiveTab('node')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'node'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              TypeScript / Node.js
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'curl'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              cURL / REST Payload
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-y-auto font-mono text-xs leading-relaxed text-slate-300 bg-slate-900/90 select-all">
          <pre className="whitespace-pre overflow-x-auto">
            <code>{activeContent}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            Run in terminal:{' '}
            <code className="text-rose-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {activeTab === 'python' ? 'python3 scripts/crawler.py' : activeTab === 'node' ? 'npm run crawl' : 'sh scripts/test.sh'}
            </code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
