import express, { Request, Response } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware";
import checkRole from "../../middlewares/checkRole.middleware";
import { Company } from "../../models/Company.model";

const router = express.Router();

/**
 * @route GET /
 * @desc Récupérer toutes les entreprises
 * @access Admin
 */
router.get(
  "/",
  authenticateToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const companies = await Company.find();
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
  authenticateToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { name, logoUrl } = req.body;
      const newCompany = new Company({
        name,
        logoUrl,
      });

      const savedCompany = await newCompany.save();
      res.status(201).json({
        success: true,
        data: savedCompany,
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
  authenticateToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, logoUrl } = req.body;

      const updatedCompany = await Company.findByIdAndUpdate(
        id,
        { name, logoUrl },
        { new: true, runValidators: true }
      );

      if (!updatedCompany) {
        return res.status(404).json({
          success: false,
          message: "Entreprise non trouvée",
        });
      }

      res.status(200).json({
        success: true,
        data: updatedCompany,
      });
    } catch (error) {
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
  authenticateToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deletedCompany = await Company.findByIdAndDelete(id);

      if (!deletedCompany) {
        return res.status(404).json({
          success: false,
          message: "Entreprise non trouvée",
        });
      }

      res.status(200).json({
        success: true,
        message: "Entreprise supprimée avec succès",
        data: deletedCompany,
      });
    } catch (error) {
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
  authenticateToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const company = await Company.findById(id);

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
