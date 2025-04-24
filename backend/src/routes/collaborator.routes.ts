/**
 * Routes pour la gestion des collaborateurs (Users + Employees)
 *
 * Ces routes permettent aux directeurs et managers de gérer leurs collaborateurs
 * avec des permissions spécifiques selon leur rôle:
 * - Directeur: peut gérer managers et employés de son entreprise
 * - Manager: peut gérer uniquement les employés de son équipe
 */
import bcrypt from "bcrypt";
import express, { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticateToken } from "../middlewares/auth.middleware";
import EmployeeModel, { EmployeeDocument } from "../models/Employee.model";
import User, { UserDocument, UserRole } from "../models/User.model";

// Extension de l'interface AuthRequest pour inclure les objets cible
interface CollaboratorAuthRequest extends AuthRequest {
  targetUser?: UserDocument;
  targetEmployee?: EmployeeDocument | null;
}

const router = express.Router();

/**
 * Middleware vérifiant si l'utilisateur a un rôle autorisé
 */
const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé pour ce rôle",
      });
    }

    next();
  };
};

/**
 * Middleware de validation des permissions de gestion
 * Vérifie si l'utilisateur peut gérer un collaborateur avec un rôle spécifique
 */
const canManageRole = (
  req: AuthRequest,
  res: Response,
  next: express.NextFunction
) => {
  const targetRole = req.body.role;

  // Vérifie si le rôle cible est valide et différent de "admin"
  if (!targetRole || !["manager", "employee"].includes(targetRole)) {
    return res.status(400).json({
      success: false,
      message: "Rôle invalide ou non autorisé",
    });
  }

  // Les directeurs peuvent gérer les managers et employés
  if (req.user.role === "directeur") {
    if (targetRole === "directeur" || targetRole === "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Vous ne pouvez pas créer ou modifier des comptes directeur ou admin",
      });
    }
    return next();
  }

  // Les managers peuvent gérer uniquement les employés
  if (req.user.role === "manager" && targetRole === "employee") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Vous n'êtes pas autorisé à gérer ce type de compte",
  });
};

/**
 * Vérifie les permissions pour une opération sur un collaborateur existant
 */
const checkCollaboratorPermissions = async (
  req: CollaboratorAuthRequest,
  res: Response,
  next: express.NextFunction
) => {
  const collaboratorId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(collaboratorId)) {
    return res.status(400).json({
      success: false,
      message: "ID de collaborateur invalide",
    });
  }

  try {
    // Récupérer l'utilisateur cible
    const targetUser = await User.findById(collaboratorId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Collaborateur non trouvé",
      });
    }

    // Un admin ne peut pas être modifié via ces routes
    if (targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Les comptes administrateur ne peuvent pas être modifiés via cette route",
      });
    }

    // Un directeur ne peut pas être modifié via ces routes
    if (targetUser.role === "directeur") {
      return res.status(403).json({
        success: false,
        message:
          "Les comptes directeur ne peuvent pas être modifiés via cette route",
      });
    }

    // Récupérer l'employé lié
    const targetEmployee = await EmployeeModel.findOne({
      userId: collaboratorId,
    });

    // Vérifier les permissions selon le rôle de l'utilisateur connecté
    if (req.user.role === "directeur") {
      // Un directeur peut uniquement modifier les utilisateurs de son entreprise
      if (
        !targetUser.companyId ||
        targetUser.companyId.toString() !== req.user.companyId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Vous ne pouvez pas modifier un collaborateur d'une autre entreprise",
        });
      }
    } else if (req.user.role === "manager") {
      // Vérifier si l'utilisateur cible est un manager
      if (targetUser.role === "manager") {
        return res.status(403).json({
          success: false,
          message: "Un manager ne peut pas modifier un autre manager",
        });
      }

      // Un manager peut uniquement modifier les employés de son équipe
      if (
        !targetEmployee ||
        !targetEmployee.teamId ||
        targetEmployee.teamId.toString() !== req.user.teamId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Vous ne pouvez pas modifier un employé qui n'est pas dans votre équipe",
        });
      }
    }

    // Ajouter les objets récupérés à la requête pour éviter de les rechercher à nouveau
    req.targetUser = targetUser;
    req.targetEmployee = targetEmployee;
    next();
  } catch (error) {
    console.error("Erreur lors de la vérification des permissions:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la vérification des permissions",
    });
  }
};

/**
 * @route   POST /api/collaborators
 * @desc    Crée un nouvel utilisateur collaborateur (manager ou employé)
 * @access  Privé (directeur, manager)
 */
router.post(
  "/",
  authenticateToken,
  requireRole(["directeur", "manager"]),
  canManageRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        role,
        teamId,
        contractHoursPerWeek = 35, // Valeur par défaut
      } = req.body;

      // Validation des champs requis
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Tous les champs obligatoires doivent être renseignés",
        });
      }

      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Un utilisateur avec cet email existe déjà",
        });
      }

      // Valider le teamId pour un employé
      if (role === "employee" && !teamId) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant d'équipe est requis pour un employé",
        });
      }

      // Préparer le companyId selon le rôle de l'utilisateur connecté
      let companyId = req.user.companyId;

      // Pour les managers, vérifier que l'employé est assigné à une équipe qu'ils gèrent
      if (req.user.role === "manager") {
        if (teamId && teamId !== req.user.teamId.toString()) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez pas assigner un employé à une équipe que vous ne gérez pas",
          });
        }
      }

      // Créer le nouvel utilisateur
      const newUser = new User({
        firstName,
        lastName,
        email,
        password, // Sera haché automatiquement par le middleware pre-save
        role,
        companyId,
        status: "active",
        isEmailVerified: true, // Simplification - à adapter selon les besoins
      });

      // Sauvegarder l'utilisateur
      const savedUser = await newUser.save();

      // Pour les managers ou employés, créer aussi une entrée dans le modèle Employee
      let employee = null;
      if (role === "manager" || role === "employee") {
        // Déterminer le teamId
        const employeeTeamId = role === "employee" ? teamId : null;

        employee = new EmployeeModel({
          userId: savedUser._id,
          companyId,
          teamId: employeeTeamId,
          firstName,
          lastName,
          status: "actif",
          contractHoursPerWeek,
        });

        await employee.save();
      }

      // Créer une copie de l'objet utilisateur sans le mot de passe pour la réponse
      const userResponse = { ...savedUser.toObject() };
      if ("password" in userResponse) {
        // @ts-ignore - Cette ligne est nécessaire car le type ne reflète pas bien l'opération
        userResponse.password = undefined;
      }

      res.status(201).json({
        success: true,
        message: "Collaborateur créé avec succès",
        data: {
          user: userResponse,
          employee,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la création du collaborateur:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la création du collaborateur",
      });
    }
  }
);

/**
 * @route   PATCH /api/collaborators/:id
 * @desc    Met à jour un collaborateur existant
 * @access  Privé (directeur, manager)
 */
router.patch(
  "/:id",
  authenticateToken,
  requireRole(["directeur", "manager"]),
  checkCollaboratorPermissions,
  async (req: CollaboratorAuthRequest, res: Response) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        role,
        teamId,
        contractHoursPerWeek,
      } = req.body;

      const { targetUser, targetEmployee } = req;

      // Vérifier que targetUser existe (devrait toujours être le cas à ce point)
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Collaborateur non trouvé",
        });
      }

      // Vérifier si le changement de rôle est autorisé
      if (role && role !== targetUser.role) {
        if (
          req.user.role === "manager" ||
          !["manager", "employee"].includes(role)
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Vous n'êtes pas autorisé à changer le rôle de ce collaborateur",
          });
        }
      }

      // Vérifier l'équipe pour un manager
      if (
        req.user.role === "manager" &&
        teamId &&
        teamId !== req.user.teamId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Vous ne pouvez assigner un employé qu'à votre propre équipe",
        });
      }

      // Mettre à jour le User
      if (firstName) targetUser.firstName = firstName;
      if (lastName) targetUser.lastName = lastName;

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (email && email !== targetUser.email) {
        const existingUser = await User.findOne({
          email,
          _id: { $ne: targetUser._id },
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Cet email est déjà utilisé par un autre utilisateur",
          });
        }
        targetUser.email = email;
      }

      // Mise à jour du rôle si autorisé
      if (role && role !== targetUser.role && req.user.role === "directeur") {
        targetUser.role = role;
      }

      // Mise à jour du mot de passe si fourni
      if (password) {
        // Hasher le nouveau mot de passe (le middleware pre-save ne se déclenche pas toujours avec findByIdAndUpdate)
        const salt = await bcrypt.genSalt(10);
        targetUser.password = await bcrypt.hash(password, salt);
      }

      // Sauvegarder les modifications de l'utilisateur
      await targetUser.save();

      // Mettre à jour l'Employee si nécessaire
      if (targetEmployee) {
        if (firstName) targetEmployee.firstName = firstName;
        if (lastName) targetEmployee.lastName = lastName;

        // Mise à jour de l'équipe si fournie (et si employé)
        if (teamId && targetUser.role === "employee") {
          targetEmployee.teamId = teamId;
        }

        // Mise à jour du nombre d'heures contractuelles si fourni
        if (contractHoursPerWeek) {
          targetEmployee.contractHoursPerWeek = contractHoursPerWeek;
        }

        await targetEmployee.save();
      }

      // Créer un nouvel enregistrement Employee si passage de manager à employé
      if (
        role === "employee" &&
        targetUser.role === "manager" &&
        !targetEmployee
      ) {
        const newEmployee = new EmployeeModel({
          userId: targetUser._id,
          companyId: targetUser.companyId,
          teamId,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          status: "actif",
          contractHoursPerWeek: contractHoursPerWeek || 35,
        });

        await newEmployee.save();
      }

      // Créer une copie de l'objet utilisateur sans le mot de passe pour la réponse
      const userResponse = { ...targetUser.toObject() };
      if ("password" in userResponse) {
        // @ts-ignore - Cette ligne est nécessaire car le type ne reflète pas bien l'opération
        userResponse.password = undefined;
      }

      res.status(200).json({
        success: true,
        message: "Collaborateur mis à jour avec succès",
        data: {
          user: userResponse,
          employee: targetEmployee || null,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du collaborateur:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour du collaborateur",
      });
    }
  }
);

/**
 * @route   DELETE /api/collaborators/:id
 * @desc    Supprime un collaborateur existant
 * @access  Privé (directeur, manager)
 */
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["directeur", "manager"]),
  checkCollaboratorPermissions,
  async (req: CollaboratorAuthRequest, res: Response) => {
    try {
      const { targetUser, targetEmployee } = req;

      // Vérifier que targetUser existe (devrait toujours être le cas à ce point)
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Collaborateur non trouvé",
        });
      }

      // Supprimer l'Employee associé s'il existe
      if (targetEmployee) {
        await EmployeeModel.findByIdAndDelete(targetEmployee._id);
      }

      // Supprimer l'utilisateur
      await User.findByIdAndDelete(targetUser._id);

      // Répondre sans contenu
      res.status(204).send();
    } catch (error) {
      console.error("Erreur lors de la suppression du collaborateur:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression du collaborateur",
      });
    }
  }
);

export default router;
