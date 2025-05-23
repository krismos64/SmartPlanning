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
 * @param roles - Les rôles autorisés pour accéder à la ressource (ex: ["admin", "manager"] ou "admin" ou "*" pour tous les utilisateurs authentifiés)
 * @returns Un middleware Express qui vérifie le rôle de l'utilisateur
 */
const checkRole = (roles: string | string[]) => {
  // Convertir le paramètre en tableau s'il ne l'est pas déjà
  const roleArray = Array.isArray(roles) ? roles : [roles];

  // Option spéciale "*" pour autoriser tous les utilisateurs authentifiés
  const allowAnyAuthenticatedUser = roleArray.includes("*");

  // Conversion des rôles autorisés en minuscules pour comparaison insensible à la casse
  const normalizedRoles = roleArray.map((role) => role.toLowerCase());

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Vérifier si l'utilisateur est attaché à la requête
      if (!req.user) {
        console.log("[checkRole] Aucun utilisateur authentifié trouvé");
        res.status(401).json({
          message: "Utilisateur non authentifié",
        });
        return;
      }

      // Si "*" est spécifié, autoriser tous les utilisateurs authentifiés
      if (allowAnyAuthenticatedUser) {
        console.log(
          "[checkRole] Autorisation accordée à tous les utilisateurs authentifiés"
        );
        next();
        return;
      }

      // Normaliser le rôle de l'utilisateur en minuscules
      const userRole = req.user.role?.toLowerCase();

      console.log(
        `[checkRole] Rôle utilisateur: "${req.user.role}" (normalisé: "${userRole}")`
      );
      console.log(
        `[checkRole] Rôles autorisés: ${JSON.stringify(
          roleArray
        )} (normalisés: ${JSON.stringify(normalizedRoles)})`
      );

      // Vérifier si l'utilisateur a un rôle défini
      if (!userRole) {
        console.log("[checkRole] L'utilisateur n'a pas de rôle défini");
        res.status(403).json({
          message: "Accès interdit – rôle non défini",
        });
        return;
      }

      // Vérifier si l'utilisateur a l'un des rôles requis
      if (!normalizedRoles.includes(userRole)) {
        console.log(
          `[checkRole] Rôle "${userRole}" non autorisé pour cette route`
        );
        res.status(403).json({
          message: "Accès interdit – rôle insuffisant",
        });
        return;
      }

      // Si l'utilisateur a un rôle autorisé, passer au middleware suivant
      console.log(
        `[checkRole] Accès autorisé pour l'utilisateur avec le rôle "${userRole}"`
      );
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
