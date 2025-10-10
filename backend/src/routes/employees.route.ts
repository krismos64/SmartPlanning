/**
 * Routes pour la gestion des employés
 *
 * Ce fichier contient les routes permettant :
 * - de récupérer tous les employés (selon le rôle de l'utilisateur)
 * - de récupérer les employés d'une équipe spécifique
 * - de récupérer les employés d'une entreprise spécifique (directeur/admin)
 *
 * MIGRATION: Migré de Mongoose vers Prisma (Octobre 2025)
 */

import { Request, Response, Router } from "express";
// MIGRATION: Remplacer Mongoose par Prisma
import prisma from "../config/prisma";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";

const router = Router();

/**
 * @route   GET /api/employees
 * @desc    Récupère les employés selon le rôle de l'utilisateur connecté
 * @access  Private - Tous les rôles (filtrage dynamique des résultats)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "manager" &&
        req.user.role !== "admin" &&
        req.user.role !== "directeur")
    ) {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    const role = req.user.role.toLowerCase();
    let employees;

    if (role === "admin") {
      // MIGRATION: Récupération avec Prisma + include pour populate
      employees = await prisma.employee.findMany({
        where: { isActive: true },
        select: {
          id: true,
          teamId: true,
          companyId: true,
          contractualHours: true,
          userId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true,
            }
          },
          team: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: {
          user: {
            lastName: 'asc'
          }
        }
      });
    } else if (role === "directeur") {
      // Le directeur n'a accès qu'aux employés de son entreprise
      if (!req.user.companyId) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise manquant pour le directeur",
        });
      }

      // MIGRATION: Filtre par companyId avec Prisma
      employees = await prisma.employee.findMany({
        where: {
          companyId: req.user.companyId,
          isActive: true
        },
        select: {
          id: true,
          teamId: true,
          companyId: true,
          contractualHours: true,
          userId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true,
            }
          },
          team: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: {
          user: {
            lastName: 'asc'
          }
        }
      });
    } else {
      // MIGRATION: Le manager n'a accès qu'aux employés de ses équipes
      // PostgreSQL: Team.managerId (singulier) au lieu de managers array
      const managerTeams = await prisma.team.findMany({
        where: {
          managerId: req.user.id
        },
        select: {
          id: true,
          name: true,
        }
      });

      console.log("🔍 Manager ID:", req.user.id);
      console.log("🔍 Équipes trouvées pour le manager:", managerTeams);

      const teamIds = managerTeams.map((team) => team.id);
      console.log("🔍 IDs des équipes:", teamIds);

      // MIGRATION: Récupérer les employés des équipes avec Prisma
      employees = await prisma.employee.findMany({
        where: {
          teamId: { in: teamIds },
          isActive: true
        },
        select: {
          id: true,
          teamId: true,
          companyId: true,
          contractualHours: true,
          userId: true,
          team: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true,
              role: true,
            }
          }
        },
        orderBy: {
          user: {
            lastName: 'asc'
          }
        }
      });

      console.log(
        "🔍 Employés trouvés avant enrichissement:",
        employees.length
      );

      // Enrichir les données avec l'email depuis userId et le nom du manager
      employees = employees.map((emp: any) => {
        const team = managerTeams.find(
          (t) => t.id === emp.teamId
        );
        return {
          ...emp,
          firstName: emp.user.firstName,
          lastName: emp.user.lastName,
          email: emp.user.email,
          photoUrl: emp.user.profilePicture,
          role: emp.user.role || "employee",
          teamName: emp.team?.name,
          managerName: emp.team?.manager ? `${emp.team.manager.firstName} ${emp.team.manager.lastName}` : "Manager",
          contractHoursPerWeek: emp.contractualHours,
          status: emp.isActive ? "actif" : "inactif",
        };
      });

      console.log("🔍 Employés après enrichissement:", employees.length);
      console.log("🔍 Premier employé:", employees[0]);
    }

    // MIGRATION: Conversion pour assurer la cohérence dans la réponse API
    // Mapper les champs Prisma vers le format attendu (compatibilité avec MongoDB _id)
    const formattedEmployees = employees.map((emp: any) => ({
      _id: emp.id, // Compatibilité avec ancien format MongoDB
      id: emp.id,
      firstName: emp.user?.firstName || emp.firstName,
      lastName: emp.user?.lastName || emp.lastName,
      email: emp.user?.email || emp.email,
      status: emp.isActive ? "actif" : "inactif",
      teamId: emp.teamId,
      companyId: emp.companyId,
      contractHoursPerWeek: emp.contractualHours || emp.contractHoursPerWeek,
      photoUrl: emp.user?.profilePicture || emp.photoUrl,
      userId: emp.userId,
      teamName: emp.team?.name || emp.teamName,
      role: emp.user?.role || emp.role,
      managerName: emp.managerName || (emp.team?.manager ? `${emp.team.manager.firstName} ${emp.team.manager.lastName}` : undefined),
    }));

    return res.status(200).json({ success: true, data: formattedEmployees });
  } catch (error) {
    console.error("Erreur lors de la récupération des employés:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des employés",
    });
  }
});

/**
 * @route   GET /api/employees/team/:teamId
 * @desc    Récupère tous les employés d'une équipe spécifique
 * @access  Private
 */
router.get("/team/:teamId", async (req: Request, res: Response) => {
  try {
    const { teamId: teamIdParam } = req.params;

    // MIGRATION: Prisma utilise number pour les IDs
    // Conversion et validation de l'ID
    const teamId = parseInt(teamIdParam, 10);
    if (isNaN(teamId)) {
      return res.status(400).json({
        success: false,
        message: "ID d'équipe invalide",
      });
    }

    // MIGRATION: Récupérer l'équipe avec Prisma pour vérifier son existence
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Équipe introuvable",
      });
    }

    // MIGRATION: Récupérer les employés de l'équipe avec Prisma
    const employees = await prisma.employee.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            email: true,
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des employés:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des employés",
    });
  }
});

/**
 * @route   GET /api/employees/company/:companyId
 * @desc    Récupère tous les employés d'une entreprise spécifique
 * @access  Private - Directeur, Admin uniquement
 */
router.get(
  "/company/:companyId",
  authenticateToken,
  checkRole(["directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { companyId: companyIdParam } = req.params;

      // MIGRATION: Prisma utilise number pour les IDs
      // Conversion et validation de l'ID
      const companyId = parseInt(companyIdParam, 10);
      if (isNaN(companyId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      // Normalisation du rôle pour la vérification
      const role = req.user.role?.toLowerCase();

      // Restriction d'accès pour les directeurs (uniquement leur propre entreprise)
      if (role === "directeur" && req.user.companyId !== companyId) {
        return res.status(403).json({
          success: false,
          message:
            "Vous n'êtes pas autorisé à accéder aux employés de cette entreprise",
        });
      }

      // MIGRATION: Récupération des employés avec Prisma
      const employees = await prisma.employee.findMany({
        where: { companyId },
        include: {
          user: {
            select: {
              email: true,
            }
          },
          team: {
            select: {
              name: true,
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: employees,
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

export default router;
