/**
 * Route pour obtenir les employés accessibles - SmartPlanning
 *
 * MIGRATION POSTGRESQL: Migré de Mongoose vers Prisma ORM
 *
 * Permet de récupérer les employés accessibles selon le rôle de l'utilisateur:
 * - Admin: Tous les employés
 * - Directeur: Employés de son entreprise
 * - Manager: Employés de son entreprise (simplifié en PostgreSQL)
 * - Employé: Accès refusé (403)
 */

import { Response, Router } from "express";
import {
  AuthRequest,
  authenticateToken,
} from "../../middlewares/auth.middleware";
import prisma from "../../config/prisma";

// Création du routeur Express
const router = Router();

/**
 * @route   GET /api/employees/accessible
 * @desc    Récupère les employés accessibles selon le rôle de l'utilisateur
 * @access  Privé (admin, directeur, manager)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // Normaliser le rôle
    const normalizedRole = user.role ? user.role.toLowerCase() : "";

    // Vérifier le rôle
    const isEmployee =
      normalizedRole === "employé" ||
      normalizedRole === "employee" ||
      normalizedRole === "employe";

    const isAdmin =
      normalizedRole === "admin" || normalizedRole === "administrator";

    const isDirector =
      normalizedRole === "directeur" || normalizedRole === "director";

    const isManager =
      normalizedRole === "manager" || normalizedRole === "gestionnaire";

    // Vérifier si l'utilisateur est employé (accès refusé)
    if (isEmployee) {
      return res.status(403).json({
        success: false,
        message:
          "Accès refusé. Vous n'avez pas les droits nécessaires pour accéder à cette ressource.",
      });
    }

    console.log("User role:", user.role);
    console.log("User normalized role:", normalizedRole);
    console.log("User companyId:", user.companyId);

    // Définir le filtre Prisma en fonction du rôle
    let whereClause: any = {};

    if (isAdmin) {
      // Admin: accès à tous les employés
      whereClause = {};
      console.log("Admin query: All employees");
    } else if ((isDirector || isManager) && user.companyId) {
      // Directeur/Manager: accès aux employés de son entreprise
      // Note: En PostgreSQL, on simplifie pour tous les employés de l'entreprise
      whereClause = { companyId: user.companyId };
      console.log("Director/Manager query: Company employees", whereClause);
    } else {
      // Fallback: utilisateur sans rôle reconnu ou sans entreprise
      console.log("Fallback: No valid role or companyId");
      return res.status(403).json({
        success: false,
        message: "Rôle ou configuration utilisateur invalide",
      });
    }

    // Récupérer les employés selon le filtre
    const employees = await prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        position: true,
        skills: true,
        isActive: true,
        teamId: true,
        companyId: true,
        userId: true,
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profilePicture: true,
          }
        }
      },
      orderBy: { user: { lastName: 'asc' } }
    });

    // Filtrer pour exclure l'utilisateur actuel si c'est aussi un employé
    const currentUserEmployee = await prisma.employee.findFirst({
      where: { userId: user.id },
      select: { id: true }
    });

    const filteredEmployees = employees.filter(
      (emp) => !currentUserEmployee || emp.id !== currentUserEmployee.id
    );

    console.log(
      `Employés trouvés: ${employees.length}, après filtrage: ${filteredEmployees.length}`
    );

    // Formater la réponse pour compatibilité frontend
    const formattedEmployees = filteredEmployees.map((emp) => ({
      _id: emp.id, // Compatibilité MongoDB frontend
      id: emp.id,
      firstName: emp.user.firstName,
      lastName: emp.user.lastName,
      email: emp.user.email || "",
      position: emp.position,
      skills: emp.skills,
      role: emp.user.role || "employee",
      teamId: emp.team || null,
      photoUrl: emp.user.profilePicture || "",
      profilePicture: emp.user.profilePicture || "",
      userId: emp.userId || null,
      status: emp.isActive ? "actif" : "inactif",
      isActive: emp.isActive,
      companyId: emp.companyId,
    }));

    return res.status(200).json({
      success: true,
      data: formattedEmployees,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des employés accessibles:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des employés accessibles.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
