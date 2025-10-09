import express, { Request, Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { generateTemporaryPassword } from "../../utils/password";
import bcrypt from "bcrypt";

const router = express.Router();

// Type pour les rôles d'utilisateur
type UserRole = "admin" | "manager" | "employee" | string;

// Middleware de synchronisation User -> Employee
const syncUserToEmployee = async (
  userId: number,
  teamId?: number
): Promise<void> => {
  try {
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== "employee") {
      return;
    }

    // Vérifier si un employee existe déjà avec ce userId
    const existingEmployee = await prisma.employee.findUnique({
      where: { userId: userId }
    });

    if (existingEmployee) {
      return;
    }

    // Créer un nouvel employee
    const newEmployee = await prisma.employee.create({
      data: {
        userId: user.id,
        companyId: user.companyId!,
        teamId: teamId || null,
        contractualHours: 35,
        isActive: user.isActive,
        position: null,
        skills: [],
      }
    });

    console.log(
      `✅ Employee créé automatiquement pour le user ${user.firstName} ${user.lastName} (ID: ${user.id})`
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création automatique de l'employee:",
      error
    );
  }
};

/**
 * @route   POST /api/admin/users
 * @desc    Création d'un nouvel utilisateur par un administrateur
 * @access  Admin uniquement
 */
router.post(
  "/",
  async (req: Request, res: Response) => {
    try {
      const {
        firstName,
        lastName,
        email,
        role,
        password,
        photoUrl,
        companyId,
        teamId,
      } = req.body;

      // Vérification des champs requis
      if (!firstName || !lastName || !email || !role || !companyId) {
        return res.status(400).json({
          success: false,
          message:
            "Les champs prénom, nom, email, rôle et entreprise sont obligatoires",
        });
      }

      // Validation de l'ID de l'entreprise
      const companyIdNum = parseInt(companyId, 10);
      if (isNaN(companyIdNum)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'entreprise n'est pas valide",
        });
      }

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé",
        });
      }

      // Si un teamId est fourni pour un employé, vérifier qu'il est valide
      let validatedTeamId: number | undefined;
      if (teamId && role === "employee") {
        const teamIdNum = parseInt(teamId, 10);
        if (isNaN(teamIdNum)) {
          return res.status(400).json({
            success: false,
            message: "L'identifiant d'équipe n'est pas valide",
          });
        }

        // Vérifier que l'équipe existe et appartient à la même entreprise
        const team = await prisma.team.findUnique({
          where: { id: teamIdNum }
        });

        if (!team) {
          return res.status(400).json({
            success: false,
            message: "L'équipe spécifiée n'existe pas",
          });
        }

        if (team.companyId !== companyIdNum) {
          return res.status(400).json({
            success: false,
            message: "L'équipe n'appartient pas à l'entreprise spécifiée",
          });
        }

        validatedTeamId = teamIdNum;
      }

      // Gestion du mot de passe
      let hashedPassword: string;
      if (password) {
        // Utiliser le mot de passe fourni
        hashedPassword = await bcrypt.hash(password, 10);
      } else {
        // Générer un mot de passe temporaire
        const tempPassword = generateTemporaryPassword();
        hashedPassword = await bcrypt.hash(tempPassword, 10);

        // TODO: Envoyer un email avec le mot de passe temporaire
        // sendWelcomeEmail(email, firstName, tempPassword);
      }

      // Créer le nouvel utilisateur
      const newUser = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          role,
          companyId: companyIdNum,
          password: hashedPassword,
          profilePicture: photoUrl || null,
          isActive: true,
        }
      });

      // Si l'utilisateur a le rôle "employee", créer automatiquement un employee associé avec l'équipe
      if (role === "employee") {
        await syncUserToEmployee(newUser.id, validatedTeamId);
      }

      // Retourner la réponse sans le mot de passe
      const { password: _, ...userResponse } = newUser;

      return res.status(201).json({
        success: true,
        message: "Utilisateur créé avec succès",
        data: userResponse,
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la création de l'utilisateur",
      });
    }
  }
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Modification d'un utilisateur existant par un administrateur
 * @access  Admin uniquement
 */
router.put(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, role, photoUrl } = req.body;

      // Validation de l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID utilisateur invalide",
        });
      }

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: idNum }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (email && email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Cet email est déjà utilisé par un autre utilisateur",
          });
        }
      }

      // Préparer les données de mise à jour
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (photoUrl !== undefined) updateData.profilePicture = photoUrl || null;

      // Mettre à jour l'utilisateur
      const updatedUser = await prisma.user.update({
        where: { id: idNum },
        data: updateData
      });

      // Retourner l'utilisateur modifié (sans le mot de passe)
      const { password: _, ...userResponse } = updatedUser;

      return res.status(200).json({
        success: true,
        user: userResponse,
      });
    } catch (error: any) {
      console.error("Erreur lors de la modification de l'utilisateur:", error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la modification de l'utilisateur",
      });
    }
  }
);

/**
 * @route   GET /api/admin/users?role=manager&companyId=xxx
 * @desc    Récupère tous les utilisateurs avec un rôle donné et une entreprise donnée
 * @access  Admin uniquement
 */
router.get(
  "/",
  async (req: Request, res: Response, next: express.NextFunction) => {
    const { role, companyId } = req.query;

    if (role && companyId) {
      try {
        // Validation de l'ID de l'entreprise
        const companyIdNum = parseInt(companyId as string, 10);
        if (isNaN(companyIdNum)) {
          return res.status(400).json({
            success: false,
            message: "L'identifiant de l'entreprise n'est pas valide",
          });
        }

        const users = await prisma.user.findMany({
          where: {
            role: role as string,
            companyId: companyIdNum,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            companyId: true,
            profilePicture: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          }
        });

        return res.status(200).json({
          success: true,
          users,
        });
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des utilisateurs filtrés :",
          err
        );
        return res.status(500).json({
          success: false,
          message: "Erreur serveur",
        });
      }
    }

    // Passer au routeur suivant si pas de filtre
    next();
  }
);

/**
 * @route   GET /api/admin/users
 * @desc    Récupère tous les utilisateurs
 * @access  Admin uniquement
 */
router.get(
  "/",
  async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          companyId: true,
          profilePicture: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      res.json({
        success: true,
        users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des utilisateurs",
      });
    }
  }
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Suppression d'un utilisateur par un administrateur
 * @access  Admin uniquement
 */
router.delete(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Validation de l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID utilisateur invalide",
        });
      }

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: idNum }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Supprimer l'utilisateur (cascade delete géré par Prisma)
      await prisma.user.delete({
        where: { id: idNum }
      });

      return res.status(200).json({
        success: true,
        message: "Utilisateur supprimé avec succès",
      });
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression de l'utilisateur",
      });
    }
  }
);

// Fonction exportée pour configurer la synchronisation automatique
export const configureUserEmployeeSync = (): void => {
  console.log("Configuration de la synchronisation User-Employee activée");
  // Note: Avec Prisma, la synchronisation est gérée manuellement dans les routes
  // contrairement à Mongoose qui utilise des hooks
};

export default router;
