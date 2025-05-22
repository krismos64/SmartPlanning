import bcrypt from "bcrypt";
import express, { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { generateToken } from "../config/passport";
import EmployeeModel from "../models/Employee.model";
import User, { UserDocument } from "../models/User.model";

const router = express.Router();

/**
 * Middleware d'authentification pour les routes protégées
 */
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = (decoded as any).user;
    next();
  } catch (error) {
    console.error("Erreur JWT:", error);
    return res.status(403).json({ success: false, message: "Token invalide" });
  }
};

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un nouvel utilisateur
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Champs requis manquants" });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Email invalide" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Mot de passe trop court" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email déjà utilisé" });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: "user",
      isEmailVerified: true,
    });

    if (newUser.role === "employee" && newUser.companyId) {
      await EmployeeModel.create({
        userId: newUser._id,
        companyId: newUser.companyId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        status: "actif",
        contractHoursPerWeek: 35,
      });
    }

    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Erreur registre:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
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

    console.log("✅ Utilisateur trouvé:", user._id.toString());
    console.log("✅ Password hash récupéré :", user.password);

    if (!user.password) {
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

    // Répondre avec les informations de l'utilisateur
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl || undefined,
      },
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
    const user = await User.findById((req.user as any)?.id).select("-password");
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
      },
    });
  } catch (error) {
    console.error("Erreur /me:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Déconnecte l'utilisateur (côté serveur, le token reste valide)
 */
router.post("/logout", (req: Request, res: Response) => {
  // Note: Comme nous utilisons des JWT, il n'y a pas vraiment de session à invalider
  // côté serveur. Le client doit simplement supprimer le token.
  // Mais cette route peut être utilisée pour des logs ou des statistiques.

  console.log("Déconnexion utilisateur");

  res.status(200).json({
    success: true,
    message: "Déconnexion réussie",
  });
});

export default router;
