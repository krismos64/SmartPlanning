import express, { Router } from "express";
import sitemapRoutes from "./public/sitemap.route";

const router: Router = express.Router();

// Routes publiques (SEO)
router.use("/", sitemapRoutes);

export default router;
