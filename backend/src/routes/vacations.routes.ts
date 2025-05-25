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
      .populate("employeeId", "firstName lastName companyId teamId")
      .populate("updatedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    // Ajouter des permissions à chaque demande
    const vacationRequestsWithPermissions = vacationRequests.map((request) => {
      const requestObj = request.toObject();

      // Déterminer si l'utilisateur peut modifier cette demande
      const canEdit = ["admin", "directeur", "manager"].includes(user.role);

      // Déterminer si l'utilisateur peut supprimer cette demande
      const canDelete =
        ["admin", "directeur", "manager"].includes(user.role) ||
        (user._id.toString() === requestObj.requestedBy.toString() &&
          requestObj.status === "pending");

      // Ajouter les permissions à l'objet de demande
      return {
        ...requestObj,
        permissions: {
          canEdit,
          canDelete,
        },
      };
    });

    // Renvoyer les résultats avec les permissions
    return res.status(200).json({
      success: true,
      data: vacationRequestsWithPermissions,
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

    // Standardiser et valider les dates
    // Convertir au format YYYY-MM-DD pour éviter les problèmes de fuseau horaire
    const startDateStr =
      typeof startDate === "string"
        ? startDate.split("T")[0]
        : new Date(startDate).toISOString().split("T")[0];

    const endDateStr =
      typeof endDate === "string"
        ? endDate.split("T")[0]
        : new Date(endDate).toISOString().split("T")[0];

    // Conversion des chaînes de date en objets Date avec le traitement du fuseau horaire
    const startParts = startDateStr.split("-");
    const startYear = parseInt(startParts[0], 10);
    const startMonth = parseInt(startParts[1], 10) - 1;
    const startDay = parseInt(startParts[2], 10);

    const endParts = endDateStr.split("-");
    const endYear = parseInt(endParts[0], 10);
    const endMonth = parseInt(endParts[1], 10) - 1;
    const endDay = parseInt(endParts[2], 10);

    // Créer les dates à midi UTC
    const start = new Date(Date.UTC(startYear, startMonth, startDay, 12, 0, 0));
    const end = new Date(Date.UTC(endYear, endMonth, endDay, 12, 0, 0));

    // Les dates sont maintenant normalisées à midi UTC

    // Vérifier si les dates sont valides
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Les dates fournies ne sont pas valides",
      });
    }

    // Comparer les dates au format YYYY-MM-DD
    if (startDateStr > endDateStr) {
      return res.status(400).json({
        success: false,
        message:
          "La date de fin doit être égale ou postérieure à la date de début",
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

    // Créer la nouvelle demande avec les dates normalisées
    const newVacationRequest = new VacationRequestModel({
      employeeId: targetEmployeeId,
      requestedBy: user._id, // On garde une trace de qui a fait la demande
      updatedBy: user._id, // Ajout du champ updatedBy avec l'utilisateur qui crée la demande
      startDate: start, // Utiliser la date normalisée
      endDate: end, // Utiliser la date normalisée
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
 * @route   GET /api/vacations/:id
 * @desc    Récupérer une demande de congé spécifique
 * @access  Privé (basé sur le rôle et les permissions)
 */
router.get(
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
          status: 400,
        });
      }

      // Récupérer la demande
      const vacationRequest = await VacationRequestModel.findById(id)
        .populate("employeeId", "firstName lastName")
        .populate("updatedBy", "firstName lastName");

      if (!vacationRequest) {
        return res.status(404).json({
          success: false,
          message: "Demande de congés non trouvée",
          status: 404,
        });
      }

      // Vérifier si l'utilisateur a les droits d'accès
      const hasAccess = await hasAccessToVacationRequest(user, vacationRequest);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les droits pour voir cette demande",
          status: 403,
        });
      }

      // Convertir en objet pour pouvoir ajouter des propriétés
      const requestObj = vacationRequest.toObject();

      // Déterminer si l'utilisateur peut modifier cette demande
      const canEdit = ["admin", "directeur", "manager"].includes(user.role);

      // Déterminer si l'utilisateur peut supprimer cette demande
      const canDelete =
        ["admin", "directeur", "manager"].includes(user.role) ||
        (user._id.toString() === requestObj.requestedBy.toString() &&
          requestObj.status === "pending");

      // Ajouter les permissions à l'objet de demande
      const requestWithPermissions = {
        ...requestObj,
        permissions: {
          canEdit,
          canDelete,
        },
      };

      return res.status(200).json({
        success: true,
        data: requestWithPermissions,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de la demande:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de la demande",
        status: 500,
      });
    }
  }
);

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
      const { startDate, endDate, reason, status, employeeId } = req.body;
      const user = req.user;

      // Valider l'ID MongoDB
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de demande invalide",
          status: 400,
        });
      }

      // Récupérer la demande existante
      const vacationRequest = await VacationRequestModel.findById(id);

      if (!vacationRequest) {
        return res.status(404).json({
          success: false,
          message: "Demande de congés non trouvée",
          status: 404,
        });
      }

      // Vérifier si l'utilisateur a les droits d'accès
      const hasAccess = await hasAccessToVacationRequest(user, vacationRequest);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les droits pour modifier cette demande",
          status: 403,
        });
      }

      // Valider les champs fournis et les appliquer si valides

      // Validation du status si fourni
      if (status !== undefined) {
        if (!["pending", "approved", "rejected"].includes(status)) {
          return res.status(400).json({
            success: false,
            message: "Le statut doit être 'pending', 'approved' ou 'rejected'",
            status: 400,
          });
        }

        // Seuls les admins, directeurs et managers peuvent modifier le statut
        if (!["admin", "directeur", "manager"].includes(user.role)) {
          return res.status(403).json({
            success: false,
            message:
              "Seuls les admins, directeurs et managers peuvent modifier le statut",
            status: 403,
          });
        }

        // Appliquer le nouveau statut
        vacationRequest.status = status;
      }

      // Validation et application de startDate si fourni
      if (startDate !== undefined) {
        // Extraire la date au format YYYY-MM-DD
        const dateString =
          typeof startDate === "string"
            ? startDate.split("T")[0] // Si ISO, prendre seulement la partie date
            : new Date(startDate).toISOString().split("T")[0];

        // Extraire les composants de la date
        const parts = dateString.split("-");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Les mois vont de 0 à 11 en JS
        const day = parseInt(parts[2], 10);

        // Créer une date à midi UTC ce jour-là
        const start = new Date(Date.UTC(year, month, day, 12, 0, 0));

        // Vérifier si la date est valide
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "La date de début n'est pas valide",
            status: 400,
          });
        }

        console.log(`Date de début originale: ${startDate}`);
        console.log(`Date de début parsée: ${dateString}`);
        console.log(`Date de début normalisée: ${start.toISOString()}`);

        vacationRequest.startDate = start;
      }

      // Validation et application de endDate si fourni
      if (endDate !== undefined) {
        // Extraire la date au format YYYY-MM-DD
        const dateString =
          typeof endDate === "string"
            ? endDate.split("T")[0] // Si ISO, prendre seulement la partie date
            : new Date(endDate).toISOString().split("T")[0];

        // Extraire les composants de la date
        const parts = dateString.split("-");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Les mois vont de 0 à 11 en JS
        const day = parseInt(parts[2], 10);

        // Créer une date à midi UTC ce jour-là
        const end = new Date(Date.UTC(year, month, day, 12, 0, 0));

        // Vérifier si la date est valide
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "La date de fin n'est pas valide",
            status: 400,
          });
        }

        console.log(`Date de fin originale: ${endDate}`);
        console.log(`Date de fin parsée: ${dateString}`);
        console.log(`Date de fin normalisée: ${end.toISOString()}`);

        vacationRequest.endDate = end;
      }

      // Vérifier la cohérence des dates
      if (startDate !== undefined || endDate !== undefined) {
        // Pour comparer les dates, on utilise toujours le format YYYY-MM-DD
        // en ignorant l'heure/fuseau horaire
        const startObj = vacationRequest.startDate;
        const endObj = vacationRequest.endDate;

        // Convertir en UTC puis extraire YYYY-MM-DD pour comparer
        const startYMD = startObj.toISOString().substring(0, 10);
        const endYMD = endObj.toISOString().substring(0, 10);

        // Comparer les dates (même jour = OK)
        if (startYMD > endYMD) {
          return res.status(400).json({
            success: false,
            message:
              "La date de fin doit être égale ou postérieure à la date de début",
            status: 400,
          });
        }

        // Les dates sont maintenant correctement normalisées
      }

      // Appliquer le motif si fourni
      if (reason !== undefined) {
        vacationRequest.reason = reason;
      }

      // Validation et application de employeeId si fourni
      if (employeeId !== undefined) {
        // Seuls les admins, directeurs et managers peuvent modifier l'employé associé
        if (!["admin", "directeur", "manager"].includes(user.role)) {
          return res.status(403).json({
            success: false,
            message:
              "Seuls les admins, directeurs et managers peuvent modifier l'employé associé",
            status: 403,
          });
        }

        // Vérifier si l'ID est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
          return res.status(400).json({
            success: false,
            message: "ID d'employé invalide",
            status: 400,
          });
        }

        // Vérifier que l'employé existe
        const employee = await mongoose.model("Employee").findById(employeeId);

        if (!employee) {
          return res.status(404).json({
            success: false,
            message: "Employé non trouvé",
            status: 404,
          });
        }

        // Vérifier les accès spécifiques selon le rôle
        if (user.role === "directeur" && user.companyId) {
          // Directeur peut modifier pour tous les employés de sa compagnie
          if (employee.companyId.toString() !== user.companyId.toString()) {
            return res.status(403).json({
              success: false,
              message:
                "Vous ne pouvez modifier les demandes que pour les employés de votre entreprise",
              status: 403,
            });
          }
        } else if (
          user.role === "manager" &&
          user.teamIds &&
          user.teamIds.length > 0
        ) {
          // Manager peut modifier pour les membres de ses équipes
          const isTeamMember = user.teamIds.some(
            (teamId: mongoose.Types.ObjectId) =>
              employee.teamId &&
              employee.teamId.toString() === teamId.toString()
          );

          if (!isTeamMember) {
            return res.status(403).json({
              success: false,
              message:
                "Vous ne pouvez modifier les demandes que pour les membres de vos équipes",
              status: 403,
            });
          }
        }

        // Appliquer le nouvel employeeId
        vacationRequest.employeeId = employeeId;
      }

      // Mettre à jour le champ updatedBy avec l'utilisateur actuel
      vacationRequest.updatedBy = user._id;

      // Sauvegarder la demande mise à jour
      await vacationRequest.save();

      // Récupérer la demande mise à jour avec les champs peuplés
      const updatedVacationRequest = await VacationRequestModel.findById(id)
        .populate("employeeId", "firstName lastName")
        .populate("updatedBy", "firstName lastName");

      // Vérifier si la demande existe toujours
      if (!updatedVacationRequest) {
        return res.status(404).json({
          success: false,
          message: "Demande de congés non trouvée après mise à jour",
          status: 404,
        });
      }

      // Convertir en objet pour pouvoir ajouter des propriétés
      const requestObj = updatedVacationRequest.toObject();

      // Déterminer les permissions de l'utilisateur sur cette demande
      const requestWithPermissions = {
        ...requestObj,
        permissions: {
          canEdit: ["admin", "directeur", "manager"].includes(user.role),
          canDelete:
            ["admin", "directeur", "manager"].includes(user.role) ||
            (user._id.toString() === requestObj.requestedBy.toString() &&
              requestObj.status === "pending"),
        },
      };

      return res.status(200).json({
        success: true,
        message: "Demande de congé mise à jour avec succès",
        data: requestWithPermissions,
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la demande:", error);

      // Gérer les erreurs de validation Mongoose
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: error.message,
          status: 400,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de la demande",
        status: 500,
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
          status: 400,
        });
      }

      // Récupérer la demande existante
      const vacationRequest = await VacationRequestModel.findById(id);

      if (!vacationRequest) {
        return res.status(404).json({
          success: false,
          message: "Demande de congés non trouvée",
          status: 404,
        });
      }

      // Vérifier si l'utilisateur a les droits d'accès
      const hasAccess = await hasAccessToVacationRequest(user, vacationRequest);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les droits pour supprimer cette demande",
          status: 403,
        });
      }

      // Les admins, directeurs et managers peuvent supprimer n'importe quelle demande
      if (["admin", "directeur", "manager"].includes(user.role)) {
        await VacationRequestModel.findByIdAndDelete(id);

        return res.status(200).json({
          success: true,
          message: "Demande de congés supprimée avec succès",
        });
      }

      // Restriction pour les employés : seulement leurs demandes en statut 'pending'
      if (
        user.role === "employé" &&
        (user._id.toString() !== vacationRequest.requestedBy.toString() ||
          vacationRequest.status !== "pending")
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Vous ne pouvez supprimer que vos propres demandes en attente",
          status: 403,
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
        status: 500,
      });
    }
  }
);

export default router;
