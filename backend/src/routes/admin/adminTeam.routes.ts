/**
 * @migration Migré de MongoDB vers PostgreSQL/Prisma
 * @changes
 * - managerIds[] → managerId (relation 1-to-1)
 * - employeeIds[] → relation employees Employee[]
 * - Employee.status → Employee.isActive
 * - Employee.firstName/lastName → Employee.user.firstName/lastName
 */

import express, { Request, Response } from "express";
import prisma from "../../config/prisma";

// Interface pour la création d'équipe (PostgreSQL)
interface CreateTeamInput {
  name: string;
  managerId?: number; // Singulier - PostgreSQL relation
  companyId: number;
}

// Interface pour la mise à jour d'équipe (PostgreSQL)
interface UpdateTeamInput {
  name?: string;
  managerId?: number; // Singulier - PostgreSQL relation
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

      // Récupérer les équipes avec leurs relations PostgreSQL
      const teams = await prisma.team.findMany({
        where,
        include: {
          company: {
            select: { name: true }
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          employees: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Formatter les données pour le frontend
      const formattedTeams = teams.map(team => ({
        ...team,
        managers: team.manager ? [team.manager] : [], // Compatibilité frontend
        employees: team.employees.map(emp => ({
          id: emp.id,
          firstName: emp.user.firstName,
          lastName: emp.user.lastName,
          email: emp.user.email,
          isActive: emp.isActive,
          position: emp.position,
          skills: emp.skills
        }))
      }));

      res.status(200).json({
        success: true,
        data: formattedTeams,
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
        where: { companyId: companyIdNum },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          employees: {
            where: { isActive: true }
          }
        }
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
      const { name, companyId, managerId } = req.body as CreateTeamInput;

      if (!name || !companyId) {
        return res.status(400).json({
          success: false,
          message: "Le nom et l'ID de l'entreprise sont requis",
        });
      }

      const companyIdNum = parseInt(companyId.toString(), 10);
      if (isNaN(companyIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      // Vérifier que le manager existe si fourni
      if (managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: managerId }
        });

        if (!manager) {
          return res.status(404).json({
            success: false,
            message: "Le manager spécifié n'existe pas",
          });
        }

        if (manager.role !== "manager" && manager.role !== "admin") {
          return res.status(400).json({
            success: false,
            message: "L'utilisateur doit avoir le rôle manager ou admin",
          });
        }

        if (manager.companyId !== companyIdNum) {
          return res.status(400).json({
            success: false,
            message: "Le manager doit appartenir à la même entreprise",
          });
        }
      }

      const newTeam = await prisma.team.create({
        data: {
          name,
          companyId: companyIdNum,
          managerId: managerId || null
        },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
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
      const { name, managerId } = req.body as UpdateTeamInput;

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

      if (managerId !== undefined) {
        // Vérifier que le manager existe, a le bon rôle et appartient à l'entreprise
        if (managerId !== null) {
          const manager = await prisma.user.findUnique({
            where: { id: managerId }
          });

          if (!manager) {
            return res.status(404).json({
              success: false,
              message: `Le manager avec l'ID ${managerId} n'existe pas`,
            });
          }

          if (manager.role !== "manager" && manager.role !== "admin") {
            return res.status(400).json({
              success: false,
              message: `L'utilisateur avec l'ID ${managerId} doit avoir le rôle manager ou admin`,
            });
          }

          if (!manager.companyId || manager.companyId !== team.companyId) {
            return res.status(400).json({
              success: false,
              message: `Le manager avec l'ID ${managerId} n'appartient pas à l'entreprise de cette équipe`,
            });
          }
        }

        updateData.managerId = managerId;
      }

      // Mettre à jour l'équipe
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: updateData,
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          employees: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Formatter pour le frontend
      const formattedTeam = {
        ...updatedTeam,
        managers: updatedTeam.manager ? [updatedTeam.manager] : [],
        employees: updatedTeam.employees.map(emp => ({
          id: emp.id,
          firstName: emp.user.firstName,
          lastName: emp.user.lastName,
          email: emp.user.email,
          isActive: emp.isActive
        }))
      };

      return res.status(200).json({
        success: true,
        message: "Équipe mise à jour avec succès",
        data: formattedTeam,
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
          isActive: true, // PostgreSQL utilise isActive, pas status
        },
      });

      if (activeEmployees > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cette équipe ne peut pas être supprimée car elle contient des employés actifs",
        });
      }

      // Mettre à null les teamId des employés avant suppression
      await prisma.employee.updateMany({
        where: { teamId: teamId },
        data: { teamId: null }
      });

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
 * @desc    Ajoute ou retire un employé d'une équipe (utilise relation PostgreSQL)
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

      let updateMessage: string;

      if (action === "add") {
        // Vérifier si l'employé est déjà dans l'équipe (relation PostgreSQL)
        if (employee.teamId === teamId) {
          return res.status(400).json({
            success: false,
            message: "L'employé est déjà dans cette équipe",
          });
        }

        // Ajouter l'employé à l'équipe (mise à jour du teamId)
        await prisma.employee.update({
          where: { id: empId },
          data: { teamId: teamId }
        });

        updateMessage = "Employé ajouté à l'équipe avec succès";
      } else {
        // Vérifier si l'employé est dans l'équipe
        if (employee.teamId !== teamId) {
          return res.status(400).json({
            success: false,
            message: "L'employé n'est pas dans cette équipe",
          });
        }

        // Retirer l'employé de l'équipe (teamId à null)
        await prisma.employee.update({
          where: { id: empId },
          data: { teamId: null }
        });

        updateMessage = "Employé retiré de l'équipe avec succès";
      }

      // Récupérer l'équipe mise à jour avec les relations
      const updatedTeam = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          employees: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Formatter pour le frontend
      const formattedTeam = updatedTeam ? {
        ...updatedTeam,
        managers: updatedTeam.manager ? [updatedTeam.manager] : [],
        employees: updatedTeam.employees.map(emp => ({
          id: emp.id,
          firstName: emp.user.firstName,
          lastName: emp.user.lastName,
          email: emp.user.email,
          isActive: emp.isActive
        }))
      } : null;

      return res.status(200).json({
        success: true,
        message: updateMessage,
        data: formattedTeam,
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
