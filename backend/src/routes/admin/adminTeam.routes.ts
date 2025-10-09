import express, { Request, Response } from "express";
import prisma from "../../config/prisma";

// Interface pour la création d'équipe
interface CreateTeamInput {
  name: string;
  managerIds: number[];
  employeeIds: number[];
  companyId: number;
}

// Interface pour la mise à jour d'équipe
interface UpdateTeamInput {
  name?: string;
  managerIds?: number[];
  employeeIds?: number[];
}

const router = express.Router();

/**
 * @route GET /api/admin/teams
 * @desc Récupérer toutes les équipes avec filtrage par companyId optionnel
 * @access Admin
 */
router.get(
  "/",
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.query;

      // Construire le where clause
      const where: any = {};
      if (companyId) {
        const companyIdNum = parseInt(companyId as string, 10);
        if (isNaN(companyIdNum)) {
          return res.status(400).json({
            success: false,
            message: "ID d'entreprise invalide",
          });
        }
        where.companyId = companyIdNum;
      }

      // Récupérer les équipes avec leurs relations
      const teams = await prisma.team.findMany({
        where,
        include: {
          company: {
            select: { name: true }
          },
          employees: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Récupérer les managers pour chaque équipe
      const teamsWithManagers = await Promise.all(
        teams.map(async (team) => {
          if (team.managerIds && team.managerIds.length > 0) {
            const managers = await prisma.user.findMany({
              where: {
                id: { in: team.managerIds }
              },
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            });
            return { ...team, managers };
          }
          return { ...team, managers: [] };
        })
      );

      res.status(200).json({
        success: true,
        data: teamsWithManagers,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des équipes:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des équipes",
      });
    }
  }
);

/**
 * @route GET /api/admin/teams/company/:companyId
 * @desc Récupérer les équipes d'une entreprise spécifique
 * @access Admin
 */
router.get(
  "/company/:companyId",
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const companyIdNum = parseInt(companyId, 10);

      if (isNaN(companyIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      const teams = await prisma.team.findMany({
        where: { companyId: companyIdNum }
      });

      res.status(200).json({
        success: true,
        data: teams,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des équipes par entreprise:",
        error
      );
      res.status(500).json({
        success: false,
        message:
          "Erreur serveur lors de la récupération des équipes par entreprise",
      });
    }
  }
);

/**
 * @route POST /api/admin/teams
 * @desc Créer une nouvelle équipe
 * @access Admin
 */
router.post(
  "/",
  async (req: Request, res: Response) => {
    try {
      const { name, companyId } = req.body;

      if (!name || !companyId) {
        return res.status(400).json({
          success: false,
          message: "Le nom et l'ID de l'entreprise sont requis",
        });
      }

      const companyIdNum = parseInt(companyId, 10);
      if (isNaN(companyIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      const newTeam = await prisma.team.create({
        data: {
          name,
          companyId: companyIdNum,
        },
      });

      res.status(201).json({
        success: true,
        data: newTeam,
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'équipe:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la création de l'équipe",
      });
    }
  }
);

/**
 * @route   PATCH /api/admin/teams/:id
 * @desc    Met à jour une équipe existante
 * @access  Admin uniquement
 */
router.patch(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, managerIds, employeeIds } = req.body as UpdateTeamInput;

      // Vérifier que l'ID de l'équipe est valide
      const teamId = parseInt(id, 10);
      if (isNaN(teamId)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'équipe n'est pas valide",
        });
      }

      // Vérifier que l'équipe existe
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });
      if (!team) {
        return res.status(404).json({
          success: false,
          message: "L'équipe spécifiée n'existe pas",
        });
      }

      // Préparer l'objet de mise à jour
      const updateData: any = {};

      if (name !== undefined) {
        updateData.name = name;
      }

      if (managerIds !== undefined) {
        // Vérifier que tous les managers existent, ont le rôle "manager" et appartiennent à l'entreprise
        const managerPromises = managerIds.map(async (managerId) => {
          const manager = await prisma.user.findUnique({
            where: { id: managerId }
          });
          if (!manager) {
            throw new Error(`Le manager avec l'ID ${managerId} n'existe pas`);
          }
          if (manager.role !== "manager") {
            throw new Error(
              `L'utilisateur avec l'ID ${managerId} n'est pas un manager`
            );
          }
          if (
            !manager.companyId ||
            manager.companyId !== team.companyId
          ) {
            throw new Error(
              `Le manager avec l'ID ${managerId} n'appartient pas à l'entreprise de cette équipe`
            );
          }
          return manager;
        });

        try {
          await Promise.all(managerPromises);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: (error as Error).message,
          });
        }

        updateData.managerIds = managerIds;
      }

      if (employeeIds !== undefined) {
        const employeeChecks = employeeIds.map(async (employeeId) => {
          const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
          });
          if (!employee) {
            throw new Error(`L'employé avec l'ID ${employeeId} n'existe pas`);
          }
          if (
            !employee.companyId ||
            employee.companyId !== team.companyId
          ) {
            throw new Error(
              `L'employé avec l'ID ${employeeId} n'appartient pas à l'entreprise de cette équipe`
            );
          }
        });

        try {
          await Promise.all(employeeChecks);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: (error as Error).message,
          });
        }

        updateData.employeeIds = employeeIds;
      }

      // Mettre à jour l'équipe
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: updateData,
        include: {
          employees: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              status: true
            }
          }
        }
      });

      // Récupérer les managers
      const managers = updatedTeam.managerIds.length > 0
        ? await prisma.user.findMany({
            where: {
              id: { in: updatedTeam.managerIds }
            },
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          })
        : [];

      return res.status(200).json({
        success: true,
        message: "Équipe mise à jour avec succès",
        data: { ...updatedTeam, managers },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'équipe:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour de l'équipe",
      });
    }
  }
);

/**
 * @route   DELETE /api/admin/teams/:id
 * @desc    Supprime une équipe
 * @access  Admin uniquement
 */
router.delete(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Vérifier que l'ID de l'équipe est valide
      const teamId = parseInt(id, 10);
      if (isNaN(teamId)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'équipe n'est pas valide",
        });
      }

      // Vérifier que l'équipe existe
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });
      if (!team) {
        return res.status(404).json({
          success: false,
          message: "L'équipe spécifiée n'existe pas",
        });
      }

      // Vérifier si l'équipe est utilisée par des employés actifs
      const activeEmployees = await prisma.employee.count({
        where: {
          teamId: teamId,
          status: "actif",
        },
      });

      if (activeEmployees > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cette équipe ne peut pas être supprimée car elle contient des employés actifs",
        });
      }

      // Supprimer l'équipe
      await prisma.team.delete({
        where: { id: teamId }
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'équipe:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression de l'équipe",
      });
    }
  }
);

/**
 * @route   PATCH /api/admin/teams/:id/employees
 * @desc    Ajoute ou retire un employé d'une équipe
 * @access  Admin uniquement
 */
router.patch(
  "/:id/employees",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { employeeId, action } = req.body;

      // Vérifier que l'action est valide
      if (action !== "add" && action !== "remove") {
        return res.status(400).json({
          success: false,
          message: "L'action doit être 'add' ou 'remove'",
        });
      }

      // Vérifier que les IDs sont valides
      const teamId = parseInt(id, 10);
      const empId = parseInt(employeeId, 10);
      if (isNaN(teamId) || isNaN(empId)) {
        return res.status(400).json({
          success: false,
          message: "Les identifiants fournis ne sont pas valides",
        });
      }

      // Vérifier que l'équipe existe
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });
      if (!team) {
        return res.status(404).json({
          success: false,
          message: "L'équipe spécifiée n'existe pas",
        });
      }

      // Vérifier que l'employé existe
      const employee = await prisma.employee.findUnique({
        where: { id: empId }
      });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "L'employé spécifié n'existe pas",
        });
      }

      // Vérifier que l'employé et l'équipe appartiennent à la même entreprise
      if (team.companyId !== employee.companyId) {
        return res.status(400).json({
          success: false,
          message:
            "L'employé et l'équipe doivent appartenir à la même entreprise",
        });
      }

      let newEmployeeIds: number[];
      let updateMessage: string;

      if (action === "add") {
        // Vérifier si l'employé est déjà dans l'équipe
        const isAlreadyInTeam = team.employeeIds.includes(empId);

        if (isAlreadyInTeam) {
          return res.status(400).json({
            success: false,
            message: "L'employé est déjà dans cette équipe",
          });
        }

        // Ajouter l'employé à l'équipe
        newEmployeeIds = [...team.employeeIds, empId];
        updateMessage = "Employé ajouté à l'équipe avec succès";

        // Mettre à jour le teamId de l'employé
        await prisma.employee.update({
          where: { id: empId },
          data: { teamId: teamId }
        });
      } else {
        // Vérifier si l'employé est dans l'équipe
        const isInTeam = team.employeeIds.includes(empId);

        if (!isInTeam) {
          return res.status(400).json({
            success: false,
            message: "L'employé n'est pas dans cette équipe",
          });
        }

        // Retirer l'employé de l'équipe
        newEmployeeIds = team.employeeIds.filter(id => id !== empId);
        updateMessage = "Employé retiré de l'équipe avec succès";

        // Si l'employé a cette équipe comme teamId, mettre à null
        if (employee.teamId === teamId) {
          await prisma.employee.update({
            where: { id: empId },
            data: { teamId: null }
          });
        }
      }

      // Mettre à jour l'équipe
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: { employeeIds: newEmployeeIds },
        include: {
          employees: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              status: true
            }
          }
        }
      });

      // Récupérer les managers
      const managers = updatedTeam.managerIds.length > 0
        ? await prisma.user.findMany({
            where: {
              id: { in: updatedTeam.managerIds }
            },
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          })
        : [];

      return res.status(200).json({
        success: true,
        message: updateMessage,
        data: { ...updatedTeam, managers },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'équipe:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour de l'équipe",
      });
    }
  }
);

export default router;
