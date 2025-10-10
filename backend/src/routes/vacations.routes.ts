/**
 * Routes de gestion des congés - SmartPlanning
 *
 * MIGRATION POSTGRESQL: Migré de Mongoose vers Prisma ORM
 *
 * Ce module gère toutes les routes CRUD pour les demandes de congés.
 * Chaque route implémente la logique d'accès basée sur les rôles (admin, directeur, manager, employé).
 */

import { Response, Router } from "express";
import { AuthRequest, authenticateToken } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";

// Enum pour les statuts de demandes de congés (aligné avec Prisma schema)
enum VacationRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

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
  console.log("- Vérification des droits utilisateur");
  console.log("- Demande:", {
    id: vacationRequest.id,
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
    const employee = await prisma.employee.findUnique({
      where: { id: vacationRequest.employeeId },
      select: { companyId: true }
    });

    const hasAccess = employee && employee.companyId === user.companyId;
    console.log("- Accès directeur:", hasAccess);
    return hasAccess;
  }

  // Manager a accès aux membres de ses équipes
  // PostgreSQL: Team.managerId (single) au lieu de User.teamIds (array)
  if (user.role === "manager") {
    const employee = await prisma.employee.findUnique({
      where: { id: vacationRequest.employeeId },
      select: { teamId: true }
    });

    console.log("- Vérification manager:");

    if (!employee || !employee.teamId) {
      console.log("  Employé sans équipe");
      return false;
    }

    // Récupérer les équipes gérées par ce manager
    const teams = await prisma.team.findMany({
      where: { managerId: user.id },
      select: { id: true }
    });

    console.log(`  Manager gère ${teams.length} équipe(s)`);
    console.log(`  Équipe de l'employé: ${employee.teamId}`);

    const teamIds = teams.map(t => t.id);
    const hasAccess = teamIds.includes(employee.teamId);

    console.log("- Accès manager:", hasAccess);
    return hasAccess;
  }

  // Employé a accès uniquement à ses propres demandes
  const hasAccess = user.id === vacationRequest.requestedBy;
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
    let whereClause: any = {};

    // Filtrer les demandes selon le rôle de l'utilisateur
    if (user.role === "admin") {
      // Admin voit tout
      whereClause = {};
    } else if (user.role === "directeur" && user.companyId) {
      // Directeur voit les employés de sa compagnie
      const companyEmployees = await prisma.employee.findMany({
        where: { companyId: user.companyId },
        select: { id: true }
      });

      const employeeIds = companyEmployees.map((employee) => employee.id);
      whereClause = { employeeId: { in: employeeIds } };
    } else if (user.role === "manager") {
      // Manager voit les membres de ses équipes
      console.log("=== FILTRE MANAGER ===");
      console.log("Manager user ID:", user.id);

      // Récupérer les équipes gérées par ce manager
      const teams = await prisma.team.findMany({
        where: { managerId: user.id },
        select: { id: true }
      });

      console.log(`Équipes du manager: ${teams.length}`);

      if (teams.length === 0) {
        console.log("Aucune équipe trouvée pour le manager");
        whereClause = { employeeId: -1 }; // Requête qui ne retourne rien
      } else {
        const teamIds = teams.map(t => t.id);

        const teamEmployees = await prisma.employee.findMany({
          where: { teamId: { in: teamIds } },
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        });

        console.log("Employés trouvés dans les équipes du manager:", teamEmployees.length);

        const employeeIds = teamEmployees.map((employee) => employee.id);
        console.log("Employee IDs pour le filtre:", employeeIds);

        whereClause = { employeeId: { in: employeeIds } };
        console.log("Where clause finale pour manager:", whereClause);
      }
    } else {
      // Employé voit uniquement ses demandes
      // D'abord, trouver le profil Employee correspondant au User connecté
      const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { id: true }
      });

      if (!employee) {
        console.log("Aucun profil employé trouvé pour l'utilisateur:", user.id);
        // Si pas de profil employé, retourner un tableau vide
        whereClause = { employeeId: -1 }; // Requête qui ne retourne rien
      } else {
        console.log("Profil employé trouvé:", employee.id);
        whereClause = { employeeId: employee.id };
      }
    }

    // Exécuter la requête paginée
    console.log("=== EXECUTION REQUETE ===");
    console.log("Where clause utilisée:", whereClause);
    console.log("Rôle utilisateur:", user.role);

    const vacationRequests = await prisma.vacationRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            companyId: true,
            teamId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true
              }
            }
          }
        },
        reviewedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(skip)
    });

    console.log("Nombre de demandes trouvées:", vacationRequests.length);
    console.log(
      "Demandes trouvées (basiques):",
      vacationRequests.map((req) => ({
        id: req.id,
        employeeId: req.employeeId,
        startDate: req.startDate,
        status: req.status,
      }))
    );

    // Ajouter des permissions à chaque demande
    const vacationRequestsWithPermissions = await Promise.all(vacationRequests.map(async (request) => {
      // Déterminer si l'utilisateur peut modifier cette demande
      // Pour admin/directeur/manager: toujours true pour leurs employés accessibles
      const canEdit = ["admin", "directeur", "manager"].includes(user.role);

      // Déterminer si l'utilisateur peut supprimer cette demande
      // Un employé peut supprimer sa propre demande pending
      const isOwnRequest = await prisma.employee.findFirst({
        where: {
          id: request.employeeId,
          userId: user.id
        }
      });

      const canDelete =
        ["admin", "directeur", "manager"].includes(user.role) ||
        (isOwnRequest !== null && request.status === "pending");

      console.log(`Permissions pour demande ${request.id}:`, {
        userRole: user.role,
        canEdit,
        canDelete,
        requestStatus: request.status,
      });

      // Ajouter les permissions à l'objet de demande
      return {
        ...request,
        permissions: {
          canEdit,
          canDelete,
        },
      };
    }));

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
    let targetEmployeeId: number;
    let companyId: number;

    // Si un employeeId est fourni, vérifier les permissions
    if (employeeId && employeeId !== user.id.toString()) {
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

      // Vérifier que l'employé existe (convertir ID)
      const empIdNum = parseInt(employeeId, 10);
      if (isNaN(empIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'employé invalide",
        });
      }

      const employee = await prisma.employee.findUnique({
        where: { id: empIdNum },
        select: { id: true, companyId: true, teamId: true }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employé non trouvé",
        });
      }

      // Vérifier les accès spécifiques selon le rôle
      if (user.role === "directeur" && user.companyId) {
        // Directeur peut créer pour tous les employés de sa compagnie
        if (employee.companyId !== user.companyId) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez créer des demandes que pour les employés de votre entreprise",
          });
        }
      } else if (user.role === "manager") {
        // Manager peut créer pour les membres de ses équipes
        if (!employee.teamId) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez créer des demandes que pour les membres de vos équipes",
          });
        }

        // Vérifier que l'équipe de l'employé est gérée par ce manager
        const teams = await prisma.team.findMany({
          where: { managerId: user.id },
          select: { id: true }
        });

        const teamIds = teams.map(t => t.id);
        const isTeamMember = teamIds.includes(employee.teamId);

        if (!isTeamMember) {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez créer des demandes que pour les membres de vos équipes",
          });
        }
      }

      // Si toutes les vérifications sont passées, utiliser l'ID de l'employé cible
      targetEmployeeId = empIdNum;
      companyId = employee.companyId;
      console.log("Création autorisée pour l'employé:", targetEmployeeId);
    } else {
      // Pour un employé normal, récupérer son document Employee correspondant
      console.log("Recherche de l'employé correspondant au user:", user.id);

      const currentEmployee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          teamId: true,
          companyId: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!currentEmployee) {
        return res.status(404).json({
          success: false,
          message: "Aucun profil d'employé trouvé pour cet utilisateur",
        });
      }

      console.log("Employee trouvé pour la création:", {
        id: currentEmployee.id,
        teamId: currentEmployee.teamId,
        companyId: currentEmployee.companyId,
        firstName: currentEmployee.user.firstName,
        lastName: currentEmployee.user.lastName,
      });

      targetEmployeeId = currentEmployee.id;
      companyId = currentEmployee.companyId;
      console.log("Employee ID trouvé:", targetEmployeeId);
    }

    // Créer la nouvelle demande avec les dates normalisées
    const savedRequest = await prisma.vacationRequest.create({
      data: {
        employeeId: targetEmployeeId,
        companyId,
        startDate: start, // Utiliser la date normalisée
        endDate: end, // Utiliser la date normalisée
        type: "vacation", // Type par défaut
        reason,
        status: "pending",
      },
      include: {
        employee: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true
              }
            }
          }
        }
      }
    });

    console.log("Création de la demande:", savedRequest);

    return res.status(201).json({
      success: true,
      data: savedRequest,
    });
  } catch (error: any) {
    console.error("Erreur lors de la création de la demande de congés:", error);

    // Vérifier s'il s'agit d'une erreur de validation Prisma
    if (error.code === 'P2002' || error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation: " + error.message,
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

      // Valider l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID de demande invalide",
          status: 400,
        });
      }

      // Récupérer la demande
      const vacationRequest = await prisma.vacationRequest.findUnique({
        where: { id: idNum },
        include: {
          employee: {
            select: {
              id: true,
              companyId: true,
              teamId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePicture: true
                }
              }
            }
          },
          reviewedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

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

      // Déterminer si l'utilisateur peut modifier cette demande
      const canEdit = ["admin", "directeur", "manager"].includes(user.role);

      // Déterminer si l'utilisateur peut supprimer cette demande
      // Vérifier si c'est la demande de l'utilisateur connecté
      const isOwnRequest = await prisma.employee.findFirst({
        where: {
          id: vacationRequest.employeeId,
          userId: user.id
        }
      });

      const canDelete =
        ["admin", "directeur", "manager"].includes(user.role) ||
        (isOwnRequest !== null &&
          vacationRequest.status === "pending");

      // Ajouter les permissions à l'objet de demande
      const requestWithPermissions = {
        ...vacationRequest,
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

      // Valider l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID de demande invalide",
          status: 400,
        });
      }

      // Récupérer la demande existante
      const vacationRequest = await prisma.vacationRequest.findUnique({
        where: { id: idNum },
      });

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

      // Préparer les données de mise à jour
      const updateData: any = {};

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
        updateData.status = status;
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

        updateData.startDate = start;
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

        updateData.endDate = end;
      }

      // Vérifier la cohérence des dates
      if (startDate !== undefined || endDate !== undefined) {
        // Utiliser les dates mises à jour ou existantes
        const finalStartDate = updateData.startDate || vacationRequest.startDate;
        const finalEndDate = updateData.endDate || vacationRequest.endDate;

        // Convertir en UTC puis extraire YYYY-MM-DD pour comparer
        const startYMD = finalStartDate.toISOString().substring(0, 10);
        const endYMD = finalEndDate.toISOString().substring(0, 10);

        // Comparer les dates (même jour = OK)
        if (startYMD > endYMD) {
          return res.status(400).json({
            success: false,
            message:
              "La date de fin doit être égale ou postérieure à la date de début",
            status: 400,
          });
        }
      }

      // Appliquer le motif si fourni
      if (reason !== undefined) {
        updateData.reason = reason;
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

        // Vérifier si l'ID est valide
        const empIdNum = parseInt(employeeId, 10);
        if (isNaN(empIdNum)) {
          return res.status(400).json({
            success: false,
            message: "ID d'employé invalide",
            status: 400,
          });
        }

        // Vérifier que l'employé existe
        const employee = await prisma.employee.findUnique({
          where: { id: empIdNum },
          select: { id: true, companyId: true, teamId: true }
        });

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
          if (employee.companyId !== user.companyId) {
            return res.status(403).json({
              success: false,
              message:
                "Vous ne pouvez modifier les demandes que pour les employés de votre entreprise",
              status: 403,
            });
          }
        } else if (user.role === "manager") {
          // Manager peut modifier pour les membres de ses équipes
          if (!employee.teamId) {
            return res.status(403).json({
              success: false,
              message:
                "Vous ne pouvez modifier les demandes que pour les membres de vos équipes",
              status: 403,
            });
          }

          // Vérifier que l'équipe de l'employé est gérée par ce manager
          const teams = await prisma.team.findMany({
            where: { managerId: user.id },
            select: { id: true }
          });

          const teamIds = teams.map(t => t.id);
          const isTeamMember = teamIds.includes(employee.teamId);

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
        updateData.employeeId = empIdNum;
      }

      // Sauvegarder la demande mise à jour
      const updatedVacationRequest = await prisma.vacationRequest.update({
        where: { id: idNum },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              companyId: true,
              teamId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePicture: true
                }
              }
            }
          },
          reviewedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Déterminer les permissions de l'utilisateur sur cette demande
      const isOwnRequestUpdate = await prisma.employee.findFirst({
        where: {
          id: updatedVacationRequest.employeeId,
          userId: user.id
        }
      });

      const requestWithPermissions = {
        ...updatedVacationRequest,
        permissions: {
          canEdit: ["admin", "directeur", "manager"].includes(user.role),
          canDelete:
            ["admin", "directeur", "manager"].includes(user.role) ||
            (isOwnRequestUpdate !== null &&
              updatedVacationRequest.status === "pending"),
        },
      };

      return res.status(200).json({
        success: true,
        message: "Demande de congé mise à jour avec succès",
        data: requestWithPermissions,
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la demande:", error);

      // Gérer les erreurs de validation Prisma
      if (error.code === 'P2002' || error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: "Erreur de validation: " + error.message,
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

      // Valider l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID de demande invalide",
          status: 400,
        });
      }

      // Récupérer la demande existante
      const vacationRequest = await prisma.vacationRequest.findUnique({
        where: { id: idNum },
      });

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
        await prisma.vacationRequest.delete({
          where: { id: idNum }
        });

        return res.status(200).json({
          success: true,
          message: "Demande de congés supprimée avec succès",
        });
      }

      // Restriction pour les employés : seulement leurs demandes en statut 'pending'
      if (user.role === "employé") {
        const isOwnRequestDelete = await prisma.employee.findFirst({
          where: {
            id: vacationRequest.employeeId,
            userId: user.id
          }
        });

        if (isOwnRequestDelete === null || vacationRequest.status !== "pending") {
          return res.status(403).json({
            success: false,
            message:
              "Vous ne pouvez supprimer que vos propres demandes en attente",
            status: 403,
          });
        }
      }

      // Supprimer la demande
      await prisma.vacationRequest.delete({
        where: { id: idNum }
      });

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

/**
 * @route   PATCH /api/vacations/:id/approve
 * @desc    Approuver une demande de congés
 * @access  Privé (admin, directeur, manager)
 */
router.patch(
  "/:id/approve",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const user = req.user;

      // Valider l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID de demande invalide",
          status: 400,
        });
      }

      // Vérifier les permissions (seuls admin, directeur, manager peuvent approuver)
      if (!["admin", "directeur", "manager"].includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les droits pour approuver cette demande",
          status: 403,
        });
      }

      // Récupérer la demande existante
      const vacationRequest = await prisma.vacationRequest.findUnique({
        where: { id: idNum },
      });

      if (!vacationRequest) {
        return res.status(404).json({
          success: false,
          message: "Demande de congés non trouvée",
          status: 404,
        });
      }

      // Vérifier si l'utilisateur a les droits d'accès à cette demande
      const hasAccess = await hasAccessToVacationRequest(user, vacationRequest);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les droits pour approuver cette demande",
          status: 403,
        });
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        status: VacationRequestStatus.APPROVED,
        reviewedById: user.id,
        reviewedAt: new Date(),
      };

      if (comment) {
        updateData.reviewNote = comment;
      }

      // Mettre à jour la demande
      const updatedRequest = await prisma.vacationRequest.update({
        where: { id: idNum },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              companyId: true,
              teamId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePicture: true
                }
              }
            }
          },
          reviewedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: "Demande de congés approuvée avec succès",
        data: updatedRequest,
      });
    } catch (error) {
      console.error("Erreur lors de l'approbation de la demande:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'approbation de la demande",
        status: 500,
      });
    }
  }
);

/**
 * @route   PATCH /api/vacations/:id/reject
 * @desc    Rejeter une demande de congés
 * @access  Privé (admin, directeur, manager)
 */
router.patch(
  "/:id/reject",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const user = req.user;

      // Valider l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID de demande invalide",
          status: 400,
        });
      }

      // Vérifier les permissions (seuls admin, directeur, manager peuvent rejeter)
      if (!["admin", "directeur", "manager"].includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les droits pour rejeter cette demande",
          status: 403,
        });
      }

      // Récupérer la demande existante
      const vacationRequest = await prisma.vacationRequest.findUnique({
        where: { id: idNum },
      });

      if (!vacationRequest) {
        return res.status(404).json({
          success: false,
          message: "Demande de congés non trouvée",
          status: 404,
        });
      }

      // Vérifier si l'utilisateur a les droits d'accès à cette demande
      const hasAccess = await hasAccessToVacationRequest(user, vacationRequest);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les droits pour rejeter cette demande",
          status: 403,
        });
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        status: VacationRequestStatus.REJECTED,
        reviewedById: user.id,
        reviewedAt: new Date(),
      };

      if (comment) {
        updateData.reviewNote = comment;
      }

      // Mettre à jour la demande
      const updatedRequest = await prisma.vacationRequest.update({
        where: { id: idNum },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              companyId: true,
              teamId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePicture: true
                }
              }
            }
          },
          reviewedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: "Demande de congés rejetée avec succès",
        data: updatedRequest,
      });
    } catch (error) {
      console.error("Erreur lors du rejet de la demande:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors du rejet de la demande",
        status: 500,
      });
    }
  }
);

export default router;
