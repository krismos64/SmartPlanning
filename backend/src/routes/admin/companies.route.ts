import express, { Request, Response } from "express";
import prisma from "../../config/prisma";

const router = express.Router();

/**
 * @route GET /
 * @desc Récupérer toutes les entreprises
 * @access Admin
 */
router.get(
  "/",
  async (req: Request, res: Response) => {
    try {
      const companies = await prisma.company.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      res.status(200).json({
        success: true,
        data: companies,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des entreprises:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des entreprises.",
      });
    }
  }
);

/**
 * @route POST /
 * @desc Créer une nouvelle entreprise
 * @access Admin
 */
router.post(
  "/",
  async (req: Request, res: Response) => {
    try {
      const { name, logoUrl } = req.body;
      const newCompany = await prisma.company.create({
        data: {
          name,
          logo: logoUrl, // Note: Le champ est 'logo' dans Prisma, pas 'logoUrl'
        }
      });

      res.status(201).json({
        success: true,
        data: newCompany,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de l'entreprise",
        error,
      });
    }
  }
);

/**
 * @route PUT /:id
 * @desc Mettre à jour une entreprise existante
 * @access Admin
 */
router.put(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, logoUrl } = req.body;

      // Validation de l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      const updatedCompany = await prisma.company.update({
        where: { id: idNum },
        data: {
          name,
          logo: logoUrl,
        }
      });

      res.status(200).json({
        success: true,
        data: updatedCompany,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Entreprise non trouvée",
        });
      }
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de l'entreprise",
        error,
      });
    }
  }
);

/**
 * @route DELETE /:id
 * @desc Supprimer une entreprise
 * @access Admin
 */
router.delete(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Validation de l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      const deletedCompany = await prisma.company.delete({
        where: { id: idNum }
      });

      res.status(200).json({
        success: true,
        message: "Entreprise supprimée avec succès",
        data: deletedCompany,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Entreprise non trouvée",
        });
      }
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de l'entreprise",
        error,
      });
    }
  }
);

/**
 * @route GET /:id
 * @desc Récupérer une entreprise par ID
 * @access Admin
 */
router.get(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Validation de l'ID
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({
          success: false,
          message: "ID d'entreprise invalide",
        });
      }

      const company = await prisma.company.findUnique({
        where: { id: idNum }
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Entreprise non trouvée",
        });
      }

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de l'entreprise",
        error,
      });
    }
  }
);

export const adminCompaniesRouter = router;
