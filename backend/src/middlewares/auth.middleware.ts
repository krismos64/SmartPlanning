/**
 * Middleware d'authentification JWT
 *
 * Vérifie les tokens JWT dans l'en-tête Authorization et attache les informations
 * de l'utilisateur décodé à l'objet request pour les middlewares/routes suivants.
 * Renvoie une erreur 401 si le token est invalide ou absent.
 */

import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

// Charger les variables d'environnement
dotenv.config();

/**
 * Extension de l'interface Request d'Express pour inclure l'utilisateur authentifié
 */
export interface AuthRequest extends Request {
  user?: any; // L'utilisateur décodé à partir du token JWT
}

/**
 * Middleware d'authentification qui vérifie le token JWT
 * - Extrait le token de l'en-tête Authorization
 * - Vérifie sa validité avec JWT_SECRET
 * - Ajoute les informations utilisateur décodées à l'objet request
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    const user = (decoded as any).user;

    // Normaliser l'ID utilisateur: transformer id en _id pour la cohérence
    if (user && user.id) {
      user._id = user.id;
      delete user.id;
    }

    req.user = user;

    // Log pour debug rapide
    console.log("User authentifié:", req.user);

    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: "Token invalide ou expiré" });
  }
}

export default authenticateToken;
