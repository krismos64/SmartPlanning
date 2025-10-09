/**
 * Routes pour la gestion des plannings générés par l'IA
 *
 * Ce fichier contient les routes pour mettre à jour et rejeter
 * les plannings générés automatiquement.
 */
import express, { Response } from "express";
import prisma from "../config/prisma";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";

// Création du router
const router = express.Router();

/**
 * Interface pour les données de planning (JSONB)
 */
interface ScheduleData {
  [key: string]: any;
}

/**
 * Interface pour les requêtes de mise à jour de planning
 */
interface UpdateScheduleRequest {
  action: "update" | "reject";
  scheduleData?: ScheduleData;
}

/**
 * @route   PUT /api/generated-schedules/:id
 * @desc    Mettre à jour ou rejeter un planning généré par l'IA
 * @access  Private (nécessite authentification, rôle manager ou directeur)
 */
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      // Récupération de l'ID du planning
      const scheduleId = req.params.id;

      // Vérification de la validité de l'ID
      const scheduleIdNum = parseInt(scheduleId, 10);
      if (isNaN(scheduleIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID de planning invalide",
        });
      }

      // Récupération des données de la requête
      const { action, scheduleData } = req.body as UpdateScheduleRequest;

      // TODO: Vérification des droits d'accès (rôle manager ou directeur)
      // if (req.user?.role !== 'manager' && req.user?.role !== 'directeur') {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Accès non autorisé. Rôle manager ou directeur requis."
      //   });
      // }

      // Vérification que l'action est spécifiée
      if (!action) {
        return res.status(400).json({
          success: false,
          message: "L'action est requise (update ou reject)",
        });
      }

      // Recherche du planning à mettre à jour
      const schedule = await prisma.generatedSchedule.findUnique({
        where: { id: scheduleIdNum }
      });

      // Vérification que le planning existe
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Planning non trouvé",
        });
      }

      // Traitement en fonction de l'action demandée
      switch (action) {
        case "update":
          // Vérification que les données de planning sont fournies
          if (!scheduleData) {
            return res.status(400).json({
              success: false,
              message:
                "Les données de planning (scheduleData) sont requises pour l'action update",
            });
          }

          // Vérification du format des données
          if (typeof scheduleData !== "object") {
            return res.status(400).json({
              success: false,
              message: "Format des données de planning invalide",
            });
          }

          // Mise à jour des données du planning
          const updatedSchedule = await prisma.generatedSchedule.update({
            where: { id: scheduleIdNum },
            data: { schedule: scheduleData as any }
          });

          return res.status(200).json({
            success: true,
            message: "Planning mis à jour avec succès",
            data: updatedSchedule,
          });

        case "reject":
          // Mise à jour du statut du planning à "rejected"
          const rejectedSchedule = await prisma.generatedSchedule.update({
            where: { id: scheduleIdNum },
            data: { status: "rejected" }
          });

          return res.status(200).json({
            success: true,
            message: "Planning rejeté avec succès",
            data: rejectedSchedule,
          });

        default:
          // Action non supportée
          return res.status(400).json({
            success: false,
            message: "Action non supportée. Utilisez 'update' ou 'reject'",
          });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du planning:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour du planning",
        error: (error as Error).message,
      });
    }
  }
);

export default router;
