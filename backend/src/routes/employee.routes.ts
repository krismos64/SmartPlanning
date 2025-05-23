import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import EmployeeModel from "../models/Employee.model";
import { TeamModel } from "../models/Team.model";
import User from "../models/User.model";

const router = express.Router();

/**
 * Route GET /api/employees
 * Liste tous les employés actifs:
 * - Pour un admin: tous les employés
 * - Pour un directeur: tous les employés de son entreprise
 * - Pour un manager: seulement les employés de ses équipes
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "manager" &&
        req.user.role !== "admin" &&
        req.user.role !== "directeur")
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
        .populate("teamId", "name")
        .sort({ lastName: 1, firstName: 1 })
        .lean();
    } else if (req.user.role === "directeur") {
      // Le directeur n'a accès qu'aux employés de son entreprise
      if (!req.user.companyId) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise manquant pour le directeur",
        });
      }

      employees = await EmployeeModel.find(
        { companyId: req.user.companyId, status: "actif" },
        "_id firstName lastName email status teamId companyId contractHoursPerWeek photoUrl userId"
      )
        .populate("teamId", "name")
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
        .populate("teamId", "name")
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
    console.log(
      `[GET /employees/team/:teamId] Recherche des employés pour l'équipe: ${teamId}`
    );

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      console.log(
        `[GET /employees/team/:teamId] ID d'équipe invalide: ${teamId}`
      );
      return res
        .status(400)
        .json({ success: false, message: "Identifiant d'équipe invalide" });
    }

    try {
      // Vérifier si l'équipe existe d'abord
      const team = await TeamModel.findById(teamId).lean();
      if (!team) {
        console.log(
          `[GET /employees/team/:teamId] Équipe non trouvée avec ID: ${teamId}`
        );
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      console.log(`[GET /employees/team/:teamId] Équipe trouvée: ${team.name}`);
      console.log(
        `[GET /employees/team/:teamId] Employés dans l'équipe:`,
        team.employeeIds ? team.employeeIds.length : 0
      );

      // D'abord, rechercher les employés qui ont cette équipe comme teamId
      const employeesByTeamId = await EmployeeModel.find({ teamId })
        .sort({ lastName: 1, firstName: 1 })
        .lean();

      console.log(
        `[GET /employees/team/:teamId] Employés trouvés via teamId: ${employeesByTeamId.length}`
      );

      // Ensuite, rechercher les employés qui sont listés dans employeeIds de l'équipe
      let employeesByTeamList: any[] = [];
      if (team.employeeIds && team.employeeIds.length > 0) {
        employeesByTeamList = await EmployeeModel.find({
          _id: { $in: team.employeeIds },
        })
          .sort({ lastName: 1, firstName: 1 })
          .lean();

        console.log(
          `[GET /employees/team/:teamId] Employés trouvés via employeeIds: ${employeesByTeamList.length}`
        );
      }

      // Fusionner les deux listes sans doublons
      const allEmployeeIds = new Set();
      const allEmployees = [];

      // Ajouter les employés trouvés par teamId
      for (const emp of employeesByTeamId) {
        if (!allEmployeeIds.has(emp._id.toString())) {
          allEmployeeIds.add(emp._id.toString());
          allEmployees.push(emp);
        }
      }

      // Ajouter les employés trouvés par la liste d'employeeIds
      for (const emp of employeesByTeamList) {
        if (!allEmployeeIds.has(emp._id.toString())) {
          allEmployeeIds.add(emp._id.toString());
          allEmployees.push(emp);
        }
      }

      console.log(
        `[GET /employees/team/:teamId] Total d'employés uniques trouvés: ${allEmployees.length}`
      );

      return res.status(200).json({ success: true, data: allEmployees });
    } catch (error) {
      console.error("[GET /employees/team/:teamId] Erreur:", error);
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
 *
 * Cette route est maintenue pour la rétrocompatibilité mais est dépréciée.
 * Utiliser plutôt la route POST /api/employees/create qui offre plus de flexibilité.
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
    // Le mot de passe sera hashé automatiquement par le hook pre('save') du modèle User
    const newUser = await User.create(
      [
        {
          firstName,
          lastName,
          email,
          password,
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
 * Route POST /api/employees/create
 * Crée un nouvel employé ou manager selon le rôle spécifié
 *
 * Accessible uniquement aux directeurs
 * Permet de créer:
 * - Des employés (role="employee") associés à une équipe
 * - Des managers (role="manager") associés à une équipe comme gestionnaire
 */
router.post(
  "/create",
  authenticateToken,
  checkRole(["directeur"]),
  async (req: AuthRequest, res: Response) => {
    console.log(
      "[POST /employees/create] Début de la création d'un employé ou manager"
    );

    // Extraction des champs de la requête
    const {
      firstName,
      lastName,
      email,
      role,
      teamId,
      photoUrl,
      contractHoursPerWeek = 35,
      status = "actif",
    } = req.body;

    // Validation des champs obligatoires
    if (!firstName || !lastName || !email || !role) {
      console.log("[POST /employees/create] Champs obligatoires manquants");
      return res.status(400).json({
        success: false,
        message:
          "Champs obligatoires manquants: firstName, lastName, email et role sont requis",
      });
    }

    // Validation du rôle (uniquement employé ou manager)
    if (role !== "employee" && role !== "manager" && role !== "employé") {
      console.log(`[POST /employees/create] Rôle invalide: ${role}`);
      return res.status(400).json({
        success: false,
        message: "Le rôle doit être 'employee' ou 'manager'",
      });
    }

    // Vérification que le directeur a bien un companyId
    if (!req.user?.companyId) {
      console.log(
        "[POST /employees/create] CompanyId manquant pour le directeur"
      );
      return res.status(400).json({
        success: false,
        message: "ID d'entreprise manquant pour le directeur",
      });
    }

    // Pour un manager, teamId est obligatoire
    if (role === "manager" && !teamId) {
      console.log(
        "[POST /employees/create] TeamId manquant pour la création d'un manager"
      );
      return res.status(400).json({
        success: false,
        message: "L'ID d'équipe est obligatoire pour créer un manager",
      });
    }

    // Validation de teamId si fourni
    if (teamId && !mongoose.Types.ObjectId.isValid(teamId)) {
      console.log(`[POST /employees/create] ID d'équipe invalide: ${teamId}`);
      return res.status(400).json({
        success: false,
        message: "ID d'équipe invalide",
      });
    }

    // Démarrer une session pour assurer la cohérence des opérations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Vérifier si l'email existe déjà
      console.log(
        `[POST /employees/create] Vérification de l'unicité de l'email: ${email}`
      );
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        console.log(`[POST /employees/create] Email déjà utilisé: ${email}`);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé par un autre utilisateur",
        });
      }

      // Si teamId est fourni, vérifier que l'équipe existe et appartient à la même entreprise
      if (teamId) {
        console.log(
          `[POST /employees/create] Vérification de l'équipe: ${teamId}`
        );
        const team = await TeamModel.findById(teamId).lean();

        if (!team) {
          console.log(`[POST /employees/create] Équipe non trouvée: ${teamId}`);
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            success: false,
            message: "Équipe introuvable",
          });
        }

        // Vérifier que l'équipe appartient à la même entreprise que le directeur
        if (team.companyId.toString() !== req.user.companyId.toString()) {
          console.log(
            `[POST /employees/create] Tentative d'accès inter-entreprise: équipe ${teamId} (entreprise ${team.companyId}) vs directeur (entreprise ${req.user.companyId})`
          );
          await session.abortTransaction();
          session.endSession();
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez pas créer un utilisateur dans une équipe d'une autre entreprise",
          });
        }
      }

      // Générer un mot de passe temporaire aléatoire
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      console.log(
        `[POST /employees/create] Mot de passe temporaire généré et hashé`
      );

      // Normaliser le rôle pour la base de données
      const normalizedRole = role === "employé" ? "employee" : role;

      // Créer un nouvel utilisateur
      console.log(
        `[POST /employees/create] Création d'un utilisateur avec le rôle: ${normalizedRole}`
      );
      const newUser = await User.create(
        [
          {
            firstName,
            lastName,
            email,
            password: hashedPassword, // Utiliser le mot de passe déjà hashé
            role: normalizedRole, // Utiliser le rôle normalisé (employee ou manager)
            status: "active",
            isEmailVerified: true, // Bypass car compte créé par un directeur
            companyId: req.user.companyId,
          },
        ],
        { session }
      );

      let response: any = {
        user: {
          _id: newUser[0]._id,
          firstName: newUser[0].firstName,
          lastName: newUser[0].lastName,
          email: newUser[0].email,
          role: newUser[0].role,
          isEmailVerified: newUser[0].isEmailVerified,
        },
        tempPassword, // Inclure le mot de passe temporaire en clair dans la réponse
      };

      // Traitement spécifique selon le rôle
      if (normalizedRole === "employee") {
        // Pour un employé, créer une entrée dans EmployeeModel
        console.log(
          `[POST /employees/create] Création d'un employé dans EmployeeModel`
        );
        const newEmployee = await EmployeeModel.create(
          [
            {
              firstName,
              lastName,
              email,
              teamId,
              companyId: req.user.companyId,
              contractHoursPerWeek,
              status,
              photoUrl,
              userId: newUser[0]._id,
            },
          ],
          { session }
        );

        response.employee = {
          _id: newEmployee[0]._id,
          firstName: newEmployee[0].firstName,
          lastName: newEmployee[0].lastName,
          email: newEmployee[0].email,
          teamId: newEmployee[0].teamId,
          companyId: newEmployee[0].companyId,
          contractHoursPerWeek: newEmployee[0].contractHoursPerWeek,
          status: newEmployee[0].status,
          userId: newEmployee[0].userId,
        };
      } else if (normalizedRole === "manager") {
        // Pour un manager, créer une entrée dans EmployeeModel ET l'ajouter à la liste des managers de l'équipe
        console.log(
          `[POST /employees/create] Création d'un manager dans EmployeeModel et ajout à l'équipe: ${teamId}`
        );

        // Créer l'entrée dans EmployeeModel
        const newEmployee = await EmployeeModel.create(
          [
            {
              firstName,
              lastName,
              email,
              teamId,
              companyId: req.user.companyId,
              contractHoursPerWeek: contractHoursPerWeek || 35,
              status: status || "actif",
              photoUrl,
              userId: newUser[0]._id,
              role: "manager", // Spécifier explicitement le rôle
            },
          ],
          { session }
        );

        // Ajouter le manager à l'équipe
        const updatedTeam = await TeamModel.findByIdAndUpdate(
          teamId,
          { $addToSet: { managerIds: newUser[0]._id } },
          { new: true, session }
        );

        response.employee = {
          _id: newEmployee[0]._id,
          firstName: newEmployee[0].firstName,
          lastName: newEmployee[0].lastName,
          email: newEmployee[0].email,
          teamId: newEmployee[0].teamId,
          companyId: newEmployee[0].companyId,
          contractHoursPerWeek: newEmployee[0].contractHoursPerWeek,
          status: newEmployee[0].status,
          userId: newEmployee[0].userId,
        };
        response.team = updatedTeam;
      }

      // Valider la transaction
      await session.commitTransaction();
      session.endSession();
      console.log("[POST /employees/create] Transaction validée avec succès");

      return res.status(201).json({
        success: true,
        message: `${
          normalizedRole === "employee" ? "Employé" : "Manager"
        } créé avec succès`,
        data: response,
      });
    } catch (error) {
      // En cas d'erreur, annuler la transaction
      await session.abortTransaction();
      session.endSession();

      console.error("[POST /employees/create] Erreur:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la création",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

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
        // Méthode 1: Utiliser directement User.updateOne pour éviter le hook pre('save')
        await User.updateOne(
          { _id: employee.userId },
          { $set: { password: await bcrypt.hash(password, 10) } },
          { session }
        );

        // Méthode 2 (alternative): Récupérer l'utilisateur et utiliser save() (mais risque de double hashage)
        // const user = await User.findById(employee.userId);
        // if (user) {
        //   user.password = password;
        //   await user.save({ session });
        // }
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
