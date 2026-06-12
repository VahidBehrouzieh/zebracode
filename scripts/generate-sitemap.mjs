import { readFileSync, writeFileSync } from 'fs';

const tools = JSON.parse(readFileSync('./scripts/tools.json', 'utf-8'));
const BASE_URL = 'https://zebracode.ir';
const today = new Date().toISOString().split('T')[0];

const staticRoutes = [
    { path: '', lastmod: today, priority: 1.0 },
    { path: 'about', lastmod: today, priority: 0.8 },
    { path: 'feedback', lastmod: today, priority: 0.6 },
    { path: 'date-time', lastmod: today, priority: 0.9 },
];

const urls = [...staticRoutes, ...tools.map(t => ({ path: t.path, lastmod: t.lastmod, priority: 0.9 }))];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE_URL}/${u.path}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

writeFileSync('out/sitemap.xml', sitemap, 'utf8');
console.log(`✅ sitemap.xml generated with ${urls.length} URLs`);