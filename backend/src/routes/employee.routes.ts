import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import EmployeeModel from "../models/Employee.model";
import { TeamModel } from "../models/Team.model";
import User from "../models/User.model";

const router = express.Router();

/**
 * Route GET /api/employees
 * Liste tous les employés actifs:
 * - Pour un admin: tous les employés
 * - Pour un manager: seulement les employés de ses équipes
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "manager" && req.user.role !== "admin")
    ) {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    let employees;

    if (req.user.role === "admin") {
      // L'admin a accès à tous les employés actifs
      employees = await EmployeeModel.find(
        { status: "actif" },
        "_id firstName lastName email status teamId companyId contractHoursPerWeek photoUrl userId"
      )
        .populate("teamId", "name") // <<<<<< C'est la seule ligne à ajouter
        .sort({ lastName: 1, firstName: 1 })
        .lean();
    } else {
      // Le manager n'a accès qu'aux employés de ses équipes
      const managerTeams = await TeamModel.find(
        { managerIds: req.user._id },
        "_id"
      ).lean();
      const teamIds = managerTeams.map((team) => team._id);

      employees = await EmployeeModel.find(
        { teamId: { $in: teamIds }, status: "actif" },
        "_id firstName lastName email status teamId companyId contractHoursPerWeek photoUrl userId"
      )
        .sort({ lastName: 1, firstName: 1 })
        .lean();
    }

    // Conversion du champ userId en string pour assurer la cohérence dans la réponse API
    const formattedEmployees = employees.map((emp) => ({
      ...emp,
      userId: emp.userId?.toString() || null,
    }));

    return res.status(200).json({ success: true, data: formattedEmployees });
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
 * Crée un nouvel employé et un compte utilisateur associé
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

  // Démarrer une session pour assurer la cohérence des opérations
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Vérifier si l'email existe déjà dans la collection des utilisateurs
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé par un autre utilisateur",
      });
    }

    // Créer un nouvel utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create(
      [
        {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: "employee",
          status: "active",
          isEmailVerified: true, // Bypass car compte créé par un admin
          companyId,
        },
      ],
      { session }
    );

    // Créer l'employé associé
    const newEmployee = await EmployeeModel.create(
      [
        {
          firstName,
          lastName,
          email,
          teamId,
          companyId,
          contractHoursPerWeek: contractHoursPerWeek || 35,
          status: status || "actif",
          userId: newUser[0]._id, // Association avec l'utilisateur créé
        },
      ],
      { session }
    );

    // Valider la transaction
    await session.commitTransaction();
    session.endSession();

    // Préparer la réponse sans inclure les informations sensibles
    const response = {
      employee: {
        _id: newEmployee[0]._id,
        firstName: newEmployee[0].firstName,
        lastName: newEmployee[0].lastName,
        email: newEmployee[0].email,
        teamId: newEmployee[0].teamId,
        companyId: newEmployee[0].companyId,
        contractHoursPerWeek: newEmployee[0].contractHoursPerWeek,
        status: newEmployee[0].status,
        userId: newEmployee[0].userId,
      },
      user: {
        _id: newUser[0]._id,
        firstName: newUser[0].firstName,
        lastName: newUser[0].lastName,
        email: newUser[0].email,
        role: newUser[0].role,
        isEmailVerified: newUser[0].isEmailVerified,
      },
    };

    return res.status(201).json({
      success: true,
      message: "Employé et utilisateur créés avec succès",
      data: response,
    });
  } catch (error) {
    // En cas d'erreur, annuler la transaction
    await session.abortTransaction();
    session.endSession();

    console.error("Erreur création employé et utilisateur:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Route PATCH /api/employees/:employeeId
 * Met à jour un employé existant et son utilisateur associé si nécessaire
 */
router.patch(
  "/:employeeId",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { employeeId } = req.params;
    const updateData = { ...req.body };

    // Extraire et supprimer le mot de passe de l'objet de mise à jour pour l'employé
    const { password } = updateData;
    delete updateData.password;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res
        .status(400)
        .json({ success: false, message: "Identifiant employé invalide" });
    }

    // Démarrer une session pour assurer la cohérence des opérations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Récupérer l'employé pour obtenir son userId
      const employee = await EmployeeModel.findById(employeeId);

      if (!employee) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ success: false, message: "Employé non trouvé" });
      }

      // Mettre à jour l'employé
      const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
        employeeId,
        updateData,
        { new: true, lean: true, session }
      );

      // Si un mot de passe est fourni et que l'employé a un userId, mettre à jour l'utilisateur
      if (password && employee.userId) {
        // Hacher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Mettre à jour le mot de passe de l'utilisateur
        await User.findByIdAndUpdate(
          employee.userId,
          { password: hashedPassword },
          { session }
        );
      }

      // Valider la transaction
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Employé mis à jour avec succès",
        data: updatedEmployee,
      });
    } catch (error) {
      // En cas d'erreur, annuler la transaction
      await session.abortTransaction();
      session.endSession();

      console.error("Erreur mise à jour employé:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Route DELETE /api/employees/:employeeId
 * Supprime un employé et son utilisateur associé
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

    // Démarrer une session pour assurer la cohérence des opérations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Récupérer l'employé pour obtenir son userId avant suppression
      const employee = await EmployeeModel.findById(employeeId);

      if (!employee) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ success: false, message: "Employé non trouvé" });
      }

      // Supprimer l'employé
      await EmployeeModel.findByIdAndDelete(employeeId, { session });

      // Si l'employé avait un userId, supprimer également l'utilisateur associé
      if (employee.userId) {
        await User.findByIdAndDelete(employee.userId, { session });
      }

      // Valider la transaction
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Employé et utilisateur associé supprimés avec succès",
      });
    } catch (error) {
      // En cas d'erreur, annuler la transaction
      await session.abortTransaction();
      session.endSession();

      console.error("Erreur suppression employé et utilisateur:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;
