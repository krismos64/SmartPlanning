/**
 * Routes pour la gestion du profil utilisateur
 * Ces routes permettent aux utilisateurs de gérer leur propre profil
 * sans vérification de rôle (uniquement authentification)
 */
import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.model";

// Initialisation du routeur
const router = Router();

/**
 * @route PUT /api/profile/update
 * @desc Met à jour le profil de l'utilisateur connecté sans vérification de rôle
 * @access Authentifié uniquement
 */
router.put("/update", async (req: Request, res: Response) => {
  try {
    console.log(
      "🔍 Tentative de mise à jour du profil utilisateur (route profile)"
    );
    console.log("🔍 Headers:", req.headers);
    console.log("🔍 Body de la requête:", req.body);

    // Extraire le token d'autorisation
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Autorisation requise",
      });
    }

    // Extraire et vérifier le token
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      console.log("🔍 Token décodé:", decoded);

      // Récupérer l'ID de l'utilisateur depuis le token décodé
      const userId = (decoded as any).user?.id || (decoded as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Token invalide - ID utilisateur manquant",
        });
      }

      // Extraire uniquement les champs modifiables
      const { firstName, lastName, email, photoUrl } = req.body;

      // Mettre à jour les informations de l'utilisateur
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
            ...(email !== undefined && { email }),
            ...(photoUrl !== undefined && { photoUrl }),
          },
        },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Retourner les données de l'utilisateur mis à jour
      return res.status(200).json({
        success: true,
        data: {
          _id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          photoUrl: updatedUser.photoUrl,
          role: updatedUser.role,
        },
      });
    } catch (tokenError) {
      console.error("❌ Erreur lors de la vérification du token:", tokenError);
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré",
      });
    }
  } catch (error: any) {
    console.error("❌ Erreur lors de la mise à jour du profil:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour du profil",
    });
  }
});

export default router;
