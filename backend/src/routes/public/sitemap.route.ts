import express, { Request, Response, Router } from "express";

const router: Router = express.Router();

/**
 * Génère le contenu XML du sitemap avec toutes les pages publiques
 * @returns {string} Sitemap XML formaté
 */
function generateSitemap(): string {
  const baseUrl = "https://smartplanning.fr";
  const currentDate = new Date().toISOString().split("T")[0];

  // Pages publiques principales avec leurs priorités
  const pages = [
    { path: "/", priority: "0.8" },
    { path: "/contact", priority: "0.5" },
    { path: "/login", priority: "0.5" },
    { path: "/register", priority: "0.5" },
    { path: "/conditions", priority: "0.5" },
    { path: "/mentions-legales", priority: "0.5" },
  ];

  // Génération du XML
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  pages.forEach((page) => {
    sitemap += `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  sitemap += `
</urlset>`;

  return sitemap;
}

/**
 * Route GET /sitemap.xml
 * Retourne le sitemap XML dynamique pour le SEO
 */
router.get("/sitemap.xml", (req: Request, res: Response): void => {
  try {
    // Headers XML appropriés
    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=86400"); // Cache 24h

    // Génération et envoi du sitemap
    const xmlContent = generateSitemap();
    res.status(200).send(xmlContent);
  } catch (error) {
    console.error("Erreur lors de la génération du sitemap:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

export default router;
