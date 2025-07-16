/**
 * Routes pour la gestion du profil utilisateur
 * Ces routes permettent aux utilisateurs de gérer leur propre profil
 * sans vérification de rôle (uniquement authentification)
 */
import { Response, Router } from "express";
import User from "../models/User.model";
import authMiddleware, { AuthRequest } from "../middlewares/auth.middleware";
import { notifyProfileUpdate } from "../services/userSyncService";

// Initialisation du routeur
const router = Router();

/**
 * @route PUT /api/profile/update
 * @desc Met à jour le profil de l'utilisateur connecté sans vérification de rôle
 * @access Authentifié uniquement
 */
router.put("/update", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    console.log(
      "🔍 Tentative de mise à jour du profil utilisateur (route profile)"
    );
    console.log("🔍 Headers:", req.headers);
    console.log("🔍 Body de la requête:", req.body);
    console.log("🔍 Utilisateur authentifié:", req.user);

    // L'utilisateur est déjà vérifié par le middleware authMiddleware
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
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

    // Vérifier si le profil est maintenant complet et mettre à jour profileCompleted
    if (updatedUser.firstName && updatedUser.lastName && updatedUser.email && updatedUser.photoUrl) {
      updatedUser.profileCompleted = true;
      await updatedUser.save();
      console.log("✅ Profil marqué comme complet pour l'utilisateur:", userId);
    }

    // Notifier la mise à jour du profil pour synchronisation
    const changes = { firstName, lastName, email, photoUrl };
    notifyProfileUpdate(userId, userId, changes);

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
        profileCompleted: updatedUser.profileCompleted,
      },
    });
  } catch (error: any) {
    console.error("❌ Erreur lors de la mise à jour du profil:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour du profil",
    });
  }
});

export default router;
