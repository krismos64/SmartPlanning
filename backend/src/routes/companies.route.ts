import express, { Response } from "express";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import { Company } from "../models/Company.model";

const router = express.Router();

/**
 * @route GET /me
 * @desc Récupérer les informations de l'entreprise de l'utilisateur connecté
 * @access Private (tous les rôles authentifiés)
 */
router.get(
  "/me",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user || !req.user.companyId) {
        return res.status(400).json({
          success: false,
          message: "Informations utilisateur ou entreprise manquantes",
        });
      }

      const company = await Company.findById(req.user.companyId);

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Entreprise non trouvée",
        });
      }

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'entreprise:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération de l'entreprise",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * @route GET /:id
 * @desc Récupérer une entreprise par ID (accès étendu)
 * @access Private (utilisateurs de la même entreprise + admin)
 */
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // Les admins peuvent accéder à toutes les entreprises
      // Les autres utilisateurs ne peuvent accéder qu'à leur propre entreprise
      if (req.user.role !== "admin" && req.user.companyId !== id) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé à cette entreprise",
        });
      }

      const company = await Company.findById(id);

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Entreprise non trouvée",
        });
      }

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'entreprise:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération de l'entreprise",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;
