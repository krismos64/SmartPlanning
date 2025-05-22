/**
 * Routes pour la gestion des utilisateurs
 *
 * Ces routes permettent aux administrateurs de gérer les utilisateurs du système.
 * Toutes les routes sont protégées par authentification et vérification du rôle admin.
 */
import bcrypt from "bcrypt";
import { Request, Response, Router } from "express";
import randomstring from "randomstring";
import authMiddleware, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import User, { UserRole } from "../models/User.model";

// Initialisation du routeur
const router = Router();

/**
 * @route POST /api/users/test-update
 * @desc Route de test pour vérifier les permissions des utilisateurs
 * @access Authentifié uniquement
 */
router.post(
  "/test-update",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      console.log("🔍 Test route accessed by user:", req.user);
      return res.status(200).json({
        success: true,
        message: "Vous avez accès à cette route",
      });
    } catch (error) {
      console.error("Erreur route test:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors du test",
      });
    }
  }
);

/**
 * @route GET /api/users
 * @desc Liste tous les utilisateurs (sans mot de passe)
 * @access Admin only
 */
router.get(
  "/",
  authMiddleware,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const users = await User.find({}).select("-password");
      return res.status(200).json(users);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      return res.status(500).json({
        message: "Erreur serveur lors de la récupération des utilisateurs",
      });
    }
  }
);

interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

/**
 * @route POST /api/users
 * @desc Crée un nouvel utilisateur avec un mot de passe temporaire
 * @access Admin only
 */
router.post(
  "/",
  authMiddleware,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { email, firstName, lastName, role } =
        req.body as CreateUserRequest;

      // Vérification si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Un utilisateur avec cet email existe déjà" });
      }

      // Génération du mot de passe temporaire
      const tempPassword = randomstring.generate({
        length: 10,
        charset: "alphanumeric",
      });

      // Hashage du mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      // Création du nouvel utilisateur
      const newUser = new User({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: role || "user", // Valeur par défaut si non spécifiée
        status: "active", // Statut par défaut
      });

      await newUser.save();

      // Préparation de la réponse sans le mot de passe
      const userObject = newUser.toObject();
      // Utiliser la déstructuration pour éviter la suppression directe avec delete
      const { password, ...userWithoutPassword } = userObject;

      return res.status(201).json({
        user: userWithoutPassword,
        tempPassword, // Envoi du mot de passe temporaire
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      return res.status(500).json({
        message: "Erreur serveur lors de la création de l'utilisateur",
      });
    }
  }
);

interface UpdateUserRequest {
  role?: UserRole;
  status?: "active" | "inactive";
}

/**
 * @route PUT /api/users/:id
 * @desc Modifie le rôle ou le statut d'un utilisateur
 * @access Admin only
 */
router.put(
  "/:id",
  authMiddleware,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role, status } = req.body as UpdateUserRequest;

      // Vérifier que l'utilisateur existe
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Mettre à jour uniquement les champs fournis
      if (role) {
        user.set("role", role);
      }
      if (status && (status === "active" || status === "inactive")) {
        user.set("status", status);
      }

      await user.save();

      // Retourner l'utilisateur mis à jour sans le mot de passe
      const userObject = user.toObject();
      // Utiliser la déstructuration pour éviter la suppression directe avec delete
      const { password, ...userWithoutPassword } = userObject;

      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Erreur lors de la modification de l'utilisateur:", error);
      return res.status(500).json({
        message: "Erreur serveur lors de la modification de l'utilisateur",
      });
    }
  }
);

/**
 * @route GET /api/users/me
 * @desc Récupère les données de l'utilisateur actuellement connecté
 * @access Authentifié uniquement
 */
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Récupérer l'ID de l'utilisateur depuis le token
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // Récupérer les données de l'utilisateur sans le mot de passe
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Renvoyer uniquement les données pertinentes
    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        photoUrl: user.photoUrl,
        role: user.role,
        companyId: user.companyId,
        teamIds: user.teamIds,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération du profil",
    });
  }
});

/**
 * @route PUT /api/users/password
 * @desc Change le mot de passe de l'utilisateur connecté
 * @access Authentifié uniquement
 */
router.put(
  "/password",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Récupérer l'ID de l'utilisateur depuis le token
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // Extraire les mots de passe du corps de la requête
      const { currentPassword, newPassword } = req.body;

      // Vérifier que les deux mots de passe sont fournis
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Les mots de passe actuel et nouveau sont requis",
        });
      }

      // Récupérer l'utilisateur avec son mot de passe (qui est normalement exclu par défaut)
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier que le mot de passe actuel est correct
      const isMatch = await user.comparePassword(currentPassword);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Mot de passe actuel incorrect",
        });
      }

      // Mettre à jour le mot de passe (le hachage est géré par le middleware pre-save)
      user.password = newPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Mot de passe mis à jour avec succès",
      });
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors du changement de mot de passe",
      });
    }
  }
);

export default router;
