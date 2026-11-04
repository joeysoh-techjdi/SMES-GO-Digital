import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { crawlAllCategories } from './src/crawler/engine.ts';
import { CrawlProgress, SolutionItem, CategoryInfo } from './src/crawler/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory state and disk sync
let currentProgress: CrawlProgress = {
  status: 'idle',
  completedSubcategories: 0,
  totalSubcategories: 26,
  totalSolutionsFound: 0,
  logs: []
};

let cachedData: {
  crawledAt: string;
  totalSolutions: number;
  categories: CategoryInfo[];
  solutions: SolutionItem[];
} = {
  crawledAt: '',
  totalSolutions: 0,
  categories: [],
  solutions: []
};

// Load initial data from disk if exists
const dataFilePath = path.join(__dirname, 'src/data/solutions.json');
try {
  if (fs.existsSync(dataFilePath)) {
    const raw = fs.readFileSync(dataFilePath, 'utf-8');
    cachedData = JSON.parse(raw);
    currentProgress.totalSolutionsFound = cachedData.totalSolutions;
    currentProgress.status = 'completed';
    currentProgress.logs = [
      {
        time: new Date(cachedData.crawledAt || Date.now()).toLocaleTimeString(),
        message: `Loaded ${cachedData.totalSolutions} solutions across 5 categories from repository cache.`,
        type: 'success'
      }
    ];
  }
} catch (e) {
  console.warn('Could not read cached data file:', e);
}

// API Routes
app.get('/api/data', (req, res) => {
  res.json({
    crawledAt: cachedData.crawledAt,
    totalSolutions: cachedData.solutions.length,
    categories: cachedData.categories,
    solutions: cachedData.solutions
  });
});

app.get('/api/crawl/progress', (req, res) => {
  res.json(currentProgress);
});

app.post('/api/crawl', async (req, res) => {
  if (currentProgress.status === 'running') {
    return res.status(409).json({ error: 'Crawl is already running in background' });
  }

  const selectedCategories: string[] | undefined = req.body?.categories;

  currentProgress = {
    status: 'running',
    completedSubcategories: 0,
    totalSubcategories: 0,
    totalSolutionsFound: 0,
    logs: [
      {
        time: new Date().toLocaleTimeString(),
        message: `Starting crawl job...`,
        type: 'info'
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  res.json({ message: 'Crawl triggered successfully', progress: currentProgress });

  // Run asynchronously
  (async () => {
    try {
      const { solutions, categories } = await crawlAllCategories((progress) => {
        currentProgress = progress;
      }, selectedCategories);

      cachedData = {
        crawledAt: new Date().toISOString(),
        totalSolutions: solutions.length,
        categories,
        solutions
      };

      // Persist to disk
      try {
        const dir = path.join(__dirname, 'src/data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataFilePath, JSON.stringify(cachedData, null, 2), 'utf-8');

        // Also update public CSV
        const publicDir = path.join(__dirname, 'public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
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
        fs.writeFileSync(path.join(publicDir, 'smes_digital_solutions.csv'), csvContent, 'utf-8');
      } catch (err) {
        console.error('Failed saving crawl output to disk:', err);
      }
    } catch (err: any) {
      currentProgress.status = 'error';
      currentProgress.logs.push({
        time: new Date().toLocaleTimeString(),
        message: `Fatal crawl error: ${err?.message || err}`,
        type: 'error'
      });
    }
  })();
});

// CSV Export route
app.get('/api/export/csv', (req, res) => {
  const categoryFilter = req.query.category as string | undefined;
  const subcategoryFilter = req.query.subcategory as string | undefined;
  const search = (req.query.search as string || '').toLowerCase();

  let filtered = cachedData.solutions;
  if (categoryFilter && categoryFilter !== 'all') {
    filtered = filtered.filter(s => s.category === categoryFilter);
  }
  if (subcategoryFilter && subcategoryFilter !== 'all') {
    filtered = filtered.filter(s => s.subcategory === subcategoryFilter);
  }
  if (search) {
    filtered = filtered.filter(s =>
      s.softwareName.toLowerCase().includes(search) ||
      s.company.toLowerCase().includes(search) ||
      s.features.toLowerCase().includes(search)
    );
  }

  const csvHeaders = ['Software Name', 'Company', 'Price', 'Features (Comma-separated)', 'Category', 'Subcategory', 'Official URL'];
  const csvRows = filtered.map(s => [
    `"${(s.softwareName || '').replace(/"/g, '""')}"`,
    `"${(s.company || '').replace(/"/g, '""')}"`,
    `"${(s.price || '').replace(/"/g, '""')}"`,
    `"${(s.features || '').replace(/"/g, '""')}"`,
    `"${(s.category || '').replace(/"/g, '""')}"`,
    `"${(s.subcategory || '').replace(/"/g, '""')}"`,
    `"${(s.sourceUrl || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="smes_digital_solutions.csv"');
  res.status(200).send(csvContent);
});

// JSON Export route
app.get('/api/export/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="smes_digital_solutions.json"');
  res.send(JSON.stringify(cachedData, null, 2));
});

// Standalone Python & Node code scripts export
app.get('/api/crawler-scripts', (req, res) => {
  try {
    const pythonScriptPath = path.join(__dirname, 'scripts/crawler.py');
    const pythonScript = fs.existsSync(pythonScriptPath) 
      ? fs.readFileSync(pythonScriptPath, 'utf-8') 
      : '# crawler.py script not found on server';
    res.json({ pythonScript });
  } catch (err) {
    res.status(500).json({ error: 'Failed reading crawler script' });
  }
});

// Serve frontend with Vite in dev, or static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Crawler Fullstack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
