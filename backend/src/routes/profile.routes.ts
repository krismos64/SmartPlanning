/**
 * Routes pour la gestion du profil utilisateur
 * Ces routes permettent aux utilisateurs de gérer leur propre profil
 * sans vérification de rôle (uniquement authentification)
 */
import { Response, Router } from "express";
import prisma from "../config/prisma";
import authMiddleware, { AuthRequest } from "../middlewares/auth.middleware";
import { notifyProfileUpdate } from "../services/userSyncService";

// Initialisation du routeur
const router = Router();

/**
 * @route GET /api/profile
 * @desc Récupère le profil de l'utilisateur connecté
 * @access Authentifié uniquement
 */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
      });
    }

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profilePicture: true,
        role: true,
        companyId: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        companyId: user.companyId,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération du profil:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération du profil",
    });
  }
});

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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
      });
    }

    // Extraire uniquement les champs modifiables
    const { firstName, lastName, email, photoUrl } = req.body;

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (photoUrl !== undefined) updateData.profilePicture = photoUrl;

    // Mettre à jour les informations de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userIdNum },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profilePicture: true,
        role: true,
      },
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Notifier la mise à jour du profil pour synchronisation
    const changes = { firstName, lastName, email, photoUrl };
    notifyProfileUpdate(userId, userId, changes);

    // Retourner les données de l'utilisateur mis à jour
    return res.status(200).json({
      success: true,
      data: {
        _id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        photoUrl: updatedUser.profilePicture,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
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
