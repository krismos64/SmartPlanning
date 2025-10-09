/**
 * Routes de gestion du mot de passe
 *
 * Ce fichier contient les endpoints liés à la gestion du mot de passe
 * incluant la mise à jour du mot de passe avec validation RGPD.
 */

import express, { Response } from "express";
import { AuthRequest, authenticateToken } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
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
      const userId = req.user?.id;

      // Validation des champs
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Les champs "currentPassword" et "newPassword" sont requis',
        });
      }

      // Récupérer l'utilisateur avec son mot de passe
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID utilisateur invalide",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userIdNum },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier l'ancien mot de passe (utiliser bcrypt comme dans le modèle User)
      const bcrypt = require('bcrypt');
      const isMatch = await bcrypt.compare(currentPassword, user.password);

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

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: userIdNum },
        data: { password: hashedPassword },
      });

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
