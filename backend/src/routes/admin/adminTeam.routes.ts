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
  managerId: string;
  companyId: string;
}

// Interface pour la mise à jour d'équipe
interface UpdateTeamInput {
  name?: string;
  managerIds?: string[];
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

      // Récupérer toutes les équipes de l'entreprise
      const teams = await TeamModel.find({ companyId }).populate(
        "managerIds",
        "firstName lastName email"
      );

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
      const { name, managerId, companyId } = req.body as CreateTeamInput;
      const userWithAuth = req as any;

      // Validation des champs requis
      if (!name || !managerId || !companyId) {
        return res.status(400).json({
          success: false,
          message: "Tous les champs sont requis (name, managerId, companyId)",
        });
      }

      // Vérifier que le managerId et companyId sont des ObjectId valides
      if (
        !mongoose.Types.ObjectId.isValid(managerId) ||
        !mongoose.Types.ObjectId.isValid(companyId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Les identifiants fournis ne sont pas valides",
        });
      }

      // Vérifier que le manager existe, a le rôle "manager" et appartient à l'entreprise
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Le manager spécifié n'existe pas",
        });
      }

      if (manager.role !== "manager") {
        return res.status(400).json({
          success: false,
          message: "L'utilisateur spécifié n'est pas un manager",
        });
      }

      if (!manager.companyId || manager.companyId.toString() !== companyId) {
        return res.status(400).json({
          success: false,
          message: "Le manager n'appartient pas à l'entreprise spécifiée",
        });
      }

      // Créer la nouvelle équipe
      const newTeam = new TeamModel({
        name,
        managerIds: [managerId],
        companyId,
      });

      const savedTeam = await newTeam.save();

      // Récupérer l'équipe avec les informations du manager
      const team = await TeamModel.findById(savedTeam._id).populate(
        "managerIds",
        "firstName lastName email"
      );

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
      const { name, managerId } = req.body as UpdateTeamInput;
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

      if (managerId !== undefined) {
        // Vérifier que le managerId est valide
        if (!mongoose.Types.ObjectId.isValid(managerId)) {
          return res.status(400).json({
            success: false,
            message: "L'identifiant du manager n'est pas valide",
          });
        }

        // Vérifier que le manager existe, a le rôle "manager" et appartient à l'entreprise
        const manager = await User.findById(managerId);
        if (!manager) {
          return res.status(404).json({
            success: false,
            message: "Le manager spécifié n'existe pas",
          });
        }

        if (manager.role !== "manager") {
          return res.status(400).json({
            success: false,
            message: "L'utilisateur spécifié n'est pas un manager",
          });
        }

        if (
          !manager.companyId ||
          manager.companyId.toString() !== team.companyId.toString()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Le manager n'appartient pas à l'entreprise de cette équipe",
          });
        }

        updateData.managerIds = [managerId];
      }

      // Mettre à jour l'équipe
      const updatedTeam = await TeamModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      ).populate("managerIds", "firstName lastName email");

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
