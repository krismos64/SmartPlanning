import express, { Request, Response } from "express";
import mongoose from "mongoose";

// Import du modèle Employee
import EmployeeModel from "../../models/Employee.model";

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
 * @route   GET /api/admin/employees
 * @desc    Récupère tous les employés d'une entreprise spécifique
 * @access  Admin uniquement
 */
router.get(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.query;

      // Vérifier que le paramètre companyId est présent
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "Le paramètre companyId est obligatoire",
        });
      }

      // Vérifier que companyId est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(companyId as string)) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de l'entreprise n'est pas valide",
        });
      }

      // Récupérer les employés de l'entreprise
      const employees = await EmployeeModel.find(
        { companyId: companyId as string },
        {
          _id: 1,
          firstName: 1,
          lastName: 1,
          status: 1,
        }
      );

      // Retourner les résultats
      return res.status(200).json({
        success: true,
        employees,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des employés:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des employés",
      });
    }
  }
);

export default router;
