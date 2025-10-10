import express, { Response } from "express";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// ================================================================================
// MIGRATION NOTE: Ce fichier a été migré de MongoDB vers Prisma PostgreSQL
//
// Changements majeurs:
// - MongoDB ObjectId (string) → PostgreSQL INTEGER (number)
// - Collection WeeklySchedule (employeeId + weekNumber + year) →
//   Table weekly_schedule (companyId + teamId + weekStartDate/weekEndDate)
// - Données employés stockées dans le JSON schedule au lieu de documents séparés
// - Utilisation de transactions Prisma pour garantir l'intégrité
// - Conversion year/weekNumber → weekStartDate/weekEndDate via getWeekDates()
//
// Structure du champ JSON schedule:
// {
//   monday: [{ employeeId: 123, startTime: "09:00", endTime: "17:00", position: "...", ... }],
//   tuesday: [...],
//   ...
// }
// ================================================================================

/**
 * MIGRATION: Convertit year + weekNumber en dates de début/fin de semaine ISO
 * @param year - Année (ex: 2025)
 * @param weekNumber - Numéro de semaine ISO (1-53)
 * @returns { weekStartDate: Date, weekEndDate: Date }
 */
function getWeekDates(
  year: number,
  weekNumber: number
): { weekStartDate: Date; weekEndDate: Date } {
  // ISO 8601: La semaine 1 est la première semaine avec au moins 4 jours dans l'année
  const january4th = new Date(year, 0, 4); // 4 janvier
  const dayOfWeek = january4th.getDay() || 7; // 0 (dimanche) → 7
  const weekStart = new Date(january4th);

  // Trouver le lundi de la semaine 1
  weekStart.setDate(january4th.getDate() - dayOfWeek + 1);

  // Ajouter les semaines
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Dimanche

  return { weekStartDate: weekStart, weekEndDate: weekEnd };
}

/**
 * MIGRATION: Valide et parse un ID en number (au lieu de ObjectId)
 */
function parseId(id: string | number, fieldName: string): number {
  const parsed = typeof id === "number" ? id : parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} invalide: ${id}`);
  }
  return parsed;
}

/**
 * MIGRATION: Extrait les jours de la semaine depuis scheduleData (format ancien)
 * et les convertit en structure compatible Prisma JSON
 */
function convertScheduleDataToJson(
  scheduleData: Record<string, string[]>,
  employeeId: number,
  dailyNotes?: Record<string, string>,
  dailyDates?: Record<string, Date>
): Record<string, any[]> {
  const scheduleJson: Record<string, any[]> = {};
  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  for (const day of daysOfWeek) {
    const slots = scheduleData[day] || [];
    scheduleJson[day] = slots.map((slot) => {
      const [timeRange] = slot.split(" "); // Format: "09:00-17:00"
      const [startTime, endTime] = timeRange.split("-");

      return {
        employeeId,
        startTime,
        endTime,
        note: dailyNotes?.[day] || null,
        date: dailyDates?.[day]?.toISOString() || null,
      };
    });
  }

  return scheduleJson;
}

/**
 * Route POST /api/weekly-schedules
 * MIGRATION: Crée ou met à jour un planning hebdomadaire dans le modèle Prisma
 * Accessible aux managers, directeurs et admins
 */
router.post(
  "/",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
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

      console.log("MIGRATION: Création planning hebdomadaire", {
        employeeId,
        weekNumber,
        year,
        scheduleDataDays: Object.keys(scheduleData || {}).length,
        totalWeeklyMinutes,
      });

      // 🔒 Vérification authentification
      if (!req.user || (!req.user.userId && !req.user.id)) {
        return res.status(400).json({
          message: "Utilisateur non authentifié (updatedBy manquant)",
        });
      }

      const authenticatedUserId =
        req.user.userId || req.user.id;

      // MIGRATION: Parse userId en number
      const createdById = parseId(authenticatedUserId, "userId");

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

      // MIGRATION: Parse employeeId en number
      const employeeIdNum = parseId(employeeId, "employeeId");

      // Formater les dates quotidiennes
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

      // MIGRATION: Récupérer companyId et teamId depuis l'employé
      const employee = await prisma.employee.findUnique({
        where: { id: employeeIdNum },
        select: { id: true, companyId: true, teamId: true },
      });

      if (!employee) {
        return res.status(404).json({
          message: "Employé non trouvé",
        });
      }

      if (!employee.teamId) {
        return res.status(400).json({
          message: "L'employé doit appartenir à une équipe",
        });
      }

      // MIGRATION: Calculer weekStartDate et weekEndDate
      const { weekStartDate, weekEndDate } = getWeekDates(year, weekNumber);

      console.log("MIGRATION: Dates calculées", {
        year,
        weekNumber,
        weekStartDate,
        weekEndDate,
        companyId: employee.companyId,
        teamId: employee.teamId,
      });

      // MIGRATION: Convertir scheduleData en structure JSON Prisma
      const scheduleJson = convertScheduleDataToJson(
        scheduleData,
        employeeIdNum,
        dailyNotes,
        formattedDailyDates
      );

      // MIGRATION: Vérifier si un planning existe déjà pour cette équipe/semaine
      const existing = await prisma.weeklySchedule.findFirst({
        where: {
          companyId: employee.companyId,
          teamId: employee.teamId,
          weekStartDate,
          weekEndDate,
        },
      });

      if (existing) {
        // MIGRATION: Fusionner avec le planning existant (plusieurs employés de la même équipe)
        const existingSchedule =
          (existing.schedule as Record<string, any[]>) || {};

        // Fusionner les horaires de cet employé dans chaque jour
        for (const [day, slots] of Object.entries(scheduleJson)) {
          if (!existingSchedule[day]) {
            existingSchedule[day] = [];
          }

          // Retirer les anciens slots de cet employé
          existingSchedule[day] = existingSchedule[day].filter(
            (slot: any) => slot.employeeId !== employeeIdNum
          );

          // Ajouter les nouveaux slots
          existingSchedule[day].push(...slots);
        }

        // Mettre à jour le planning existant
        const updatedSchedule = await prisma.weeklySchedule.update({
          where: { id: existing.id },
          data: {
            schedule: existingSchedule,
            updatedAt: new Date(),
          },
        });

        console.log(
          `MIGRATION: Planning fusionné pour équipe ${employee.teamId}, semaine ${weekNumber}/${year}`
        );

        return res.status(200).json({
          message:
            "Planning mis à jour avec succès (fusionné avec planning existant)",
          data: {
            id: updatedSchedule.id,
            companyId: updatedSchedule.companyId,
            teamId: updatedSchedule.teamId,
            weekStartDate: updatedSchedule.weekStartDate,
            weekEndDate: updatedSchedule.weekEndDate,
            status: updatedSchedule.status,
            // Retourner les infos de compatibilité anciennes
            employeeId: employeeIdNum,
            weekNumber,
            year,
            scheduleData,
            notes,
            totalWeeklyMinutes,
          },
        });
      }

      // ✅ Création d'un nouveau planning
      const newSchedule = await prisma.weeklySchedule.create({
        data: {
          companyId: employee.companyId,
          teamId: employee.teamId,
          weekStartDate,
          weekEndDate,
          schedule: scheduleJson,
          status: "validated", // MIGRATION: "approved" → "validated"
          createdById,
        },
      });

      console.log(`MIGRATION: Nouveau planning créé ID=${newSchedule.id}`);

      return res.status(201).json({
        message: "Planning créé avec succès",
        data: {
          id: newSchedule.id,
          companyId: newSchedule.companyId,
          teamId: newSchedule.teamId,
          weekStartDate: newSchedule.weekStartDate,
          weekEndDate: newSchedule.weekEndDate,
          status: newSchedule.status,
          // Retourner les infos de compatibilité anciennes
          employeeId: employeeIdNum,
          weekNumber,
          year,
          scheduleData,
          notes,
          totalWeeklyMinutes,
        },
      });
    } catch (error) {
      console.error("MIGRATION: Erreur création planning:", error);
      return res.status(500).json({
        message: "Erreur serveur lors de la création du planning",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Route GET /api/weekly-schedules/week/:year/:weekNumber
 * MIGRATION: Récupère les plannings hebdomadaires pour une semaine donnée
 * Sécurisé multitenant: filtre par entreprise de l'utilisateur
 */
router.get(
  "/week/:year/:weekNumber",
  authenticateToken,
  checkRole(["directeur", "manager", "employee", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { year, weekNumber } = req.params;
      const { teamId, employeeId } = req.query;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const isAdmin = req.user.role === "admin";
      const isEmployee = req.user.role === "employee";
      const userCompanyId = req.user.companyId;
      const userId = req.user.userId || req.user.id;

      if (!isAdmin && !userCompanyId) {
        return res.status(401).json({
          success: false,
          message: "CompanyId manquant pour un utilisateur non-admin",
        });
      }

      console.log("MIGRATION: Recherche plannings hebdomadaires", {
        userId,
        userRole: req.user.role,
        companyId: userCompanyId,
        year,
        weekNumber,
        teamId: teamId || "non spécifié",
        employeeId: employeeId || "non spécifié",
      });

      const yearNumber = parseInt(year, 10);
      const weekNumberValue = parseInt(weekNumber, 10);

      if (isNaN(yearNumber) || isNaN(weekNumberValue)) {
        return res.status(400).json({
          success: false,
          message: "Année ou numéro de semaine invalide",
        });
      }

      // MIGRATION: Calculer weekStartDate et weekEndDate
      const { weekStartDate, weekEndDate } = getWeekDates(
        yearNumber,
        weekNumberValue
      );

      // Construction du filtre Prisma
      const where: any = {
        weekStartDate,
        weekEndDate,
        status: "validated", // MIGRATION: "approved" → "validated"
      };

      // Filtre par entreprise (sauf admins)
      if (!isAdmin) {
        where.companyId = parseId(userCompanyId, "companyId");
      }

      // **RESTRICTION POUR LES EMPLOYÉS**
      if (isEmployee) {
        const employee = await prisma.employee.findFirst({
          where: { userId: parseId(userId, "userId") },
        });

        if (!employee) {
          return res.status(404).json({
            success: false,
            message: "Profil employé non trouvé",
          });
        }

        // Si teamId spécifié, vérifier que c'est bien son équipe
        if (teamId) {
          const teamIdNum = parseId(teamId as string, "teamId");
          if (employee.teamId && employee.teamId === teamIdNum) {
            where.teamId = teamIdNum;
            console.log(
              `MIGRATION: Employé ${userId} consulte son équipe ${teamIdNum}`
            );
          } else {
            return res.status(403).json({
              success: false,
              message:
                "Vous ne pouvez consulter que les plannings de votre propre équipe",
            });
          }
        } else {
          // Pas de teamId : restreindre à son équipe par défaut
          if (employee.teamId) {
            where.teamId = employee.teamId;
          }
        }
      } else {
        // Pour managers/directeurs
        if (teamId) {
          const teamIdNum = parseId(teamId as string, "teamId");

          // Vérifier que l'équipe existe et appartient à l'entreprise
          const team = await prisma.team.findFirst({
            where: isAdmin
              ? { id: teamIdNum }
              : { id: teamIdNum, companyId: parseId(userCompanyId, "companyId") },
          });

          if (!team) {
            return res.status(200).json({
              success: true,
              data: [],
              count: 0,
              message: "Équipe introuvable ou non autorisée",
            });
          }

          where.teamId = teamIdNum;
        }
      }

      // MIGRATION: Requête Prisma avec relations
      const schedules = await prisma.weeklySchedule.findMany({
        where,
        include: {
          team: {
            select: { id: true, name: true },
          },
          company: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // MIGRATION: Transformer les données pour compatibilité API
      const transformedSchedules = [];

      for (const schedule of schedules) {
        const scheduleJson = (schedule.schedule as Record<string, any[]>) || {};

        // Filtrer par employeeId si spécifié
        let employeeSchedules: any[] = [];

        if (employeeId) {
          const employeeIdNum = parseId(employeeId as string, "employeeId");

          // Extraire uniquement les slots de cet employé
          for (const [day, slots] of Object.entries(scheduleJson)) {
            const employeeSlots = slots.filter(
              (slot: any) => slot.employeeId === employeeIdNum
            );
            if (employeeSlots.length > 0) {
              // Récupérer les infos de l'employé
              const employee = await prisma.employee.findUnique({
                where: { id: employeeIdNum },
                select: {
                  id: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      profilePicture: true,
                    }
                  }
                },
              });

              if (employee) {
                transformedSchedules.push({
                  _id: `${schedule.id}-${employeeIdNum}`,
                  employeeId: employee.id,
                  employeeName: `${employee.user.firstName} ${employee.user.lastName}`,
                  employeePhotoUrl: employee.user.profilePicture,
                  teamId: schedule.teamId,
                  teamName: schedule.team.name,
                  year: yearNumber,
                  weekNumber: weekNumberValue,
                  scheduleData: { [day]: employeeSlots.map((s: any) => `${s.startTime}-${s.endTime}`) },
                  dailyNotes: {},
                  notes: null,
                  totalWeeklyMinutes: 0, // À calculer si nécessaire
                  status: schedule.status,
                  createdAt: schedule.createdAt,
                  updatedAt: schedule.updatedAt,
                });
              }
            }
          }
        } else {
          // Extraire tous les employés du planning
          const employeeIds = new Set<number>();
          for (const slots of Object.values(scheduleJson)) {
            for (const slot of slots as any[]) {
              if (slot.employeeId) {
                employeeIds.add(slot.employeeId);
              }
            }
          }

          // Créer un document par employé (compatibilité avec l'ancien modèle)
          for (const empId of employeeIds) {
            const employee = await prisma.employee.findUnique({
              where: { id: empId },
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profilePicture: true,
                  }
                }
              },
            });

            if (!employee) continue;

            const employeeScheduleData: Record<string, string[]> = {};
            const employeeDailyNotes: Record<string, string> = {};

            for (const [day, slots] of Object.entries(scheduleJson)) {
              const employeeSlots = (slots as any[]).filter(
                (slot: any) => slot.employeeId === empId
              );

              if (employeeSlots.length > 0) {
                employeeScheduleData[day] = employeeSlots.map(
                  (s: any) => `${s.startTime}-${s.endTime}`
                );

                // Extraire les notes si présentes
                const note = employeeSlots.find((s: any) => s.note)?.note;
                if (note) {
                  employeeDailyNotes[day] = note;
                }
              }
            }

            transformedSchedules.push({
              _id: `${schedule.id}-${empId}`,
              employeeId: employee.id,
              employeeName: `${employee.user.firstName} ${employee.user.lastName}`,
              employeePhotoUrl: employee.user.profilePicture,
              teamId: schedule.teamId,
              teamName: schedule.team.name,
              year: yearNumber,
              weekNumber: weekNumberValue,
              scheduleData: employeeScheduleData,
              dailyNotes: employeeDailyNotes,
              notes: null,
              totalWeeklyMinutes: 0, // À calculer si nécessaire
              status: schedule.status,
              createdAt: schedule.createdAt,
              updatedAt: schedule.updatedAt,
            });
          }
        }
      }

      console.log(
        `MIGRATION: ${transformedSchedules.length} plannings trouvés après transformation`
      );

      return res.status(200).json({
        success: true,
        data: transformedSchedules,
        count: transformedSchedules.length,
      });
    } catch (error) {
      console.error("MIGRATION: Erreur récupération plannings:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des plannings",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Route PUT /api/weekly-schedules/:id
 * MIGRATION: Met à jour un planning hebdomadaire existant
 * Accessible aux managers, directeurs et admins
 */
router.put(
  "/:id",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
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

      console.log("MIGRATION: Mise à jour planning", { id });

      if (!req.user || (!req.user.userId && !req.user.id)) {
        return res.status(400).json({
          message: "Utilisateur non authentifié",
        });
      }

      // MIGRATION: Parse id en number
      const scheduleId = parseId(id, "scheduleId");
      const employeeIdNum = parseId(employeeId, "employeeId");

      // Vérifier l'existence du planning
      const existingSchedule = await prisma.weeklySchedule.findUnique({
        where: { id: scheduleId },
        include: { team: true },
      });

      if (!existingSchedule) {
        return res.status(404).json({
          message: "Planning introuvable",
        });
      }

      // Validation des champs
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

      // Formater les dates
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

      // Validation format horaire
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

      // MIGRATION: Convertir scheduleData en JSON
      const scheduleJson = convertScheduleDataToJson(
        scheduleData,
        employeeIdNum,
        dailyNotes,
        formattedDailyDates
      );

      // MIGRATION: Fusionner avec le planning existant
      const existingScheduleJson =
        (existingSchedule.schedule as Record<string, any[]>) || {};

      for (const [day, slots] of Object.entries(scheduleJson)) {
        if (!existingScheduleJson[day]) {
          existingScheduleJson[day] = [];
        }

        // Retirer les anciens slots de cet employé
        existingScheduleJson[day] = existingScheduleJson[day].filter(
          (slot: any) => slot.employeeId !== employeeIdNum
        );

        // Ajouter les nouveaux slots
        existingScheduleJson[day].push(...slots);
      }

      // Mettre à jour
      const updatedSchedule = await prisma.weeklySchedule.update({
        where: { id: scheduleId },
        data: {
          schedule: existingScheduleJson,
          updatedAt: new Date(),
        },
      });

      console.log(`MIGRATION: Planning ${scheduleId} mis à jour`);

      return res.status(200).json({
        message: "Planning mis à jour avec succès",
        data: {
          id: updatedSchedule.id,
          companyId: updatedSchedule.companyId,
          teamId: updatedSchedule.teamId,
          weekStartDate: updatedSchedule.weekStartDate,
          weekEndDate: updatedSchedule.weekEndDate,
          status: updatedSchedule.status,
          employeeId: employeeIdNum,
          weekNumber,
          year,
          scheduleData,
          notes,
          totalWeeklyMinutes,
        },
      });
    } catch (error) {
      console.error("MIGRATION: Erreur mise à jour planning:", error);
      return res.status(500).json({
        message: "Erreur serveur lors de la mise à jour du planning",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Route GET /api/weekly-schedules/:id
 * MIGRATION: Récupère un planning spécifique par son ID
 * Pour les employés : seulement leurs propres plannings
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

      const isEmployee = req.user.role === "employee";
      const userId = req.user.userId || req.user.id;

      // MIGRATION: Parse id en number
      const scheduleId = parseId(id, "scheduleId");

      // Récupérer le planning
      const schedule = await prisma.weeklySchedule.findUnique({
        where: { id: scheduleId },
        include: {
          team: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Planning introuvable",
        });
      }

      // **RESTRICTION EMPLOYÉ**
      if (isEmployee) {
        const employee = await prisma.employee.findFirst({
          where: { userId: parseId(userId, "userId") },
        });

        if (!employee) {
          return res.status(404).json({
            success: false,
            message: "Profil employé non trouvé",
          });
        }

        // Vérifier que le planning concerne cet employé
        const scheduleJson = (schedule.schedule as Record<string, any[]>) || {};
        let hasEmployeeData = false;

        for (const slots of Object.values(scheduleJson)) {
          if ((slots as any[]).some((slot: any) => slot.employeeId === employee.id)) {
            hasEmployeeData = true;
            break;
          }
        }

        if (!hasEmployeeData) {
          return res.status(403).json({
            success: false,
            message: "Vous n'êtes autorisé à voir que vos propres plannings",
          });
        }
      }

      // MIGRATION: Formater la réponse (compatibilité)
      const scheduleJson = (schedule.schedule as Record<string, any[]>) || {};

      // Extraire les employés
      const employeeIds = new Set<number>();
      for (const slots of Object.values(scheduleJson)) {
        for (const slot of slots as any[]) {
          if (slot.employeeId) {
            employeeIds.add(slot.employeeId);
          }
        }
      }

      // Pour l'instant, retourner le premier employé trouvé (limitation)
      const firstEmployeeId = Array.from(employeeIds)[0];
      const employee = firstEmployeeId
        ? await prisma.employee.findUnique({
            where: { id: firstEmployeeId },
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            },
          })
        : null;

      return res.status(200).json({
        success: true,
        data: {
          _id: schedule.id,
          employeeId: firstEmployeeId || null,
          employeeName: employee
            ? `${employee.user.firstName} ${employee.user.lastName}`
            : "Employé inconnu",
          teamId: schedule.teamId,
          teamName: schedule.team.name,
          year: schedule.weekStartDate.getFullYear(),
          weekNumber: 1, // À calculer si nécessaire
          scheduleData: scheduleJson,
          status: schedule.status,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
          updatedByName: schedule.createdBy
            ? `${schedule.createdBy.firstName} ${schedule.createdBy.lastName}`
            : "Utilisateur inconnu",
        },
      });
    } catch (error) {
      console.error("MIGRATION: Erreur récupération planning:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération du planning",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Route DELETE /api/weekly-schedules/:id
 * MIGRATION: Supprime un planning spécifique
 * Accessible aux managers, directeurs et admins
 */
router.delete(
  "/:id",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // MIGRATION: Parse id en number
      const scheduleId = parseId(id, "scheduleId");

      // Vérifier l'existence
      const existingSchedule = await prisma.weeklySchedule.findUnique({
        where: { id: scheduleId },
      });

      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: "Planning introuvable",
        });
      }

      // Supprimer
      await prisma.weeklySchedule.delete({
        where: { id: scheduleId },
      });

      console.log(`MIGRATION: Planning ${scheduleId} supprimé`);

      return res.status(200).json({
        success: true,
        message: "Planning supprimé avec succès",
      });
    } catch (error) {
      console.error("MIGRATION: Erreur suppression planning:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression du planning",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Route GET /api/weekly-schedules/admin/all
 * MIGRATION: Récupère tous les plannings pour l'admin avec filtres
 * Accessible uniquement aux administrateurs
 */
router.get(
  "/admin/all",
  authenticateToken,
  checkRole(["admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        companyId,
        teamId,
        employeeId,
        year,
        weekNumber,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      console.log("MIGRATION: Admin récupération plannings", {
        companyId: companyId || "tous",
        teamId: teamId || "tous",
        employeeId: employeeId || "tous",
        year: year || "toutes",
        weekNumber: weekNumber || "toutes",
        search: search || "aucune",
        page,
        limit,
      });

      // Construction du filtre Prisma
      const where: any = {
        status: "validated",
      };

      if (companyId) {
        where.companyId = parseId(companyId as string, "companyId");
      }

      if (teamId) {
        where.teamId = parseId(teamId as string, "teamId");
      }

      // Filtre par année/semaine
      if (year && weekNumber) {
        const yearNum = parseInt(year as string, 10);
        const weekNum = parseInt(weekNumber as string, 10);

        if (!isNaN(yearNum) && !isNaN(weekNum)) {
          const { weekStartDate, weekEndDate } = getWeekDates(yearNum, weekNum);
          where.weekStartDate = weekStartDate;
          where.weekEndDate = weekEndDate;
        }
      }

      // Pagination
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;
      const skip = (pageNum - 1) * limitNum;

      // Requête avec relations
      const schedules = await prisma.weeklySchedule.findMany({
        where,
        include: {
          team: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limitNum,
      });

      const total = await prisma.weeklySchedule.count({ where });

      // MIGRATION: Transformer les données
      const transformedSchedules = [];

      for (const schedule of schedules) {
        const scheduleJson = (schedule.schedule as Record<string, any[]>) || {};

        // Extraire les employés
        const employeeIds = new Set<number>();
        for (const slots of Object.values(scheduleJson)) {
          for (const slot of slots as any[]) {
            if (slot.employeeId) {
              employeeIds.add(slot.employeeId);
            }
          }
        }

        // Si filtre par employeeId
        if (employeeId) {
          const employeeIdNum = parseId(employeeId as string, "employeeId");
          if (!employeeIds.has(employeeIdNum)) continue;
        }

        // Récupérer infos employés
        const employees = await prisma.employee.findMany({
          where: { id: { in: Array.from(employeeIds) } },
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          },
        });

        for (const emp of employees) {
          transformedSchedules.push({
            _id: `${schedule.id}-${emp.id}`,
            year: schedule.weekStartDate.getFullYear(),
            weekNumber: 1, // À calculer si nécessaire
            employeeId: emp.id,
            employeeName: `${emp.user.firstName} ${emp.user.lastName}`,
            employeeEmail: emp.user.email,
            teamId: schedule.teamId,
            teamName: schedule.team.name,
            companyId: schedule.companyId,
            companyName: schedule.company.name,
            status: schedule.status,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
            updatedByName: schedule.createdBy
              ? `${schedule.createdBy.firstName} ${schedule.createdBy.lastName}`
              : "Utilisateur inconnu",
          });
        }
      }

      // Filtre recherche textuelle
      let filteredSchedules = transformedSchedules;
      if (search && typeof search === "string" && search.trim()) {
        const searchLower = search.trim().toLowerCase();
        filteredSchedules = transformedSchedules.filter(
          (s: any) =>
            s.employeeName?.toLowerCase().includes(searchLower) ||
            s.employeeEmail?.toLowerCase().includes(searchLower) ||
            s.companyName?.toLowerCase().includes(searchLower) ||
            s.teamName?.toLowerCase().includes(searchLower)
        );
      }

      console.log(`MIGRATION: ${filteredSchedules.length} plannings trouvés sur ${total} total`);

      return res.status(200).json({
        success: true,
        data: filteredSchedules,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      });
    } catch (error) {
      console.error("MIGRATION: Erreur récupération plannings admin:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des plannings",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Route GET /api/weekly-schedules/employee/:employeeId
 * MIGRATION: Récupère tous les plannings d'un employé spécifique
 * Accessible aux employés (leurs propres plannings) et aux managers/directeurs/admins
 */
router.get(
  "/employee/:employeeId",
  authenticateToken,
  checkRole(["employee", "manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { employeeId } = req.params;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const isAdmin = req.user.role === "admin";
      const isEmployee = req.user.role === "employee";
      const userCompanyId = req.user.companyId;
      const userId = req.user.userId || req.user.id;

      // MIGRATION: Parse employeeId
      const employeeIdNum = parseId(employeeId, "employeeId");

      // Vérifier que l'employé existe
      const targetEmployee = await prisma.employee.findUnique({
        where: { id: employeeIdNum },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profilePicture: true,
            }
          },
          team: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
        },
      });

      if (!targetEmployee) {
        return res.status(404).json({
          success: false,
          message: "Employé non trouvé",
        });
      }

      // **RESTRICTION EMPLOYÉ**
      if (isEmployee) {
        const currentEmployee = await prisma.employee.findFirst({
          where: { userId: parseId(userId, "userId") },
        });

        if (!currentEmployee || currentEmployee.id !== employeeIdNum) {
          return res.status(403).json({
            success: false,
            message: "Vous ne pouvez consulter que vos propres plannings",
          });
        }
      } else if (!isAdmin) {
        // Managers/directeurs: vérifier la même entreprise
        if (targetEmployee.companyId !== parseId(userCompanyId, "companyId")) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez pas consulter les plannings de cet employé",
          });
        }
      }

      // MIGRATION: Récupérer tous les plannings de l'équipe de l'employé
      const schedules = await prisma.weeklySchedule.findMany({
        where: {
          teamId: targetEmployee.teamId,
          status: "validated",
        },
        include: {
          team: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
        },
        orderBy: { weekStartDate: "desc" },
      });

      // Filtrer uniquement les plannings contenant cet employé
      const employeeSchedules = [];

      for (const schedule of schedules) {
        const scheduleJson = (schedule.schedule as Record<string, any[]>) || {};

        // Vérifier si l'employé est dans ce planning
        let hasEmployeeData = false;
        const employeeScheduleData: Record<string, string[]> = {};
        const employeeDailyNotes: Record<string, string> = {};

        for (const [day, slots] of Object.entries(scheduleJson)) {
          const employeeSlots = (slots as any[]).filter(
            (slot: any) => slot.employeeId === employeeIdNum
          );

          if (employeeSlots.length > 0) {
            hasEmployeeData = true;
            employeeScheduleData[day] = employeeSlots.map(
              (s: any) => `${s.startTime}-${s.endTime}`
            );

            const note = employeeSlots.find((s: any) => s.note)?.note;
            if (note) {
              employeeDailyNotes[day] = note;
            }
          }
        }

        if (hasEmployeeData) {
          employeeSchedules.push({
            _id: `${schedule.id}-${employeeIdNum}`,
            year: schedule.weekStartDate.getFullYear(),
            weekNumber: 1, // À calculer si nécessaire
            employeeId: targetEmployee.id,
            employeeName: `${targetEmployee.user.firstName} ${targetEmployee.user.lastName}`,
            employeePhotoUrl: targetEmployee.user.profilePicture,
            teamId: schedule.teamId,
            teamName: schedule.team.name,
            companyId: schedule.companyId,
            companyName: schedule.company.name,
            scheduleData: employeeScheduleData,
            dailyNotes: employeeDailyNotes,
            status: schedule.status,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
          });
        }
      }

      console.log(
        `MIGRATION: ${employeeSchedules.length} plannings trouvés pour employé ${employeeIdNum}`
      );

      return res.status(200).json({
        success: true,
        data: employeeSchedules,
        count: employeeSchedules.length,
        message: `Plannings de ${targetEmployee.user.firstName} ${targetEmployee.user.lastName}`,
      });
    } catch (error) {
      console.error("MIGRATION: Erreur récupération plannings employé:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des plannings",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;
