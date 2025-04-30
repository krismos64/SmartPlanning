/**
 * Routes de gestion des congés - SmartPlanning
 *
 * Ce module gère toutes les routes CRUD pour les demandes de congés.
 * Chaque route implémente la logique d'accès basée sur les rôles (admin, directeur, manager, employé).
 */

import { Response, Router } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticateToken } from "../middlewares/auth.middleware";
import VacationRequestModel from "../models/VacationRequest.model";

// Création du routeur Express
const router = Router();

/**
 * Vérifie si un utilisateur a les droits d'accès à une demande de congé spécifique
 * @param user L'utilisateur authentifié
 * @param vacationRequest La demande de congé à vérifier
 * @returns boolean indiquant si l'utilisateur a les droits d'accès
 */
const hasAccessToVacationRequest = async (
  user: any,
  vacationRequest: any
): Promise<boolean> => {
  console.log("Vérification des droits d'accès");
  console.log("- Utilisateur:", { id: user._id, role: user.role });
  console.log("- Demande:", {
    id: vacationRequest._id,
    employeeId: vacationRequest.employeeId,
    requestedBy: vacationRequest.requestedBy,
    status: vacationRequest.status,
  });

  // Admin a accès à tout
  if (user.role === "admin") {
    console.log("- Accès autorisé (admin)");
    return true;
  }

  // Directeur a accès à tous les employés de la même entreprise
  if (user.role === "directeur" && user.companyId) {
    // Récupérer l'employé associé à la demande
    const employee = await mongoose
      .model("Employee")
      .findById(vacationRequest.employeeId);

    const hasAccess =
      employee && employee.companyId.toString() === user.companyId.toString();
    console.log("- Accès directeur:", hasAccess);
    return hasAccess;
  }

  // Manager a accès aux membres de ses équipes
  if (user.role === "manager" && user.teamIds && user.teamIds.length > 0) {
    const employee = await mongoose
      .model("Employee")
      .findById(vacationRequest.employeeId);

    console.log("- Équipes du manager (détaillées):");
    user.teamIds.forEach((teamId: mongoose.Types.ObjectId, index: number) => {
      console.log(`  Équipe ${index + 1}: ${teamId.toString()}`);
    });

    console.log(
      "- Équipe de l'employé:",
      employee?.teamId ? employee.teamId.toString() : "aucune équipe"
    );

    const hasAccess =
      employee &&
      user.teamIds.some(
        (teamId: mongoose.Types.ObjectId) =>
          employee.teamId && employee.teamId.toString() === teamId.toString()
      );

    console.log("- Accès manager:", hasAccess);
    return hasAccess;
  }

  // Employé a accès uniquement à ses propres demandes
  const hasAccess =
    user._id.toString() === vacationRequest.requestedBy.toString();
  console.log("- Accès employé:", hasAccess);
  return hasAccess;
};

/**
 * @route   GET /api/vacations
 * @desc    Récupérer les demandes de congés accessibles à l'utilisateur
 * @access  Privé (tous les rôles avec filtre basé sur le rôle)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const user = req.user;

    // Configuration de la requête filtrée selon le rôle
    let query = {};

    // Filtrer les demandes selon le rôle de l'utilisateur
    if (user.role === "admin") {
      // Admin voit tout
      query = {};
    } else if (user.role === "directeur" && user.companyId) {
      // Directeur voit les employés de sa compagnie
      const companyEmployees = await mongoose
        .model("Employee")
        .find({ companyId: user.companyId })
        .select("_id");

      const employeeIds = companyEmployees.map((employee: any) => employee._id);
      query = { employeeId: { $in: employeeIds } };
    } else if (
      user.role === "manager" &&
      user.teamIds &&
      user.teamIds.length > 0
    ) {
      // Manager voit les membres de ses équipes
      const teamEmployees = await mongoose
        .model("Employee")
        .find({ teamId: { $in: user.teamIds } })
        .select("_id");

      const employeeIds = teamEmployees.map((employee: any) => employee._id);
      query = { employeeId: { $in: employeeIds } };
    } else {
      // Employé voit uniquement ses demandes
      query = { requestedBy: user._id };
    }

    // Exécuter la requête paginée
    const vacationRequests = await VacationRequestModel.find(query)
      .populate("employeeId", "firstName lastName")
      .populate("updatedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    // Renvoyer les résultats
    return res.status(200).json({
      success: true,
      data: vacationRequests,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des demandes de congés:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des demandes de congés",
    });
  }
});

/**
 * @route   POST /api/vacations
 * @desc    Créer une nouvelle demande de congés
 * @access  Privé (tous les rôles)
 */
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, reason, employeeId } = req.body;
    const user = req.user;

    // Vérifier les champs obligatoires
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Les dates de début et de fin sont requises",
      });
    }

    // Valider la cohérence des dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "La date de fin doit être postérieure à la date de début",
      });
    }

    // Déterminer pour quel employé la demande est créée
    let targetEmployeeId = user._id;

    // Si un employeeId est fourni, vérifier les permissions
    if (employeeId && employeeId !== user._id.toString()) {
      console.log("Tentative de création pour un autre employé:", employeeId);
      console.log("Rôle de l'utilisateur:", user.role);

      // Vérifier si l'utilisateur a les droits pour créer une demande pour cet employé
      const canCreateForOthers =
        user.role === "admin" ||
        user.role === "directeur" ||
        user.role === "manager";

      if (!canCreateForOthers) {
        return res.status(403).json({
          success: false,
          message:
            "Vous n'avez pas les droits pour créer une demande pour un autre employé",
        });
      }

      // Vérifier que l'employé existe
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'employé invalide",
        });
      }

      const employee = await mongoose.model("Employee").findById(employeeId);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employé non trouvé",
        });
      }

      // Vérifier les accès spécifiques selon le rôle
      if (user.role === "directeur" && user.companyId) {
        // Directeur peut créer pour tous les employés de sa compagnie
        if (employee.companyId.toString() !== user.companyId.toString()) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez créer des demandes que pour les employés de votre entreprise",
          });
        }
      } else if (
        user.role === "manager" &&
        user.teamIds &&
        user.teamIds.length > 0
      ) {
        // Manager peut créer pour les membres de ses équipes
        const isTeamMember = user.teamIds.some(
          (teamId: mongoose.Types.ObjectId) =>
            employee.teamId && employee.teamId.toString() === teamId.toString()
        );

        if (!isTeamMember) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez créer des demandes que pour les membres de vos équipes",
          });
        }
      }

      // Si toutes les vérifications sont passées, utiliser l'ID de l'employé cible
      targetEmployeeId = employeeId;
      console.log("Création autorisée pour l'employé:", targetEmployeeId);
    }

    // Créer la nouvelle demande
    const newVacationRequest = new VacationRequestModel({
      employeeId: targetEmployeeId,
      requestedBy: user._id, // On garde une trace de qui a fait la demande
      updatedBy: user._id, // Ajout du champ updatedBy avec l'utilisateur qui crée la demande
      startDate,
      endDate,
      reason,
      status: "pending",
    });

    console.log("Création de la demande:", newVacationRequest);

    // Sauvegarder et retourner la demande créée
    const savedRequest = await newVacationRequest.save();

    // Populer les champs nécessaires
    await savedRequest.populate("employeeId", "firstName lastName");

    return res.status(201).json({
      success: true,
      data: savedRequest,
    });
  } catch (error: any) {
    console.error("Erreur lors de la création de la demande de congés:", error);

    // Vérifier s'il s'agit d'une erreur de validation Mongoose
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la demande de congés",
    });
  }
});

/**
 * @route   PUT /api/vacations/:id
 * @desc    Mettre à jour une demande de congés
 * @access  Privé (basé sur le rôle et les permissions)
 */
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate, reason, status } = req.body;
      const user = req.user;

      console.log("PUT /api/vacations/:id - Début de la route");
      console.log("ID de la demande:", id);
      console.log("Corps de la requête:", req.body);
      console.log("Utilisateur:", { id: user._id, role: user.role });

      // Valider l'ID MongoDB
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log("ID de demande invalide");
        return res.status(400).json({
          success: false,
          message: "ID de demande invalide",
        });
      }

      // Récupérer la demande existante
      const vacationRequest = await VacationRequestModel.findById(id);
      console.log("Demande trouvée:", vacationRequest);

      if (!vacationRequest) {
        console.log("Demande non trouvée");
        return res.status(404).json({
          success: false,
          message: "Demande de congés non trouvée",
        });
      }

      // Vérifier si l'utilisateur a les droits d'accès
      const hasAccess = await hasAccessToVacationRequest(user, vacationRequest);
      console.log("Accès autorisé:", hasAccess);

      if (!hasAccess) {
        console.log("Accès refusé");
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les droits pour modifier cette demande",
        });
      }

      // Préparer les champs à mettre à jour
      const updateData: any = {};

      // Si c'est l'employé lui-même qui modifie (et que le statut est pending), il peut modifier les dates et raison
      if (
        user._id.toString() === vacationRequest.requestedBy.toString() &&
        vacationRequest.status === "pending"
      ) {
        if (startDate) updateData.startDate = startDate;
        if (endDate) updateData.endDate = endDate;
        if (reason !== undefined) updateData.reason = reason;
        updateData.updatedBy = user._id; // Ajouter qui a mis à jour la demande
        console.log(
          "Modification par l'employé lui-même, données:",
          updateData
        );
      } else if (["admin", "directeur", "manager"].includes(user.role)) {
        // Les managers, directeurs et admins peuvent changer le statut
        if (status) updateData.status = status;

        // Ajouter qui a mis à jour la demande
        updateData.updatedBy = user._id;
        console.log("Modification par un administrateur, données:", updateData);
      }

      // Si aucun champ à mettre à jour
      if (Object.keys(updateData).length === 0) {
        console.log("Aucun champ à mettre à jour");
        return res.status(400).json({
          success: false,
          message: "Aucun champ valide à mettre à jour",
        });
      }

      // Si on modifie les dates, vérifier leur cohérence
      if (updateData.startDate || updateData.endDate) {
        const start = new Date(
          updateData.startDate || vacationRequest.startDate
        );
        const end = new Date(updateData.endDate || vacationRequest.endDate);

        if (end < start) {
          console.log("Dates incohérentes");
          return res.status(400).json({
            success: false,
            message: "La date de fin doit être postérieure à la date de début",
          });
        }
      }

      console.log("Mise à jour de la demande avec les données:", updateData);

      // Mettre à jour la demande
      console.log(`Tentative de mise à jour pour l'ID: ${id}`);
      console.log(`Données de mise à jour: ${JSON.stringify(updateData)}`);

      // Utiliser findOne puis save pour s'assurer que les hooks et validations sont exécutés
      const vacReq = await VacationRequestModel.findById(id);

      if (!vacReq) {
        console.log("Demande introuvable lors de la mise à jour finale");
        return res.status(404).json({
          success: false,
          message: "Demande de congés non trouvée lors de la mise à jour",
        });
      }

      // Application manuelle des modifications
      Object.assign(vacReq, updateData);

      // Sauvegarde avec validation complète
      await vacReq.save();

      // Récupération de la demande mise à jour avec les champs peuplés
      const updatedVacationRequest = await VacationRequestModel.findById(id)
        .populate("employeeId", "firstName lastName")
        .populate("updatedBy", "firstName lastName");

      console.log(
        "Type de la réponse après mise à jour:",
        typeof updatedVacationRequest
      );
      console.log(
        "Demande mise à jour:",
        JSON.stringify(updatedVacationRequest, null, 2)
      );

      return res.status(200).json({
        success: true,
        data: updatedVacationRequest,
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la demande:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de la demande",
      });
    }
  }
);

/**
 * @route   DELETE /api/vacations/:id
 * @desc    Supprimer une demande de congés
 * @access  Privé (basé sur le rôle et les permissions)
 */
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;

      // Valider l'ID MongoDB
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de demande invalide",
        });
      }

      // Récupérer la demande existante
      const vacationRequest = await VacationRequestModel.findById(id);

      if (!vacationRequest) {
        return res.status(404).json({
          success: false,
          message: "Demande de congés non trouvée",
        });
      }

      // Vérifier si l'utilisateur a les droits d'accès
      const hasAccess = await hasAccessToVacationRequest(user, vacationRequest);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les droits pour supprimer cette demande",
        });
      }

      // Restriction additionnelle : un employé ne peut supprimer que ses demandes en statut 'pending'
      if (
        user.role === "employé" &&
        (user._id.toString() !== vacationRequest.requestedBy.toString() ||
          vacationRequest.status !== "pending")
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Vous ne pouvez supprimer que vos propres demandes en attente",
        });
      }

      // Supprimer la demande
      await VacationRequestModel.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: "Demande de congés supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la demande:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de la demande",
      });
    }
  }
);

export default router;
