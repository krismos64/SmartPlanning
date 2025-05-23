/**
 * Routes pour la gestion des employés
 *
 * Ce fichier contient les routes permettant :
 * - de récupérer les employés d'une équipe spécifique
 * - de récupérer les employés d'une entreprise spécifique (directeur/admin)
 */

import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import EmployeeModel from "../models/Employee.model";
import { TeamModel } from "../models/Team.model";

const router = Router();

/**
 * @route   GET /api/employees/team/:teamId
 * @desc    Récupère tous les employés d'une équipe spécifique
 * @access  Private
 */
router.get("/team/:teamId", async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    console.log(
      `[GET /employees/team/:teamId] Recherche des employés pour l'équipe: ${teamId}`
    );

    // Vérifier que l'ID d'équipe est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      console.log(
        `[GET /employees/team/:teamId] ID d'équipe invalide: ${teamId}`
      );
      return res.status(400).json({
        success: false,
        message: "ID d'équipe invalide",
      });
    }

    // Récupérer l'équipe pour vérifier son existence
    const team = await TeamModel.findById(teamId);
    if (!team) {
      console.log(
        `[GET /employees/team/:teamId] Équipe non trouvée: ${teamId}`
      );
      return res.status(404).json({
        success: false,
        message: "Équipe introuvable",
      });
    }

    console.log(`[GET /employees/team/:teamId] Équipe trouvée: ${team.name}`);

    // Utiliser la méthode statique pour récupérer les employés de l'équipe
    const employees = await EmployeeModel.find({ teamId })
      .populate("userId", "email")
      .lean();

    console.log(
      `[GET /employees/team/:teamId] ${employees.length} employés trouvés`
    );

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("[GET /employees/team/:teamId] Erreur:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des employés",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * @route   GET /api/employees/company/:companyId
 * @desc    Récupère tous les employés d'une entreprise spécifique
 * @access  Private - Directeur, Admin uniquement
 */
router.get(
  "/company/:companyId",
  authenticateToken,
  checkRole(["directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Vérification des paramètres
      const { companyId } = req.params;
      console.log(
        `[GET /employees/company/:companyId] Recherche des employés pour l'entreprise: ${companyId}`
      );

      // ✅ Validation de l'identifiant d'entreprise
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        console.log(
          `[GET /employees/company/:companyId] ID d'entreprise invalide: ${companyId}`
        );
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      // 🔍 Restriction d'accès pour les directeurs (uniquement leur propre entreprise)
      if (req.user.role === "directeur" && req.user.companyId !== companyId) {
        console.log(
          `[GET /employees/company/:companyId] Tentative d'accès non autorisé: le directeur (${req.user._id}) tente d'accéder à une autre entreprise (${companyId})`
        );
        return res.status(403).json({
          success: false,
          message:
            "Vous n'êtes pas autorisé à accéder aux employés de cette entreprise",
        });
      }

      // 🧠 Récupération des employés de l'entreprise
      // Utiliser la méthode statique pour récupérer les employés de l'entreprise
      const employees = await EmployeeModel.find({ companyId })
        .populate("userId", "email")
        .populate("teamId", "name")
        .lean();

      console.log(
        `[GET /employees/company/:companyId] ${employees.length} employés trouvés pour l'entreprise ${companyId}`
      );

      // ✅ Retour des données
      return res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (error) {
      // ⚠️ Gestion des erreurs
      console.error("[GET /employees/company/:companyId] Erreur:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des employés",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;
