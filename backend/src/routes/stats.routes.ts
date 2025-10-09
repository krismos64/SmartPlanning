/**
 * Routes de statistiques - SmartPlanning
 *
 * MIGRATION POSTGRESQL: Migré de Mongoose vers Prisma ORM
 *
 * Fournit des statistiques selon le rôle:
 * - Admin: stats globales (users, companies, plannings)
 * - Directeur: stats de son entreprise
 * - Manager: stats de ses équipes
 */

import express, { Response, Router } from "express";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";

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
      const userId = req.user.id;
      const role = req.user.role;
      const companyId = req.user.companyId;

      // Filtre de base pour la date de création
      const timeFilter = { createdAt: { gte: startDate } };

      // Traitement selon le rôle
      if (role === "admin") {
        try {
          // Format des stats attendu par le frontend pour l'admin
          const stats = {
            totalUsersCount: 0,
            totalCompaniesCount: 0,
            totalDirectorsCount: 0,
            totalManagersCount: 0,
            totalEmployeesCount: 0,
            generatedPlanningsCount: 0,
            activeUsersCount: 0,
          };

          // Nombre total d'utilisateurs créés dans la période
          stats.totalUsersCount = await prisma.user.count({
            where: timeFilter
          });

          // Nombre d'utilisateurs par rôle créés dans la période
          stats.totalDirectorsCount = await prisma.user.count({
            where: {
              role: "directeur",
              ...timeFilter,
            },
          });

          stats.totalManagersCount = await prisma.user.count({
            where: {
              role: "manager",
              ...timeFilter,
            },
          });

          stats.totalEmployeesCount = await prisma.user.count({
            where: {
              role: "employee",
              ...timeFilter,
            },
          });

          // Nombre total d'entreprises (toutes, pas filtré par période)
          stats.totalCompaniesCount = await prisma.company.count();

          // Nombre de plannings générés dans la période
          stats.generatedPlanningsCount = await prisma.weeklySchedule.count({
            where: timeFilter
          });

          // Utilisateurs actifs récemment (ceux qui se sont connectés depuis startDate)
          stats.activeUsersCount = await prisma.user.count({
            where: {
              lastLogin: { gte: startDate },
            },
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

          // Format des stats attendu par le frontend pour le directeur
          const stats = {
            managersCount: 0,
            teamsCount: 0,
            employeesCount: 0,
            approvedUpcomingLeaveCount: 0,
            pendingLeaveRequestsCount: 0,
          };

          // Nombre de managers dans l'entreprise (créés dans la période)
          stats.managersCount = await prisma.user.count({
            where: {
              role: "manager",
              companyId: companyId,
              ...timeFilter,
            },
          });

          // Nombre d'équipes dans l'entreprise (toutes)
          stats.teamsCount = await prisma.team.count({
            where: { companyId: companyId },
          });

          // Nombre d'employés dans l'entreprise (via table Employee)
          stats.employeesCount = await prisma.employee.count({
            where: { companyId: companyId, isActive: true }
          });

          // Récupérer les IDs de tous les employés actifs de l'entreprise
          const employees = await prisma.employee.findMany({
            where: { companyId: companyId, isActive: true },
            select: { id: true }
          });

          const employeeIds = employees.map((emp) => emp.id);

          if (employeeIds.length > 0) {
            // Congés en attente dans l'entreprise
            stats.pendingLeaveRequestsCount = await prisma.vacationRequest.count({
              where: {
                employeeId: { in: employeeIds },
                status: "pending",
              },
            });

            // Congés approuvés à venir dans l'entreprise
            stats.approvedUpcomingLeaveCount = await prisma.vacationRequest.count({
              where: {
                employeeId: { in: employeeIds },
                status: "approved",
                startDate: { gte: new Date() },
              },
            });
          }

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
          // Récupérer les équipes gérées par ce manager
          // Dans PostgreSQL: Team.managerId = userId (single, pas array)
          const teams = await prisma.team.findMany({
            where: { managerId: userId },
            select: { id: true }
          });

          // Format des stats attendu par le frontend pour les managers
          const stats = {
            teamsCount: 0,
            employeesCount: 0,
            pendingLeaveRequestsCount: 0,
            approvedUpcomingLeaveCount: 0,
          };

          // Compter les équipes
          stats.teamsCount = teams.length;

          // Si aucune équipe n'est trouvée, on retourne des statistiques à 0
          if (teams.length === 0) {
            console.log("Aucune équipe trouvée pour le manager");
            return res.status(200).json({
              success: true,
              data: stats,
            });
          }

          const teamIds = teams.map(team => team.id);

          // Récupérer les employés des équipes via Employee.teamId
          const employees = await prisma.employee.findMany({
            where: {
              teamId: { in: teamIds },
              isActive: true
            },
            select: { id: true }
          });

          const employeeIds = employees.map(emp => emp.id);

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
          stats.pendingLeaveRequestsCount = await prisma.vacationRequest.count({
            where: {
              employeeId: { in: employeeIds },
              status: "pending",
            },
          });

          // Congés approuvés à venir
          stats.approvedUpcomingLeaveCount = await prisma.vacationRequest.count({
            where: {
              employeeId: { in: employeeIds },
              status: "approved",
              startDate: { gte: new Date() },
            },
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
