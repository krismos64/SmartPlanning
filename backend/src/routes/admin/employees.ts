import express, { Request, Response } from "express";
import mongoose from "mongoose";

// Import du modèle Employee
import EmployeeModel from "../../models/Employee.model";
// Import du type AuthRequest
import { AuthRequest } from "../../middlewares/auth.middleware";

const router = express.Router();

/**
 * @route   GET /api/admin/employees
 * @desc    Récupère tous les employés d'une entreprise spécifique
 * @access  Admin uniquement
 */
router.get(
  "/",
  async (req: AuthRequest, res: Response) => {
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
  async (req: AuthRequest, res: Response) => {
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

      // Récupérer les employés de l'entreprise avec tous les champs nécessaires
      const employees = await EmployeeModel.find({
        companyId: companyId as string,
      })
        .select({
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          status: 1,
          userId: 1,
          teamId: 1,
          companyId: 1,
          contractHoursPerWeek: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean();

      // Récupérer toutes les équipes de l'entreprise
      const TeamModel = mongoose.model("Team");
      const teams = await TeamModel.find({
        companyId: companyId as string,
      }).lean();

      // Associer les équipes aux employés
      const employeesWithTeams = employees.map((employee) => {
        // Utiliser le teamId de l'employé pour trouver son équipe
        let employeeTeams: Array<{ _id: any; name: string }> = [];

        if (employee.teamId) {
          const team = teams.find(
            (t) => String(t._id) === String(employee.teamId)
          );

          if (team) {
            employeeTeams = [{ _id: team._id, name: team.name }];
          }
        }

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
 * @route   GET /api/admin/employees/team/:teamId
 * @desc    Récupère tous les employés d'une équipe spécifique
 * @access  Admin uniquement
 */
router.get(
  "/team/:teamId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { teamId } = req.params;

      // Vérifier que l'ID d'équipe est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(teamId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'équipe invalide",
        });
      }

      // Récupérer l'équipe pour vérifier son existence
      const TeamModel = mongoose.model("Team");
      const team = await TeamModel.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // Récupérer les employés de l'équipe
      const employees = await EmployeeModel.find({ teamId })
        .select({
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          status: 1,
          userId: 1,
          teamId: 1,
          companyId: 1,
          contractHoursPerWeek: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean();

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

/**
 * @route   PATCH /api/admin/employees/:id
 * @desc    Met à jour un employé existant
 * @access  Admin uniquement
 */
router.patch(
  "/:id",
  async (req: AuthRequest, res: Response) => {
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
