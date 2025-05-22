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
import authRoutes from "./routes/auth.routes";
import employeeRoutes from "./routes/employee.routes";
import accessibleEmployeesRoutes from "./routes/employees/accessibleEmployees.route";
import generatedSchedulesRoutes from "./routes/generatedSchedules.route";
import incidentsRoutes from "./routes/incidents.route";
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
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/companies", adminCompaniesRouter);
app.use("/api/admin/teams", adminTeamRoutes);
app.use("/api/admin/employees", adminEmployeesRoutes);
app.use("/api/employees/accessible", accessibleEmployeesRoutes);
app.use("/api/employees", employeeRoutes);
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

// Routes d'upload d'images utilisateur
app.use("/api/upload", uploadRoutes);

// Route par défaut
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "SmartPlanning API" });
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
