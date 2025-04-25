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

      // 🔒 Vérification de l'authentification de l'utilisateur
      if (!req.user || !req.user.userId) {
        return res.status(400).json({
          message: "Utilisateur non authentifié (updatedBy manquant)",
        });
      }

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

      if (!isValidObjectId(employeeId)) {
        return res.status(400).json({ message: "ID employé invalide" });
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
        dailyDates,
        totalWeeklyMinutes,
        notes,
        status: "approved",
        updatedBy: req.user.userId,
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

export default router;
