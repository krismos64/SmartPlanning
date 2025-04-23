import cors from "cors";
import dotenv from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { adminCompaniesRouter } from "./routes/admin/companies.route";
import adminUsersRoutes from "./routes/admin/users.route";

// Routes
import authRoutes from "./routes/auth.routes";
import collaboratorRoutes from "./routes/collaborator.routes";

// Load env variables
dotenv.config();

// Initialize Express
const app: Express = express();

// Connection à MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smartplanning")
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);
  });

// Middlewares
app.use(morgan("dev")); // Logging
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
); // CORS
app.use(helmet()); // Sécurité
app.use(express.json()); // Body parser pour JSON
app.use(express.urlencoded({ extended: true })); // Body parser pour URL-encoded

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/companies", adminCompaniesRouter);
app.use("/api/collaborators", collaboratorRoutes);

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

// Export de l'app
export default app;
