/**
 * Utilitaire pour tester l'authentification côté serveur
 * @migration Migré de Mongoose vers Prisma (_id → id, User.findById → prisma.user.findUnique)
 */

import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

/**
 * Teste si un token JWT est valide
 */
export const testJWTToken = async (token: string) => {
  try {
    console.log("🔍 Test du token JWT:", token.substring(0, 50) + "...");

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    console.log("✅ Token JWT valide");

    const user = (decoded as any).user;
    console.log("👤 Utilisateur dans le token:", {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Vérifier si l'utilisateur existe en base (Prisma)
    const userId = typeof user.id === 'number' ? user.id : parseInt(user.id, 10);
    if (isNaN(userId)) {
      console.log("❌ ID utilisateur invalide");
      return { valid: false, error: "ID utilisateur invalide" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (dbUser) {
      console.log("✅ Utilisateur trouvé en base");
      return { valid: true, user: dbUser };
    } else {
      console.log("❌ Utilisateur non trouvé en base");
      return { valid: false, error: "Utilisateur non trouvé" };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.log("❌ Token JWT invalide:", errorMessage);
    return { valid: false, error: errorMessage };
  }
};

/**
 * Génère un token JWT pour un utilisateur
 */
export const generateTestToken = (user: any) => {
  const payload = {
    user: {
      id: user.id, // ✅ Changé de _id à id
      email: user.email,
      role: user.role
    }
  };

  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '24h' });
};

/**
 * Teste l'authentification pour un utilisateur spécifique
 */
export const testAuthForUser = async (userId: string) => {
  try {
    console.log("🔍 Test d'authentification pour utilisateur:", userId);

    // Parse et validation de l'ID (Prisma utilise des nombres)
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      console.log("❌ ID utilisateur invalide");
      return { success: false, error: "ID utilisateur invalide" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdNum }
    });

    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return { success: false, error: "Utilisateur non trouvé" };
    }

    console.log("✅ Utilisateur trouvé:", user.email);

    // Générer un nouveau token
    const newToken = generateTestToken(user);
    console.log("✅ Nouveau token généré");

    // Tester le token
    const testResult = await testJWTToken(newToken);

    return {
      success: testResult.valid,
      user: user,
      token: newToken,
      error: testResult.error
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.log("❌ Erreur test auth:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Fonction pour déboguer un problème d'authentification
export const debugAuthProblem = async (userId: string) => {
  console.log(`
🔍 DEBUG AUTHENTIFICATION SERVEUR
================================================================
Utilisateur: ${userId}
================================================================
  `);

  const result = await testAuthForUser(userId);

  console.log("Résultat:", result);

  return result;
};