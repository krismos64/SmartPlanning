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
import prisma from "../config/prisma";
import { notifyUserUpdate } from "../services/userSyncService";
import { uploadImageToCloudinary } from "../utils/cloudinary";

// Type pour les rôles utilisateurs (compatible avec le schema Prisma)
type UserRole = "admin" | "directeur" | "manager" | "employee";

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
 * @migration Migré de Mongoose vers Prisma
 */
router.get(
  "/",
  authMiddleware,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          companyId: true,
          profilePicture: true,
          googleId: true,
          isActive: true,
          lastLogin: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
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
 * @migration Migré de Mongoose vers Prisma
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
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
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
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Création du nouvel utilisateur
      const newUser = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: hashedPassword,
          role: role || "employee", // Valeur par défaut (adapté pour Prisma)
          isActive: true, // Remplace "status: active"
        },
      });

      // Préparation de la réponse sans le mot de passe
      const { password, ...userWithoutPassword } = newUser;

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
 * @migration Migré de Mongoose vers Prisma
 */
router.put(
  "/:id",
  authMiddleware,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role, status } = req.body as UpdateUserRequest;

      // Parse et validation de l'ID
      const userId = parseInt(id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID utilisateur invalide" });
      }

      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Préparer les données à mettre à jour
      const updateData: any = {};
      if (role) {
        updateData.role = role;
      }
      if (status !== undefined && (status === "active" || status === "inactive")) {
        updateData.isActive = status === "active"; // Conversion status -> isActive
      }

      // Mettre à jour l'utilisateur
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      // Retourner l'utilisateur mis à jour sans le mot de passe
      const { password, ...userWithoutPassword } = updatedUser;

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
 * @migration Migré de Mongoose vers Prisma
 */
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Récupérer l'ID de l'utilisateur depuis le token
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // Parse et validation de l'ID
    const userIdNum = typeof userId === 'number' ? userId : parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
      });
    }

    // Récupérer les données de l'utilisateur sans le mot de passe
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profilePicture: true,
        role: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Renvoyer uniquement les données pertinentes (compatibilité API)
    return res.status(200).json({
      success: true,
      data: {
        _id: user.id, // Compatibilité avec ancien format
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        photoUrl: user.profilePicture, // Mapping profilePicture -> photoUrl
        role: user.role,
        companyId: user.companyId,
        teamIds: [], // TODO: implémenter si nécessaire via relation Employee
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
 * @migration Migré de Mongoose vers Prisma (bcrypt manuel)
 */
router.put(
  "/password",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Récupérer l'ID de l'utilisateur depuis le token
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // Parse et validation de l'ID
      const userIdNum = typeof userId === 'number' ? userId : parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID utilisateur invalide",
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

      // Récupérer l'utilisateur avec son mot de passe
      const user = await prisma.user.findUnique({
        where: { id: userIdNum },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: "Impossible de changer le mot de passe pour ce compte",
        });
      }

      // Vérifier que le mot de passe actuel est correct (bcrypt manuel)
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Mot de passe actuel incorrect",
        });
      }

      // Hasher le nouveau mot de passe manuellement (pas de hook pre-save avec Prisma)
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: userIdNum },
        data: { password: hashedPassword },
      });

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
 * @migration Migré de Mongoose vers Prisma (_id → id)
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
        requesterId: requester?.id, // ✅ Changé de _id à id
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
          requesterId: requester?.id, // ✅ Changé de _id à id
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
 * @migration Migré de Mongoose vers Prisma (_id → id, User.findByIdAndUpdate → prisma.user.update)
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
      userId: req.user?.id // ✅ Changé de _id à id
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
        requesterId: requester?.id, // ✅ Changé de _id à id
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

      // Parse et validation de l'ID utilisateur
      const userIdNum = parseInt(userIdToUpdate, 10);
      if (isNaN(userIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID utilisateur invalide"
        });
      }

      // Vérifier les autorisations (admin/manager/directeur ou l'utilisateur lui-même)
      const isAuthorized =
        requester.role === "admin" ||
        requester.role === "manager" ||
        requester.role === "directeur" ||
        requester.id.toString() === userIdToUpdate; // ✅ Changé de _id à id

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

      // ✅ Mise à jour Prisma (photoUrl → profilePicture)
      await prisma.user.update({
        where: { id: userIdNum },
        data: { profilePicture: uploadedImageUrl },
      });

      // Notifier la mise à jour de la photo pour synchronisation
      notifyUserUpdate(userIdToUpdate, requester.id.toString(), { // ✅ Changé de _id à id
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
