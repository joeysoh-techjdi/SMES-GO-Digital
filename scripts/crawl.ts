import fs from 'fs';
import path from 'path';
import { crawlAllCategories } from '../src/crawler/engine.ts';

async function main() {
  console.log('====================================================');
  console.log('🚀 Starting IMDA SMEs Go Digital Solutions Crawler');
  console.log('====================================================');

  const startTime = Date.now();
  const { solutions, categories } = await crawlAllCategories(progress => {
    const lastLog = progress.logs[progress.logs.length - 1];
    if (lastLog) {
      console.log(`[${lastLog.time}] ${lastLog.message}`);
    }
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('----------------------------------------------------');
  console.log(`✅ Crawl completed in ${durationSec}s. Total Solutions: ${solutions.length}`);

  // Ensure directories exist
  const dataDir = path.resolve(process.cwd(), 'src/data');
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  // Save JSON
  const jsonPath = path.join(dataDir, 'solutions.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    crawledAt: new Date().toISOString(),
    totalSolutions: solutions.length,
    categories,
    solutions
  }, null, 2), 'utf-8');
  console.log(`📁 Saved JSON to: ${jsonPath}`);

  // Generate CSV with exact requested columns: software name, company, price, features as comma separated text
  const csvHeaders = ['Software Name', 'Company', 'Price', 'Features (Comma-separated)', 'Category', 'Subcategory', 'Official URL'];
  const csvRows = solutions.map(s => [
    `"${(s.softwareName || '').replace(/"/g, '""')}"`,
    `"${(s.company || '').replace(/"/g, '""')}"`,
    `"${(s.price || '').replace(/"/g, '""')}"`,
    `"${(s.features || '').replace(/"/g, '""')}"`,
    `"${(s.category || '').replace(/"/g, '""')}"`,
    `"${(s.subcategory || '').replace(/"/g, '""')}"`,
    `"${(s.sourceUrl || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n');
  const csvPath = path.join(publicDir, 'smes_digital_solutions.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  console.log(`📄 Saved CSV to: ${csvPath}`);

  // Print a summary table in terminal of the first 10 solutions
  console.log('\nPreview of first 5 solutions:');
  console.table(solutions.slice(0, 5).map(s => ({
    Software: s.softwareName.slice(0, 25),
    Company: s.company.slice(0, 25),
    Price: s.price,
    Category: s.category,
    Subcategory: s.subcategory.slice(0, 25),
    FeaturesCount: (s.coreFeatures.length + s.additionalFeatures.length)
  })));
}

main().catch(err => {
  console.error('Crawler failed:', err);
  process.exit(1);
});
