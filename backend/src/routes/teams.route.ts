/**
 * Routes pour la gestion des équipes
 *
 * Ce fichier contient la route pour récupérer les équipes
 * dont un utilisateur est manager
 */
import express, { Response } from "express";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import { TeamModel } from "../models/Team.model";

// Création du router
const router = express.Router();

/**
 * @route   GET /api/teams
 * @desc    Récupérer toutes les équipes dont l'utilisateur authentifié est manager
 * @access  Private (nécessite authentification)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Vérification que l'utilisateur est bien authentifié
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié ou identification invalide",
      });
    }

    // Recherche des équipes dont l'utilisateur authentifié est manager
    const teams = await TeamModel.find({ managerIds: req.user._id })
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
