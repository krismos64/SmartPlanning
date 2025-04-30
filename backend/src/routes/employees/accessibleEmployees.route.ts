/**
 * Route pour obtenir les employés accessibles - SmartPlanning
 *
 * Permet de récupérer les employés accessibles selon le rôle de l'utilisateur:
 * - Admin: Tous les employés
 * - Directeur: Employés de son entreprise
 * - Manager: Employés de ses équipes
 * - Employé: Accès refusé (403)
 */

import { Response, Router } from "express";
import mongoose from "mongoose";
import {
  AuthRequest,
  authenticateToken,
} from "../../middlewares/auth.middleware";

// Création du routeur Express
const router = Router();

/**
 * @route   GET /api/employees/accessible
 * @desc    Récupère les employés accessibles selon le rôle de l'utilisateur
 * @access  Privé (admin, directeur, manager)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    // Normaliser le rôle pour gérer différentes variantes possibles
    const normalizedRole = user.role ? user.role.toLowerCase() : "";

    // Vérifier le rôle (en tenant compte des variantes possibles)
    const isEmployee =
      normalizedRole === "employé" ||
      normalizedRole === "employee" ||
      normalizedRole === "employe";

    const isAdmin =
      normalizedRole === "admin" || normalizedRole === "administrator";

    const isDirector =
      normalizedRole === "directeur" || normalizedRole === "director";

    const isManager =
      normalizedRole === "manager" || normalizedRole === "gestionnaire";

    // Vérifier si l'utilisateur est employé (accès refusé)
    if (isEmployee) {
      return res.status(403).json({
        success: false,
        message:
          "Accès refusé. Vous n'avez pas les droits nécessaires pour accéder à cette ressource.",
      });
    }

    // Log pour debug
    console.log("User role:", user.role);
    console.log("User normalized role:", normalizedRole);
    console.log("User companyId:", user.companyId);
    console.log("User teamIds:", user.teamIds);

    // Définir la requête en fonction du rôle
    let query = {};

    if (isAdmin) {
      // Admin: accès à tous les employés
      query = {};
      console.log("Admin query: All employees");
    } else if (isDirector && user.companyId) {
      // Directeur: accès aux employés de son entreprise
      query = { companyId: user.companyId };
      console.log("Director query: Company employees", query);
    } else if (isManager && user.teamIds && user.teamIds.length > 0) {
      // Manager: accès aux employés de ses équipes
      query = { teamId: { $in: user.teamIds } };
      console.log("Manager query: Team employees", query);
    } else {
      // Fallback: si le rôle n'est pas reconnu, retourner l'utilisateur lui-même
      console.log("Fallback: Returning user as employee");

      // Dans ce mode "fallback", pour permettre à l'application frontend de fonctionner,
      // nous renvoyons l'utilisateur lui-même comme seul employé accessible
      return res.status(200).json({
        success: true,
        data: [
          {
            _id: user._id,
            firstName: user.firstName || "Utilisateur",
            lastName: user.lastName || "Actuel",
          },
        ],
      });
    }

    // Récupérer les employés selon la requête
    const employees = await mongoose
      .model("Employee")
      .find(query)
      .select("_id firstName lastName")
      .sort({ lastName: 1 });

    // Si aucun employé trouvé, renvoyer au moins l'utilisateur actuel pour que l'interface reste fonctionnelle
    if (employees.length === 0) {
      console.log("No employees found, returning current user");
      return res.status(200).json({
        success: true,
        data: [
          {
            _id: user._id,
            firstName: user.firstName || "Utilisateur",
            lastName: user.lastName || "Actuel",
          },
        ],
      });
    }

    // Renvoyer les résultats
    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des employés accessibles:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des employés accessibles.",
    });
  }
});

export default router;
