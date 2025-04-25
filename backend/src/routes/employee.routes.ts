/**
 * Routes pour la gestion des employés
 *
 * Ces routes permettent de gérer les employés de l'application :
 * - Lister tous les employés actifs
 */

import express, { Request, Response } from "express";
import authenticateToken from "../middlewares/auth.middleware";
import { EmployeeModel } from "../models/Employee.model";

const router = express.Router();

/**
 * Route GET /api/employees
 * Liste tous les employés actifs, triés par nom puis prénom
 * Retourne uniquement les champs _id, firstName et lastName
 */
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    // 👨‍💼 Récupération des employés actifs uniquement
    const employees = await EmployeeModel.find(
      { status: "actif" }, // Filtre sur le statut actif
      "_id firstName lastName" // Projection pour limiter les champs retournés
    )
      .sort({ lastName: 1, firstName: 1 }) // Tri par nom puis prénom
      .lean(); // Optimisation de la performance en retournant des objets JavaScript simples

    // ✅ Réponse avec les employés et succès
    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    // ❌ Gestion des erreurs
    console.error("Erreur lors de la récupération des employés:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des employés",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
