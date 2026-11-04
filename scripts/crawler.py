#!/usr/bin/env python3
"""
IMDA SMEs Go Digital Essential Business Solutions Crawler (Zero-dependency Python 3 standard library)
Extracts all digital solutions across:
  - Sales & Marketing
  - Human Resource
  - Operations
  - Cybersecurity
  - Sustainability

Extracts:
  - Software Name
  - Company (Vendor)
  - Price (SGD)
  - Features (Comma-separated text)
  - Category & Subcategory
  - Link to digital solution
"""

import urllib.request
import urllib.error
import json
import csv
import time

BASE_URL = "https://smesgodigital.gov.sg"
DEFAULT_CSRF = "T6C+9iB49TLra4jEsMeSckDMNhQ="
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"

def post_json(url, payload, csrf=DEFAULT_CSRF):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json; charset=UTF-8",
            "Accept": "application/json",
            "X-CSRFToken": csrf,
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
        price_str = f"SGD ${price_num:,.2f}" if price_num > 0 else "Pricing on Enquiry"

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
    print("  IMDA SMEs Go Digital Solutions Crawler (Python Standard Library)")
    print("=" * 65)
    token = get_latest_version_token()
    print(f"Dynamic Version Token: {token}")
    categories = crawl_categories(token)
    all_results = []

    for cat in categories:
        cat_name = cat.get("name")
        subcats = cat.get("categories", [])
        print(f"\n📂 [{cat_name}] ({len(subcats)} subcategories)")
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

    print("\n" + "=" * 65)
    print(f"✓ Completed crawl! Total {len(all_results)} digital solutions extracted.")
    print("=" * 65)

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
