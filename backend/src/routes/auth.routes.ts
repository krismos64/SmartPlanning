import bcrypt from "bcrypt";
import crypto from "crypto";
import express, { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { generateToken } from "../config/passport";
// MIGRATION: Remplacer Mongoose par Prisma
import prisma from "../config/prisma";
import { sendPasswordResetEmail } from "../utils/email";
import { sendTestEmail } from "../utils/emailTest";
import {
  isValidUrl,
  passwordRequirementsMessage,
  validatePasswordComplexity,
} from "../utils/password";
import { securityConfig, clearAuthCookies } from "../config/security.config";

// Import des schémas de validation et middleware
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  validateBody,
  validateParams
} from "../schemas";
import {
  asyncHandler,
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError
} from "../middlewares/errorHandler.middleware";

// Types personnalisés pour la requête Express avec utilisateur
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    teamIds?: string[];
    companyId?: string;
    toObject?: () => any;
  };
}

const router = express.Router();

/**
 * Importer le middleware d'authentification centralisé qui gère les cookies
 */
import { authenticateToken } from "../middlewares/auth.middleware";

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un directeur avec création d'entreprise
 * @access Public
 */
router.post("/register", validateBody(registerSchema, 'register'), asyncHandler(async (req: Request, res: Response) => {
  // Les données sont maintenant validées et typées
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    companyName,
    companyAddress,
    companyPostalCode,
    companyCity,
    companySize,
    acceptTerms,
    acceptMarketing,
    companyLogo,
    profilePicture
  } = req.body;

  // MIGRATION: Vérifier si l'utilisateur existe déjà avec Prisma
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError("Un utilisateur avec cet email existe déjà");
  }

  // MIGRATION: Vérifier l'unicité du nom d'entreprise avec Prisma
  const existingCompany = await prisma.company.findFirst({
    where: { name: companyName }
  });
  if (existingCompany) {
    throw new ConflictError(
      "Ce nom d'entreprise existe déjà. Ajoutez une ville ou un suffixe pour le différencier."
    );
  }

  // MIGRATION: Hasher le mot de passe manuellement (Prisma n'a pas de pre-save hooks)
  const hashedPassword = await bcrypt.hash(password, 10);

  // MIGRATION: Utiliser une transaction Prisma pour créer entreprise + utilisateur
  const result = await prisma.$transaction(async (tx) => {
    // Créer l'entreprise d'abord
    const company = await tx.company.create({
      data: {
        name: companyName,
        address: companyAddress,
        postalCode: companyPostalCode,
        city: companyCity,
        size: companySize,
        logoUrl: companyLogo || null,
        plan: 'free', // Plan par défaut
      }
    });

    // Créer l'utilisateur directeur
    const user = await tx.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: phone || null,
        photoUrl: profilePicture || null,
        role: "directeur", // Rôle fixé en dur à "directeur"
        companyId: company.id,
        isEmailVerified: true, // On considère l'email vérifié à l'inscription
        status: "active",
      }
    });

    // Mettre à jour l'entreprise avec l'ID du créateur
    await tx.company.update({
      where: { id: company.id },
      data: { createdBy: user.id }
    });

    return { company, user };
  });

  // Génération du token JWT avec cookies sécurisés
  const tokenPayload = {
    id: result.user.id,
    email: result.user.email,
    role: result.user.role,
    firstName: result.user.firstName,
    lastName: result.user.lastName,
    companyId: result.user.companyId,
  };
  const token = generateToken(tokenPayload);

  // Configuration des cookies avec sécurité renforcée
  res.cookie('token', token, securityConfig.cookieOptions);

  // Réponse avec les données minimales de l'utilisateur (sans mot de passe)
  res.status(201).json({
    success: true,
    message: "Inscription réussie",
    user: {
      id: result.user.id,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      email: result.user.email,
      role: result.user.role,
      companyId: result.user.companyId,
      phone: result.user.phone
    },
    company: {
      id: result.company.id,
      name: result.company.name,
      address: result.company.address,
      postalCode: result.company.postalCode,
      city: result.company.city,
      size: result.company.size
    },
  });
}));

/**
 * @route POST /api/auth/login
 * @desc Connexion par email/mot de passe
 * @access Public
 */
router.post("/login", validateBody(loginSchema, 'login'), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  console.log("🔐 Tentative de connexion pour:", email);

  // MIGRATION: Récupérer l'utilisateur avec Prisma (password inclus)
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.warn("❌ Utilisateur non trouvé pour l'email :", email);
    throw new AuthenticationError("Email ou mot de passe incorrect");
  }

  console.log("✅ Utilisateur trouvé pour connexion");

  // Vérifier que l'utilisateur est actif
  if (!user.isActive) {
    throw new AuthenticationError("Compte désactivé. Contactez l'administrateur.");
  }

  if (!user.password) {
    // Vérifier si c'est un employé qui n'a pas encore créé son mot de passe
    if (user.role === "employee" && user.resetPasswordToken) {
      console.log("ℹ️ Employé n'a pas encore créé son mot de passe");
      throw new AuthenticationError(
        "Veuillez créer votre mot de passe en utilisant le lien reçu par email."
      );
    }

    console.error("❌ Champ 'password' manquant");
    throw new AuthenticationError("Problème d'authentification. Contactez le support.");
  }

  // Vérifier le mot de passe
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    console.warn("❌ Mot de passe incorrect pour l'utilisateur :", email);
    throw new AuthenticationError("Email ou mot de passe incorrect");
  }

  console.log("✅ Mot de passe vérifié avec succès pour:", email);

  // Générer le token JWT
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    companyId: user.companyId,
  };
  const token = generateToken(tokenPayload);
  console.log("✅ Token JWT généré avec succès");

  // Configuration des cookies avec sécurité renforcée
  const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7 jours ou 24h
  const cookieOptions = {
    ...securityConfig.cookieOptions,
    maxAge,
  };

  console.log("🍪 Configuration du cookie:", {
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    httpOnly: cookieOptions.httpOnly,
    maxAge: cookieOptions.maxAge,
    rememberMe,
    nodeEnv: process.env.NODE_ENV
  });

  // Définir le cookie httpOnly sécurisé
  res.cookie('token', token, cookieOptions);

  // Répondre avec les informations de l'utilisateur (sans le token pour sécurité)
  res.status(200).json({
    success: true,
    message: "Connexion réussie",
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      photoUrl: user.photoUrl,
      phone: user.phone,
    },
    // Token pour fallback localStorage si cookies cross-origin échouent
    token: token
  });

  console.log("✅ Connexion réussie pour:", email);
}));

/**
 * @route GET /api/auth/me
 * @desc Retourne les infos de l'utilisateur connecté
 */
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    // MIGRATION: Récupérer avec Prisma (sans password)
    const user = await prisma.user.findUnique({
      where: { id: (req.user as any)?.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        companyId: true,
        photoUrl: true,
        profileCompleted: true,
        phone: true,
      }
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user.id, // Compatibilité avec ancien format
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        companyId: user.companyId,
        teamIds: [], // TODO: Gérer la relation many-to-many si nécessaire
        photoUrl: user.photoUrl || undefined,
        profileCompleted: user.profileCompleted || false,
      },
    });
  } catch (error) {
    console.error("Erreur /me:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Déconnecte l'utilisateur en supprimant le cookie httpOnly
 */
router.post("/logout", (req: Request, res: Response) => {
  try {
    // FIX #5: Utiliser la fonction centralisée pour nettoyer les cookies
    clearAuthCookies(res);

    console.log("✅ Déconnexion utilisateur réussie");

    res.status(200).json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (error) {
    console.error("❌ Erreur logout:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Demande de réinitialisation de mot de passe
 * @access Public
 */
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log("📧 Demande de réinitialisation pour email:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "L'adresse email est requise",
      });
    }

    // MIGRATION: Rechercher l'utilisateur par email avec Prisma
    const user = await prisma.user.findUnique({ where: { email } });
    console.log("🔍 Utilisateur trouvé:", user ? "Oui" : "Non");

    // Générer un token même si l'utilisateur n'existe pas (pour éviter l'énumération d'email)
    const resetToken = crypto.randomBytes(32).toString("hex");
    console.log("🔑 Token généré");

    // Si l'utilisateur existe, sauvegarder le token (hashé) et sa date d'expiration
    if (user) {
      // Créer un hash du token pour le stockage sécurisé
      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // MIGRATION: Sauvegarder avec Prisma
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken,
          resetPasswordExpire: new Date(Date.now() + 3600000), // 1 heure
        }
      });
      console.log("💾 Token sauvegardé en base de données");

      // Créer le lien de réinitialisation avec l'URL correcte
      const frontendBaseUrl =
        process.env.FRONTEND_URL || "http://localhost:3000";
      console.log("🌐 URL frontend:", frontendBaseUrl);

      const resetUrl = `${frontendBaseUrl}/reset-password?token=${resetToken}&email=${email}`;
      console.log("🔗 Lien de réinitialisation:", resetUrl);

      // Préparer le contenu de l'email
      const subject = "Réinitialisation de votre mot de passe SmartPlanning";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4f46e5;">SmartPlanning</h1>
          </div>
          <p>Bonjour${user.firstName ? " " + user.firstName : ""},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte SmartPlanning.</p>
          <p>Veuillez cliquer sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
          </div>
          <p>Ce lien est valable pendant 1 heure. Après cette période, vous devrez faire une nouvelle demande de réinitialisation.</p>
          <p>Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe SmartPlanning</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>© ${new Date().getFullYear()} SmartPlanning. Tous droits réservés.</p>
          </div>
        </div>
      `;

      try {
        // D'abord essayer avec la configuration normale
        console.log(
          "📨 Tentative d'envoi d'email avec les paramètres SMTP standards:"
        );
        console.log(
          `   Host: ${process.env.SMTP_HOST || "smtp.hostinger.com"}`
        );
        console.log(`   Port: ${process.env.SMTP_PORT || "465"}`);
        console.log(
          `   User: ${process.env.SMTP_USER || "contact@smartplanning.fr"}`
        );
        console.log(
          `   Pass: ${process.env.SMTP_PASS ? "******" : "Non défini"}`
        );

        const emailSent = await sendPasswordResetEmail(
          email,
          resetUrl,
          user.firstName
        );
        console.log("📧 Résultat envoi email:", emailSent ? "Succès" : "Échec");

        // Si l'envoi normal échoue, essayer avec Ethereal (service de test)
        if (!emailSent) {
          console.log("📧 Tentative avec service de test Ethereal...");
          const previewUrl = await sendTestEmail(email, subject, html);
          console.log(
            "📧 Email de test envoyé. URL de prévisualisation:",
            previewUrl
          );
        }
      } catch (emailError) {
        console.error(
          "📧 Erreur détaillée lors de l'envoi d'email:",
          emailError
        );

        // Essayer la méthode de secours
        try {
          console.log(
            "📧 Tentative de secours avec service de test Ethereal..."
          );
          const previewUrl = await sendTestEmail(email, subject, html);
          console.log(
            "📧 Email de test envoyé. URL de prévisualisation:",
            previewUrl
          );
        } catch (backupError) {
          console.error("📧 Échec de la méthode de secours:", backupError);
        }
      }
    }

    // Répondre avec un message générique pour éviter l'énumération d'emails
    res.status(200).json({
      success: true,
      message:
        "Si un compte existe avec cette adresse email, un email de réinitialisation a été envoyé.",
    });
  } catch (error) {
    console.error("Erreur de réinitialisation de mot de passe:", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors du traitement de votre demande.",
    });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Réinitialisation du mot de passe avec token
 * @access Public
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    // Vérifier la complexité du mot de passe (RGPD)
    if (!validatePasswordComplexity(newPassword)) {
      return res.status(400).json({
        success: false,
        message: passwordRequirementsMessage,
      });
    }

    // Créer le hash du token reçu pour comparaison
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // MIGRATION: Rechercher l'utilisateur avec Prisma
    const user = await prisma.user.findFirst({
      where: {
        email,
        resetPasswordToken,
        resetPasswordExpire: { gt: new Date() }, // Token non expiré
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Le token est invalide ou a expiré",
      });
    }

    // MIGRATION: Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // MIGRATION: Mettre à jour avec Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null,
      }
    });

    res.status(200).json({
      success: true,
      message: "Votre mot de passe a été réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors du traitement de votre demande",
    });
  }
});

/**
 * @route POST /api/auth/create-password
 * @desc Création du mot de passe pour un nouvel employé avec token
 * @access Public
 */
router.post("/create-password", async (req: Request, res: Response) => {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    // Vérifier la complexité du mot de passe (RGPD)
    if (!validatePasswordComplexity(password)) {
      return res.status(400).json({
        success: false,
        message: passwordRequirementsMessage,
      });
    }

    // Créer le hash du token reçu pour comparaison
    const createPasswordTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // MIGRATION: Rechercher l'utilisateur avec Prisma
    const user = await prisma.user.findFirst({
      where: {
        email,
        resetPasswordToken: createPasswordTokenHash,
        resetPasswordExpire: { gt: new Date() }, // Token non expiré
        role: "employee", // S'assurer que c'est bien un employé
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Le lien est invalide ou a expiré",
      });
    }

    // Vérifier que l'utilisateur n'a pas déjà un mot de passe
    if (user.password) {
      return res.status(400).json({
        success: false,
        message: "Un mot de passe a déjà été créé pour ce compte",
      });
    }

    // MIGRATION: Hasher le mot de passe et mettre à jour avec Prisma
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isEmailVerified: true,
        resetPasswordToken: null,
        resetPasswordExpire: null,
      }
    });

    res.status(200).json({
      success: true,
      message:
        "Votre mot de passe a été créé avec succès. Vous pouvez maintenant vous connecter.",
    });
  } catch (error) {
    console.error("Erreur lors de la création du mot de passe:", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors du traitement de votre demande",
    });
  }
});

/**
 * @route PATCH /api/users/me
 * @desc Mise à jour du profil utilisateur après authentification OAuth
 * @access Privé (nécessite token JWT)
 */
router.patch(
  "/users/me",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Accès à l'ID utilisateur depuis le token décodé
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // Récupérer les données du corps de la requête
      const { companyName, companyLogo, phone, profilePicture, bio } = req.body;

      // MIGRATION: Vérifier que l'utilisateur existe avec Prisma
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Créer un objet pour stocker les champs à mettre à jour
      const updates: any = {};

      // Si l'utilisateur n'a pas encore de companyId et veut créer une entreprise
      if (!user.companyId && companyName) {
        // Validation du nom d'entreprise
        if (!companyName.trim()) {
          return res.status(400).json({
            success: false,
            message:
              "Le nom de l'entreprise est requis pour créer une entreprise",
          });
        }

        // MIGRATION: Vérification de l'unicité du nom d'entreprise avec Prisma
        const existingCompany = await prisma.company.findFirst({
          where: { name: companyName }
        });
        if (existingCompany) {
          return res.status(409).json({
            success: false,
            message:
              "Ce nom d'entreprise existe déjà. Ajoutez une ville ou un suffixe pour le différencier.",
          });
        }

        // Validation de l'URL du logo si présente
        if (
          companyLogo &&
          typeof companyLogo === "string" &&
          !isValidUrl(companyLogo)
        ) {
          return res.status(400).json({
            success: false,
            message: "URL du logo d'entreprise invalide",
          });
        }

        // MIGRATION: Création de la nouvelle entreprise avec Prisma
        const newCompany = await prisma.company.create({
          data: {
            name: companyName,
            logoUrl: companyLogo || null,
            plan: "free", // Plan par défaut
          }
        });

        // Associer l'ID de l'entreprise à l'utilisateur
        updates.companyId = newCompany.id;
      }

      // Mise à jour des autres champs si fournis
      if (phone !== undefined) {
        // Validation du numéro de téléphone si présent et non vide
        if (phone && typeof phone === "string") {
          const phoneRegex = /^(\+\d{1,3}\s?)?(\d{9,15})$/;
          if (!phoneRegex.test(phone)) {
            return res.status(400).json({
              success: false,
              message: "Format de numéro de téléphone invalide",
            });
          }
          updates.phone = phone;
        } else if (phone === "") {
          // Permettre de supprimer le numéro de téléphone
          updates.phone = null;
        }
      }

      // Mise à jour de la photo de profil si fournie
      if (profilePicture !== undefined) {
        // Validation de l'URL de la photo si présente et non vide
        if (
          profilePicture &&
          typeof profilePicture === "string" &&
          !isValidUrl(profilePicture)
        ) {
          return res.status(400).json({
            success: false,
            message: "URL de la photo de profil invalide",
          });
        }
        updates.photoUrl = profilePicture || null;
      }

      // Mise à jour de la bio si fournie
      if (bio !== undefined) {
        updates.bio = bio;
      }

      // Si aucune mise à jour n'est nécessaire
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Aucune donnée valide fournie pour la mise à jour",
        });
      }

      // MIGRATION: Effectuer la mise à jour avec Prisma
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updates
      });

      // Retourner la réponse avec l'utilisateur mis à jour
      res.status(200).json({
        success: true,
        message: "Profil mis à jour",
        data: updatedUser,
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);

      // MIGRATION: Gestion des erreurs spécifiques de Prisma
      if (error.code === 'P2002') {
        // Violation de contrainte d'unicité
        return res.status(409).json({
          success: false,
          message:
            "Ce nom d'entreprise existe déjà. Ajoutez une ville ou un suffixe pour le différencier.",
        });
      }

      res.status(500).json({
        success: false,
        message: "Une erreur est survenue lors de la mise à jour du profil",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);


export default router;
