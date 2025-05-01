/**
 * Routes de gestion des tâches employé - SmartPlanning
 *
 * Ce module gère toutes les routes CRUD pour les tâches des employés.
 * Chaque route implémente la vérification que l'utilisateur ne peut
 * manipuler que ses propres tâches.
 */

import { Response, Router } from "express";
import { AuthRequest, authenticateToken } from "../middlewares/auth.middleware";
import TaskModel from "../models/Task.model";

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
      // Récupération de l'ID de l'utilisateur connecté
      const employeeId = req.user?._id;

      // Recherche des tâches associées à l'employé
      const tasks = await TaskModel.find({ employeeId })
        .sort({ dueDate: 1 }) // Tri par date d'échéance
        .select("-__v");

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
    const { title, dueDate, status } = req.body;

    // Validation du titre (requis)
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Le titre de la tâche est requis",
      });
    }

    // Création de la nouvelle tâche
    const newTask = new TaskModel({
      title,
      employeeId: req.user?._id,
      dueDate: dueDate || undefined,
      status: status || "pending", // Valeur par défaut si non fournie
    });

    // Enregistrement de la tâche dans la base de données
    await newTask.save();

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
      const { title, dueDate, status } = req.body;
      const employeeId = req.user?._id;

      // Recherche de la tâche
      const task = await TaskModel.findById(taskId);

      // Vérification de l'existence de la tâche
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Tâche non trouvée",
        });
      }

      // Vérification que la tâche appartient bien à l'utilisateur connecté
      if (task.employeeId.toString() !== employeeId?.toString()) {
        return res.status(403).json({
          success: false,
          message: "Vous n'êtes pas autorisé à modifier cette tâche",
        });
      }

      // Préparation des données à mettre à jour
      const updateData: {
        title?: string;
        dueDate?: Date | null;
        status?: "pending" | "inProgress" | "completed";
      } = {};

      // Mise à jour conditionnelle des champs
      if (title !== undefined) updateData.title = title;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (status !== undefined) updateData.status = status;

      // Mise à jour de la tâche
      const updatedTask = await TaskModel.findByIdAndUpdate(
        taskId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

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
      const employeeId = req.user?._id;

      // Recherche de la tâche
      const task = await TaskModel.findById(taskId);

      // Vérification de l'existence de la tâche
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Tâche non trouvée",
        });
      }

      // Vérification que la tâche appartient bien à l'utilisateur connecté
      if (task.employeeId.toString() !== employeeId?.toString()) {
        return res.status(403).json({
          success: false,
          message: "Vous n'êtes pas autorisé à supprimer cette tâche",
        });
      }

      // Suppression de la tâche
      await TaskModel.findByIdAndDelete(taskId);

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
