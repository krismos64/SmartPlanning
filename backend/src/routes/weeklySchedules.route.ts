import express, { Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import { TeamModel } from "../models/Team.model";
import WeeklyScheduleModel from "../models/WeeklySchedule.model";

const router = express.Router();

/**
 * Route POST /api/weekly-schedules
 * Crée un planning hebdomadaire validé manuellement
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
      if (!req.user || (!req.user.userId && !req.user.id && !req.user._id)) {
        console.log("Erreur d'authentification: req.user =", req.user);
        return res.status(400).json({
          message: "Utilisateur non authentifié (updatedBy manquant)",
        });
      }

      // Utiliser userId, id ou _id selon ce qui est disponible
      const authenticatedUserId =
        req.user.userId || req.user.id || req.user._id;
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
 * Récupère les plannings hebdomadaires validés (status: "approved") pour une semaine et une année données
 * Sécurisé avec multitenant: filtre uniquement les employés de l'entreprise de l'utilisateur connecté
 * Pour les employés : seuls leurs propres plannings sont accessibles
 * Accessible aux utilisateurs authentifiés avec roles directeur, manager, employé et admin
 */
router.get(
  "/week/:year/:weekNumber",
  authenticateToken,
  checkRole(["directeur", "manager", "employee", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { year, weekNumber } = req.params;
      const { teamId, employeeId } = req.query;

      // Validation de l'authentification et récupération de companyId
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // Pour les admins, pas de restriction de companyId
      const isAdmin = req.user.role === "admin";
      const isEmployee = req.user.role === "employee";
      const userCompanyId = req.user.companyId;
      const userId = req.user.userId || req.user._id || req.user.id;

      // Vérification du companyId seulement pour les non-admins
      if (!isAdmin && !userCompanyId) {
        return res.status(401).json({
          success: false,
          message: "CompanyId manquant pour un utilisateur non-admin",
        });
      }

      // Logs pour déboguer
      console.log("Recherche de plannings hebdomadaires:", {
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

      // Validation des paramètres
      if (isNaN(yearNumber) || isNaN(weekNumberValue)) {
        return res.status(400).json({
          success: false,
          message: "Année ou numéro de semaine invalide",
        });
      }

      // Construction du filtre de base avec restriction par entreprise et statut
      let aggregationPipeline: any[] = [];

      // Étape de correspondance initiale pour les plannings approuvés
      const matchStage: any = {
        status: "approved",
        year: yearNumber,
        weekNumber: weekNumberValue,
      };

      // **RESTRICTION POUR LES EMPLOYÉS**
      if (isEmployee) {
        // Pour les employés, on doit d'abord trouver leur document Employee
        const EmployeeModel = require("../models/Employee.model").default;
        const employee = await EmployeeModel.findOne({ userId: userId }).lean();

        if (!employee) {
          return res.status(404).json({
            success: false,
            message: "Profil employé non trouvé",
          });
        }

        // Si un teamId est spécifié, vérifier que c'est bien l'équipe de l'employé
        if (teamId && isValidObjectId(teamId as string)) {
          // Vérifier que le teamId correspond à l'équipe de l'employé
          if (employee.teamId && employee.teamId.toString() === teamId) {
            console.log(
              `Employé ${userId} consulte les plannings de son équipe (teamId: ${teamId})`
            );
            // Ne pas restreindre par employeeId, permettre de voir toute l'équipe
            // Le filtre par équipe sera appliqué plus tard dans l'agrégation
          } else {
            console.log(
              `Employé ${userId} tente d'accéder à une équipe non autorisée (teamId: ${teamId}, son équipe: ${employee.teamId})`
            );
            return res.status(403).json({
              success: false,
              message:
                "Vous ne pouvez consulter que les plannings de votre propre équipe",
            });
          }
        } else {
          // Pas de teamId spécifié, restricter aux plannings de cet employé uniquement
          matchStage.employeeId = employee._id;
          console.log(
            `Employé ${userId} consulte ses propres plannings (employeeId: ${employee._id})`
          );
        }
      } else {
        // Pour les autres rôles (manager, directeur), appliquer les filtres normaux

        // Filtre par employé si spécifié
        if (employeeId && isValidObjectId(employeeId as string)) {
          matchStage.employeeId = new mongoose.Types.ObjectId(
            employeeId as string
          );
        }

        // Filtre par équipe si spécifié
        if (teamId && isValidObjectId(teamId as string)) {
          // Note: le filtre par équipe sera géré via l'agrégation avec Employee
        }
      }

      // Construction du pipeline d'agrégation
      aggregationPipeline = [
        // Première étape: correspondre aux plannings avec le filtre de base
        {
          $match: matchStage,
        },
        // Deuxième étape: joindre avec la collection des employés
        {
          $lookup: {
            from: "employees",
            localField: "employeeId",
            foreignField: "_id",
            as: "employeeData",
          },
        },
        // Troisième étape: déstructurer le tableau employeeData
        {
          $unwind: "$employeeData",
        },
      ];

      // Ajouter les filtres d'entreprise et d'équipe
      // Filtre par entreprise (sauf pour les admins)
      if (!isAdmin) {
        aggregationPipeline.push({
          $match: {
            "employeeData.companyId":
              mongoose.Types.ObjectId.createFromHexString(userCompanyId),
          },
        });
      }

      // Filtre par équipe si spécifié (pour tous les rôles maintenant)
      if (teamId && isValidObjectId(teamId as string)) {
        try {
          console.log("Filtrage par équipe:", teamId);

          const teamQuery = isAdmin
            ? { _id: teamId }
            : { _id: teamId, companyId: userCompanyId };

          const team = await TeamModel.findOne(teamQuery).lean();

          if (!team) {
            console.log(
              `Équipe non trouvée${
                !isAdmin ? " ou n'appartient pas à l'entreprise" : ""
              }: ${teamId}`
            );
            return res.status(200).json({
              success: true,
              data: [],
              count: 0,
              message: "Équipe introuvable ou non autorisée",
            });
          }

          console.log(`Équipe trouvée: ${team.name}`);

          aggregationPipeline.push({
            $match: {
              "employeeData.teamId":
                mongoose.Types.ObjectId.createFromHexString(teamId as string),
            },
          });
        } catch (err) {
          console.error("Erreur lors de la vérification de l'équipe:", err);
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la vérification de l'équipe",
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // Ajouter les étapes finales d'agrégation
      aggregationPipeline.push(
        // Joindre avec la collection des équipes
        {
          $lookup: {
            from: "teams",
            localField: "employeeData.teamId",
            foreignField: "_id",
            as: "teamData",
          },
        },
        // Joindre avec la collection des employés pour les managers
        {
          $lookup: {
            from: "employees",
            localField: "teamData.managerIds",
            foreignField: "_id",
            as: "managerData",
          },
        },
        {
          $project: {
            _id: 1,
            employeeId: "$employeeData._id",
            employeeName: {
              $concat: [
                "$employeeData.firstName",
                " ",
                "$employeeData.lastName",
              ],
            },
            employeePhotoUrl: "$employeeData.photoUrl",
            teamId: "$employeeData.teamId",
            teamName: {
              $cond: {
                if: { $gt: [{ $size: "$teamData" }, 0] },
                then: { $arrayElemAt: ["$teamData.name", 0] },
                else: null,
              },
            },
            managerName: {
              $cond: {
                if: { $gt: [{ $size: "$managerData" }, 0] },
                then: {
                  $concat: [
                    { $arrayElemAt: ["$managerData.firstName", 0] },
                    " ",
                    { $arrayElemAt: ["$managerData.lastName", 0] },
                  ],
                },
                else: null,
              },
            },
            year: 1,
            weekNumber: 1,
            scheduleData: 1,
            dailyNotes: 1,
            notes: 1,
            dailyDates: 1,
            totalWeeklyMinutes: 1,
            status: 1,
            updatedBy: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        }
      );

      console.log(
        "Exécution de l'agrégation MongoDB:",
        JSON.stringify(aggregationPipeline, null, 2)
      );

      const schedules = await WeeklyScheduleModel.aggregate(
        aggregationPipeline
      );

      console.log(
        `${schedules.length} plannings trouvés après filtrage par entreprise`
      );

      return res.status(200).json({
        success: true,
        data: schedules,
        count: schedules.length,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des plannings:", error);
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
 * Met à jour un planning hebdomadaire existant
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

      // Logs pour déboguer
      console.log("Requête reçue pour mise à jour de planning");
      console.log("ID planning:", id);
      console.log("User dans req:", req.user);

      // 🔒 Vérification de l'authentification de l'utilisateur
      if (!req.user || (!req.user.userId && !req.user.id && !req.user._id)) {
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

      // Utiliser userId, id ou _id selon ce qui est disponible
      const authenticatedUserId =
        req.user.userId || req.user.id || req.user._id;
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
 * Pour les employés : seulement leurs propres plannings
 * Accessible aux utilisateurs authentifiés
 */
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de planning invalide",
        });
      }

      // Vérifier l'utilisateur
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const isEmployee = req.user.role === "employee";
      const userId = req.user.userId || req.user._id || req.user.id;

      let schedule;

      if (isEmployee) {
        // Pour les employés, vérifier qu'ils ne peuvent voir que leurs propres plannings
        const EmployeeModel = require("../models/Employee.model").default;
        const employee = await EmployeeModel.findOne({ userId: userId }).lean();

        if (!employee) {
          return res.status(404).json({
            success: false,
            message: "Profil employé non trouvé",
          });
        }

        // Récupérer le planning seulement s'il appartient à cet employé
        schedule = await WeeklyScheduleModel.findOne({
          _id: id,
          employeeId: employee._id,
        })
          .populate("employeeId", "firstName lastName")
          .populate("updatedBy", "firstName lastName")
          .lean();

        if (!schedule) {
          return res.status(403).json({
            success: false,
            message: "Vous n'êtes autorisé à voir que vos propres plannings",
          });
        }
      } else {
        // Pour les autres rôles, récupération normale
        schedule = await WeeklyScheduleModel.findById(id)
          .populate("employeeId", "firstName lastName")
          .populate("updatedBy", "firstName lastName")
          .lean();

        if (!schedule) {
          return res.status(404).json({
            success: false,
            message: "Planning introuvable",
          });
        }
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
  }
);

/**
 * Route DELETE /api/weekly-schedules/:id
 * Supprime un planning spécifique
 * Accessible aux managers, directeurs et admins
 */
router.delete(
  "/:id",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
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

/**
 * Route GET /api/weekly-schedules/admin/all
 * Récupère tous les plannings pour l'admin avec filtres par entreprise, équipe et employé
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

      console.log("Admin - Récupération des plannings avec filtres:", {
        companyId: companyId || "tous",
        teamId: teamId || "tous",
        employeeId: employeeId || "tous",
        year: year || "toutes",
        weekNumber: weekNumber || "toutes",
        search: search || "aucune",
        page,
        limit,
      });

      // Construction du pipeline d'agrégation
      const matchStage: any = {
        status: "approved", // Seulement les plannings approuvés
      };

      // Filtre par année si spécifié
      if (year) {
        const yearNumber = parseInt(year as string, 10);
        if (!isNaN(yearNumber)) {
          matchStage.year = yearNumber;
        }
      }

      // Filtre par semaine si spécifié
      if (weekNumber) {
        const weekNum = parseInt(weekNumber as string, 10);
        if (!isNaN(weekNum)) {
          matchStage.weekNumber = weekNum;
        }
      }

      // Filtre par employé si spécifié
      if (employeeId && isValidObjectId(employeeId as string)) {
        matchStage.employeeId = new mongoose.Types.ObjectId(
          employeeId as string
        );
      }

      const aggregationPipeline: any[] = [
        { $match: matchStage },

        // Jointure avec les employés
        {
          $lookup: {
            from: "employees",
            localField: "employeeId",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },

        // Jointure avec les équipes
        {
          $lookup: {
            from: "teams",
            localField: "employee.teamId",
            foreignField: "_id",
            as: "team",
          },
        },

        // Jointure avec les entreprises
        {
          $lookup: {
            from: "companies",
            localField: "employee.companyId",
            foreignField: "_id",
            as: "company",
          },
        },

        // Jointure avec l'utilisateur qui a mis à jour
        {
          $lookup: {
            from: "users",
            localField: "updatedBy",
            foreignField: "_id",
            as: "updatedByUser",
          },
        },
      ];

      // Filtrage par entreprise
      if (companyId && isValidObjectId(companyId as string)) {
        aggregationPipeline.push({
          $match: {
            "employee.companyId": new mongoose.Types.ObjectId(
              companyId as string
            ),
          },
        });
      }

      // Filtrage par équipe
      if (teamId && isValidObjectId(teamId as string)) {
        aggregationPipeline.push({
          $match: {
            "employee.teamId": new mongoose.Types.ObjectId(teamId as string),
          },
        });
      }

      // Projection finale
      aggregationPipeline.push({
        $project: {
          _id: 1,
          year: 1,
          weekNumber: 1,
          scheduleData: 1,
          dailyNotes: 1,
          dailyDates: 1,
          totalWeeklyMinutes: 1,
          notes: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          employeeId: "$employee._id",
          employeeName: {
            $concat: ["$employee.firstName", " ", "$employee.lastName"],
          },
          employeeEmail: "$employee.email",
          teamId: { $arrayElemAt: ["$team._id", 0] },
          teamName: { $arrayElemAt: ["$team.name", 0] },
          companyId: { $arrayElemAt: ["$company._id", 0] },
          companyName: { $arrayElemAt: ["$company.name", 0] },
          updatedByName: {
            $concat: [
              { $arrayElemAt: ["$updatedByUser.firstName", 0] },
              " ",
              { $arrayElemAt: ["$updatedByUser.lastName", 0] },
            ],
          },
        },
      });

      // Filtrage par recherche textuelle si spécifié
      if (search && typeof search === "string" && search.trim()) {
        const searchRegex = new RegExp(search.trim(), "i");
        aggregationPipeline.push({
          $match: {
            $or: [
              { employeeName: searchRegex },
              { employeeEmail: searchRegex },
              { companyName: searchRegex },
              { teamName: searchRegex },
            ],
          },
        });
      }

      // Tri par date de mise à jour décroissante
      aggregationPipeline.push({
        $sort: { updatedAt: -1 },
      });

      // Pagination
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;
      const skip = (pageNum - 1) * limitNum;

      // Compter le total pour la pagination
      const countPipeline = [...aggregationPipeline, { $count: "total" }];
      const countResult = await WeeklyScheduleModel.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      // Ajouter la pagination à l'agrégation principale
      aggregationPipeline.push({ $skip: skip }, { $limit: limitNum });

      console.log(
        "Exécution de l'agrégation pour admin:",
        JSON.stringify(aggregationPipeline, null, 2)
      );

      const schedules = await WeeklyScheduleModel.aggregate(
        aggregationPipeline
      );

      console.log(`${schedules.length} plannings trouvés sur ${total} total`);

      return res.status(200).json({
        success: true,
        data: schedules,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des plannings admin:",
        error
      );
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
 * Récupère tous les plannings d'un employé spécifique
 * Accessible aux employés (leurs propres plannings) et aux managers/directeurs/admins
 */
router.get(
  "/employee/:employeeId",
  authenticateToken,
  checkRole(["employee", "manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { employeeId } = req.params;

      // Validation de l'authentification
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const isAdmin = req.user.role === "admin";
      const isEmployee = req.user.role === "employee";
      const userCompanyId = req.user.companyId;
      const userId = req.user.userId || req.user._id || req.user.id;

      // Validation de l'ID employé
      if (!isValidObjectId(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "ID employé invalide",
        });
      }

      // Vérifier que l'employé existe et appartient à la bonne entreprise
      const EmployeeModel = require("../models/Employee.model").default;
      const targetEmployee = await EmployeeModel.findById(employeeId).lean();

      if (!targetEmployee) {
        return res.status(404).json({
          success: false,
          message: "Employé non trouvé",
        });
      }

      // Pour les employés : ils ne peuvent voir que leurs propres plannings
      if (isEmployee) {
        const currentEmployee = await EmployeeModel.findOne({
          userId: userId,
        }).lean();

        if (!currentEmployee || currentEmployee._id.toString() !== employeeId) {
          return res.status(403).json({
            success: false,
            message: "Vous ne pouvez consulter que vos propres plannings",
          });
        }
      } else if (!isAdmin) {
        // Pour les managers/directeurs : vérifier que l'employé appartient à leur entreprise
        if (targetEmployee.companyId.toString() !== userCompanyId) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez pas consulter les plannings de cet employé",
          });
        }
      }

      // Construire le pipeline d'agrégation
      const aggregationPipeline: any[] = [
        {
          $match: {
            employeeId: new mongoose.Types.ObjectId(employeeId),
            status: "approved", // Seulement les plannings approuvés
          },
        },

        // Jointure avec les employés
        {
          $lookup: {
            from: "employees",
            localField: "employeeId",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },

        // Jointure avec les équipes
        {
          $lookup: {
            from: "teams",
            localField: "employee.teamId",
            foreignField: "_id",
            as: "team",
          },
        },

        // Jointure avec les entreprises
        {
          $lookup: {
            from: "companies",
            localField: "employee.companyId",
            foreignField: "_id",
            as: "company",
          },
        },

        // Projection des données
        {
          $project: {
            _id: 1,
            year: 1,
            weekNumber: 1,
            scheduleData: 1,
            dailyNotes: 1,
            dailyDates: 1,
            totalWeeklyMinutes: 1,
            notes: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            employeeId: "$employee._id",
            employeeName: {
              $concat: ["$employee.firstName", " ", "$employee.lastName"],
            },
            employeePhotoUrl: "$employee.photoUrl",
            teamId: { $arrayElemAt: ["$team._id", 0] },
            teamName: { $arrayElemAt: ["$team.name", 0] },
            companyId: { $arrayElemAt: ["$company._id", 0] },
            companyName: { $arrayElemAt: ["$company.name", 0] },
          },
        },

        // Tri par année et semaine (plus récent en premier)
        {
          $sort: { year: -1, weekNumber: -1 },
        },
      ];

      const schedules = await WeeklyScheduleModel.aggregate(
        aggregationPipeline
      );

      console.log(
        `${schedules.length} plannings trouvés pour l'employé ${employeeId}`
      );

      return res.status(200).json({
        success: true,
        data: schedules,
        count: schedules.length,
        message: `Plannings de ${targetEmployee.firstName} ${targetEmployee.lastName}`,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des plannings employé:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des plannings",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;
