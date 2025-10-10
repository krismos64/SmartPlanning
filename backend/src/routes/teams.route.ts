/**
 * Routes pour la gestion des équipes - SmartPlanning
 *
 * MIGRATION POSTGRESQL: Migré de Mongoose vers Prisma ORM
 *
 * Ce fichier contient les routes permettant :
 * - de récupérer les équipes selon le rôle
 * - de créer une équipe
 * - de mettre à jour une équipe
 * - de supprimer une équipe
 * - de récupérer une équipe par ID
 * - de récupérer les équipes d'une entreprise (directeur/admin)
 * - de récupérer les employés d'une équipe
 */

import express, { Response } from "express";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import prisma from "../config/prisma";

const router = express.Router();

/**
 * @route   GET /api/teams
 * @desc    Récupérer les équipes selon le rôle de l'utilisateur:
 *          - Manager/Directeur: toutes les équipes de son entreprise
 * @access  Private
 * @note    PostgreSQL: managerIds supprimé (simplified architecture)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié ou identification invalide",
      });
    }

    if (!req.user.companyId) {
      return res.status(400).json({
        success: false,
        message: "ID d'entreprise manquant",
      });
    }

    // Récupérer toutes les équipes de l'entreprise avec leurs employés
    const teams = await prisma.team.findMany({
      where: { companyId: req.user.companyId },
      include: {
        employees: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                profilePicture: true,
              }
            }
          }
        },
        company: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(
      `${req.user.role} ${req.user.id}: ${teams.length} équipes trouvées pour l'entreprise ${req.user.companyId}`
    );

    return res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des équipes:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des équipes",
      error: (error as Error).message,
    });
  }
});

/**
 * @route   GET /api/teams/company/:companyId
 * @desc    Récupérer toutes les équipes d'une entreprise spécifique
 * @access  Private - Directeur, Admin uniquement
 */
router.get(
  "/company/:companyId",
  authenticateToken,
  checkRole(["directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      console.log(
        `[GET /teams/company/:companyId] Recherche des équipes pour l'entreprise: ${companyId}`
      );

      // Validation de l'identifiant d'entreprise
      const companyIdNum = parseInt(companyId, 10);
      if (isNaN(companyIdNum)) {
        console.log(
          `[GET /teams/company/:companyId] ID d'entreprise invalide: ${companyId}`
        );
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      // Restriction d'accès pour les directeurs (uniquement leur propre entreprise)
      if (req.user.role === "directeur" && req.user.companyId !== companyIdNum) {
        console.log(
          `[GET /teams/company/:companyId] Tentative d'accès non autorisé: le directeur (${req.user.id}) tente d'accéder à une autre entreprise (${companyId})`
        );
        return res.status(403).json({
          success: false,
          message:
            "Vous n'êtes pas autorisé à accéder aux équipes de cette entreprise",
        });
      }

      // Récupération des équipes de l'entreprise
      const teams = await prisma.team.findMany({
        where: { companyId: companyIdNum },
        include: {
          employees: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  profilePicture: true,
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      console.log(
        `[GET /teams/company/:companyId] ${teams.length} équipes trouvées pour l'entreprise ${companyId}`
      );

      return res.status(200).json({
        success: true,
        data: teams,
      });
    } catch (error) {
      console.error("[GET /teams/company/:companyId] Erreur:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des équipes",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * @route   POST /api/teams
 * @desc    Créer une nouvelle équipe
 * @access  Private
 */
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, companyId } = req.body;

  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: "Utilisateur non authentifié",
    });
  }

  if (!name || !companyId) {
    return res.status(400).json({
      success: false,
      message: "Le nom et l'identifiant de l'entreprise sont requis",
    });
  }

  try {
    const companyIdNum = parseInt(companyId, 10);
    if (isNaN(companyIdNum)) {
      return res.status(400).json({
        success: false,
        message: "ID d'entreprise invalide",
      });
    }

    const newTeam = await prisma.team.create({
      data: {
        name: name.trim(),
        companyId: companyIdNum,
      },
      include: {
        employees: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: newTeam,
    });
  } catch (error) {
    console.error("Erreur création équipe:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de l'équipe",
      error: (error as Error).message,
    });
  }
});

/**
 * @route   PATCH /api/teams/:id
 * @desc    Mettre à jour une équipe (nom uniquement)
 * @access  Private
 */
router.patch(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({
        success: false,
        message: "ID d'équipe invalide",
      });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Le nom de l'équipe est requis",
      });
    }

    try {
      const updatedTeam = await prisma.team.update({
        where: { id: idNum },
        data: { name: name.trim() },
        include: {
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
        data: updatedTeam,
      });
    } catch (error: any) {
      console.error("Erreur mise à jour équipe:", error);

      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Équipe non trouvée",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour de l'équipe",
        error: error.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/teams/:id
 * @desc    Supprimer une équipe
 * @access  Private
 */
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({
        success: false,
        message: "ID d'équipe invalide",
      });
    }

    try {
      await prisma.team.delete({
        where: { id: idNum }
      });

      return res.status(200).json({
        success: true,
        message: "Équipe supprimée avec succès",
      });
    } catch (error: any) {
      console.error("Erreur suppression équipe:", error);

      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Équipe non trouvée",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression de l'équipe",
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/teams/:id
 * @desc    Récupérer une équipe par son ID
 * @access  Private
 */
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'équipe invalide",
        });
      }

      const team = await prisma.team.findUnique({
        where: { id: idNum },
        include: {
          employees: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  profilePicture: true,
                }
              }
            }
          },
          company: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe non trouvée",
        });
      }

      return res.status(200).json({
        success: true,
        data: team,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'équipe:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération de l'équipe",
        error: (error as Error).message,
      });
    }
  }
);

/**
 * @route   GET /api/teams/:id/employees
 * @desc    Récupérer les employés d'une équipe spécifique
 * @access  Private - Manager, Directeur, Admin
 */
router.get("/:id/employees", authenticateToken, checkRole(["manager", "directeur", "admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // Validation de l'ID de l'équipe
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({
        success: false,
        message: "ID d'équipe invalide",
      });
    }

    // Récupération de l'équipe avec ses employés
    const team = await prisma.team.findUnique({
      where: { id: idNum },
      select: {
        id: true,
        name: true,
        companyId: true,
        employees: {
          select: {
            id: true,
            position: true,
            skills: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                profilePicture: true,
              }
            }
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Équipe non trouvée",
      });
    }

    // Vérification des droits d'accès
    const userIsDirecteur =
      req.user.role === "directeur" &&
      req.user.companyId === team.companyId;
    const userIsAdmin = req.user.role === "admin";
    const userIsManager = req.user.role === "manager" && req.user.companyId === team.companyId;

    if (!userIsManager && !userIsDirecteur && !userIsAdmin) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à accéder aux employés de cette équipe",
      });
    }

    console.log(`[GET /teams/${id}/employees] ${team.employees.length} employés trouvés`);

    return res.status(200).json({
      success: true,
      data: team.employees,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des employés:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des employés",
      error: (error as Error).message,
    });
  }
});

export default router;
