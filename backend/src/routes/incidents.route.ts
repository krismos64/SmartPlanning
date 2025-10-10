/**
 * Routes de gestion des incidents - SmartPlanning
 *
 * MIGRATION POSTGRESQL: Migré de Mongoose vers Prisma ORM
 */

import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import prisma from "../config/prisma";

// Type pour les requêtes authentifiées
interface AuthRequest {
  user?: {
    id: number;
    email: string;
    role: "admin" | "manager" | "employee" | "directeur";
    teamIds?: number[];
    companyId?: number;
  };
  query: any;
  body: any;
  params: any;
}

const router = Router();

// GET /api/incidents - Récupérer la liste des incidents
router.get(
  "/",
  authenticateToken,
  checkRole(["admin", "directeur", "manager"]),
  async (req: any, res: any) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
      const companyFilter = req.query.companyId ? parseInt(req.query.companyId as string) : null;
      const teamFilter = req.query.teamId ? parseInt(req.query.teamId as string) : null;

      let whereClause: any = {};

      // Filtrer selon le rôle de l'utilisateur
      if (req.user) {
        if (req.user.role === "directeur" && req.user.companyId) {
          // Un directeur voit les incidents de sa compagnie
          whereClause.companyId = req.user.companyId;
        } else if (req.user.role === "manager") {
          // Un manager voit les incidents des équipes qu'il gère
          const managedTeams = await prisma.team.findMany({
            where: { managerId: req.user.id },
            select: { id: true }
          });
          const teamIds = managedTeams.map((team) => team.id);

          if (teamIds.length > 0) {
            whereClause.OR = [
              { teamId: { in: teamIds } },
              { companyId: req.user.companyId, teamId: null } // Incidents sans équipe de sa compagnie
            ];
          } else {
            // Si le manager ne gère aucune équipe, voir les incidents de sa compagnie sans équipe
            whereClause.companyId = req.user.companyId;
            whereClause.teamId = null;
          }
        }
        // Admin voit tout, et peut filtrer par companyId ou teamId
        else if (req.user.role === "admin") {
          if (companyFilter && !isNaN(companyFilter)) {
            whereClause.companyId = companyFilter;
          }

          if (teamFilter && !isNaN(teamFilter)) {
            whereClause.teamId = teamFilter;
          }
        }
      }

      const [incidents, total] = await Promise.all([
        prisma.incident.findMany({
          where: whereClause,
          include: {
            reportedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            resolvedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { reportedAt: 'desc' },
          skip: skip,
          take: limit
        }),
        prisma.incident.count({ where: whereClause })
      ]);

      res.status(200).json({
        success: true,
        data: incidents,
        pagination: {
          total,
          limit,
          skip,
          hasMore: total > skip + limit,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des incidents",
        error: error.message,
      });
    }
  }
);

// POST /api/incidents - Créer un nouvel incident
router.post(
  "/",
  authenticateToken,
  checkRole(["admin", "manager"]),
  async (req: any, res: any) => {
    try {
      const {
        title,
        description,
        teamId,
        severity,
        category,
      } = req.body;

      // Validation des champs requis
      if (!title || !description) {
        return res
          .status(400)
          .json({ success: false, message: "Titre et description requis" });
      }

      // Validation de companyId de l'utilisateur
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res
          .status(400)
          .json({ success: false, message: "L'utilisateur doit appartenir à une entreprise" });
      }

      // Si teamId fourni, valider
      let teamIdNum: number | null = null;
      if (teamId) {
        teamIdNum = parseInt(teamId, 10);
        if (isNaN(teamIdNum)) {
          return res
            .status(400)
            .json({ success: false, message: "ID d'équipe invalide" });
        }

        // Vérifier que l'équipe existe et appartient à la bonne compagnie
        const team = await prisma.team.findUnique({
          where: { id: teamIdNum },
          select: { companyId: true }
        });

        if (!team || team.companyId !== companyId) {
          return res.status(404).json({
            success: false,
            message: "Équipe non trouvée ou non autorisée",
          });
        }
      }

      // Créer l'incident
      const incident = await prisma.incident.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          companyId,
          teamId: teamIdNum,
          severity: severity || null,
          category: category || null,
          status: "open",
          reportedById: req.user?.id,
        },
        include: {
          reportedBy: {
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

      res.status(201).json({ success: true, data: incident });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de l'incident",
        error: error.message,
      });
    }
  }
);

// PUT /api/incidents/:id - Modifier un incident existant
router.put(
  "/:id",
  authenticateToken,
  checkRole(["admin", "manager"]),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;

      // Validation de l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res
          .status(400)
          .json({ success: false, message: "ID incident invalide" });
      }

      // Récupérer l'incident existant
      const incident = await prisma.incident.findUnique({
        where: { id: idNum },
      });

      if (!incident) {
        return res
          .status(404)
          .json({ success: false, message: "Incident non trouvé" });
      }

      // Vérifier si le manager a le droit de modifier cet incident
      if (req.user && req.user.role === "manager") {
        // Vérifier que l'incident concerne une équipe gérée par ce manager
        if (incident.teamId) {
          const team = await prisma.team.findUnique({
            where: { id: incident.teamId },
            select: { managerId: true }
          });

          if (!team || team.managerId !== req.user.id) {
            return res.status(403).json({
              success: false,
              message:
                "Vous ne pouvez pas modifier cet incident car il n'appartient pas à vos équipes",
            });
          }
        } else {
          // Si pas de teamId, vérifier que c'est bien la même compagnie
          if (incident.companyId !== req.user.companyId) {
            return res.status(403).json({
              success: false,
              message: "Vous ne pouvez pas modifier cet incident",
            });
          }
        }
      }

      // Mettre à jour l'incident
      const { title, description, severity, category, status, resolution } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (severity !== undefined) updateData.severity = severity;
      if (category !== undefined) updateData.category = category;
      if (status !== undefined) {
        updateData.status = status;
        if (status === "resolved" || status === "closed") {
          updateData.resolvedAt = new Date();
          updateData.resolvedById = req.user?.id;
        }
      }
      if (resolution !== undefined) updateData.resolution = resolution;

      const updatedIncident = await prisma.incident.update({
        where: { id: idNum },
        data: updateData,
        include: {
          reportedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          resolvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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

      res.status(200).json({ success: true, data: updatedIncident });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de l'incident",
        error: error.message,
      });
    }
  }
);

// DELETE /api/incidents/:id - Supprimer un incident
router.delete(
  "/:id",
  authenticateToken,
  checkRole(["admin", "manager"]),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;

      // Validation de l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res
          .status(400)
          .json({ success: false, message: "ID incident invalide" });
      }

      // Récupérer l'incident existant
      const incident = await prisma.incident.findUnique({
        where: { id: idNum },
      });

      if (!incident) {
        return res
          .status(404)
          .json({ success: false, message: "Incident non trouvé" });
      }

      // Vérifier si le manager a le droit de supprimer cet incident
      if (req.user && req.user.role === "manager") {
        // Vérifier que l'incident concerne une équipe gérée par ce manager
        if (incident.teamId) {
          const team = await prisma.team.findUnique({
            where: { id: incident.teamId },
            select: { managerId: true }
          });

          if (!team || team.managerId !== req.user.id) {
            return res.status(403).json({
              success: false,
              message:
                "Vous ne pouvez pas supprimer cet incident car il n'appartient pas à vos équipes",
            });
          }
        } else {
          // Si pas de teamId, vérifier que c'est bien la même compagnie
          if (incident.companyId !== req.user.companyId) {
            return res.status(403).json({
              success: false,
              message: "Vous ne pouvez pas supprimer cet incident",
            });
          }
        }
      }

      await prisma.incident.delete({
        where: { id: idNum }
      });

      res
        .status(200)
        .json({ success: true, message: "Incident supprimé avec succès" });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de l'incident",
        error: error.message,
      });
    }
  }
);

export default router;
