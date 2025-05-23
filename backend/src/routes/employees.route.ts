/**
 * Routes pour la gestion des employés
 *
 * Ce fichier contient les routes permettant :
 * - de récupérer tous les employés (selon le rôle de l'utilisateur)
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
 * @route   GET /api/employees
 * @desc    Récupère les employés selon le rôle de l'utilisateur connecté
 * @access  Private - Tous les rôles (filtrage dynamique des résultats)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "manager" &&
        req.user.role !== "admin" &&
        req.user.role !== "directeur")
    ) {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    const role = req.user.role.toLowerCase();
    let employees;

    if (role === "admin") {
      employees = await EmployeeModel.find(
        { status: "actif" },
        "_id firstName lastName email status teamId companyId contractHoursPerWeek photoUrl userId"
      )
        .populate("teamId", "name")
        .sort({ lastName: 1, firstName: 1 })
        .lean();
    } else if (role === "directeur") {
      // Le directeur n'a accès qu'aux employés de son entreprise
      if (!req.user.companyId) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise manquant pour le directeur",
        });
      }

      employees = await EmployeeModel.find(
        { companyId: req.user.companyId, status: "actif" },
        "_id firstName lastName email status teamId companyId contractHoursPerWeek photoUrl userId"
      )
        .populate("teamId", "name")
        .sort({ lastName: 1, firstName: 1 })
        .lean();
    } else {
      // Le manager n'a accès qu'aux employés de ses équipes
      const managerTeams = await TeamModel.find(
        { managerIds: req.user._id },
        "_id name"
      ).lean();

      console.log("🔍 Manager ID:", req.user._id);
      console.log("🔍 Équipes trouvées pour le manager:", managerTeams);

      const teamIds = managerTeams.map((team) => team._id);
      console.log("🔍 IDs des équipes:", teamIds);

      employees = await EmployeeModel.find(
        { teamId: { $in: teamIds }, status: "actif" },
        "_id firstName lastName email status teamId companyId contractHoursPerWeek photoUrl userId role"
      )
        .populate("teamId", "name managerIds")
        .populate("userId", "email role")
        .sort({ lastName: 1, firstName: 1 })
        .lean();

      console.log(
        "🔍 Employés trouvés avant enrichissement:",
        employees.length
      );

      // Enrichir les données avec l'email depuis userId et le nom du manager
      employees = employees.map((emp: any) => {
        const team = managerTeams.find(
          (t) => t._id.toString() === emp.teamId?._id?.toString()
        );
        return {
          ...emp,
          email: emp.email || emp.userId?.email,
          role: emp.role || emp.userId?.role || "employee",
          teamName: emp.teamId?.name,
          managerName: "Manager", // Pour l'instant, on peut améliorer cela plus tard
        };
      });

      console.log("🔍 Employés après enrichissement:", employees.length);
      console.log("🔍 Premier employé:", employees[0]);
    }

    // Conversion du champ userId en string pour assurer la cohérence dans la réponse API
    const formattedEmployees = employees.map((emp) => ({
      ...emp,
      userId: emp.userId?.toString() || null,
    }));

    return res.status(200).json({ success: true, data: formattedEmployees });
  } catch (error) {
    console.error("Erreur lors de la récupération des employés:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des employés",
    });
  }
});

/**
 * @route   GET /api/employees/team/:teamId
 * @desc    Récupère tous les employés d'une équipe spécifique
 * @access  Private
 */
router.get("/team/:teamId", async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    // Vérifier que l'ID d'équipe est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: "ID d'équipe invalide",
      });
    }

    // Récupérer l'équipe pour vérifier son existence
    const team = await TeamModel.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Équipe introuvable",
      });
    }

    // Utiliser la méthode statique pour récupérer les employés de l'équipe
    const employees = await EmployeeModel.find({ teamId })
      .populate("userId", "email")
      .lean();

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des employés:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des employés",
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
      const { companyId } = req.params;

      // Validation de l'identifiant d'entreprise
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      // Normalisation du rôle pour la vérification
      const role = req.user.role?.toLowerCase();

      // Restriction d'accès pour les directeurs (uniquement leur propre entreprise)
      if (role === "directeur" && req.user.companyId !== companyId) {
        return res.status(403).json({
          success: false,
          message:
            "Vous n'êtes pas autorisé à accéder aux employés de cette entreprise",
        });
      }

      // Récupération des employés de l'entreprise
      const employees = await EmployeeModel.find({ companyId })
        .populate("userId", "email")
        .populate("teamId", "name")
        .lean();

      return res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des employés:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des employés",
      });
    }
  }
);

export default router;
