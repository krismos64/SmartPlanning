import bcrypt from "bcrypt";
import crypto from "crypto";
import express, { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { generateToken } from "../config/passport";
import Company from "../models/Company.model";
import User, { UserDocument } from "../models/User.model";
import { sendPasswordResetEmail } from "../utils/email";
import { sendTestEmail } from "../utils/emailTest";
import {
  isValidUrl,
  passwordRequirementsMessage,
  validatePasswordComplexity,
} from "../utils/password";

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
router.post("/register", async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      companyName,
      profilePicture,
      companyLogo,
    } = req.body;

    // Validation des champs obligatoires
    if (!firstName || !lastName || !email || !password || !companyName) {
      return res.status(400).json({
        success: false,
        message:
          "Champs requis manquants. Prénom, nom, email, mot de passe et nom d'entreprise sont obligatoires.",
      });
    }

    // Validation de l'email
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Format d'email invalide" });
    }

    // Validation du mot de passe RGPD
    if (!validatePasswordComplexity(password)) {
      return res
        .status(422)
        .json({ success: false, message: passwordRequirementsMessage });
    }

    // Validation des URLs des images si présentes
    if (profilePicture && !isValidUrl(profilePicture)) {
      return res
        .status(400)
        .json({ success: false, message: "URL de photo de profil invalide" });
    }

    if (companyLogo && !isValidUrl(companyLogo)) {
      return res
        .status(400)
        .json({ success: false, message: "URL de logo d'entreprise invalide" });
    }

    // Validation du numéro de téléphone si présent
    if (phone) {
      const phoneRegex = /^(\+\d{1,3}\s?)?(\d{9,15})$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Format de numéro de téléphone invalide",
        });
      }
    }

    // Vérification de l'unicité de l'email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cette adresse email est déjà utilisée",
      });
    }

    // Vérification de l'unicité du nom d'entreprise
    const existingCompany = await Company.findOne({ name: companyName });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message:
          "Ce nom d'entreprise existe déjà. Ajoutez une ville ou un suffixe pour le différencier.",
      });
    }

    // Création de l'entreprise
    const newCompany = await Company.create({
      name: companyName,
      logoUrl: companyLogo || null,
    });

    // Création de l'utilisateur directeur
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password, // Le hashage est géré par le middleware pre-save dans User.model.ts
      phone,
      photoUrl: profilePicture || undefined,
      role: "directeur", // Rôle fixé en dur à "directeur"
      companyId: newCompany._id,
      isEmailVerified: true, // On considère l'email vérifié à l'inscription
      status: "active",
    });

    // Génération du token JWT
    const token = generateToken(newUser.toObject());

    // Réponse avec les données minimales de l'utilisateur (sans mot de passe)
    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        companyId: newUser.companyId,
        profilePicture: newUser.photoUrl || undefined,
      },
      company: {
        id: newCompany._id,
        name: newCompany.name,
        logo: newCompany.logoUrl || undefined,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de l'inscription:", error);

    // Gestion des erreurs spécifiques de MongoDB
    if (error.name === "MongoServerError" && error.code === 11000) {
      // Gestion des violations de contrainte d'unicité
      if (error.keyPattern?.name) {
        return res.status(400).json({
          success: false,
          message:
            "Ce nom d'entreprise existe déjà. Ajoutez une ville ou un suffixe pour le différencier.",
        });
      }
      if (error.keyPattern?.email) {
        return res.status(409).json({
          success: false,
          message: "Cette adresse email est déjà utilisée",
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'inscription",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Connexion par email/mot de passe
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Tentative de connexion pour:", email);

    // Récupérer l'utilisateur avec son mot de passe
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.warn("❌ Utilisateur non trouvé pour l'email :", email);
      return res
        .status(401)
        .json({ success: false, message: "Identifiants incorrects" });
    }

    console.log("✅ Utilisateur trouvé pour connexion");

    if (!user.password) {
      // Vérifier si c'est un employé qui n'a pas encore créé son mot de passe
      if (user.role === "employee" && user.resetPasswordToken) {
        console.log("ℹ️ Employé n'a pas encore créé son mot de passe");
        return res.status(403).json({
          success: false,
          message:
            "Veuillez créer votre mot de passe en utilisant le lien reçu par email.",
          code: "PASSWORD_NOT_CREATED",
        });
      }

      console.error("❌ Champ 'password' manquant malgré .select('+password')");
      return res.status(500).json({
        success: false,
        message: "Mot de passe non disponible. Contact support.",
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.warn("❌ Mot de passe incorrect pour l'utilisateur :", email);
      return res
        .status(401)
        .json({ success: false, message: "Identifiants incorrects" });
    }

    console.log("✅ Mot de passe vérifié avec succès pour:", email);

    // Générer le token JWT
    const token = generateToken((user as UserDocument).toObject());
    console.log("✅ Token JWT généré avec succès");

    // Configuration des cookies pour cross-origin
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS requis en production
      sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
      path: '/',
      // Pas de domaine spécifié pour permettre le cross-origin
    };

    console.log("🍪 Configuration du cookie:", {
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      httpOnly: cookieOptions.httpOnly,
      nodeEnv: process.env.NODE_ENV
    });

    // Définir le cookie httpOnly sécurisé
    res.cookie('token', token, cookieOptions);

    // Répondre avec les informations de l'utilisateur (avec le token pour fallback)
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        photoUrl: user.photoUrl || undefined,
      },
      // Envoyer aussi le token pour le fallback côté frontend
      // En cas d'échec des cookies cross-origin
      token: token
    });

    console.log("✅ Connexion réussie pour:", email);
  } catch (error) {
    console.error("❌ Erreur login:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Retourne les infos de l'utilisateur connecté
 */
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req.user as any)?._id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        companyId: user.companyId,
        teamIds: user.teamIds || [],
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
    // Configuration identique à celle du login pour supprimer le cookie
    const clearCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
      path: '/'
    };

    console.log("🍪 Suppression du cookie avec options:", clearCookieOptions);

    // Supprimer le cookie httpOnly
    res.clearCookie('token', clearCookieOptions);

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

    // Rechercher l'utilisateur par email
    const user = await User.findOne({ email });
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

      // Sauvegarder le token et sa date d'expiration (1 heure)
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 heure

      await user.save();
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
          // On pourrait stocker cette URL quelque part pour l'administrateur
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
          // On pourrait stocker cette URL quelque part pour l'administrateur
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

    // Rechercher l'utilisateur par email et token
    const user = await User.findOne({
      email,
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }, // Vérifier que le token n'a pas expiré
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Le token est invalide ou a expiré",
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    // Supprimer les champs de réinitialisation
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

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

    // Rechercher l'utilisateur par email et token
    const user = await User.findOne({
      email,
      resetPasswordToken: createPasswordTokenHash, // Réutilise le champ resetPasswordToken
      resetPasswordExpire: { $gt: Date.now() }, // Vérifier que le token n'a pas expiré
      role: "employee", // S'assurer que c'est bien un employé
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

    // Mettre à jour le mot de passe et vérifier l'email
    user.password = password;
    user.isEmailVerified = true;
    // Supprimer les champs de token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

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

      // Vérifier que l'utilisateur existe
      const user = await User.findById(userId);
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

        // Vérification de l'unicité du nom d'entreprise
        const existingCompany = await Company.findOne({ name: companyName });
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

        // Création de la nouvelle entreprise
        const newCompany = await Company.create({
          name: companyName,
          logoUrl: companyLogo || null,
          plan: "free", // Plan par défaut
        });

        // Associer l'ID de l'entreprise à l'utilisateur
        updates.companyId = newCompany._id;
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
          updates.phone = undefined;
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
        updates.photoUrl = profilePicture || undefined;
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

      // Effectuer la mise à jour
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      // Retourner la réponse avec l'utilisateur mis à jour
      res.status(200).json({
        success: true,
        message: "Profil mis à jour",
        data: updatedUser,
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);

      // Gestion des erreurs spécifiques de MongoDB
      if (error.name === "MongoServerError" && error.code === 11000) {
        // Gestion des violations de contrainte d'unicité
        if (error.keyPattern?.name) {
          return res.status(409).json({
            success: false,
            message:
              "Ce nom d'entreprise existe déjà. Ajoutez une ville ou un suffixe pour le différencier.",
          });
        }
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

/**
 * @route GET /api/auth/google
 * @desc Initialise l'authentification via Google OAuth
 * @access Public
 */
router.get("/google", (req: Request, res: Response, next: NextFunction) => {
  (
    passport.authenticate("google", {
      scope: ["profile", "email"],
      accessType: "offline",
      prompt: "select_account",
      redirect_uri: "https://smartplanning.fr/api/auth/google/callback",
    } as any) as express.RequestHandler
  )(req, res, next);
});

/**
 * @route GET /api/auth/google/callback
 * @desc Callback de l'authentification Google OAuth
 * @access Public
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${
      process.env.CLIENT_URL ||
      process.env.FRONTEND_URL ||
      "https://smartplanning.fr"
    }/connexion?error=googleauth`,
    session: false,
  }),
  (req: Request, res: Response) => {
    try {
      // L'utilisateur est authentifié à ce stade
      if (!req.user) {
        return res.redirect(
          `${
            process.env.CLIENT_URL ||
            process.env.FRONTEND_URL ||
            "https://smartplanning.fr"
          }/connexion?error=usernotfound`
        );
      }

      // Générer un token JWT pour l'utilisateur
      const token = generateToken((req.user as UserDocument).toObject());

      // Rediriger vers la page de callback OAuth du frontend avec le token JWT dans l'URL
      res.redirect(
        `${
          process.env.CLIENT_URL ||
          process.env.FRONTEND_URL ||
          "https://smartplanning.fr"
        }/oauth/callback?token=${token}`
      );
    } catch (error) {
      console.error("Erreur lors de l'authentification Google OAuth:", error);
      res.redirect(
        `${
          process.env.CLIENT_URL ||
          process.env.FRONTEND_URL ||
          "https://smartplanning.fr"
        }/connexion?error=internal`
      );
    }
  }
);

export default router;
