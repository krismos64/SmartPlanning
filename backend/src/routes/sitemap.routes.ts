import { Request, Response, Router } from 'express';

const router = Router();

/**
 * Interface pour une URL de sitemap
 */
interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Génère le sitemap XML pour l'application SmartPlanning
 */
router.get('/sitemap.xml', (req: Request, res: Response) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://smartplanning.fr' 
    : 'http://localhost:5173';

  const urls: SitemapUrl[] = [
    // Pages principales
    {
      loc: `${baseUrl}/`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      loc: `${baseUrl}/login`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/register`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.8
    },
    // Pages publiques SEO
    {
      loc: `${baseUrl}/fonctionnalites`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/tarifs`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/mentions-legales`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: 0.3
    },
    {
      loc: `${baseUrl}/politique-confidentialite`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: 0.3
    }
  ];

  // Génération du XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.set({
    'Content-Type': 'application/xml',
    'Cache-Control': 'public, max-age=86400', // Cache 24h
  });

  res.send(sitemap);
});

/**
 * Robots.txt pour indiquer le sitemap aux moteurs de recherche
 */
router.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://smartplanning.onrender.com' 
    : 'http://localhost:5050';

  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/

Sitemap: ${baseUrl}/api/sitemap.xml`;

  res.set({
    'Content-Type': 'text/plain',
    'Cache-Control': 'public, max-age=86400', // Cache 24h
  });

  res.send(robots);
});

export default router;