import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { authenticateToken } from "../middlewares/auth.middleware";
import EmployeeModel from "../models/Employee.model";
import IncidentModel from "../models/Incident.model";

// Type pour les requêtes authentifiées
interface AuthRequest {
  user?: {
    _id: string;
    email: string;
    role: "admin" | "manager" | "employee" | "directeur";
    teamIds?: string[];
    companyId?: string;
  };
  query: any;
  body: any;
  params: any;
}

const router = Router();

// Middleware pour vérifier l'autorisation selon le rôle
const checkRoleAccess = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Non authentifié" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Accès non autorisé pour ce rôle" });
    }

    next();
  };
};

// GET /api/incidents - Récupérer la liste des incidents
router.get(
  "/",
  authenticateToken,
  checkRoleAccess(["admin", "directeur", "manager"]),
  async (req: any, res: any) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;

      let query = {};

      // Filtrer selon le rôle de l'utilisateur
      if (req.user) {
        if (req.user.role === "directeur" && req.user.companyId) {
          // Un directeur voit les incidents des employés de sa compagnie
          const companyEmployees = await EmployeeModel.find(
            { companyId: req.user.companyId },
            "_id"
          );
          const employeeIds = companyEmployees.map((emp) => emp._id);
          query = { employeeId: { $in: employeeIds } };
        } else if (
          req.user.role === "manager" &&
          req.user.teamIds &&
          req.user.teamIds.length > 0
        ) {
          // Un manager voit les incidents des employés de ses équipes
          const teamEmployees = await EmployeeModel.find(
            { teamId: { $in: req.user.teamIds } },
            "_id"
          );
          const employeeIds = teamEmployees.map((emp) => emp._id);
          query = { employeeId: { $in: employeeIds } };
        }
        // Admin voit tout, pas besoin de filtrer
      }

      const incidents = await IncidentModel.find(query)
        .populate("employeeId", "firstName lastName email")
        .populate("reportedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await IncidentModel.countDocuments(query);

      res.status(200).json({
        success: true,
        data: incidents,
        pagination: {
          total,
          limit,
          skip,
          hasMore: total > skip + limit,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des incidents",
        error: error.message,
      });
    }
  }
);

// POST /api/incidents - Créer un nouvel incident
router.post(
  "/",
  authenticateToken,
  checkRoleAccess(["admin", "manager"]),
  async (req: any, res: any) => {
    try {
      const {
        employeeId,
        type,
        description,
        date,
        status = "pending",
      } = req.body;

      if (!isValidObjectId(employeeId)) {
        return res
          .status(400)
          .json({ success: false, message: "ID employé invalide" });
      }

      // Vérifier si l'employé existe
      const employee = await EmployeeModel.findById(employeeId);
      if (!employee) {
        return res
          .status(404)
          .json({ success: false, message: "Employé non trouvé" });
      }

      // Vérifier les droits du manager sur l'employé
      if (req.user && req.user.role === "manager" && req.user.teamIds) {
        if (
          !employee.teamId ||
          !req.user.teamIds.includes(employee.teamId.toString())
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez pas créer d'incident pour un employé qui n'est pas dans vos équipes",
          });
        }
      }

      // Créer l'incident
      const incident = new IncidentModel({
        employeeId,
        type,
        description,
        date: date || new Date(),
        status,
        reportedBy: req.user?._id,
      });

      await incident.save();

      res.status(201).json({ success: true, data: incident });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de l'incident",
        error: error.message,
      });
    }
  }
);

// PUT /api/incidents/:id - Modifier un incident existant
router.put(
  "/:id",
  authenticateToken,
  checkRoleAccess(["admin", "manager"]),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID incident invalide" });
      }

      // Récupérer l'incident existant
      const incident = await IncidentModel.findById(id);
      if (!incident) {
        return res
          .status(404)
          .json({ success: false, message: "Incident non trouvé" });
      }

      // Vérifier si le manager a le droit de modifier cet incident
      if (req.user && req.user.role === "manager" && req.user.teamIds) {
        const employee = await EmployeeModel.findById(incident.employeeId);
        if (
          !employee ||
          !employee.teamId ||
          !req.user.teamIds.includes(employee.teamId.toString())
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez pas modifier cet incident car l'employé n'est pas dans vos équipes",
          });
        }
      }

      // Mettre à jour l'incident
      const { type, description, date, status } = req.body;

      incident.type = type || incident.type;
      incident.description = description || incident.description;
      incident.date = date || incident.date;
      incident.status = status || incident.status;

      await incident.save();

      res.status(200).json({ success: true, data: incident });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de l'incident",
        error: error.message,
      });
    }
  }
);

// DELETE /api/incidents/:id - Supprimer un incident
router.delete(
  "/:id",
  authenticateToken,
  checkRoleAccess(["admin", "manager"]),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID incident invalide" });
      }

      // Récupérer l'incident existant
      const incident = await IncidentModel.findById(id);
      if (!incident) {
        return res
          .status(404)
          .json({ success: false, message: "Incident non trouvé" });
      }

      // Vérifier si le manager a le droit de supprimer cet incident
      if (req.user && req.user.role === "manager" && req.user.teamIds) {
        const employee = await EmployeeModel.findById(incident.employeeId);
        if (
          !employee ||
          !employee.teamId ||
          !req.user.teamIds.includes(employee.teamId.toString())
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez pas supprimer cet incident car l'employé n'est pas dans vos équipes",
          });
        }
      }

      await IncidentModel.findByIdAndDelete(id);
      res
        .status(200)
        .json({ success: true, message: "Incident supprimé avec succès" });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de l'incident",
        error: error.message,
      });
    }
  }
);

export default router;
