/**
 * Routes de gestion du mot de passe
 *
 * Ce fichier contient les endpoints liés à la gestion du mot de passe
 * incluant la mise à jour du mot de passe avec validation RGPD.
 */

import express, { Response } from "express";
import { AuthRequest, authenticateToken } from "../middlewares/auth.middleware";
import User from "../models/User.model";
import {
  passwordRequirementsMessage,
  validatePasswordComplexity,
} from "../utils/password";

const router = express.Router();

/**
 * @route PUT /api/profile/password
 * @desc Mettre à jour le mot de passe de l'utilisateur connecté
 * @access Privé (token JWT requis)
 */
router.put(
  "/password",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?._id;

      // Validation des champs
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Les champs "currentPassword" et "newPassword" sont requis',
        });
      }

      // Récupérer l'utilisateur avec son mot de passe (qui est normalement exclu par défaut)
      const user = await User.findById(userId).select("+password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier l'ancien mot de passe
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Mot de passe actuel incorrect",
        });
      }

      // Valider la complexité du nouveau mot de passe (RGPD)
      if (!validatePasswordComplexity(newPassword)) {
        return res.status(400).json({
          success: false,
          message: passwordRequirementsMessage,
        });
      }

      // Assigner directement le nouveau mot de passe
      // Le hook Mongoose pre("save") se chargera du hashage
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Mot de passe mis à jour avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      res.status(500).json({
        success: false,
        message:
          "Une erreur est survenue lors de la mise à jour du mot de passe",
      });
    }
  }
);

export default router;
