import express, { Request, Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

const router = express.Router();

// Type pour les rôles d'utilisateur
type UserRole = "admin" | "manager" | "employee" | string;

/**
 * @route   GET /api/admin/teams
 * @desc    Récupère toutes les équipes d'une entreprise
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

      // Récupérer toutes les équipes de l'entreprise avec leurs relations
      const teams = await prisma.team.findMany({
        where: { companyId: companyIdNum },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          employees: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Formater les données pour correspondre à l'ancien format
      const formattedTeams = teams.map(team => ({
        _id: team.id,
        name: team.name,
        description: team.description,
        companyId: team.companyId,
        managerId: team.managerId,
        manager: team.manager ? {
          _id: team.manager.id,
          firstName: team.manager.firstName,
          lastName: team.manager.lastName,
          email: team.manager.email,
        } : null,
        requiredSkills: team.requiredSkills,
        minimumMembers: team.minimumMembers,
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        employeeIds: team.employees.map(emp => emp.id),
        employees: team.employees.map(emp => ({
          _id: emp.id,
          firstName: emp.user.firstName,
          lastName: emp.user.lastName,
        })),
      }));

      return res.status(200).json({
        success: true,
        data: formattedTeams,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des équipes:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des équipes",
      });
    }
  }
);

/**
 * @route   GET /api/admin/teams/:id
 * @desc    Récupère une équipe par son ID
 * @access  Admin uniquement
 */
router.get(
  "/:id",
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Validation de l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'équipe invalide",
        });
      }

      // Récupérer l'équipe avec ses relations
      const team = await prisma.team.findUnique({
        where: { id: idNum },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          employees: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        }
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // Formater les données
      const formattedTeam = {
        _id: team.id,
        name: team.name,
        description: team.description,
        companyId: team.companyId,
        managerId: team.managerId,
        manager: team.manager ? {
          _id: team.manager.id,
          firstName: team.manager.firstName,
          lastName: team.manager.lastName,
          email: team.manager.email,
        } : null,
        requiredSkills: team.requiredSkills,
        minimumMembers: team.minimumMembers,
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        employeeIds: team.employees.map(emp => emp.id),
        employees: team.employees.map(emp => ({
          _id: emp.id,
          firstName: emp.user.firstName,
          lastName: emp.user.lastName,
        })),
      };

      return res.status(200).json({
        success: true,
        data: formattedTeam,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'équipe:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération de l'équipe",
      });
    }
  }
);

/**
 * @route   POST /api/admin/teams
 * @desc    Crée une nouvelle équipe
 * @access  Admin uniquement
 */
router.post(
  "/",
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        name,
        description,
        companyId,
        managerId,
        requiredSkills,
        minimumMembers,
      } = req.body;

      // Validation des champs requis
      if (!name || !companyId) {
        return res.status(400).json({
          success: false,
          message: "Le nom et l'entreprise sont obligatoires",
        });
      }

      // Validation de l'ID de l'entreprise
      const companyIdNum = parseInt(companyId, 10);
      if (isNaN(companyIdNum)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'entreprise n'est pas valide",
        });
      }

      // Vérifier que l'entreprise existe
      const company = await prisma.company.findUnique({
        where: { id: companyIdNum }
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "L'entreprise spécifiée n'existe pas",
        });
      }

      // Préparer les données de création
      const teamData: any = {
        name,
        description: description || null,
        companyId: companyIdNum,
        requiredSkills: requiredSkills || [],
        minimumMembers: minimumMembers || 1,
      };

      // Valider et ajouter le managerId si fourni
      if (managerId) {
        const managerIdNum = parseInt(managerId, 10);
        if (isNaN(managerIdNum)) {
          return res.status(400).json({
            success: false,
            message: "L'identifiant du manager n'est pas valide",
          });
        }

        // Vérifier que le manager existe et a le bon rôle
        const manager = await prisma.user.findUnique({
          where: { id: managerIdNum }
        });

        if (!manager) {
          return res.status(404).json({
            success: false,
            message: "Le manager spécifié n'existe pas",
          });
        }

        if (manager.role !== "manager" && manager.role !== "directeur" && manager.role !== "admin") {
          return res.status(400).json({
            success: false,
            message: "L'utilisateur spécifié n'a pas le rôle de manager",
          });
        }

        if (manager.companyId !== companyIdNum) {
          return res.status(400).json({
            success: false,
            message: "Le manager n'appartient pas à la même entreprise",
          });
        }

        teamData.managerId = managerIdNum;
      }

      // Créer l'équipe
      const newTeam = await prisma.team.create({
        data: teamData,
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          employees: true,
        }
      });

      return res.status(201).json({
        success: true,
        message: "Équipe créée avec succès",
        data: newTeam,
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'équipe:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la création de l'équipe",
      });
    }
  }
);

/**
 * @route   PUT /api/admin/teams/:id
 * @desc    Met à jour une équipe existante
 * @access  Admin uniquement
 */
router.put(
  "/:id",
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        managerId,
        requiredSkills,
        minimumMembers,
        isActive,
      } = req.body;

      // Validation de l'ID de l'équipe
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'équipe invalide",
        });
      }

      // Vérifier que l'équipe existe
      const team = await prisma.team.findUnique({
        where: { id: idNum }
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // Préparer les données de mise à jour
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (requiredSkills !== undefined) updateData.requiredSkills = requiredSkills;
      if (minimumMembers !== undefined) updateData.minimumMembers = minimumMembers;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Valider et mettre à jour le managerId si fourni
      if (managerId !== undefined) {
        if (managerId === null) {
          updateData.managerId = null;
        } else {
          const managerIdNum = parseInt(managerId, 10);
          if (isNaN(managerIdNum)) {
            return res.status(400).json({
              success: false,
              message: "L'identifiant du manager n'est pas valide",
            });
          }

          // Vérifier que le manager existe et a le bon rôle
          const manager = await prisma.user.findUnique({
            where: { id: managerIdNum }
          });

          if (!manager) {
            return res.status(404).json({
              success: false,
              message: "Le manager spécifié n'existe pas",
            });
          }

          if (manager.role !== "manager" && manager.role !== "directeur" && manager.role !== "admin") {
            return res.status(400).json({
              success: false,
              message: "L'utilisateur spécifié n'a pas le rôle de manager",
            });
          }

          if (manager.companyId !== team.companyId) {
            return res.status(400).json({
              success: false,
              message: "Le manager n'appartient pas à la même entreprise que l'équipe",
            });
          }

          updateData.managerId = managerIdNum;
        }
      }

      // Mettre à jour l'équipe
      const updatedTeam = await prisma.team.update({
        where: { id: idNum },
        data: updateData,
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          employees: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: "Équipe mise à jour avec succès",
        data: updatedTeam,
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'équipe:", error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Équipe non trouvée",
        });
      }
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
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Validation de l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'équipe invalide",
        });
      }

      // Vérifier que l'équipe existe
      const team = await prisma.team.findUnique({
        where: { id: idNum }
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // Supprimer l'équipe (cascade delete géré par Prisma)
      await prisma.team.delete({
        where: { id: idNum }
      });

      return res.status(200).json({
        success: true,
        message: "Équipe supprimée avec succès",
      });
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'équipe:", error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Équipe non trouvée",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression de l'équipe",
      });
    }
  }
);

export default router;
