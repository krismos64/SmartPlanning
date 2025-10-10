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
  user?: any;
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
  // Chercher le token dans les cookies d'abord, puis dans les headers (pour compatibilité)
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers["authorization"];
  const headerToken = authHeader?.split(" ")[1];
  
  const token = cookieToken || headerToken;

  // Debug: logguer les informations de token pour diagnostic
  console.log("🔍 DEBUG Auth Middleware - Token info:", {
    url: req.url,
    method: req.method,
    hasCookieToken: !!cookieToken,
    hasHeaderToken: !!headerToken,
    cookieTokenLength: cookieToken?.length,
    headerTokenLength: headerToken?.length,
    allCookies: req.cookies,
    hasTokenInCookies: !!req.cookies?.token
  });

  if (!token) {
    console.log("❌ Token manquant pour:", req.url);
    return res.status(401).json({ success: false, message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const user = decoded.user;

    req.user = user;

    // Debug: logguer les informations utilisateur
    console.log("✅ DEBUG Auth Middleware - Utilisateur authentifié:", {
      url: req.url,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role
    });

    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.log("❌ Token invalide ou expiré pour:", req.url, errorMessage);
    return res
      .status(401)
      .json({ success: false, message: "Token invalide ou expiré" });
  }
}

export default authenticateToken;
