import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Team from "../../models/Team.model";

// Import des modèles depuis les fichiers du dossier models/
import EmployeeModel from "../../models/Employee.model";
import User from "../../models/User.model";

// Interface pour la création d'équipe
interface CreateTeamInput {
  name: string;
  managerIds: string[];
  employeeIds: string[];
  companyId: string;
}

// Interface pour la mise à jour d'équipe
interface UpdateTeamInput {
  name?: string;
  managerIds?: string[];
  employeeIds?: string[];
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
      let query = {};

      // Si un companyId est fourni, filtrer par entreprise
      if (companyId) {
        if (!mongoose.Types.ObjectId.isValid(companyId as string)) {
          return res.status(400).json({
            success: false,
            message: "ID d'entreprise invalide",
          });
        }
        query = { companyId: companyId as string };
      }

      const teams = await Team.find(query)
        .populate("companyId", "name")
        .populate("managerIds", "firstName lastName email")
        .populate("employeeIds", "firstName lastName email");

      res.status(200).json({
        success: true,
        data: teams,
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

      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      const teams = await Team.find({ companyId });

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

      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      const newTeam = new Team({
        name,
        companyId,
      });

      await newTeam.save();

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
      const userWithAuth = req as any;

      // Vérifier que l'ID de l'équipe est valide
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'équipe n'est pas valide",
        });
      }

      // Vérifier que l'équipe existe
      const team = await Team.findById(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: "L'équipe spécifiée n'existe pas",
        });
      }

      // Préparer l'objet de mise à jour
      const updateData: UpdateTeamInput = {};

      if (name !== undefined) {
        updateData.name = name;
      }

      if (managerIds !== undefined) {
        // Vérifier que les managerIds sont valides
        const invalidManagerIds = managerIds.filter(
          (id) => !mongoose.Types.ObjectId.isValid(id)
        );
        if (invalidManagerIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Certains identifiants de managers ne sont pas valides",
          });
        }

        // Vérifier que tous les managers existent, ont le rôle "manager" et appartiennent à l'entreprise
        const managerPromises = managerIds.map(async (managerId) => {
          const manager = await User.findById(managerId);
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
            manager.companyId.toString() !== team.companyId.toString()
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
        const invalidEmployeeIds = employeeIds.filter(
          (id) => !mongoose.Types.ObjectId.isValid(id)
        );
        if (invalidEmployeeIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Certains identifiants d'employés ne sont pas valides",
          });
        }

        const employeeChecks = employeeIds.map(async (employeeId) => {
          const employee = await EmployeeModel.findById(employeeId);
          if (!employee) {
            throw new Error(`L'employé avec l'ID ${employeeId} n'existe pas`);
          }
          if (
            !employee.companyId ||
            employee.companyId.toString() !== team.companyId.toString()
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
      const updatedTeam = await Team.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      )
        .populate("managerIds", "firstName lastName email")
        .populate("employeeIds", "firstName lastName email status"); // <-- Ajout ici

      return res.status(200).json({
        success: true,
        message: "Équipe mise à jour avec succès",
        data: updatedTeam,
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
      const userWithAuth = req as any;

      // Vérifier que l'ID de l'équipe est valide
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'équipe n'est pas valide",
        });
      }

      // Vérifier que l'équipe existe
      const team = await Team.findById(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: "L'équipe spécifiée n'existe pas",
        });
      }

      // Vérifier si l'équipe est utilisée par des employés actifs
      const activeEmployees = await EmployeeModel.countDocuments({
        teamId: id,
        status: "actif",
      });

      if (activeEmployees > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cette équipe ne peut pas être supprimée car elle contient des employés actifs",
        });
      }

      // Supprimer l'équipe
      await Team.findByIdAndDelete(id);

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
      if (
        !mongoose.Types.ObjectId.isValid(id) ||
        !mongoose.Types.ObjectId.isValid(employeeId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Les identifiants fournis ne sont pas valides",
        });
      }

      // Vérifier que l'équipe existe
      const team = await Team.findById(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: "L'équipe spécifiée n'existe pas",
        });
      }

      // Vérifier que l'employé existe
      const employee = await EmployeeModel.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "L'employé spécifié n'existe pas",
        });
      }

      // Vérifier que l'employé et l'équipe appartiennent à la même entreprise
      if (team.companyId.toString() !== employee.companyId.toString()) {
        return res.status(400).json({
          success: false,
          message:
            "L'employé et l'équipe doivent appartenir à la même entreprise",
        });
      }

      let updateOperation;
      let updateMessage;

      if (action === "add") {
        // Vérifier si l'employé est déjà dans l'équipe
        const isAlreadyInTeam = team.employeeIds.some(
          (id) => id.toString() === employeeId
        );

        if (isAlreadyInTeam) {
          return res.status(400).json({
            success: false,
            message: "L'employé est déjà dans cette équipe",
          });
        }

        // Ajouter l'employé à l'équipe
        updateOperation = { $addToSet: { employeeIds: employeeId } };
        updateMessage = "Employé ajouté à l'équipe avec succès";

        // Mettre à jour le teamId de l'employé
        await EmployeeModel.findByIdAndUpdate(employeeId, {
          $set: { teamId: id },
        });
      } else {
        // Vérifier si l'employé est dans l'équipe
        const isInTeam = team.employeeIds.some(
          (id) => id.toString() === employeeId
        );

        if (!isInTeam) {
          return res.status(400).json({
            success: false,
            message: "L'employé n'est pas dans cette équipe",
          });
        }

        // Retirer l'employé de l'équipe
        updateOperation = { $pull: { employeeIds: employeeId } };
        updateMessage = "Employé retiré de l'équipe avec succès";

        // Si l'employé a cette équipe comme teamId, mettre à null
        const employeeToUpdate = await EmployeeModel.findById(employeeId);
        if (
          employeeToUpdate &&
          employeeToUpdate.teamId &&
          employeeToUpdate.teamId.toString() === id
        ) {
          await EmployeeModel.findByIdAndUpdate(employeeId, {
            $set: { teamId: null },
          });
        }
      }

      // Mettre à jour l'équipe
      const updatedTeam = await Team.findByIdAndUpdate(id, updateOperation, {
        new: true,
      })
        .populate("managerIds", "firstName lastName email")
        .populate("employeeIds", "firstName lastName email status");

      return res.status(200).json({
        success: true,
        message: updateMessage,
        data: updatedTeam,
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
