/**
 * Routes pour la gestion des équipes
 *
 * Ce fichier contient les routes permettant :
 * - de récupérer les équipes d'un manager
 * - de créer une équipe
 * - de mettre à jour une équipe
 * - de supprimer une équipe
 */

import express, { Response } from "express";
import mongoose from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
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

export default router;
