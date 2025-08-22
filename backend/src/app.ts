import compression from "compression";
import cors from "cors";
const cookieParser = require("cookie-parser");
import dotenv from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { metricsMiddleware } from "./monitoring/metrics";
import { initSentry, sentryRequestHandler } from "./config/sentry.config";

import adminTeamRoutes from "./routes/admin/adminTeam.routes";
import { adminCompaniesRouter } from "./routes/admin/companies.route";
import adminEmployeesRoutes from "./routes/admin/employees";
import adminUsersRoutes from "./routes/admin/users.route";
// Import des middlewares de sécurité
import { authenticateToken } from "./middlewares/auth.middleware";
import checkRole from "./middlewares/checkRole.middleware";
import aiRoutes from "./routes/ai.routes";
import authRoutes from "./routes/auth.routes";
import companiesRoutes from "./routes/companies.route";
import contactRoutes from "./routes/contact.routes";
import employeeRoutes from "./routes/employee.routes";
import employeesByCompanyRoutes from "./routes/employees.route";
import accessibleEmployeesRoutes from "./routes/employees/accessibleEmployees.route";
import autoGenerateRoutes from "./routes/autoGenerate.route";
import generatedSchedulesRoutes from "./routes/generatedSchedules.route";
import incidentsRoutes from "./routes/incidents.route";
import publicRoutes from "./routes/index";
import sitemapRoutes from "./routes/sitemap.routes";
import passwordRoutes from "./routes/password.routes";
import profileRoutes from "./routes/profile.routes";
import statsRoutes from "./routes/stats.routes";
import tasksRoutes from "./routes/tasks.routes";
import teamRoutes from "./routes/teams.route";
import { uploadRoutes } from "./routes/upload.routes";
import usersRoutes from "./routes/users.routes";
import vacationRoutes from "./routes/vacations.routes";
import weeklySchedulesRouter from "./routes/weeklySchedules.route";
import monitoringRoutes from "./routes/monitoring.routes";
import performanceRoutes from "./routes/performance.routes";
import sentryMonitoringRoutes from "./routes/monitoring-sentry.routes";
import { securityConfig, applySecurityHeaders } from "./config/security.config";
// Charger les variables d'environnement
dotenv.config();

// Initialiser Sentry en premier (production uniquement)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  initSentry();
}

// Initialisation de l'application
const app: Express = express();

// Connexion à MongoDB (seulement si pas en mode test)
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smartplanning")
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => {
      console.error("❌ Error connecting to MongoDB:", err);
      process.exit(1);
    });
}

// Middlewares
app.use(morgan("dev"));

// Headers de sécurité supplémentaires (FIX #2: Validation headers HTTP)
app.use(applySecurityHeaders);

// 📊 Monitoring et métriques
app.use(metricsMiddleware);

// 🗜️ Compression pour améliorer les performances
app.use(compression({
  // Compresser seulement les réponses > 1KB
  threshold: 1024,
  // Niveau de compression (1-9, 6 par défaut)
  level: 6,
  // Types MIME à compresser
  filter: (req, res) => {
    // Ne pas compresser les réponses avec un en-tête 'no-transform'
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Compresser par défaut selon les types MIME
    return compression.filter(req, res);
  }
}));

// 🔒 Rate limiting pour prévenir les attaques par déni de service
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 100, // Plus permissif en développement
  message: {
    success: false,
    message: "Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes"
  },
  standardHeaders: true, // Inclure les headers `RateLimit-*`
  legacyHeaders: false, // Désactiver les headers `X-RateLimit-*`
  skip: (req) => {
    // Exemptions pour les tests et certaines routes
    if (process.env.NODE_ENV === 'test') return true;
    if (process.env.NODE_ENV === 'development') {
      // En développement, exemptions pour les routes d'auth fréquentes
      if (req.url?.startsWith('/api/health')) return true;
      if (req.url?.startsWith('/api/auth/me')) return true;
      if (req.url?.includes('localhost')) return true;
    }
    if (req.url?.startsWith('/api/health')) return true;
    return false;
  }
});

// Appliquer le rate limiting à toutes les routes API
app.use('/api/', limiter);

// 📦 Cache Control pour optimiser les performances
app.use((req, res, next) => {
  // Cache statique pour les assets
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 an
    res.setHeader('Expires', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString());
  } 
  // Cache court pour les API publiques (sitemap, health check)
  else if (req.url.match(/\/(sitemap|health|public)/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 heure
  }
  // Pas de cache pour les API privées
  else if (req.url.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  // Cache par défaut pour les autres ressources
  else {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 heure
  }
  
  next();
});

// 🔒 Configuration CORS sécurisée selon l'environnement
const corsConfig = {
  // 🌐 Origine autorisée selon l'environnement
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Liste des origines autorisées selon l'environnement
    const allowedOrigins: string[] = [];

    if (process.env.NODE_ENV === "development") {
      // 🚧 Développement : autoriser localhost
      allowedOrigins.push("http://localhost:5173");
      console.log(
        "🔧 Mode développement : autorisation CORS pour localhost:5173"
      );
    } else if (process.env.NODE_ENV === "production") {
      // 🏭 Production : autoriser uniquement le domaine officiel
      allowedOrigins.push("https://smartplanning.fr");
      console.log(
        "🚀 Mode production : autorisation CORS pour smartplanning.fr uniquement"
      );
    } else {
      // 🔍 Autres environnements (test, staging...) : utiliser la variable d'environnement
      const envOrigin = process.env.FRONTEND_URL;
      if (envOrigin) {
        allowedOrigins.push(envOrigin);
        console.log(
          `🔧 Mode ${process.env.NODE_ENV}: autorisation CORS pour ${envOrigin}`
        );
      }
    }

    // Autoriser les requêtes sans origine (ex: Postman, apps mobiles)
    if (!origin) return callback(null, true);

    // Vérifier si l'origine est autorisée
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS bloqué pour l'origine: ${origin}`);
      callback(new Error("Non autorisé par la politique CORS"), false);
    }
  },

  // 🔑 Headers autorisés pour toutes les requêtes
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],

  // 🛠️ Méthodes HTTP autorisées
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],

  // 🍪 Autoriser l'envoi de cookies/credentials
  credentials: true,

  // ⚡ Cache preflight pendant 24h pour optimiser les performances
  maxAge: 86400,
};

// 🌐 Configuration CORS sécurisée (FIX: CORS renforcé)
app.use(cors(securityConfig.corsOptions));
app.use(helmet());
app.use(cookieParser());
// Middleware de base avec limites de sécurité (FIX #3: Protection DoS)
app.use(express.json({ limit: securityConfig.payloadLimits.json }));
app.use(express.urlencoded({ extended: true, limit: securityConfig.payloadLimits.urlencoded }));
app.use(express.raw({ limit: securityConfig.payloadLimits.raw }));

// Routes publiques (SEO)
app.use("/api", publicRoutes);
app.use("/api", sitemapRoutes);

// Routes
app.use("/api/auth", authRoutes);

// Protection globale pour toutes les routes admin
app.use("/api/admin/*", authenticateToken, checkRole(["admin"]));

// Routes protégées par authentification (toutes sauf auth et contact)
app.use("/api/ai", authenticateToken, aiRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/companies", adminCompaniesRouter);
app.use("/api/admin/teams", adminTeamRoutes);
app.use("/api/admin/employees", adminEmployeesRoutes);
app.use("/api/companies", authenticateToken, companiesRoutes);
app.use("/api/employees/accessible", authenticateToken, accessibleEmployeesRoutes);
app.use("/api/employees", authenticateToken, employeeRoutes);
app.use("/api/employees", authenticateToken, employeesByCompanyRoutes);
app.use("/api/generated-schedules", authenticateToken, generatedSchedulesRoutes);
app.use("/api/schedules", authenticateToken, autoGenerateRoutes);
app.use("/api/incidents", authenticateToken, incidentsRoutes);
app.use("/api/profile", authenticateToken, profileRoutes);
app.use("/api/profile", authenticateToken, passwordRoutes);
app.use("/api/teams", authenticateToken, teamRoutes);
app.use("/api/users", authenticateToken, usersRoutes);
app.use("/api/vacations", authenticateToken, vacationRoutes);
app.use("/api/weekly-schedules", authenticateToken, weeklySchedulesRouter);
app.use("/api/tasks", authenticateToken, tasksRoutes);
app.use("/api/stats", authenticateToken, statsRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/monitoring/sentry", sentryMonitoringRoutes);

// Routes de performance et analytics
app.use("/api/performance", performanceRoutes);

// Routes publiques
app.use("/api/contact", contactRoutes);

// Routes d'upload d'images utilisateur (protégées)
app.use("/api/upload", authenticateToken, uploadRoutes);

// Routes Stripe (paiements et abonnements)
import stripeRoutes from "./routes/stripe.routes";
app.use("/api/stripe", stripeRoutes);

// Route par défaut
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "SmartPlanning API" });
});

// Health check pour Render
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Gestion des erreurs 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// Handler Sentry pour erreurs Express (production)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  app.use(sentryRequestHandler);
}

// Gestion des erreurs globales
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Erreur serveur:", err);
  
  // Ne pas exposer les détails d'erreur en production
  const message = process.env.NODE_ENV === 'production' 
    ? "Erreur serveur interne" 
    : err.message;
    
  res.status(500).json({ 
    message: "Erreur serveur", 
    error: message,
    timestamp: new Date().toISOString()
  });
});

export default app;
