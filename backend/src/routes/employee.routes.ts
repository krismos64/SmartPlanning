import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import EmployeeModel from "../models/Employee.model";
import { TeamModel } from "../models/Team.model";

const router = express.Router();

/**
 * Route GET /api/employees
 * Liste tous les employés actifs du manager connecté (toutes ses équipes)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "manager") {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    const managerTeams = await TeamModel.find(
      { managerIds: req.user._id },
      "_id"
    ).lean();
    const teamIds = managerTeams.map((team) => team._id);

    const employees = await EmployeeModel.find(
      { teamId: { $in: teamIds }, status: "actif" },
      "_id firstName lastName email status teamId companyId contractHoursPerWeek photoUrl"
    )
      .sort({ lastName: 1, firstName: 1 })
      .lean();

    return res.status(200).json({ success: true, data: employees });
  } catch (error) {
    console.error("Erreur récupération employés:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Route GET /api/employees/team/:teamId
 * Liste les employés d'une équipe spécifique
 */
router.get(
  "/team/:teamId",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { teamId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res
        .status(400)
        .json({ success: false, message: "Identifiant d'équipe invalide" });
    }

    try {
      const employees = await EmployeeModel.find({ teamId })
        .sort({ lastName: 1, firstName: 1 })
        .lean();

      return res.status(200).json({ success: true, data: employees });
    } catch (error) {
      console.error("Erreur récupération employés équipe:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Route POST /api/employees
 * Crée un nouvel employé
 */
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const {
    firstName,
    lastName,
    email,
    password,
    teamId,
    companyId,
    contractHoursPerWeek,
    status,
  } = req.body;

  if (!firstName || !lastName || !email || !password || !teamId || !companyId) {
    return res
      .status(400)
      .json({ success: false, message: "Champs obligatoires manquants" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await EmployeeModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      teamId,
      companyId,
      contractHoursPerWeek: contractHoursPerWeek || 35,
      status: status || "actif",
    });

    const employeeResponse = {
      _id: newEmployee._id,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      email: newEmployee.email,
      teamId: newEmployee.teamId,
      companyId: newEmployee.companyId,
      contractHoursPerWeek: newEmployee.contractHoursPerWeek,
      status: newEmployee.status,
    };

    return res.status(201).json({ success: true, data: employeeResponse });
  } catch (error) {
    console.error("Erreur création employé:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Route PATCH /api/employees/:employeeId
 * Met à jour un employé existant
 */
router.patch(
  "/:employeeId",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res
        .status(400)
        .json({ success: false, message: "Identifiant employé invalide" });
    }

    try {
      const updateData: any = { ...req.body };

      // Si un nouveau mot de passe est fourni, le hasher
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
        employeeId,
        updateData,
        { new: true, lean: true }
      );

      if (!updatedEmployee) {
        return res
          .status(404)
          .json({ success: false, message: "Employé non trouvé" });
      }

      return res.status(200).json({ success: true, data: updatedEmployee });
    } catch (error) {
      console.error("Erreur mise à jour employé:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Route DELETE /api/employees/:employeeId
 * Supprime un employé
 */
router.delete(
  "/:employeeId",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res
        .status(400)
        .json({ success: false, message: "Identifiant employé invalide" });
    }

    try {
      const deletedEmployee = await EmployeeModel.findByIdAndDelete(employeeId);

      if (!deletedEmployee) {
        return res
          .status(404)
          .json({ success: false, message: "Employé non trouvé" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Employé supprimé" });
    } catch (error) {
      console.error("Erreur suppression employé:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;
