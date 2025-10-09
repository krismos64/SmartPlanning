/**
 * Routes de gestion des tâches employé - SmartPlanning
 *
 * Ce module gère toutes les routes CRUD pour les tâches des employés.
 * Chaque route implémente la vérification que l'utilisateur ne peut
 * manipuler que ses propres tâches.
 *
 * MIGRATION POSTGRESQL: Migré de Mongoose vers Prisma ORM
 */

import { Response, Router } from "express";
import { AuthRequest, authenticateToken } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";

// Création du routeur Express
const router = Router();

/**
 * @route   GET /api/tasks/my-tasks
 * @desc    Récupère toutes les tâches de l'employé connecté
 * @access  Privé
 */
router.get(
  "/my-tasks",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      // Récupération de l'ID de l'utilisateur connecté (PostgreSQL: Int)
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // Recherche des tâches assignées à cet utilisateur (via relation assignedTo)
      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { assignedToId: userId }, // Tâches assignées directement
            { createdById: userId },  // Tâches créées par l'utilisateur
          ]
        },
        orderBy: { dueDate: 'asc' }, // Tri par date d'échéance
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });

      // Retourne les tâches au format JSON
      return res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des tâches:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des tâches",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
);

/**
 * @route   POST /api/tasks
 * @desc    Crée une nouvelle tâche pour l'employé connecté
 * @access  Privé
 */
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, dueDate, status, priority, assignedToId, teamId } = req.body;
    const userId = req.user?.id;
    const companyId = req.user?.companyId;

    // Validation de l'utilisateur
    if (!userId || !companyId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié ou entreprise non trouvée",
      });
    }

    // Validation du titre (requis)
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Le titre de la tâche est requis",
      });
    }

    // Préparation des données de la tâche
    const taskData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      companyId,
      createdById: userId,
      status: status || "todo", // Valeur par défaut PostgreSQL
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || null,
      teamId: teamId ? parseInt(teamId, 10) : null,
      assignedToId: assignedToId ? parseInt(assignedToId, 10) : userId, // Par défaut assigné au créateur
    };

    // Création de la nouvelle tâche
    const newTask = await prisma.task.create({
      data: taskData,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: newTask,
      message: "Tâche créée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la création de la tâche:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la tâche",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
});

/**
 * @route   PATCH /api/tasks/:id
 * @desc    Met à jour une tâche existante
 * @access  Privé (uniquement les tâches de l'employé connecté)
 */
router.patch(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const taskId = req.params.id;
      const { title, description, dueDate, status, priority, assignedToId } = req.body;
      const userId = req.user?.id;

      // Validation de l'ID
      const taskIdNum = parseInt(taskId, 10);
      if (isNaN(taskIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      // Recherche de la tâche
      const task = await prisma.task.findUnique({
        where: { id: taskIdNum }
      });

      // Vérification de l'existence de la tâche
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Tâche non trouvée",
        });
      }

      // Vérification que la tâche appartient bien à l'utilisateur connecté (créateur ou assigné)
      if (task.assignedToId !== userId && task.createdById !== userId) {
        return res.status(403).json({
          success: false,
          message: "Vous n'êtes pas autorisé à modifier cette tâche",
        });
      }

      // Préparation des données à mettre à jour
      const updateData: any = {};

      // Mise à jour conditionnelle des champs
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId ? parseInt(assignedToId, 10) : null;

      // Si le statut passe à "done", enregistrer la date et l'utilisateur qui a complété
      if (status === "done" && task.status !== "done") {
        updateData.completedAt = new Date();
        updateData.completedById = userId;
      }

      // Mise à jour de la tâche
      const updatedTask = await prisma.task.update({
        where: { id: taskIdNum },
        data: updateData,
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          completedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: updatedTask,
        message: "Tâche mise à jour avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de la tâche",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Supprime une tâche
 * @access  Privé (uniquement les tâches de l'employé connecté)
 */
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const taskId = req.params.id;
      const userId = req.user?.id;

      // Validation de l'ID
      const taskIdNum = parseInt(taskId, 10);
      if (isNaN(taskIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      // Recherche de la tâche
      const task = await prisma.task.findUnique({
        where: { id: taskIdNum }
      });

      // Vérification de l'existence de la tâche
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Tâche non trouvée",
        });
      }

      // Vérification que la tâche appartient bien à l'utilisateur connecté (créateur ou assigné)
      if (task.assignedToId !== userId && task.createdById !== userId) {
        return res.status(403).json({
          success: false,
          message: "Vous n'êtes pas autorisé à supprimer cette tâche",
        });
      }

      // Suppression de la tâche
      await prisma.task.delete({
        where: { id: taskIdNum }
      });

      return res.status(200).json({
        success: true,
        message: "Tâche supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de la tâche",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
);

export default router;
