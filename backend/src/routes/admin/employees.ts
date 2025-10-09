import express, { Request, Response } from "express";
import prisma from "../../config/prisma";
// Import du type AuthRequest
import { AuthRequest } from "../../middlewares/auth.middleware";

const router = express.Router();

/**
 * @route   GET /api/admin/employees
 * @desc    Récupère tous les employés d'une entreprise spécifique
 * @access  Admin uniquement
 */
router.get(
  "/",
  async (req: AuthRequest, res: Response) => {
    try {
      const { companyId } = req.query;

      // Vérifier que le paramètre companyId est présent
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "Le paramètre companyId est obligatoire",
        });
      }

      // Validation de l'ID de l'entreprise
      const companyIdNum = parseInt(companyId as string, 10);
      if (isNaN(companyIdNum)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'entreprise n'est pas valide",
        });
      }

      // Récupérer les employés de l'entreprise avec leurs informations utilisateur
      const employees = await prisma.employee.findMany({
        where: { companyId: companyIdNum },
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          isActive: true,
        }
      });

      // Formater la réponse pour matcher l'ancien format
      const formattedEmployees = employees.map(emp => ({
        _id: emp.id,
        firstName: emp.user.firstName,
        lastName: emp.user.lastName,
        status: emp.isActive ? 'actif' : 'inactif',
      }));

      // Retourner les résultats
      return res.status(200).json({
        success: true,
        employees: formattedEmployees,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des employés:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des employés",
      });
    }
  }
);

/**
 * @route   GET /api/admin/employees/withteams
 * @desc    Récupère tous les employés d'une entreprise avec leurs équipes associées
 * @access  Admin uniquement
 */
router.get(
  "/withteams",
  async (req: AuthRequest, res: Response) => {
    try {
      const { companyId } = req.query;

      // Vérifier que le paramètre companyId est présent
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "Le paramètre companyId est obligatoire",
        });
      }

      // Validation de l'ID de l'entreprise
      const companyIdNum = parseInt(companyId as string, 10);
      if (isNaN(companyIdNum)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'entreprise n'est pas valide",
        });
      }

      // Récupérer les employés de l'entreprise avec tous les champs nécessaires
      const employees = await prisma.employee.findMany({
        where: { companyId: companyIdNum },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          team: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      // Formater les données pour correspondre à l'ancien format
      const employeesWithTeams = employees.map(employee => {
        const teams = employee.team ? [{
          _id: employee.team.id,
          name: employee.team.name,
        }] : [];

        return {
          _id: employee.id,
          firstName: employee.user.firstName,
          lastName: employee.user.lastName,
          email: employee.user.email,
          status: employee.isActive ? 'actif' : 'inactif',
          userId: employee.userId,
          teamId: employee.teamId,
          companyId: employee.companyId,
          contractHoursPerWeek: employee.contractualHours,
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt,
          teams: teams,
        };
      });

      // Retourner les résultats
      return res.status(200).json({
        success: true,
        data: employeesWithTeams,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des employés avec équipes:",
        error
      );
      return res.status(500).json({
        success: false,
        message:
          "Erreur serveur lors de la récupération des employés avec équipes",
      });
    }
  }
);

/**
 * @route   GET /api/admin/employees/team/:teamId
 * @desc    Récupère tous les employés d'une équipe spécifique
 * @access  Admin uniquement
 */
router.get(
  "/team/:teamId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { teamId } = req.params;

      // Validation de l'ID de l'équipe
      const teamIdNum = parseInt(teamId, 10);
      if (isNaN(teamIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'équipe invalide",
        });
      }

      // Récupérer l'équipe pour vérifier son existence
      const team = await prisma.team.findUnique({
        where: { id: teamIdNum }
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // Récupérer les employés de l'équipe
      const employees = await prisma.employee.findMany({
        where: { teamId: teamIdNum },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      });

      // Formater les données
      const formattedEmployees = employees.map(employee => ({
        _id: employee.id,
        firstName: employee.user.firstName,
        lastName: employee.user.lastName,
        email: employee.user.email,
        status: employee.isActive ? 'actif' : 'inactif',
        userId: employee.userId,
        teamId: employee.teamId,
        companyId: employee.companyId,
        contractHoursPerWeek: employee.contractualHours,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      }));

      return res.status(200).json({
        success: true,
        data: formattedEmployees,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des employés:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des employés",
      });
    }
  }
);

/**
 * @route   PATCH /api/admin/employees/:id
 * @desc    Met à jour un employé existant
 * @access  Admin uniquement
 */
router.patch(
  "/:id",
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { teamId, status } = req.body;

      // Validation de l'ID de l'employé
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'employé n'est pas valide",
        });
      }

      // Vérifier que l'employé existe
      const employee = await prisma.employee.findUnique({
        where: { id: idNum }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "L'employé spécifié n'existe pas",
        });
      }

      // Préparer l'objet de mise à jour
      const updateData: any = {};

      // Mettre à jour le teamId si fourni
      if (teamId !== undefined) {
        // Vérifier que le teamId est valide ou null
        if (teamId !== null) {
          const teamIdNum = parseInt(teamId, 10);
          if (isNaN(teamIdNum)) {
            return res.status(400).json({
              success: false,
              message: "L'identifiant d'équipe n'est pas valide",
            });
          }

          // Si un teamId est fourni, vérifier que l'équipe existe et appartient à la même entreprise
          const team = await prisma.team.findUnique({
            where: { id: teamIdNum }
          });

          if (!team) {
            return res.status(404).json({
              success: false,
              message: "L'équipe spécifiée n'existe pas",
            });
          }

          if (team.companyId !== employee.companyId) {
            return res.status(400).json({
              success: false,
              message:
                "L'équipe n'appartient pas à la même entreprise que l'employé",
            });
          }

          updateData.teamId = teamIdNum;
        } else {
          updateData.teamId = null;
        }
      }

      // Mettre à jour le statut si fourni
      if (status !== undefined) {
        if (status !== "actif" && status !== "inactif") {
          return res.status(400).json({
            success: false,
            message: "Le statut doit être 'actif' ou 'inactif'",
          });
        }

        updateData.isActive = status === "actif";
      }

      // Mettre à jour l'employé
      const updatedEmployee = await prisma.employee.update({
        where: { id: idNum },
        data: updateData,
        include: {
          user: true,
        }
      });

      return res.status(200).json({
        success: true,
        message: "Employé mis à jour avec succès",
        data: updatedEmployee,
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'employé:", error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Employé non trouvé",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour de l'employé",
      });
    }
  }
);

export default router;
