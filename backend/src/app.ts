import cors from "cors";
import dotenv from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";
import session from "express-session";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import passport from "./config/passport";

// Routes
import authRoutes from "./routes/auth.routes";

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

// Configuration de la session (nécessaire pour Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "smartplanning-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 jour
    },
  })
);

// Initialisation de Passport
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);

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
