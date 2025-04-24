import express, { Request, Response } from "express";
import mongoose from "mongoose";

// Import des modèles
import User from "../../models/User.model";

// Interface pour la requête d'admin authentifiée
interface AdminAuthRequest extends Request {
  user: {
    _id: string;
    email: string;
    role: string;
    companyId: mongoose.Types.ObjectId;
  };
}

// Middleware d'authentification pour transformer Request en AdminAuthRequest
const authenticateToken = (
  req: Request,
  res: Response,
  next: express.NextFunction
) => {
  // Dans une implémentation réelle, vérifier le token JWT
  // Pour cet exemple, on simule simplement un utilisateur admin
  (req as any).user = {
    _id: "admin123",
    email: "admin@example.com",
    role: "admin",
    companyId: new mongoose.Types.ObjectId(),
  };
  next();
};

// Middleware de vérification de rôle
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (user && roles.includes(user.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: "Accès refusé - Rôle insuffisant",
      });
    }
  };
};

const router = express.Router();

/**
 * @route   GET /api/admin/users
 * @desc    Récupère les utilisateurs d'une entreprise filtrés par rôle
 * @access  Admin uniquement
 */
router.get(
  "/users",
  authenticateToken,
  requireRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { companyId, role } = req.query;

      // Vérifier que les paramètres obligatoires sont présents
      if (!companyId || !role) {
        return res.status(400).json({
          success: false,
          message: "Les paramètres companyId et role sont obligatoires",
        });
      }

      // Vérifier que companyId est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(companyId as string)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'entreprise n'est pas valide",
        });
      }

      // Vérifier que le rôle est valide
      const validRoles = ["manager", "employee"];
      if (!validRoles.includes(role as string)) {
        return res.status(400).json({
          success: false,
          message:
            "Le rôle spécifié n'est pas valide. Valeurs acceptées : manager, employee",
        });
      }

      // Construire la requête à la base de données
      const users = await User.find(
        {
          companyId: companyId as string,
          role: role as string,
        },
        {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
        }
      );

      // Retourner les résultats
      return res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des utilisateurs",
      });
    }
  }
);

export default router;
