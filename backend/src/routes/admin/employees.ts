import express, { Request, Response } from "express";
import mongoose from "mongoose";

// Import du modèle Employee
import EmployeeModel from "../../models/Employee.model";

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

const router = express.Router();

/**
 * @route   GET /api/admin/employees
 * @desc    Récupère tous les employés d'une entreprise spécifique
 * @access  Admin uniquement
 */
router.get(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.query;

      // Vérifier que le paramètre companyId est présent
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "Le paramètre companyId est obligatoire",
        });
      }

      // Vérifier que companyId est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(companyId as string)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'entreprise n'est pas valide",
        });
      }

      // Récupérer les employés de l'entreprise
      const employees = await EmployeeModel.find(
        { companyId: companyId as string },
        {
          _id: 1,
          firstName: 1,
          lastName: 1,
          status: 1,
        }
      );

      // Retourner les résultats
      return res.status(200).json({
        success: true,
        employees,
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

/**
 * @route   GET /api/admin/employees/withteams
 * @desc    Récupère tous les employés d'une entreprise avec leurs équipes associées
 * @access  Admin uniquement
 */
router.get(
  "/withteams",
  authenticateToken,
  requireRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.query;

      // Vérifier que le paramètre companyId est présent
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "Le paramètre companyId est obligatoire",
        });
      }

      // Vérifier que companyId est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(companyId as string)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'entreprise n'est pas valide",
        });
      }

      // Récupérer les employés de l'entreprise
      const employees = await EmployeeModel.find({
        companyId: companyId as string,
      }).lean();

      // Récupérer toutes les équipes de l'entreprise
      const TeamModel = mongoose.model("Team");
      const teams = await TeamModel.find({
        companyId: companyId as string,
      }).lean();

      // Associer les équipes aux employés
      const employeesWithTeams = employees.map((employee) => {
        // Trouver les équipes où cet employé est référencé
        const employeeTeams = teams.filter((team) => {
          if (!team.employeeIds || !Array.isArray(team.employeeIds))
            return false;
          return team.employeeIds.some(
            (id) => String(id) === String(employee._id)
          );
        });

        // Ajouter la liste des équipes à l'employé
        return {
          ...employee,
          teams: employeeTeams.map((team) => ({
            _id: team._id,
            name: team.name,
          })),
        };
      });

      // Retourner les résultats
      return res.status(200).json({
        success: true,
        data: employeesWithTeams,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des employés avec équipes:",
        error
      );
      return res.status(500).json({
        success: false,
        message:
          "Erreur serveur lors de la récupération des employés avec équipes",
      });
    }
  }
);

/**
 * @route   PATCH /api/admin/employees/:id
 * @desc    Met à jour un employé existant
 * @access  Admin uniquement
 */
router.patch(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { teamId, status } = req.body;

      // Vérifier que l'ID de l'employé est valide
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'employé n'est pas valide",
        });
      }

      // Vérifier que l'employé existe
      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "L'employé spécifié n'existe pas",
        });
      }

      // Préparer l'objet de mise à jour
      const updateData: any = {};

      // Mettre à jour le teamId si fourni
      if (teamId !== undefined) {
        // Vérifier que le teamId est valide ou null
        if (teamId !== null && !mongoose.Types.ObjectId.isValid(teamId)) {
          return res.status(400).json({
            success: false,
            message: "L'identifiant d'équipe n'est pas valide",
          });
        }

        // Si un teamId est fourni, vérifier que l'équipe existe et appartient à la même entreprise
        if (teamId) {
          const TeamModel = mongoose.model("Team");
          const team = await TeamModel.findById(teamId);

          if (!team) {
            return res.status(404).json({
              success: false,
              message: "L'équipe spécifiée n'existe pas",
            });
          }

          if (team.companyId.toString() !== employee.companyId.toString()) {
            return res.status(400).json({
              success: false,
              message:
                "L'équipe n'appartient pas à la même entreprise que l'employé",
            });
          }
        }

        updateData.teamId = teamId;
      }

      // Mettre à jour le statut si fourni
      if (status !== undefined) {
        if (status !== "actif" && status !== "inactif") {
          return res.status(400).json({
            success: false,
            message: "Le statut doit être 'actif' ou 'inactif'",
          });
        }

        updateData.status = status;
      }

      // Mettre à jour l'employé
      const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Employé mis à jour avec succès",
        data: updatedEmployee,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'employé:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour de l'employé",
      });
    }
  }
);

export default router;
