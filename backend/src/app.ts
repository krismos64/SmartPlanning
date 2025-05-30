import cors from "cors";
import dotenv from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";

import adminTeamRoutes from "./routes/admin/adminTeam.routes";
import { adminCompaniesRouter } from "./routes/admin/companies.route";
import adminEmployeesRoutes from "./routes/admin/employees";
import adminUsersRoutes from "./routes/admin/users.route";
import aiRoutes from "./routes/ai.routes";
import authRoutes from "./routes/auth.routes";
import companiesRoutes from "./routes/companies.route";
import contactRoutes from "./routes/contact.routes";
import employeeRoutes from "./routes/employee.routes";
import employeesByCompanyRoutes from "./routes/employees.route";
import accessibleEmployeesRoutes from "./routes/employees/accessibleEmployees.route";
import generatedSchedulesRoutes from "./routes/generatedSchedules.route";
import incidentsRoutes from "./routes/incidents.route";
import publicRoutes from "./routes/index";
import passwordRoutes from "./routes/password.routes";
import profileRoutes from "./routes/profile.routes";
import statsRoutes from "./routes/stats.routes";
import tasksRoutes from "./routes/tasks.routes";
import teamRoutes from "./routes/teams.route";
import { uploadRoutes } from "./routes/upload.routes";
import usersRoutes from "./routes/users.routes";
import vacationRoutes from "./routes/vacations.routes";
import weeklySchedulesRouter from "./routes/weeklySchedules.route";
// Charger les variables d'environnement
dotenv.config();

// Initialisation de l'application
const app: Express = express();

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smartplanning")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);
  });

// Middlewares
app.use(morgan("dev"));

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

app.use(cors(corsConfig));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes publiques (SEO)
app.use("/api", publicRoutes);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/companies", adminCompaniesRouter);
app.use("/api/admin/teams", adminTeamRoutes);
app.use("/api/admin/employees", adminEmployeesRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/employees/accessible", accessibleEmployeesRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/employees", employeesByCompanyRoutes);
app.use("/api/generated-schedules", generatedSchedulesRoutes);
app.use("/api/incidents", incidentsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/profile", passwordRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/vacations", vacationRoutes);
app.use("/api/weekly-schedules", weeklySchedulesRouter);
app.use("/api/tasks", tasksRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/contact", contactRoutes);

// Routes d'upload d'images utilisateur
app.use("/api/upload", uploadRoutes);

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

// Gestion des erreurs globales
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Erreur serveur:", err);
  res.status(500).json({ message: "Erreur serveur", error: err.message });
});

export default app;
