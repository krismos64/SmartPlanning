/**
 * Routes de gestion des employés - SmartPlanning
 *
 * MIGRATION POSTGRESQL: Migré de Mongoose vers Prisma ORM
 *
 * IMPORTANT: Dans PostgreSQL, Employee n'a PAS firstName, lastName, email
 * Ces champs sont uniquement dans User (relation 1-to-1)
 *
 * Différences clés:
 * - contractualHours au lieu de contractHoursPerWeek
 * - isActive boolean au lieu de status "actif"
 * - Team.managerId (single) au lieu de managerIds array
 * - Pas d'array employeeIds dans Team (relation via FK)
 * - Transactions avec prisma.$transaction()
 */

import bcrypt from "bcrypt";
import crypto from "crypto";
import express, { Request, Response } from "express";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import prisma from "../config/prisma";
import { sendEmployeeWelcomeEmail } from "../utils/email";

const router = express.Router();

/**
 * Route GET /api/employees
 * Liste tous les employés actifs:
 * - Pour un admin: tous les employés
 * - Pour un directeur: tous les employés de son entreprise
 * - Pour un manager: seulement les employés de ses équipes (via Team.managerId)
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

    let whereClause: any = { isActive: true };
    let selectClause = {
      id: true,
      userId: true,
      companyId: true,
      teamId: true,
      position: true,
      skills: true,
      contractualHours: true,
      isActive: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profilePicture: true,
        }
      },
      team: {
        select: {
          id: true,
          name: true,
        }
      }
    };

    if (req.user.role === "admin") {
      // L'admin a accès à tous les employés actifs
      whereClause = { isActive: true };
    } else if (req.user.role === "directeur") {
      // Le directeur n'a accès qu'aux employés de son entreprise
      if (!req.user.companyId) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise manquant pour le directeur",
        });
      }
      whereClause = { companyId: req.user.companyId, isActive: true };
    } else if (req.user.role === "manager") {
      // Le manager n'a accès qu'aux employés des équipes qu'il gère
      // Dans PostgreSQL: Team.managerId = req.user.id
      const managerTeams = await prisma.team.findMany({
        where: { managerId: req.user.id },
        select: { id: true }
      });

      const teamIds = managerTeams.map(team => team.id);

      if (teamIds.length === 0) {
        // Manager sans équipes = aucun employé accessible
        return res.status(200).json({ success: true, data: [] });
      }

      whereClause = {
        teamId: { in: teamIds },
        isActive: true
      };
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      select: selectClause,
      orderBy: [
        { user: { lastName: 'asc' } },
        { user: { firstName: 'asc' } }
      ]
    });

    // Formater la réponse pour compatibilité avec l'ancien format MongoDB
    const formattedEmployees = employees.map((emp) => ({
      _id: emp.id, // Compatibilité MongoDB
      id: emp.id,
      firstName: emp.user.firstName,
      lastName: emp.user.lastName,
      email: emp.user.email,
      photoUrl: emp.user.profilePicture,
      profilePicture: emp.user.profilePicture,
      position: emp.position,
      skills: emp.skills,
      teamId: emp.team ? { _id: emp.team.id, name: emp.team.name } : null,
      companyId: emp.companyId,
      contractHoursPerWeek: emp.contractualHours, // Mapping de nom
      status: emp.isActive ? "actif" : "inactif", // Mapping boolean → string
      userId: emp.userId,
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

    // Validation de l'ID
    const teamIdNum = parseInt(teamId, 10);
    if (isNaN(teamIdNum)) {
      return res
        .status(400)
        .json({ success: false, message: "Identifiant d'équipe invalide" });
    }

    try {
      // Vérifier que l'équipe existe
      const team = await prisma.team.findUnique({
        where: { id: teamIdNum }
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // Récupérer les employés de l'équipe
      const employees = await prisma.employee.findMany({
        where: { teamId: teamIdNum },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            }
          },
          team: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      // Formater la réponse
      const formattedEmployees = employees.map(emp => ({
        _id: emp.id,
        id: emp.id,
        firstName: emp.user.firstName,
        lastName: emp.user.lastName,
        email: emp.user.email,
        photoUrl: emp.user.profilePicture,
        position: emp.position,
        skills: emp.skills,
        teamId: emp.team,
        userId: emp.userId,
        status: emp.isActive ? "actif" : "inactif",
      }));

      return res.status(200).json({
        success: true,
        data: formattedEmployees,
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

  // Validation des IDs
  const teamIdNum = parseInt(teamId, 10);
  const companyIdNum = parseInt(companyId, 10);

  if (isNaN(teamIdNum) || isNaN(companyIdNum)) {
    return res
      .status(400)
      .json({ success: false, message: "ID d'équipe ou d'entreprise invalide" });
  }

  try {
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé par un autre utilisateur",
      });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer utilisateur et employé dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: "employee",
          isActive: true,
          isEmailVerified: true, // Bypass car créé par admin
          companyId: companyIdNum,
        }
      });

      // Créer l'employé associé
      const newEmployee = await tx.employee.create({
        data: {
          userId: newUser.id,
          companyId: companyIdNum,
          teamId: teamIdNum,
          contractualHours: contractHoursPerWeek || 35,
          isActive: status === "actif" || status === "active" || status !== "inactif",
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            }
          }
        }
      });

      return { newUser, newEmployee };
    });

    // Préparer la réponse
    const response = {
      employee: {
        _id: result.newEmployee.id,
        id: result.newEmployee.id,
        firstName: result.newEmployee.user.firstName,
        lastName: result.newEmployee.user.lastName,
        email: result.newEmployee.user.email,
        teamId: result.newEmployee.teamId,
        companyId: result.newEmployee.companyId,
        contractHoursPerWeek: result.newEmployee.contractualHours,
        status: result.newEmployee.isActive ? "actif" : "inactif",
        userId: result.newEmployee.userId,
      },
      user: {
        _id: result.newUser.id,
        id: result.newUser.id,
        firstName: result.newUser.firstName,
        lastName: result.newUser.lastName,
        email: result.newUser.email,
        role: result.newUser.role,
        isEmailVerified: result.newUser.isEmailVerified,
      },
    };

    return res.status(201).json({
      success: true,
      message: "Employé et utilisateur créés avec succès",
      data: response,
    });
  } catch (error) {
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
    // Extraction des champs
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

    // Validation du rôle selon le rôle de l'utilisateur
    let validRoles: string[] = [];
    if (req.user?.role === "directeur") {
      validRoles = ["employee", "manager", "directeur"];
    } else if (req.user?.role === "manager") {
      validRoles = ["employee"]; // Les managers ne peuvent créer que des employés
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Rôle invalide. Valeurs acceptées pour votre rôle : ${validRoles.join(", ")}`,
      });
    }

    // Vérification de l'ID d'entreprise
    let companyId = 0;
    if (req.user?.role === "directeur") {
      if (!req.user?.companyId) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise manquant pour le directeur",
        });
      }
      companyId = req.user.companyId;
    } else if (req.user?.role === "manager") {
      // Pour un manager, récupérer l'entreprise via ses équipes gérées
      const managerTeam = await prisma.team.findFirst({
        where: { managerId: req.user.id },
        select: { companyId: true }
      });

      if (!managerTeam) {
        return res.status(400).json({
          success: false,
          message: "Manager non assigné à des équipes",
        });
      }
      companyId = managerTeam.companyId;
    }

    // Pour un manager ou un employé, teamId est obligatoire
    if ((role === "manager" || role === "employee") && !teamId) {
      return res.status(400).json({
        success: false,
        message: "L'ID d'équipe est obligatoire pour créer un employé ou manager",
      });
    }

    // Validation de l'ID d'équipe
    let teamIdNum: number | null = null;
    if (teamId) {
      teamIdNum = parseInt(teamId, 10);
      if (isNaN(teamIdNum)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant d'équipe n'est pas valide",
        });
      }
    }

    try {
      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé par un autre utilisateur",
        });
      }

      // Si teamId est fourni, vérifier que l'équipe existe et appartient à la même entreprise
      if (teamIdNum) {
        const team = await prisma.team.findUnique({
          where: { id: teamIdNum },
          select: { id: true, companyId: true, managerId: true }
        });

        if (!team) {
          return res.status(404).json({
            success: false,
            message: "Équipe introuvable",
          });
        }

        // Vérifier que l'équipe appartient à la même entreprise
        if (team.companyId !== companyId) {
          return res.status(403).json({
            success: false,
            message: "Vous ne pouvez pas créer un utilisateur dans une équipe d'une autre entreprise",
          });
        }

        // Vérification pour les managers: ils ne peuvent créer que dans leurs équipes
        if (req.user?.role === "manager" && team.managerId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: "Vous ne pouvez créer des employés que dans les équipes que vous gérez",
          });
        }
      }

      // Normaliser le rôle
      const normalizedRole = role === "employé" ? "employee" : role;

      // BRANCHE 1: Création d'un EMPLOYÉ avec email de bienvenue
      if (normalizedRole === "employee") {
        // Générer un token de création de mot de passe
        const createPasswordToken = crypto.randomBytes(32).toString("hex");
        const createPasswordTokenHash = crypto
          .createHash("sha256")
          .update(createPasswordToken)
          .digest("hex");

        const result = await prisma.$transaction(async (tx) => {
          // Créer l'utilisateur sans mot de passe
          const newUser = await tx.user.create({
            data: {
              firstName,
              lastName,
              email,
              role: normalizedRole,
              isActive: true,
              isEmailVerified: false, // Sera vérifié lors de la création du mot de passe
              companyId,
              profilePicture: photoUrl || null,
              resetPasswordToken: createPasswordTokenHash,
              resetPasswordExpire: new Date(Date.now() + 7 * 24 * 3600000), // 7 jours
            }
          });

          // Créer l'employé associé
          const newEmployee = await tx.employee.create({
            data: {
              userId: newUser.id,
              companyId,
              teamId: teamIdNum,
              contractualHours: contractHoursPerWeek,
              isActive: status === "actif" || status === "active" || status !== "inactif",
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                  isEmailVerified: true,
                }
              }
            }
          });

          return { newUser, newEmployee, createPasswordToken };
        });

        // Envoyer l'email de bienvenue
        const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const createPasswordUrl = `${frontendBaseUrl}/create-password?token=${result.createPasswordToken}&email=${email}`;

        try {
          await sendEmployeeWelcomeEmail(email, firstName, createPasswordUrl);
          console.log(`📧 Email de bienvenue envoyé à ${email}`);
        } catch (emailError) {
          console.error("Erreur lors de l'envoi de l'email de bienvenue:", emailError);
          // Ne pas faire échouer la création pour un problème d'email
        }

        const response = {
          user: {
            _id: result.newUser.id,
            id: result.newUser.id,
            firstName: result.newUser.firstName,
            lastName: result.newUser.lastName,
            email: result.newUser.email,
            role: result.newUser.role,
            isEmailVerified: result.newUser.isEmailVerified,
          },
          employee: {
            _id: result.newEmployee.id,
            id: result.newEmployee.id,
            firstName: result.newEmployee.user.firstName,
            lastName: result.newEmployee.user.lastName,
            email: result.newEmployee.user.email,
            teamId: result.newEmployee.teamId,
            companyId: result.newEmployee.companyId,
            contractHoursPerWeek: result.newEmployee.contractualHours,
            status: result.newEmployee.isActive ? "actif" : "inactif",
            userId: result.newEmployee.userId,
          },
          message: "Un email de bienvenue a été envoyé à l'employé pour qu'il puisse créer son mot de passe.",
        };

        return res.status(201).json({
          success: true,
          message: "Employé créé avec succès",
          data: response,
        });
      }

      // BRANCHE 2: Création d'un MANAGER ou DIRECTEUR avec mot de passe temporaire
      else {
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const result = await prisma.$transaction(async (tx) => {
          // Créer l'utilisateur
          const newUser = await tx.user.create({
            data: {
              firstName,
              lastName,
              email,
              password: hashedPassword,
              role: normalizedRole,
              isActive: true,
              isEmailVerified: true,
              companyId,
              profilePicture: photoUrl || null,
            }
          });

          // Si c'est un manager, mettre à jour l'équipe pour référencer ce manager
          if (normalizedRole === "manager" && teamIdNum) {
            await tx.team.update({
              where: { id: teamIdNum },
              data: { managerId: newUser.id }
            });
          }

          return { newUser, tempPassword };
        });

        const response: any = {
          user: {
            _id: result.newUser.id,
            id: result.newUser.id,
            firstName: result.newUser.firstName,
            lastName: result.newUser.lastName,
            email: result.newUser.email,
            role: result.newUser.role,
            isEmailVerified: result.newUser.isEmailVerified,
          },
          tempPassword: result.tempPassword,
        };

        if (normalizedRole === "manager") {
          response.manager = {
            _id: result.newUser.id,
            id: result.newUser.id,
            firstName: result.newUser.firstName,
            lastName: result.newUser.lastName,
            email: result.newUser.email,
            role: result.newUser.role,
            managedTeamId: teamIdNum,
          };
        }

        return res.status(201).json({
          success: true,
          message: "Utilisateur créé avec succès",
          data: response,
        });
      }
    } catch (error) {
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

    // Extraire le mot de passe
    const { password } = updateData;
    delete updateData.password;

    // Validation de l'ID
    const employeeIdNum = parseInt(employeeId, 10);
    if (isNaN(employeeIdNum)) {
      return res
        .status(400)
        .json({ success: false, message: "Identifiant employé invalide" });
    }

    try {
      // Récupérer l'employé pour obtenir son userId
      const employee = await prisma.employee.findUnique({
        where: { id: employeeIdNum },
        select: { id: true, userId: true, companyId: true }
      });

      if (!employee) {
        return res
          .status(404)
          .json({ success: false, message: "Employé non trouvé" });
      }

      // Préparer les données de mise à jour pour Employee
      const employeeUpdateData: any = {};

      // Mapping des champs
      if (updateData.contractHoursPerWeek !== undefined) {
        employeeUpdateData.contractualHours = parseInt(updateData.contractHoursPerWeek, 10);
      }
      if (updateData.status !== undefined) {
        employeeUpdateData.isActive = updateData.status === "actif" || updateData.status === "active";
      }
      if (updateData.teamId !== undefined) {
        employeeUpdateData.teamId = updateData.teamId ? parseInt(updateData.teamId, 10) : null;
      }
      if (updateData.position !== undefined) {
        employeeUpdateData.position = updateData.position;
      }
      if (updateData.skills !== undefined) {
        employeeUpdateData.skills = updateData.skills;
      }

      // Préparer les données de mise à jour pour User
      const userUpdateData: any = {};
      if (updateData.firstName !== undefined) userUpdateData.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) userUpdateData.lastName = updateData.lastName;
      if (updateData.email !== undefined) userUpdateData.email = updateData.email;
      if (updateData.photoUrl !== undefined) userUpdateData.profilePicture = updateData.photoUrl;
      if (password) {
        userUpdateData.password = await bcrypt.hash(password, 10);
      }

      // Mettre à jour dans une transaction
      const result = await prisma.$transaction(async (tx) => {
        // Mettre à jour l'employé si nécessaire
        let updatedEmployee = employee;
        if (Object.keys(employeeUpdateData).length > 0) {
          updatedEmployee = await tx.employee.update({
            where: { id: employeeIdNum },
            data: employeeUpdateData,
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profilePicture: true,
                }
              },
              team: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          });
        }

        // Mettre à jour l'utilisateur si nécessaire
        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: employee.userId },
            data: userUpdateData
          });
        }

        // Récupérer l'employé mis à jour avec toutes les relations
        return await tx.employee.findUnique({
          where: { id: employeeIdNum },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePicture: true,
              }
            },
            team: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        });
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Employé non trouvé après mise à jour",
        });
      }

      // Formater la réponse
      const formattedEmployee = {
        _id: result.id,
        id: result.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        photoUrl: result.user.profilePicture,
        position: result.position,
        skills: result.skills,
        teamId: result.team,
        companyId: result.companyId,
        contractHoursPerWeek: result.contractualHours,
        status: result.isActive ? "actif" : "inactif",
        userId: result.userId,
      };

      return res.status(200).json({
        success: true,
        message: "Employé mis à jour avec succès",
        data: formattedEmployee,
      });
    } catch (error) {
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

    // Validation de l'ID
    const employeeIdNum = parseInt(employeeId, 10);
    if (isNaN(employeeIdNum)) {
      return res
        .status(400)
        .json({ success: false, message: "Identifiant employé invalide" });
    }

    try {
      // Récupérer l'employé pour obtenir son userId
      const employee = await prisma.employee.findUnique({
        where: { id: employeeIdNum },
        select: { id: true, userId: true }
      });

      if (!employee) {
        return res
          .status(404)
          .json({ success: false, message: "Employé non trouvé" });
      }

      // Supprimer dans une transaction (Employee d'abord, puis User)
      // Note: Avec onDelete: Cascade, supprimer User supprimera automatiquement Employee
      // Mais ici on supprime Employee d'abord pour être explicite
      await prisma.$transaction(async (tx) => {
        // Supprimer l'employé
        await tx.employee.delete({
          where: { id: employeeIdNum }
        });

        // Supprimer l'utilisateur associé
        await tx.user.delete({
          where: { id: employee.userId }
        });
      });

      return res.status(200).json({
        success: true,
        message: "Employé et utilisateur associé supprimés avec succès",
      });
    } catch (error) {
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

      const userId = req.user.id;

      // Récupérer l'employé basé sur le userId
      const employee = await prisma.employee.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true,
            }
          },
          team: {
            select: {
              id: true,
              name: true,
            }
          },
          company: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Profil employé non trouvé",
        });
      }

      // Formater la réponse
      const formattedEmployee = {
        _id: employee.id,
        id: employee.id,
        firstName: employee.user.firstName,
        lastName: employee.user.lastName,
        email: employee.user.email,
        photoUrl: employee.user.profilePicture,
        position: employee.position,
        skills: employee.skills,
        teamId: employee.team,
        companyId: employee.company,
        contractHoursPerWeek: employee.contractualHours,
        status: employee.isActive ? "actif" : "inactif",
        userId: employee.userId,
      };

      return res.status(200).json({
        success: true,
        data: formattedEmployee,
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
