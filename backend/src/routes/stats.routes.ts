import express, { Response, Router } from "express";
import mongoose from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import { Company } from "../models/Company.model";
import { TeamModel } from "../models/Team.model";
import User from "../models/User.model";
import VacationRequestModel from "../models/VacationRequest.model";

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

      // Log pour débuggage
      console.log("User dans la route stats:", req.user);

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
          startDate.setDate(now.getDate() - 30);
          break;
        case "year":
          startDate.setDate(now.getDate() - 365);
          break;
        default:
          startDate.setDate(now.getDate() - 7); // Par défaut, 7 jours
      }

      // Récupération du rôle et de l'id de l'utilisateur
      const userId = req.user._id;
      const role = req.user.role;
      const companyId = req.user.companyId;

      // Log pour débuggage
      console.log(`UserId: ${userId}, Role: ${role}, CompanyId: ${companyId}`);

      // Statistiques à retourner en fonction du rôle
      let stats: Record<string, number> = {};

      if (role === "manager") {
        try {
          // 1. Obtenir les équipes gérées par ce manager
          const teams = await TeamModel.find({
            managerIds: mongoose.Types.ObjectId.isValid(userId)
              ? new mongoose.Types.ObjectId(userId)
              : userId,
          });
          console.log("Équipes trouvées:", teams.length);

          // Si des équipes sont trouvées, extraire leurs IDs
          const teamIds = teams.map((team) => team._id);

          // 2. Compter les employés dans ces équipes (via la liste employeeIds)
          let employeesCount = 0;
          teams.forEach((team) => {
            if (team.employeeIds && Array.isArray(team.employeeIds)) {
              employeesCount += team.employeeIds.length;
            }
          });

          // 3. Récupérer les demandes de congés en attente pour ces équipes
          const pendingLeaves = await VacationRequestModel.countDocuments({
            employeeId: { $in: teams.flatMap((t) => t.employeeIds || []) },
            status: "pending",
          });

          // 4. Récupérer les congés approuvés à venir
          const approvedUpcomingLeaves =
            await VacationRequestModel.countDocuments({
              employeeId: { $in: teams.flatMap((t) => t.employeeIds || []) },
              status: "approved",
              startDate: { $gte: new Date() },
            });

          stats = {
            teamsCount: teams.length,
            employeesCount: employeesCount,
            pendingLeaveRequestsCount: pendingLeaves,
            approvedUpcomingLeaveCount: approvedUpcomingLeaves,
          };
        } catch (error) {
          console.error("Erreur lors du calcul des stats manager:", error);
          stats = {
            teamsCount: 0,
            employeesCount: 0,
            pendingLeaveRequestsCount: 0,
            approvedUpcomingLeaveCount: 0,
          };
        }
      } else if (role === "directeur") {
        try {
          // Convertir companyId en ObjectId si ce n'est pas déjà le cas
          const companyObjectId = mongoose.Types.ObjectId.isValid(companyId)
            ? new mongoose.Types.ObjectId(companyId)
            : companyId;

          // 1. Nombre de managers dans l'entreprise du directeur
          const managers = await User.countDocuments({
            companyId: companyObjectId,
            role: "manager",
            status: "active",
          });

          // 2. Nombre d'équipes dans l'entreprise
          const teams = await TeamModel.countDocuments({
            companyId: companyObjectId,
          });

          // 3. Nombre d'employés dans toutes les équipes de l'entreprise
          const allTeams = await TeamModel.find({ companyId: companyObjectId });
          let employeesCount = 0;
          allTeams.forEach((team) => {
            if (team.employeeIds && Array.isArray(team.employeeIds)) {
              employeesCount += team.employeeIds.length;
            }
          });

          // 4. Congés approuvés à venir dans l'entreprise
          const allEmployeeIds = allTeams.flatMap((t) => t.employeeIds || []);

          const approvedUpcomingLeaves =
            await VacationRequestModel.countDocuments({
              employeeId: { $in: allEmployeeIds },
              status: "approved",
              startDate: { $gte: new Date() },
            });

          // 5. Congés en attente dans l'entreprise
          const pendingLeaves = await VacationRequestModel.countDocuments({
            employeeId: { $in: allEmployeeIds },
            status: "pending",
          });

          stats = {
            managersCount: managers,
            teamsCount: teams,
            employeesCount: employeesCount,
            approvedUpcomingLeaveCount: approvedUpcomingLeaves,
            pendingLeaveRequestsCount: pendingLeaves,
          };
        } catch (error) {
          console.error("Erreur lors du calcul des stats directeur:", error);
          stats = {
            managersCount: 0,
            teamsCount: 0,
            employeesCount: 0,
            approvedUpcomingLeaveCount: 0,
            pendingLeaveRequestsCount: 0,
          };
        }
      } else if (role === "admin") {
        try {
          // 1. Nombre total d'utilisateurs
          const totalUsers = await User.countDocuments();

          // 2. Nombre total d'entreprises
          const totalCompanies = await Company.countDocuments();

          // 3. Nombre d'utilisateurs par rôle
          const directors = await User.countDocuments({ role: "directeur" });
          const managers = await User.countDocuments({ role: "manager" });
          const employees = await User.countDocuments({ role: "employee" });

          // 4. Nombre de plannings générés (estimation par les équipes)
          const teams = await TeamModel.countDocuments();

          // 5. Nombre d'utilisateurs actifs récemment
          const activeUsers = await User.countDocuments({
            lastLogin: { $gte: startDate },
          });

          stats = {
            totalUsersCount: totalUsers,
            totalCompaniesCount: totalCompanies,
            totalDirectorsCount: directors,
            totalManagersCount: managers,
            totalEmployeesCount: employees,
            generatedPlanningsCount: teams * 4, // Estimation: 4 plannings par équipe
            activeUsersCount: activeUsers,
          };
        } catch (error) {
          console.error("Erreur lors du calcul des stats admin:", error);
          stats = {
            totalUsersCount: 0,
            totalCompaniesCount: 0,
            totalDirectorsCount: 0,
            totalManagersCount: 0,
            totalEmployeesCount: 0,
            generatedPlanningsCount: 0,
            activeUsersCount: 0,
          };
        }
      }

      // Envoi des statistiques au client
      return res.status(200).json({
        success: true,
        data: stats,
      });
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
