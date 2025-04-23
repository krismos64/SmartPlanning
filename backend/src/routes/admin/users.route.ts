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

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Modification d'un utilisateur existant par un administrateur
 * @access  Admin uniquement
 */
router.put(
  "/:id",
  auth,
  checkRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, role, photoUrl } = req.body;

      // Vérifier si l'utilisateur existe
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: id } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Cet email est déjà utilisé par un autre utilisateur",
          });
        }
      }

      // Mise à jour des champs modifiés
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (email) user.email = email;
      if (role) user.role = role;
      if (photoUrl !== undefined) user.photoUrl = photoUrl || undefined;

      // Sauvegarder les modifications
      await user.save();

      // Retourner l'utilisateur modifié (sans le mot de passe)
      const userResponse = user.toObject() as any;
      if ("password" in userResponse) {
        delete userResponse.password;
      }

      return res.status(200).json({
        success: true,
        user: userResponse,
      });
    } catch (error) {
      console.error("Erreur lors de la modification de l'utilisateur:", error);
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
  auth,
  checkRole("admin"),
  async (req: Request, res: Response, next: express.NextFunction) => {
    const { role, companyId } = req.query;

    if (role && companyId) {
      try {
        const users = await User.find({
          role,
          companyId: companyId.toString(),
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
  auth,
  checkRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
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
  auth,
  checkRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Vérifier si l'utilisateur existe
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Supprimer l'utilisateur
      await User.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: "Utilisateur supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression de l'utilisateur",
      });
    }
  }
);

export default router;
