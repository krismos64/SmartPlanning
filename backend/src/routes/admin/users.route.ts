import express, { Request, Response } from "express";
import auth from "../../middlewares/auth.middleware";
import checkRole from "../../middlewares/checkRole.middleware";
import User from "../../models/User.model";
import { generateTemporaryPassword } from "../../utils/password";

const router = express.Router();

/**
 * @route   POST /api/admin/users
 * @desc    Création d'un nouvel utilisateur par un administrateur
 * @access  Admin uniquement
 */
router.post(
  "/",
  auth,
  checkRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, role, password, photoUrl } = req.body;

      // Vérification des champs requis
      if (!firstName || !lastName || !email || !role) {
        return res.status(400).json({
          success: false,
          message: "Les champs prénom, nom, email et rôle sont obligatoires",
        });
      }

      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé",
        });
      }

      // Créer le nouvel utilisateur
      const newUser = new User({
        firstName,
        lastName,
        email,
        role,
        photoUrl: photoUrl || undefined,
        status: "active",
      });

      // Gestion du mot de passe
      if (password) {
        // Utiliser le mot de passe fourni
        newUser.password = password; // Le modèle s'occupe du hashing via pre-save hook
      } else {
        // Générer un mot de passe temporaire
        const tempPassword = generateTemporaryPassword();
        newUser.password = tempPassword;

        // TODO: Envoyer un email avec le mot de passe temporaire
        // sendWelcomeEmail(email, firstName, tempPassword);
      }

      // Sauvegarder l'utilisateur
      await newUser.save();

      // Retourner l'utilisateur créé (sans le mot de passe)
      const userResponse = newUser.toObject() as any;
      if ("password" in userResponse) {
        delete userResponse.password;
      }

      return res.status(201).json({
        success: true,
        user: userResponse,
      });
    } catch (error) {
      console.error("Erreur lors de la création d'un utilisateur:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la création de l'utilisateur",
      });
    }
  }
);

export default router;
