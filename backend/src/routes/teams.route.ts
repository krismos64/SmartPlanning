/**
 * Routes pour la gestion des équipes
 *
 * Ce fichier contient la route pour récupérer les équipes
 * dont un utilisateur est manager
 */
import express, { Response } from "express";
import mongoose from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import { TeamModel } from "../models/Team.model";

// Création du router
const router = express.Router();

/**
 * @route   GET /api/teams?managerId=xxx
 * @desc    Récupérer toutes les équipes dont l'utilisateur est manager
 * @access  Private (nécessite authentification)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Récupération du managerId depuis les paramètres de requête
    const { managerId } = req.query;

    // Vérification que le managerId est bien fourni
    if (!managerId) {
      return res.status(400).json({
        success: false,
        message: "Le paramètre managerId est requis",
      });
    }

    // Vérification de la validité de l'ID
    if (!mongoose.Types.ObjectId.isValid(managerId as string)) {
      return res.status(400).json({
        success: false,
        message: "ID de manager invalide",
      });
    }

    // Recherche des équipes dont le managerId fait partie du tableau managerIds
    const teams = await TeamModel.find({ managerIds: managerId })
      .populate("managerIds", "firstName lastName email photoUrl")
      .populate("employeeIds", "firstName lastName email photoUrl");

    // Retourner les équipes trouvées (ou un tableau vide)
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

export default router;
