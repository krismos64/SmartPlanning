import cors from "cors";
import express, { Application, Request, Response } from "express";

// Initialisation de l'application Express
const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de base pour vérifier que le serveur fonctionne
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "API SmartPlanning opérationnelle",
    status: "success",
  });
});

export default app;
