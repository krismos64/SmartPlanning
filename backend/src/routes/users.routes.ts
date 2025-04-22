/**
 * Routes pour la gestion des utilisateurs
 *
 * Ces routes permettent aux administrateurs de gérer les utilisateurs du système.
 * Toutes les routes sont protégées par authentification et vérification du rôle admin.
 */
import bcrypt from "bcrypt";
import { Request, Response, Router } from "express";
import randomstring from "randomstring";
import authMiddleware from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import User, { UserRole } from "../models/User.model";

// Initialisation du routeur
const router = Router();

/**
 * @route GET /api/users
 * @desc Liste tous les utilisateurs (sans mot de passe)
 * @access Admin only
 */
router.get(
  "/",
  authMiddleware,
  checkRole("admin"),
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
  checkRole("admin"),
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
  checkRole("admin"),
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

export default router;
