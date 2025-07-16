/**
 * Utilitaire pour tester l'authentification côté serveur
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.model';

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
      _id: user._id,
      email: user.email,
      role: user.role
    });
    
    // Vérifier si l'utilisateur existe en base
    const dbUser = await User.findById(user.id || user._id);
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
      id: user._id,
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
    
    const user = await User.findById(userId);
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