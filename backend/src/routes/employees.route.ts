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
    // 🔐 Vérification de l'authentification
    if (!req.user || !req.user._id) {
      console.log("[GET /employees] Utilisateur non authentifié");
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // 📋 Log de débogage détaillé
    console.log("----- DÉBUT DÉBOGAGE GET /EMPLOYEES -----");
    console.log(
      "[GET /employees] Utilisateur authentifié:",
      JSON.stringify(req.user, null, 2)
    );
    console.log(`[GET /employees] Rôle original: "${req.user.role}"`);

    // 🔄 Normalisation du rôle pour éviter les problèmes de casse
    const role = req.user.role?.toLowerCase();
    console.log(`[GET /employees] Rôle normalisé = "${role}"`);

    let employees = [];

    // 🎯 Filtrage par rôle
    switch (role) {
      case "admin":
        // Admin voit tous les employés
        console.log("[GET /employees] Filtrage pour admin: tous les employés");
        employees = await EmployeeModel.find({})
          .populate("userId", "email")
          .populate("teamId", "name")
          .lean();
        break;

      case "directeur":
        // Directeur voit tous les employés de son entreprise
        if (!req.user.companyId) {
          console.log(
            "[GET /employees] ERREUR: CompanyId manquant pour le directeur"
          );
          return res.status(400).json({
            success: false,
            message: "CompanyId manquant pour le directeur",
          });
        }

        console.log(
          `[GET /employees] Filtrage pour directeur: employés de l'entreprise ${req.user.companyId}`
        );
        employees = await EmployeeModel.find({ companyId: req.user.companyId })
          .populate("userId", "email")
          .populate("teamId", "name")
          .lean();
        break;

      case "manager":
        // Manager voit tous les employés des équipes qu'il gère
        // D'abord, récupérer les équipes gérées par le manager
        console.log(
          `[GET /employees] Filtrage pour manager: employés des équipes gérées par ${req.user._id}`
        );
        const managedTeams = await TeamModel.find(
          { managerIds: req.user._id },
          "_id"
        );
        const teamIds = managedTeams.map((team) => team._id);

        if (teamIds.length === 0) {
          console.log(
            "[GET /employees] Le manager ne gère aucune équipe, retournant un tableau vide"
          );
          return res.status(200).json({
            success: true,
            data: [],
          });
        }

        employees = await EmployeeModel.find({ teamId: { $in: teamIds } })
          .populate("userId", "email")
          .populate("teamId", "name")
          .lean();
        break;

      case "employé":
      case "employée":
      case "employe":
      case "employee":
        // Employé voit uniquement lui-même
        console.log(
          `[GET /employees] Filtrage pour employé: uniquement lui-même (${req.user._id})`
        );

        // Chercher d'abord par userId qui référence l'utilisateur connecté
        let employee = await EmployeeModel.findOne({ userId: req.user._id })
          .populate("userId", "email")
          .populate("teamId", "name")
          .lean();

        // Si non trouvé, essayer avec _id (si l'employé est directement connecté avec son ID d'employé)
        if (!employee) {
          employee = await EmployeeModel.findById(req.user._id)
            .populate("userId", "email")
            .populate("teamId", "name")
            .lean();
        }

        employees = employee ? [employee] : [];
        break;

      default:
        // Rôle non reconnu
        console.log(
          `[GET /employees] ERREUR: Rôle non reconnu ou non autorisé: ${role} (original: ${req.user.role})`
        );
        return res.status(403).json({
          success: false,
          message: "Rôle non autorisé",
        });
    }

    // 📊 Log du résultat
    console.log(
      `[GET /employees] ${employees.length} employés trouvés pour le rôle ${role}`
    );
    console.log("----- FIN DÉBOGAGE GET /EMPLOYEES -----");

    // ✅ Retour des données
    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    // ⚠️ Gestion des erreurs
    console.error("[GET /employees] Erreur:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des employés",
      error: error instanceof Error ? error.message : String(error),
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

      // 🔄 Normalisation du rôle pour la vérification
      const role = req.user.role?.toLowerCase();

      // 🔍 Restriction d'accès pour les directeurs (uniquement leur propre entreprise)
      if (role === "directeur" && req.user.companyId !== companyId) {
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
