import express, { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import WeeklyScheduleModel from "../models/WeeklySchedule.model";

const router = express.Router();

/**
 * Route POST /api/weekly-schedules
 * Crée un planning hebdomadaire validé manuellement
 * Accessible uniquement aux managers et directeurs
 */
router.post(
  "/",
  authenticateToken,
  checkRole(["manager", "directeur"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        employeeId,
        weekNumber,
        year,
        scheduleData,
        dailyNotes,
        notes,
        dailyDates,
        totalWeeklyMinutes,
      } = req.body;

      // Logs pour déboguer
      console.log("Requête reçue pour création de planning");
      console.log("Headers:", req.headers);
      console.log("User dans req:", req.user);
      console.log("Body:", {
        employeeId,
        weekNumber,
        year,
        scheduleData: Object.keys(scheduleData || {}).length + " jours",
        totalWeeklyMinutes,
      });

      // 🔒 Vérification de l'authentification de l'utilisateur
      if (!req.user || (!req.user.userId && !req.user.id)) {
        console.log("Erreur d'authentification: req.user =", req.user);
        return res.status(400).json({
          message: "Utilisateur non authentifié (updatedBy manquant)",
        });
      }

      // Utiliser userId ou id selon ce qui est disponible
      const authenticatedUserId = req.user.userId || req.user.id;
      console.log("ID utilisateur authentifié:", authenticatedUserId);

      // 📌 Validation des champs requis
      if (
        !employeeId ||
        !weekNumber ||
        !year ||
        !scheduleData ||
        !dailyDates ||
        typeof totalWeeklyMinutes !== "number"
      ) {
        return res.status(400).json({
          message: "Champs requis manquants",
          details: {
            employeeId: !employeeId ? "manquant" : "présent",
            weekNumber: !weekNumber ? "manquant" : "présent",
            year: !year ? "manquant" : "présent",
            scheduleData: !scheduleData ? "manquant" : "présent",
            dailyDates: !dailyDates ? "manquant" : "présent",
            totalWeeklyMinutes:
              typeof totalWeeklyMinutes !== "number"
                ? "format invalide"
                : "présent",
          },
        });
      }

      if (!isValidObjectId(employeeId)) {
        return res.status(400).json({ message: "ID employé invalide" });
      }

      // Formater explicitement les dates quotidiennes
      const formattedDailyDates: Record<string, Date> = {};
      for (const [day, dateValue] of Object.entries(dailyDates)) {
        try {
          formattedDailyDates[day] = new Date(
            dateValue as string | number | Date
          );
        } catch (err) {
          return res.status(400).json({
            message: `Format de date invalide pour ${day}`,
            value: dateValue,
          });
        }
      }

      // 🕓 Validation du format des créneaux horaires
      const timeRegex =
        /^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

      for (const day in scheduleData) {
        const slots = scheduleData[day];
        if (!Array.isArray(slots)) continue;

        for (const slot of slots) {
          if (!timeRegex.test(slot)) {
            return res.status(400).json({
              message: `Format invalide pour le créneau "${slot}" (${day})`,
            });
          }

          const [start, end] = slot.split("-");
          if (start >= end) {
            return res.status(400).json({
              message: `L'heure de fin doit être après l'heure de début pour "${slot}" (${day})`,
            });
          }
        }
      }

      // 🔁 Vérifier l'unicité du planning pour cet employé et cette semaine
      const existing = await WeeklyScheduleModel.findOne({
        employeeId,
        weekNumber,
        year,
      });

      if (existing) {
        return res.status(409).json({
          message:
            "Un planning existe déjà pour cet employé cette semaine et cette année",
        });
      }

      // ✅ Création du planning avec l'ID de l'utilisateur connecté comme updatedBy
      const newSchedule = await WeeklyScheduleModel.create({
        employeeId,
        weekNumber,
        year,
        scheduleData,
        dailyNotes,
        dailyDates: formattedDailyDates,
        totalWeeklyMinutes,
        notes,
        status: "approved",
        updatedBy: authenticatedUserId,
      });

      return res.status(201).json({
        message: "Planning créé avec succès",
        data: newSchedule,
      });
    } catch (error) {
      console.error("Erreur lors de la création du planning:", error);
      return res.status(500).json({
        message: "Erreur serveur lors de la création du planning",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Route GET /api/weekly-schedules/week/:year/:weekNumber
 * Récupère tous les plannings validés pour une année et une semaine précises
 * Inclut les informations des employés via populate
 */
router.get("/week/:year/:weekNumber", async (req: Request, res: Response) => {
  try {
    const { year, weekNumber } = req.params;

    const yearNumber = parseInt(year, 10);
    const weekNumberValue = parseInt(weekNumber, 10);

    if (
      isNaN(yearNumber) ||
      isNaN(weekNumberValue) ||
      yearNumber < 2020 ||
      yearNumber > 2050 ||
      weekNumberValue < 1 ||
      weekNumberValue > 53
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Paramètres invalides. L'année doit être entre 2020 et 2050, et la semaine entre 1 et 53.",
      });
    }

    const schedules = await WeeklyScheduleModel.find({
      year: yearNumber,
      weekNumber: weekNumberValue,
      status: "approved",
    })
      .populate("employeeId", "firstName lastName")
      .lean();

    const formattedSchedules = schedules.map((schedule: any) => ({
      ...schedule,
      employeeName: schedule.employeeId
        ? `${(schedule.employeeId as any).firstName} ${
            (schedule.employeeId as any).lastName
          }`
        : "Employé inconnu",
      employeeId: schedule.employeeId
        ? (schedule.employeeId as any)._id
        : schedule.employeeId,
    }));

    return res.status(200).json({
      success: true,
      data: formattedSchedules,
      count: formattedSchedules.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des plannings:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des plannings",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Route PUT /api/weekly-schedules/:id
 * Met à jour un planning hebdomadaire existant
 * Accessible uniquement aux managers et directeurs
 */
router.put(
  "/:id",
  authenticateToken,
  checkRole(["manager", "directeur"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        employeeId,
        weekNumber,
        year,
        scheduleData,
        dailyNotes,
        notes,
        dailyDates,
        totalWeeklyMinutes,
      } = req.body;

      // Logs pour déboguer
      console.log("Requête reçue pour mise à jour de planning");
      console.log("ID planning:", id);
      console.log("User dans req:", req.user);

      // 🔒 Vérification de l'authentification de l'utilisateur
      if (!req.user || (!req.user.userId && !req.user.id)) {
        console.log("Erreur d'authentification: req.user =", req.user);
        return res.status(400).json({
          message: "Utilisateur non authentifié (updatedBy manquant)",
        });
      }

      // Vérifier l'existence du planning
      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "ID de planning invalide" });
      }

      const existingSchedule = await WeeklyScheduleModel.findById(id);
      if (!existingSchedule) {
        return res.status(404).json({
          message: "Planning introuvable",
        });
      }

      // Utiliser userId ou id selon ce qui est disponible
      const authenticatedUserId = req.user.userId || req.user.id;
      console.log("ID utilisateur authentifié:", authenticatedUserId);

      // 📌 Validation des champs requis
      if (
        !employeeId ||
        !weekNumber ||
        !year ||
        !scheduleData ||
        !dailyDates ||
        typeof totalWeeklyMinutes !== "number"
      ) {
        return res.status(400).json({
          message: "Champs requis manquants",
        });
      }

      // Formater explicitement les dates quotidiennes
      const formattedDailyDates: Record<string, Date> = {};
      for (const [day, dateValue] of Object.entries(dailyDates)) {
        try {
          formattedDailyDates[day] = new Date(
            dateValue as string | number | Date
          );
        } catch (err) {
          return res.status(400).json({
            message: `Format de date invalide pour ${day}`,
            value: dateValue,
          });
        }
      }

      // 🕓 Validation du format des créneaux horaires
      const timeRegex =
        /^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

      for (const day in scheduleData) {
        const slots = scheduleData[day];
        if (!Array.isArray(slots)) continue;

        for (const slot of slots) {
          if (!timeRegex.test(slot)) {
            return res.status(400).json({
              message: `Format invalide pour le créneau "${slot}" (${day})`,
            });
          }

          const [start, end] = slot.split("-");
          if (start >= end) {
            return res.status(400).json({
              message: `L'heure de fin doit être après l'heure de début pour "${slot}" (${day})`,
            });
          }
        }
      }

      // Mettre à jour le planning existant avec la méthode findByIdAndUpdate
      const updateData = {
        scheduleData,
        dailyNotes,
        dailyDates: formattedDailyDates,
        totalWeeklyMinutes,
        notes,
        updatedBy: authenticatedUserId,
      };

      // Log des données de mise à jour
      console.log("Données de mise à jour:", {
        ...updateData,
        dailyNotes: updateData.dailyNotes
          ? Object.keys(updateData.dailyNotes).length + " entrées"
          : undefined,
      });

      const updatedSchedule = await WeeklyScheduleModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      return res.status(200).json({
        message: "Planning mis à jour avec succès",
        data: updatedSchedule,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du planning:", error);
      return res.status(500).json({
        message: "Erreur serveur lors de la mise à jour du planning",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Route GET /api/weekly-schedules/:id
 * Récupère un planning spécifique par son ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de planning invalide",
      });
    }

    const schedule = await WeeklyScheduleModel.findById(id)
      .populate("employeeId", "firstName lastName")
      .populate("updatedBy", "firstName lastName")
      .lean();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Planning introuvable",
      });
    }

    // Formatage de la réponse
    const formattedSchedule = {
      ...schedule,
      employeeName: schedule.employeeId
        ? `${(schedule.employeeId as any).firstName} ${
            (schedule.employeeId as any).lastName
          }`
        : "Employé inconnu",
      updatedByName: schedule.updatedBy
        ? `${(schedule.updatedBy as any).firstName} ${
            (schedule.updatedBy as any).lastName
          }`
        : "Utilisateur inconnu",
      employeeId: schedule.employeeId
        ? (schedule.employeeId as any)._id
        : schedule.employeeId,
    };

    return res.status(200).json({
      success: true,
      data: formattedSchedule,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du planning:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération du planning",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Route DELETE /api/weekly-schedules/:id
 * Supprime un planning spécifique
 * Accessible uniquement aux managers et directeurs
 */
router.delete(
  "/:id",
  authenticateToken,
  checkRole(["manager", "directeur"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Vérifier la validité de l'ID
      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de planning invalide",
        });
      }

      // Vérifier l'existence du planning
      const existingSchedule = await WeeklyScheduleModel.findById(id);
      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: "Planning introuvable",
        });
      }

      // Supprimer le planning
      await WeeklyScheduleModel.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: "Planning supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du planning:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression du planning",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;
