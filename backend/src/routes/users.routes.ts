/**
 * Routes pour la gestion des utilisateurs
 *
 * Ces routes permettent aux administrateurs de gérer les utilisateurs du système.
 * Toutes les routes sont protégées par authentification et vérification du rôle admin.
 */
import bcrypt from "bcrypt";
import { Request, Response, Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import randomstring from "randomstring";
import authMiddleware, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import User, { UserRole } from "../models/User.model";
import { notifyUserUpdate } from "../services/userSyncService";
import { uploadImageToCloudinary } from "../utils/cloudinary";

// Initialisation du routeur
const router = Router();

// Configuration du stockage temporaire pour Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

// Filtre pour n'accepter que les fichiers image
const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Type de fichier non autorisé. Seules les images sont acceptées."
      )
    );
  }
};

// Configuration de l'instance Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite la taille des fichiers à 5 Mo
  },
});

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
        profileCompleted: user.profileCompleted,
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

/**
 * @route POST /api/users/debug-auth
 * @desc TEMPORAIRE: Debug l'authentification pour diagnostiquer le problème
 * @access Authentifié uniquement
 */
router.post(
  "/debug-auth",
  (req, res, next) => {
    console.log("🔍 DEBUG AUTH Route - Avant authMiddleware:", {
      url: req.url,
      method: req.method,
      hasCookies: !!req.cookies,
      cookies: req.cookies,
      contentType: req.headers['content-type']
    });
    next();
  },
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const requester = req.user;
      
      console.log("🔍 DEBUG AUTH - Informations requester:", {
        hasRequester: !!requester,
        requesterId: requester?._id,
        requesterEmail: requester?.email,
        requesterRole: requester?.role,
        cookies: req.cookies,
        headers: req.headers
      });
      
      return res.status(200).json({
        success: true,
        message: "Authentification réussie",
        user: requester,
        debug: {
          hasRequester: !!requester,
          requesterId: requester?._id,
          requesterEmail: requester?.email,
          requesterRole: requester?.role,
          hasCookies: !!req.cookies,
          tokenInCookies: !!req.cookies?.token
        }
      });
      
    } catch (error) {
      console.error("❌ Erreur debug auth:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors du debug auth"
      });
    }
  }
);

/**
 * @route PUT /api/users/:id/photo
 * @desc Modifie la photo de profil d'un utilisateur
 * @access Utilisateur lui-même ou admin/manager/directeur
 */
router.put(
  "/:id/photo",
  (req, res, next) => {
    console.log("🔍 DEBUG Photo Route - Avant authMiddleware:", {
      url: req.url,
      method: req.method,
      hasCookies: !!req.cookies,
      cookies: req.cookies,
      contentType: req.headers['content-type']
    });
    next();
  },
  authMiddleware,
  (req, res, next) => {
    console.log("🔍 DEBUG Photo Route - Après authMiddleware:", {
      hasUser: !!req.user,
      userId: req.user?._id
    });
    next();
  },
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userIdToUpdate = req.params.id;
      const requester = req.user;

      console.log("🔍 DEBUG Photo Update - Requester info:", {
        hasRequester: !!requester,
        requesterId: requester?._id,
        requesterEmail: requester?.email,
        targetUserId: userIdToUpdate,
        hasFile: !!req.file
      });

      if (!requester) {
        console.log("❌ Utilisateur non authentifié lors de la mise à jour de photo");
        return res.status(401).json({ 
          success: false, 
          message: "Utilisateur non authentifié" 
        });
      }

      const isAuthorized =
        requester.role === "admin" ||
        requester.role === "manager" ||
        requester.role === "directeur" ||
        requester._id.toString() === userIdToUpdate;

      if (!isAuthorized) {
        return res.status(403).json({ 
          success: false, 
          message: "Accès non autorisé" 
        });
      }

      const localFilePath = req.file?.path;
      if (!localFilePath) {
        return res.status(400).json({ 
          success: false, 
          message: "Aucun fichier fourni" 
        });
      }

      const uploadedImageUrl = await uploadImageToCloudinary(localFilePath);
      if (!uploadedImageUrl) {
        return res.status(500).json({ 
          success: false, 
          message: "Échec de l'upload Cloudinary" 
        });
      }

      // Supprimer le fichier temporaire après l'upload réussi
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      await User.findByIdAndUpdate(userIdToUpdate, { photoUrl: uploadedImageUrl });

      // Notifier la mise à jour de la photo pour synchronisation
      notifyUserUpdate(userIdToUpdate, requester._id.toString(), { 
        photoUrl: uploadedImageUrl 
      });

      res.status(200).json({
        success: true,
        message: "Photo de profil mise à jour avec succès.",
        photoUrl: uploadedImageUrl,
      });
    } catch (error) {
      console.error("Erreur mise à jour photo profil :", error);
      
      // Supprimer le fichier temporaire en cas d'erreur
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ 
        success: false, 
        message: "Erreur serveur lors de la mise à jour de la photo" 
      });
    }
  }
);

export default router;
