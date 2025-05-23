/**
 * Routes pour la gestion des équipes
 *
 * Ce fichier contient les routes permettant :
 * - de récupérer les équipes d'un manager
 * - de créer une équipe
 * - de mettre à jour une équipe
 * - de supprimer une équipe
 * - de récupérer une équipe par ID
 * - de récupérer les équipes d'une entreprise (directeur/admin)
 */

import express, { Response } from "express";
import mongoose from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import { TeamModel } from "../models/Team.model";

const router = express.Router();

/**
 * @route   GET /api/teams
 * @desc    Récupérer toutes les équipes dont l'utilisateur est manager
 * @access  Private
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié ou identification invalide",
      });
    }

    const teams = await TeamModel.find({ managerIds: req.user._id })
      .populate("managerIds", "firstName lastName email photoUrl")
      .populate("employeeIds", "firstName lastName email photoUrl");

    return res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des équipes:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des équipes",
      error: (error as Error).message,
    });
  }
});

/**
 * @route   GET /api/teams/company/:companyId
 * @desc    Récupérer toutes les équipes d'une entreprise spécifique
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
        `[GET /teams/company/:companyId] Recherche des équipes pour l'entreprise: ${companyId}`
      );

      // ✅ Validation de l'identifiant d'entreprise
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        console.log(
          `[GET /teams/company/:companyId] ID d'entreprise invalide: ${companyId}`
        );
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      // 🔍 Restriction d'accès pour les directeurs (uniquement leur propre entreprise)
      if (req.user.role === "directeur" && req.user.companyId !== companyId) {
        console.log(
          `[GET /teams/company/:companyId] Tentative d'accès non autorisé: le directeur (${req.user._id}) tente d'accéder à une autre entreprise (${companyId})`
        );
        return res.status(403).json({
          success: false,
          message:
            "Vous n'êtes pas autorisé à accéder aux équipes de cette entreprise",
        });
      }

      // 🧠 Récupération des équipes de l'entreprise
      const teams = await TeamModel.find({ companyId })
        .populate("managerIds", "firstName lastName email photoUrl")
        .populate("employeeIds", "firstName lastName email photoUrl")
        .lean();

      console.log(
        `[GET /teams/company/:companyId] ${teams.length} équipes trouvées pour l'entreprise ${companyId}`
      );

      // ✅ Retour des données
      return res.status(200).json({
        success: true,
        data: teams,
      });
    } catch (error) {
      // ⚠️ Gestion des erreurs
      console.error("[GET /teams/company/:companyId] Erreur:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des équipes",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * @route   POST /api/teams
 * @desc    Créer une nouvelle équipe pour le manager connecté
 * @access  Private
 */
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, companyId } = req.body;

  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: "Utilisateur non authentifié",
    });
  }

  if (!name || !companyId) {
    return res.status(400).json({
      success: false,
      message: "Le nom et l'identifiant de l'entreprise sont requis",
    });
  }

  try {
    const newTeam = await TeamModel.create({
      name,
      companyId,
      managerIds: [req.user._id],
      employeeIds: [],
    });

    return res.status(201).json({
      success: true,
      data: newTeam,
    });
  } catch (error) {
    console.error("Erreur création équipe:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de l'équipe",
      error: (error as Error).message,
    });
  }
});

/**
 * @route   PATCH /api/teams/:id
 * @desc    Mettre à jour une équipe (nom uniquement)
 * @access  Private
 */
router.patch(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID d'équipe invalide",
      });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Le nom de l'équipe est requis",
      });
    }

    try {
      const updatedTeam = await TeamModel.findByIdAndUpdate(
        id,
        { name },
        { new: true }
      );

      if (!updatedTeam) {
        return res.status(404).json({
          success: false,
          message: "Équipe non trouvée",
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedTeam,
      });
    } catch (error) {
      console.error("Erreur mise à jour équipe:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour de l'équipe",
        error: (error as Error).message,
      });
    }
  }
);

/**
 * @route   DELETE /api/teams/:id
 * @desc    Supprimer une équipe
 * @access  Private
 */
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID d'équipe invalide",
      });
    }

    try {
      const deletedTeam = await TeamModel.findByIdAndDelete(id);

      if (!deletedTeam) {
        return res.status(404).json({
          success: false,
          message: "Équipe non trouvée",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Équipe supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur suppression équipe:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression de l'équipe",
        error: (error as Error).message,
      });
    }
  }
);

/**
 * @route   GET /api/teams/:id
 * @desc    Récupérer une équipe par son ID
 * @access  Private
 */
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID d'équipe invalide",
        });
      }

      const team = await TeamModel.findById(id)
        .populate("managerIds", "firstName lastName email photoUrl")
        .populate("employeeIds", "firstName lastName email photoUrl");

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe non trouvée",
        });
      }

      return res.status(200).json({
        success: true,
        data: team,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'équipe:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération de l'équipe",
        error: (error as Error).message,
      });
    }
  }
);

export default router;
