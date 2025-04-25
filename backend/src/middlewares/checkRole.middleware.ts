/**
 * Middleware de vérification de rôle
 *
 * Vérifie que l'utilisateur authentifié possède le rôle requis pour accéder à la ressource.
 * Doit être utilisé après le middleware d'authentification (authMiddleware).
 */

import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware";

/**
 * Crée un middleware qui vérifie si l'utilisateur a l'un des rôles requis
 *
 * @param roles - Les rôles autorisés pour accéder à la ressource (ex: ["admin", "manager"])
 * @returns Un middleware Express qui vérifie le rôle de l'utilisateur
 */
const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Vérifier si l'utilisateur est attaché à la requête
      if (!req.user) {
        res.status(401).json({
          message: "Utilisateur non authentifié",
        });
        return;
      }

      // Vérifier si l'utilisateur a l'un des rôles requis
      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          message: "Accès interdit – rôle insuffisant",
        });
        return;
      }

      // Si l'utilisateur a un rôle autorisé, passer au middleware suivant
      next();
    } catch (error) {
      console.error("Erreur lors de la vérification du rôle:", error);
      res.status(500).json({
        message: "Erreur serveur lors de la vérification des autorisations",
      });
    }
  };
};

export default checkRole;
