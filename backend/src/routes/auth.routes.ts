import bcrypt from "bcrypt";
import express, { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import passport, { generateToken } from "../config/passport";
import { User } from "../models/User.model";

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un nouvel utilisateur
 * @access Public
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    // Extraction des données du corps de la requête
    const { firstName, lastName, email, password } = req.body;

    // Validation des champs requis
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    // Validation du format email avec RegEx
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
      });
    }

    // Validation de la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères",
      });
    }

    // Vérification si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    // Création d'un nouvel utilisateur avec les informations requises
    const userData = {
      firstName,
      lastName,
      email,
      password, // Sera haché automatiquement par le middleware pre-save
      role: "user" as const, // Rôle par défaut avec typage explicite
      isEmailVerified: true, // Pas de vérification d'email pour l'instant
    };

    const newUser = await User.create(userData);

    // Préparation de la réponse sans le mot de passe
    const userResponse = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
    };

    // Réponse avec statut 201 (Created)
    res.status(201).json({
      success: true,
      message: "Inscription réussie !",
      user: userResponse,
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'inscription",
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Authentification classique par email/mot de passe
 * @access Public
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Vérification des champs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir un email et un mot de passe",
      });
    }

    // Recherche de l'utilisateur par email
    const user = await User.findOne({ email }).select("+password");

    // Vérification de l'existence de l'utilisateur
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // Génération du token JWT
    const token = generateToken(user);

    // Réponse avec le token et les informations utilisateur (sans le mot de passe)
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion",
    });
  }
});

/**
 * @route GET /api/auth/google
 * @desc Initie l'authentification Google OAuth
 * @access Public
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * @route GET /api/auth/google/callback
 * @desc Callback après authentification Google OAuth
 * @access Public
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/login?error=google_auth_failed`,
  }),
  (req: Request, res: Response) => {
    try {
      // L'utilisateur est déjà authentifié par passport à ce stade
      const user = req.user;

      if (!user) {
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login?error=user_not_found`
        );
      }

      // Génération du token JWT
      const token = generateToken(user);

      // Redirection vers le frontend avec le token en paramètre d'URL
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?token=${token}`
      );
    } catch (error) {
      console.error("Erreur lors du callback Google:", error);
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=server_error`
      );
    }
  }
);

/**
 * @route GET /api/auth/me
 * @desc Récupère les informations de l'utilisateur connecté
 * @access Private
 */
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    // req.user est défini par le middleware authenticateToken
    const user = await User.findById(req.user?.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des informations utilisateur:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Déconnexion (côté client)
 * @access Public
 */
router.post("/logout", (req: Request, res: Response) => {
  // La déconnexion est gérée côté client (suppression du token)
  res.status(200).json({
    success: true,
    message: "Déconnexion réussie",
  });
});

/**
 * Middleware d'authentification pour les routes protégées
 */
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Récupération du token depuis le header Authorization
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Accès non autorisé",
    });
  }

  try {
    // Vérification et décodage du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = (decoded as any).user;
    next();
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    return res.status(403).json({
      success: false,
      message: "Token invalide ou expiré",
    });
  }
}

export default router;
