/**
 * Routes pour la gestion des plannings hebdomadaires
 *
 * Ce fichier définit les routes liées aux plannings dans l'API REST SmartPlanning.
 * Les routes permettent de récupérer, créer et modifier les plannings.
 */

import { NextFunction, Request, Response, Router } from "express";
import mongoose from "mongoose";
import { UserDocument } from "../models/User.model";
import WeeklyScheduleModel, {
  ScheduleData,
} from "../models/WeeklySchedule.model";

// Définition de l'enum UserRole directement dans ce fichier pour éviter les erreurs d'importation
enum UserRole {
  ADMIN = "admin",
  DIRECTEUR = "directeur",
  MANAGER = "manager",
  EMPLOYE = "employé",
}

// Extension du type Request pour inclure l'utilisateur authentifié
declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

// Création du router Express
const router = Router();

/**
 * Middleware fictif pour simuler l'authentification
 *
 * Dans une implémentation réelle, ce middleware vérifierait le JWT
 * et attacherait les informations de l'utilisateur à req.user
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Création d'un utilisateur fictif
  const mockUser = {
    _id: new mongoose.Types.ObjectId("64f8a8d1f3c72e1d84c5812e"),
    role: UserRole.MANAGER,
    firstName: "Admin",
    lastName: "User",
    email: "admin@smartplanning.fr",
    isActive: true,
    emailVerified: true,
    loginHistory: [],
  };

  // Assignation de l'utilisateur mockUser à req.user
  // Conversion explicite en unknown puis en UserDocument pour éviter les erreurs de typage
  req.user = mockUser as unknown as UserDocument;

  next();
};

/**
 * @route   GET /api/schedules/week/:year/:weekNumber
 * @desc    Récupère tous les plannings hebdomadaires validés pour une semaine donnée
 * @access  Private (nécessite authentification)
 */
router.get(
  "/week/:year/:weekNumber",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      // Récupération et validation des paramètres
      const year = parseInt(req.params.year);
      const weekNumber = parseInt(req.params.weekNumber);

      // Vérification des paramètres
      if (
        isNaN(year) ||
        isNaN(weekNumber) ||
        weekNumber < 1 ||
        weekNumber > 53
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Paramètres invalides. Année et numéro de semaine (1-53) requis.",
        });
      }

      // TODO: Vérification des permissions utilisateur
      // if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Accès refusé. Permissions insuffisantes.'
      //   });
      // }

      // Récupération des plannings validés pour la semaine spécifiée
      const schedules = await WeeklyScheduleModel.find({
        year,
        weekNumber,
        status: "approved",
      })
        .populate("employeeId", "firstName lastName photoUrl") // Informations de l'employé
        .populate("updatedBy", "firstName lastName") // Informations de la personne qui a validé
        .sort({ "employeeId.lastName": 1 }); // Tri par nom de famille de l'employé

      // Si aucun planning n'est trouvé, retourner un tableau vide
      if (!schedules || schedules.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "Aucun planning validé trouvé pour cette semaine.",
        });
      }

      // Type pour les objets de planning peuplés
      type PopulatedSchedule = {
        _id: string;
        employeeId: {
          _id: string;
          firstName: string;
          lastName: string;
          photoUrl?: string;
        };
        updatedBy?: {
          _id: string;
          firstName: string;
          lastName: string;
        };
        scheduleData: Map<string, string[]>;
        notes?: string;
        year: number;
        weekNumber: number;
      };

      // Formater les données de sortie pour inclure uniquement les informations nécessaires
      const formattedSchedules = schedules.map((schedule: unknown) => {
        const typedSchedule = schedule as PopulatedSchedule;
        return {
          _id: typedSchedule._id,
          employeeId: typedSchedule.employeeId._id,
          employeeName: `${typedSchedule.employeeId.firstName} ${typedSchedule.employeeId.lastName}`,
          scheduleData: typedSchedule.scheduleData,
          notes: typedSchedule.notes,
          updatedBy: typedSchedule.updatedBy
            ? `${typedSchedule.updatedBy.firstName} ${typedSchedule.updatedBy.lastName}`
            : "Système",
          year: typedSchedule.year,
          weekNumber: typedSchedule.weekNumber,
        };
      });

      // Retourner les plannings formatés
      return res.status(200).json({
        success: true,
        count: formattedSchedules.length,
        data: formattedSchedules,
      });
    } catch (error: unknown) {
      console.error("Erreur lors de la récupération des plannings:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des plannings",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      });
    }
  }
);

/**
 * @route   POST /api/schedules
 * @desc    Crée un nouveau planning hebdomadaire
 * @access  Private (nécessite authentification et rôle manager ou admin)
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    // Vérification du rôle de l'utilisateur
    if (
      req.user?.role !== UserRole.MANAGER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Accès refusé. Seuls les managers et administrateurs peuvent créer des plannings.",
      });
    }

    // Récupération des données du corps de la requête
    const { employeeId, year, weekNumber, scheduleData, notes } = req.body;

    // Vérification des données requises
    if (
      !employeeId ||
      !year ||
      !weekNumber ||
      !scheduleData ||
      Object.keys(scheduleData).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Données incomplètes. Identifiant d'employé, année, numéro de semaine et données de planning sont requis.",
      });
    }

    // Vérification des paramètres
    if (weekNumber < 1 || weekNumber > 53) {
      return res.status(400).json({
        success: false,
        message: "Le numéro de semaine doit être compris entre 1 et 53.",
      });
    }

    // Vérification si un planning existe déjà pour cet employé cette semaine-là
    const existingSchedule = await WeeklyScheduleModel.findOne({
      employeeId,
      year,
      weekNumber,
    });

    if (existingSchedule) {
      return res.status(409).json({
        success: false,
        message: "Un planning existe déjà pour cet employé sur cette semaine.",
      });
    }

    // Création du nouveau planning
    const newSchedule = new WeeklyScheduleModel({
      employeeId,
      year,
      weekNumber,
      scheduleData,
      status: "draft", // Par défaut en brouillon
      updatedBy: req.user?._id,
      notes,
    });

    // Sauvegarde du planning
    await newSchedule.save();

    return res.status(201).json({
      success: true,
      message: "Planning hebdomadaire créé avec succès.",
      data: newSchedule,
    });
  } catch (error: unknown) {
    console.error("Erreur lors de la création du planning:", error);

    // Gestion des erreurs de validation Mongoose
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation des données.",
        errors: error.errors,
      });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du planning",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
});

/**
 * @route   PUT /api/schedules/:scheduleId
 * @desc    Met à jour un planning hebdomadaire existant
 * @access  Private (nécessite authentification et rôle manager ou admin)
 */
router.put("/:scheduleId", requireAuth, async (req: Request, res: Response) => {
  try {
    // Vérification du rôle de l'utilisateur
    if (
      req.user?.role !== UserRole.MANAGER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Accès refusé. Seuls les managers et administrateurs peuvent modifier des plannings.",
      });
    }

    // Récupération de l'identifiant du planning
    const { scheduleId } = req.params;

    // Vérification que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant de planning invalide.",
      });
    }

    // Récupération des données à mettre à jour
    const { scheduleData, notes, status } = req.body;

    // Vérification des données requises
    if (!scheduleData || Object.keys(scheduleData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Les données de planning sont requises.",
      });
    }

    // Recherche du planning existant
    const schedule = await WeeklyScheduleModel.findById(scheduleId);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Planning non trouvé.",
      });
    }

    // Mise à jour des données
    schedule.scheduleData = scheduleData as ScheduleData;
    schedule.notes = notes || schedule.notes;

    // Mise à jour du statut si fourni et valide
    if (status && (status === "draft" || status === "approved")) {
      schedule.status = status;
    }

    // Enregistrement de l'utilisateur qui a fait la mise à jour
    schedule.updatedBy = req.user?._id as mongoose.Types.ObjectId;

    // Sauvegarde des modifications
    await schedule.save();

    return res.status(200).json({
      success: true,
      message: "Planning mis à jour avec succès.",
      data: schedule,
    });
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour du planning:", error);

    // Gestion des erreurs de validation Mongoose
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation des données.",
        errors: error.errors,
      });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour du planning",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
});

/**
 * @route   DELETE /api/schedules/:scheduleId
 * @desc    Supprime un planning hebdomadaire
 * @access  Private (nécessite authentification et rôle admin ou manager)
 */
router.delete(
  "/:scheduleId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      // Vérification du rôle de l'utilisateur
      if (
        req.user?.role !== UserRole.MANAGER &&
        req.user?.role !== UserRole.ADMIN
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Accès refusé. Seuls les managers et administrateurs peuvent supprimer des plannings.",
        });
      }

      // Récupération de l'identifiant du planning
      const { scheduleId } = req.params;

      // Vérification que l'ID est valide
      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        return res.status(400).json({
          success: false,
          message: "Identifiant de planning invalide.",
        });
      }

      // Suppression du planning
      const result = await WeeklyScheduleModel.findByIdAndDelete(scheduleId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Planning non trouvé.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Planning supprimé avec succès.",
      });
    } catch (error: unknown) {
      console.error("Erreur lors de la suppression du planning:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression du planning",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      });
    }
  }
);

export default router;
