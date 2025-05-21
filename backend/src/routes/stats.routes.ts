import express, { Response, Router } from "express";
import mongoose from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import { TeamModel } from "../models/Team.model";
import User from "../models/User.model";
import VacationRequestModel from "../models/VacationRequest.model";
import WeeklyScheduleModel from "../models/WeeklySchedule.model";

const router: Router = express.Router();

/**
 * @route   GET /api/stats/overview
 * @desc    Récupère les statistiques en fonction du rôle de l'utilisateur et de la période
 * @access  Privé
 */
router.get(
  "/overview",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      // Vérification que l'utilisateur est bien authentifié
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Non autorisé - Authentification requise",
        });
      }

      // Récupération du paramètre de période avec week comme valeur par défaut
      const period = (req.query.period as string) || "week";

      // Calcul de la date de début en fonction de la période
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 7); // Par défaut, 7 jours
      }

      // Récupération des informations utilisateur
      const userId = req.user._id;
      const role = req.user.role;
      const companyId = req.user.companyId;

      // Objet contenant les statistiques à retourner
      let stats = {
        totalEmployees: 0,
        totalTeams: 0,
        totalVacations: 0,
        totalSchedules: 0,
        totalIncidents: 0,
      };

      // Filtre de base pour la date de création
      const timeFilter = { createdAt: { $gte: startDate } };

      // Traitement selon le rôle
      if (role === "admin") {
        try {
          // Format des stats attendu par le frontend pour l'admin
          let stats = {
            totalUsersCount: 0,
            totalCompaniesCount: 0,
            totalDirectorsCount: 0,
            totalManagersCount: 0,
            totalEmployeesCount: 0,
            generatedPlanningsCount: 0,
            activeUsersCount: 0,
          };

          // Nombre total d'utilisateurs
          stats.totalUsersCount = await User.countDocuments(timeFilter);

          // Nombre d'utilisateurs par rôle
          stats.totalDirectorsCount = await User.countDocuments({
            role: "directeur",
            ...timeFilter,
          });

          stats.totalManagersCount = await User.countDocuments({
            role: "manager",
            ...timeFilter,
          });

          stats.totalEmployeesCount = await User.countDocuments({
            role: "employee",
            ...timeFilter,
          });

          // Nombre total d'entreprises (companies collection)
          const companies = await mongoose.connection.db
            .collection("companies")
            .countDocuments();
          stats.totalCompaniesCount = companies;

          // Nombre de plannings générés
          stats.generatedPlanningsCount =
            await WeeklyScheduleModel.countDocuments(timeFilter);

          // Utilisateurs actifs récemment (ceux qui se sont connectés depuis startDate)
          stats.activeUsersCount = await User.countDocuments({
            lastLogin: { $gte: startDate },
          });

          // Debug pour vérifier les résultats
          console.log(`Stats pour admin: `, stats);

          return res.status(200).json({
            success: true,
            data: stats,
          });
        } catch (error) {
          console.error("Erreur lors du calcul des stats admin:", error);
          return res.status(500).json({
            success: false,
            message:
              "Erreur lors du calcul des statistiques pour l'administrateur",
          });
        }
      } else if (role === "directeur") {
        try {
          // Validation du companyId
          if (!companyId) {
            return res.status(400).json({
              success: false,
              message: "CompanyId manquant pour le directeur",
            });
          }

          // Conversion en ObjectId si nécessaire
          const companyObjectId = mongoose.Types.ObjectId.isValid(companyId)
            ? new mongoose.Types.ObjectId(companyId.toString())
            : companyId;

          // Format des stats attendu par le frontend pour le directeur
          let stats = {
            managersCount: 0,
            teamsCount: 0,
            employeesCount: 0,
            approvedUpcomingLeaveCount: 0,
            pendingLeaveRequestsCount: 0,
          };

          // Nombre de managers dans l'entreprise
          stats.managersCount = await User.countDocuments({
            role: "manager",
            companyId: companyObjectId,
            ...timeFilter,
          });

          // Nombre d'équipes dans l'entreprise
          stats.teamsCount = await TeamModel.countDocuments({
            companyId: companyObjectId,
          });

          // Récupérer les IDs de tous les employés de l'entreprise
          const employeesInCompany = await User.find(
            { role: "employee", companyId: companyObjectId },
            { _id: 1 }
          );

          const employeeIds = employeesInCompany.map((emp) => emp._id);

          // Nombre d'employés dans l'entreprise
          stats.employeesCount = employeeIds.length;

          // Congés en attente dans l'entreprise
          stats.pendingLeaveRequestsCount =
            await VacationRequestModel.countDocuments({
              employeeId: { $in: employeeIds },
              status: "pending",
            });

          // Congés approuvés à venir dans l'entreprise
          stats.approvedUpcomingLeaveCount =
            await VacationRequestModel.countDocuments({
              employeeId: { $in: employeeIds },
              status: "approved",
              startDate: { $gte: new Date() },
            });

          // Debug pour vérifier les résultats
          console.log(`Stats pour directeur ${userId}: `, stats);

          return res.status(200).json({
            success: true,
            data: stats,
          });
        } catch (error) {
          console.error("Erreur lors du calcul des stats directeur:", error);
          return res.status(500).json({
            success: false,
            message: "Erreur lors du calcul des statistiques pour le directeur",
          });
        }
      } else if (role === "manager") {
        try {
          // Récupérer les équipes gérées par ce manager sans filtrer par date de création
          // Convertir l'ID en ObjectId pour la recherche
          const managerObjectId = mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId.toString())
            : userId;

          const teams = await TeamModel.find({
            managerIds: managerObjectId,
          });

          // Format des stats attendu par le frontend pour les managers
          let stats = {
            teamsCount: 0,
            employeesCount: 0,
            pendingLeaveRequestsCount: 0,
            approvedUpcomingLeaveCount: 0,
          };

          // Compter les équipes - sans filtre de date car on veut toutes les équipes gérées
          stats.teamsCount = teams.length;

          // Collecter tous les IDs des employés des équipes
          const employeeIds = teams.flatMap((team) =>
            team.employeeIds ? team.employeeIds : []
          );

          // Nombre d'employés dans les équipes du manager
          stats.employeesCount = employeeIds.length;

          // Si aucun employé n'est trouvé, on retourne des statistiques à 0
          if (employeeIds.length === 0) {
            console.log("Aucun employé trouvé dans les équipes du manager");
            return res.status(200).json({
              success: true,
              data: stats,
            });
          }

          // Debug pour vérifier les employés trouvés
          console.log(`Nombre d'employés trouvés: ${employeeIds.length}`);

          // Demandes de congés en attente
          stats.pendingLeaveRequestsCount =
            await VacationRequestModel.countDocuments({
              employeeId: { $in: employeeIds },
              status: "pending",
            });

          // Congés approuvés à venir
          stats.approvedUpcomingLeaveCount =
            await VacationRequestModel.countDocuments({
              employeeId: { $in: employeeIds },
              status: "approved",
              startDate: { $gte: new Date() },
            });

          // Debug pour vérifier les résultats
          console.log(`Stats pour manager ${userId}: `, stats);

          return res.status(200).json({
            success: true,
            data: stats,
          });
        } catch (error) {
          console.error("Erreur lors du calcul des stats manager:", error);
          return res.status(500).json({
            success: false,
            message: "Erreur lors du calcul des statistiques pour le manager",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "Rôle non autorisé pour accéder aux statistiques",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la récupération des statistiques",
      });
    }
  }
);

export default router;
