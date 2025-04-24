import express, { Request, Response } from "express";
import mongoose from "mongoose";

// Import des modèles depuis les fichiers du dossier models/
import EmployeeModel from "../../models/Employee.model";
import TeamModel from "../../models/Team.model";
import User from "../../models/User.model";

// Interface pour la requête d'admin authentifiée
interface AdminAuthRequest extends Request {
  user: {
    _id: string;
    email: string;
    role: string;
    companyId: mongoose.Types.ObjectId;
  };
}

// Middleware d'authentification pour transformer Request en AdminAuthRequest
const authenticateToken = (
  req: Request,
  res: Response,
  next: express.NextFunction
) => {
  // Dans une implémentation réelle, vérifier le token JWT
  // Pour cet exemple, on simule simplement un utilisateur admin
  (req as any).user = {
    _id: "admin123",
    email: "admin@example.com",
    role: "admin",
    companyId: new mongoose.Types.ObjectId(),
  };
  next();
};

// Middleware de vérification de rôle
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (user && roles.includes(user.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: "Accès refusé - Rôle insuffisant",
      });
    }
  };
};

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
 * @route   GET /api/admin/teams
 * @desc    Récupère toutes les équipes d'une entreprise
 * @access  Admin uniquement
 */
router.get(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.query;
      const userWithAuth = req as any;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'entreprise est requis",
        });
      }

      // Vérifier que l'identifiant de l'entreprise est valide
      if (!mongoose.Types.ObjectId.isValid(companyId as string)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'entreprise n'est pas valide",
        });
      }

      // Récupérer toutes les équipes de l'entreprise avec managers et employés peuplés
      const teams = await TeamModel.find({ companyId })
        .populate("managerIds", "firstName lastName email")
        .populate("employeeIds", "firstName lastName email status"); // Ajout du peuplement des employés

      return res.status(200).json({
        success: true,
        message: "Équipes récupérées avec succès",
        data: teams,
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
 * @route   POST /api/admin/teams
 * @desc    Crée une nouvelle équipe
 * @access  Admin uniquement
 */
router.post(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { name, managerIds, employeeIds, companyId } =
        req.body as CreateTeamInput;

      // Validation des champs requis
      if (!name || !managerIds || !employeeIds || !companyId) {
        return res.status(400).json({
          success: false,
          message:
            "Tous les champs sont requis (name, managerIds, employeeIds, companyId)",
        });
      }

      // Vérifier que les tableaux ne sont pas vides
      if (!Array.isArray(managerIds) || managerIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Au moins un manager doit être sélectionné",
        });
      }

      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Au moins un employé doit être sélectionné",
        });
      }

      // Vérifier que companyId est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'entreprise n'est pas valide",
        });
      }

      // Vérifier que tous les managerIds sont des ObjectId valides
      const invalidManagerIds = managerIds.filter(
        (id) => !mongoose.Types.ObjectId.isValid(id)
      );
      if (invalidManagerIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Certains identifiants de managers ne sont pas valides",
        });
      }

      // Vérifier que tous les employeeIds sont des ObjectId valides
      const invalidEmployeeIds = employeeIds.filter(
        (id) => !mongoose.Types.ObjectId.isValid(id)
      );
      if (invalidEmployeeIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Certains identifiants d'employés ne sont pas valides",
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
        if (!manager.companyId || manager.companyId.toString() !== companyId) {
          throw new Error(
            `Le manager avec l'ID ${managerId} n'appartient pas à l'entreprise spécifiée`
          );
        }
        return manager;
      });

      // Vérifier que tous les employés existent et appartiennent à l'entreprise
      const employeePromises = employeeIds.map(async (employeeId) => {
        const employee = await EmployeeModel.findById(employeeId);
        if (!employee) {
          throw new Error(`L'employé avec l'ID ${employeeId} n'existe pas`);
        }
        if (
          !employee.companyId ||
          employee.companyId.toString() !== companyId
        ) {
          throw new Error(
            `L'employé avec l'ID ${employeeId} n'appartient pas à l'entreprise spécifiée`
          );
        }
        return employee;
      });

      try {
        await Promise.all([...managerPromises, ...employeePromises]);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: (error as Error).message,
        });
      }

      // Créer la nouvelle équipe
      const newTeam = new TeamModel({
        name,
        managerIds,
        employeeIds,
        companyId,
      });

      const savedTeam = await newTeam.save();

      // Récupérer l'équipe avec les informations des managers
      const team = await TeamModel.findById(savedTeam._id)
        .populate("managerIds", "firstName lastName email")
        .populate("employeeIds", "firstName lastName email");

      return res.status(201).json({
        success: true,
        message: "Équipe créée avec succès",
        data: team,
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
 * @route   PATCH /api/admin/teams/:id
 * @desc    Met à jour une équipe existante
 * @access  Admin uniquement
 */
router.patch(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
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
      const team = await TeamModel.findById(id);
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
      const updatedTeam = await TeamModel.findByIdAndUpdate(
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
  authenticateToken,
  requireRole(["admin"]),
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
      const team = await TeamModel.findById(id);
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
      await TeamModel.findByIdAndDelete(id);

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

export default router;
