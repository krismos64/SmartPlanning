import bcrypt from "bcrypt";
import crypto from "crypto";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import EmployeeModel from "../models/Employee.model";
import { TeamModel } from "../models/Team.model";
import User from "../models/User.model";
import { sendEmployeeWelcomeEmail } from "../utils/email";

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
    console.error("Erreur lors de la récupération des employés:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des employés",
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
      // Récupérer l'équipe pour vérifier son existence
      const team = await TeamModel.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // Utiliser la méthode statique pour récupérer les employés de l'équipe
      const employees = await EmployeeModel.find({ teamId })
        .populate("userId", "email")
        .lean();

      return res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des employés:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
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
 * Accessible aux directeurs et managers
 * Permet de créer:
 * - Des employés (role="employee") associés à une équipe
 * - Des managers (role="manager") associés à une équipe comme gestionnaire
 */
router.post(
  "/create",
  authenticateToken,
  checkRole(["directeur", "manager"]),
  async (req: AuthRequest, res: Response) => {
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

    // Vérification des champs obligatoires
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être fournis",
      });
    }

    // Validation du rôle selon le rôle de l'utilisateur qui fait la demande
    let validRoles: string[] = [];
    if (req.user?.role === "directeur") {
      validRoles = ["employee", "manager", "directeur"];
    } else if (req.user?.role === "manager") {
      validRoles = ["employee"]; // Les managers ne peuvent créer que des employés
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Rôle invalide. Valeurs acceptées pour votre rôle : ${validRoles.join(
          ", "
        )}`,
      });
    }

    // Vérification de l'ID d'entreprise selon le rôle
    let companyId = "";
    if (req.user?.role === "directeur") {
      if (!req.user?.companyId) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise manquant pour le directeur",
        });
      }
      companyId = req.user.companyId;
    } else if (req.user?.role === "manager") {
      // Pour un manager, on récupère l'entreprise via ses équipes
      if (!req.user?.teamIds || req.user.teamIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Manager non assigné à des équipes",
        });
      }

      // Récupérer l'ID d'entreprise via la première équipe du manager
      const managerTeam = await TeamModel.findById(req.user.teamIds[0]).lean();
      if (!managerTeam) {
        return res.status(400).json({
          success: false,
          message: "Équipe du manager introuvable",
        });
      }
      companyId = managerTeam.companyId.toString();
    }

    // Pour un manager ou un employé, teamId est obligatoire
    if ((role === "manager" || role === "employee") && !teamId) {
      return res.status(400).json({
        success: false,
        message:
          "L'ID d'équipe est obligatoire pour créer un employé ou manager",
      });
    }

    // Validation de l'ID d'équipe si fourni
    if (teamId && !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant d'équipe n'est pas valide",
      });
    }

    // Démarrer une session pour assurer la cohérence des opérations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Vérifier si l'email existe déjà
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé par un autre utilisateur",
        });
      }

      // Si teamId est fourni, vérifier que l'équipe existe et appartient à la même entreprise
      if (teamId) {
        const team = await TeamModel.findById(teamId).lean();

        if (!team) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            success: false,
            message: "Équipe introuvable",
          });
        }

        // Vérifier que l'équipe appartient à la même entreprise
        if (team.companyId.toString() !== companyId) {
          await session.abortTransaction();
          session.endSession();
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez pas créer un utilisateur dans une équipe d'une autre entreprise",
          });
        }

        // Vérification supplémentaire pour les managers : ils ne peuvent créer des employés que dans leurs équipes
        if (req.user?.role === "manager") {
          const isManagerOfTeam = req.user.teamIds?.some(
            (managerTeamId: any) => managerTeamId.toString() === teamId
          );

          if (!isManagerOfTeam) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({
              success: false,
              message:
                "Vous ne pouvez créer des employés que dans les équipes que vous gérez",
            });
          }
        }
      }

      // Normaliser le rôle pour la base de données
      const normalizedRole = role === "employé" ? "employee" : role;

      // Pour les employés, créer un utilisateur sans mot de passe et envoyer un email de bienvenue
      if (normalizedRole === "employee") {
        // Générer un token de création de mot de passe
        const createPasswordToken = crypto.randomBytes(32).toString("hex");
        const createPasswordTokenHash = crypto
          .createHash("sha256")
          .update(createPasswordToken)
          .digest("hex");

        // Créer un nouvel utilisateur sans mot de passe
        const newUser = await User.create(
          [
            {
              firstName,
              lastName,
              email,
              role: normalizedRole,
              status: "active",
              isEmailVerified: false, // Sera vérifié lors de la création du mot de passe
              companyId,
              resetPasswordToken: createPasswordTokenHash, // Réutiliser ce champ pour le token de création
              resetPasswordExpire: new Date(Date.now() + 7 * 24 * 3600000), // 7 jours
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
              contractHoursPerWeek,
              status,
              photoUrl,
              userId: newUser[0]._id,
            },
          ],
          { session }
        );

        // Envoyer l'email de bienvenue avec le lien de création de mot de passe
        const frontendBaseUrl =
          process.env.FRONTEND_URL || "http://localhost:3000";
        const createPasswordUrl = `${frontendBaseUrl}/create-password?token=${createPasswordToken}&email=${email}`;

        try {
          await sendEmployeeWelcomeEmail(email, firstName, createPasswordUrl);
          console.log(`📧 Email de bienvenue envoyé à ${email}`);
        } catch (emailError) {
          console.error(
            "Erreur lors de l'envoi de l'email de bienvenue:",
            emailError
          );
          // Ne pas faire échouer la création de l'employé pour un problème d'email
        }

        let response: any = {
          user: {
            _id: newUser[0]._id,
            firstName: newUser[0].firstName,
            lastName: newUser[0].lastName,
            email: newUser[0].email,
            role: newUser[0].role,
            isEmailVerified: newUser[0].isEmailVerified,
          },
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
          message:
            "Un email de bienvenue a été envoyé à l'employé pour qu'il puisse créer son mot de passe.",
        };

        // Valider la transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
          success: true,
          message: "Employé créé avec succès",
          data: response,
        });
      } else {
        // Pour les managers et directeurs, garder l'ancien système avec mot de passe temporaire
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Créer un nouvel utilisateur
        const newUser = await User.create(
          [
            {
              firstName,
              lastName,
              email,
              password: hashedPassword,
              role: normalizedRole,
              status: "active",
              isEmailVerified: true,
              companyId,
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
          tempPassword,
        };

        // Traitement spécifique selon le rôle
        if (normalizedRole === "manager") {
          // Pour un manager, mettre à jour les équipes qu'il gère
          if (teamId) {
            // Ajouter cette équipe aux équipes gérées par le manager
            newUser[0].teamIds = [teamId];
            await newUser[0].save({ session });

            // Optionnellement, mettre à jour l'équipe pour référencer ce manager
            await TeamModel.findByIdAndUpdate(
              teamId,
              { managerId: newUser[0]._id },
              { session }
            );
          }

          response.manager = {
            _id: newUser[0]._id,
            firstName: newUser[0].firstName,
            lastName: newUser[0].lastName,
            email: newUser[0].email,
            role: newUser[0].role,
            teamIds: newUser[0].teamIds,
          };
        }

        // Valider la transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
          success: true,
          message: "Utilisateur créé avec succès",
          data: response,
        });
      }
    } catch (error) {
      // En cas d'erreur, annuler la transaction
      await session.abortTransaction();
      session.endSession();

      console.error("Erreur création employé/manager:", error);
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

/**
 * Route GET /api/employees/me
 * Récupère les informations de l'employé connecté
 */
router.get(
  "/me",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const userId = req.user.userId || req.user._id || req.user.id;

      // Récupérer l'employé basé sur le userId
      const employee = await EmployeeModel.findOne({ userId })
        .populate("teamId", "name")
        .populate("companyId", "name")
        .lean();

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Profil employé non trouvé",
        });
      }

      return res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du profil employé:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
      });
    }
  }
);

export default router;
