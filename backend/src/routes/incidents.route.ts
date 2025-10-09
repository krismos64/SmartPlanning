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
          // Un directeur voit les incidents des employés de sa compagnie
          whereClause.companyId = req.user.companyId;
        } else if (
          req.user.role === "manager" &&
          req.user.teamIds &&
          req.user.teamIds.length > 0
        ) {
          // Un manager voit les incidents des employés de ses équipes
          const teamEmployees = await prisma.employee.findMany({
            where: { teamId: { in: req.user.teamIds } },
            select: { id: true }
          });
          const employeeIds = teamEmployees.map((emp) => emp.id);
          whereClause.employeeId = { in: employeeIds };
        }
        // Admin voit tout, et peut filtrer par companyId ou teamId
        else if (req.user.role === "admin") {
          if (companyFilter && !isNaN(companyFilter)) {
            whereClause.companyId = companyFilter;
          }

          if (teamFilter && !isNaN(teamFilter)) {
            const teamEmployees = await prisma.employee.findMany({
              where: { teamId: teamFilter },
              select: { id: true }
            });
            const teamEmployeeIds = teamEmployees.map((emp) => emp.id);

            // Si on a déjà filtré par companyId, on fait l'intersection
            if (whereClause.employeeId && whereClause.employeeId.in) {
              whereClause.employeeId.in = whereClause.employeeId.in.filter((id: number) =>
                teamEmployeeIds.includes(id)
              );
            } else {
              whereClause.employeeId = { in: teamEmployeeIds };
            }
          }
        }
      }

      const [incidents, total] = await Promise.all([
        prisma.incident.findMany({
          where: whereClause,
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                companyId: true,
                teamId: true
              }
            },
            reportedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
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
        employeeId,
        type,
        description,
        date,
        status = "pending",
      } = req.body;

      // Validation de l'ID employé
      const employeeIdNum = parseInt(employeeId, 10);
      if (isNaN(employeeIdNum)) {
        return res
          .status(400)
          .json({ success: false, message: "ID employé invalide" });
      }

      // Vérifier si l'employé existe
      const employee = await prisma.employee.findUnique({
        where: { id: employeeIdNum },
        select: { id: true, teamId: true, companyId: true }
      });

      if (!employee) {
        return res
          .status(404)
          .json({ success: false, message: "Employé non trouvé" });
      }

      // Vérifier les droits du manager sur l'employé
      if (req.user && req.user.role === "manager" && req.user.teamIds) {
        if (
          !employee.teamId ||
          !req.user.teamIds.includes(employee.teamId)
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez pas créer d'incident pour un employé qui n'est pas dans vos équipes",
          });
        }
      }

      // Créer l'incident
      const incident = await prisma.incident.create({
        data: {
          employeeId: employeeIdNum,
          companyId: employee.companyId,
          type,
          description: description || null,
          date: date ? new Date(date) : new Date(),
          status,
          reportedById: req.user?.id || null,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          reportedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
        include: {
          employee: {
            select: { id: true, teamId: true }
          }
        }
      });

      if (!incident) {
        return res
          .status(404)
          .json({ success: false, message: "Incident non trouvé" });
      }

      // Vérifier si le manager a le droit de modifier cet incident
      if (req.user && req.user.role === "manager" && req.user.teamIds) {
        if (
          !incident.employee.teamId ||
          !req.user.teamIds.includes(incident.employee.teamId)
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez pas modifier cet incident car l'employé n'est pas dans vos équipes",
          });
        }
      }

      // Mettre à jour l'incident
      const { type, description, date, status } = req.body;

      const updateData: any = {};
      if (type !== undefined) updateData.type = type;
      if (description !== undefined) updateData.description = description;
      if (date !== undefined) updateData.date = new Date(date);
      if (status !== undefined) updateData.status = status;

      const updatedIncident = await prisma.incident.update({
        where: { id: idNum },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          reportedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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

      // Récupérer l'incident existant avec l'employé
      const incident = await prisma.incident.findUnique({
        where: { id: idNum },
        include: {
          employee: {
            select: { id: true, teamId: true }
          }
        }
      });

      if (!incident) {
        return res
          .status(404)
          .json({ success: false, message: "Incident non trouvé" });
      }

      // Vérifier si le manager a le droit de supprimer cet incident
      if (req.user && req.user.role === "manager" && req.user.teamIds) {
        if (
          !incident.employee.teamId ||
          !req.user.teamIds.includes(incident.employee.teamId)
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez pas supprimer cet incident car l'employé n'est pas dans vos équipes",
          });
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
