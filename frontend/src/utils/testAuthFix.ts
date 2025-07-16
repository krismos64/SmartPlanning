/**
 * Test pour vérifier que la correction de l'authentification fonctionne
 * Résout le problème : req.user.id vs req.user._id dans /api/auth/me
 */

import axiosInstance from "../api/axiosInstance";

/**
 * Test de vérification de la correction d'authentification
 */
export const testAuthenticationFix = async () => {
  console.log(`
🔧 TEST DE CORRECTION D'AUTHENTIFICATION
================================================================

PROBLÈME IDENTIFIÉ:
- L'endpoint /api/auth/me cherchait req.user.id
- Le middleware authenticateToken normalise vers req.user._id
- Incohérence causant des erreurs 401 après mise à jour de photo

CORRECTION APPLIQUÉE:
✅ Changé req.user.id en req.user._id dans /api/auth/me

TESTS EN COURS...
================================================================
  `);

  try {
    // 1. Test d'authentification simple
    console.log("1️⃣ Test d'authentification de base...");
    const authResponse = await axiosInstance.get("/auth/me");
    
    if (authResponse.data.success) {
      console.log("✅ Authentification de base fonctionne");
      console.log("👤 Utilisateur:", authResponse.data.data.firstName, authResponse.data.data.lastName);
    } else {
      console.log("❌ Authentification de base échoue");
      return { success: false, error: "Authentification de base échoue" };
    }

    const user = authResponse.data.data;

    // 2. Test de mise à jour de photo
    console.log("\n2️⃣ Test de mise à jour de photo...");
    const testBlob = new Blob(['test-auth-fix'], { type: 'image/png' });
    const testFile = new File([testBlob], 'test-auth-fix.png', { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('file', testFile);

    const photoResponse = await axiosInstance.put(`/users/${user._id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (photoResponse.data.success) {
      console.log("✅ Mise à jour de photo réussie");
      console.log("📸 Nouvelle URL:", photoResponse.data.photoUrl);
    } else {
      console.log("❌ Mise à jour de photo échoue");
      return { success: false, error: "Mise à jour de photo échoue" };
    }

    // 3. Test critique: vérifier l'authentification après mise à jour
    console.log("\n3️⃣ Test critique: authentification après mise à jour...");
    const postUpdateAuth = await axiosInstance.get("/auth/me");
    
    if (postUpdateAuth.data.success) {
      console.log("✅ SUCCÈS: Authentification maintenue après mise à jour de photo");
      console.log("👤 Utilisateur toujours connecté:", postUpdateAuth.data.data.firstName);
      
      // Vérifier que la photo a été mise à jour
      const photoUpdated = postUpdateAuth.data.data.photoUrl !== user.photoUrl;
      console.log("📸 Photo mise à jour:", photoUpdated ? "✅ OUI" : "❌ NON");
      
      return {
        success: true,
        authMaintained: true,
        photoUpdated: photoUpdated,
        message: "Correction d'authentification réussie - problème résolu !"
      };
    } else {
      console.log("❌ ÉCHEC: Utilisateur toujours déconnecté après mise à jour");
      return { 
        success: false, 
        authMaintained: false,
        error: "Problème d'authentification persiste" 
      };
    }

  } catch (error) {
    console.error("❌ Erreur durant le test:", error);
    
    // Vérifier si c'est un problème 401 spécifique
    if (error.response?.status === 401) {
      console.log("❌ CONFIRMÉ: Problème 401 - authentification échoue");
      return { 
        success: false, 
        error: "Erreur 401 - authentification échoue",
        status: 401
      };
    }
    
    return { 
      success: false, 
      error: error.message || "Erreur inconnue",
      status: error.response?.status
    };
  }
};

// Exposer pour utilisation dans la console
(window as any).testAuthenticationFix = testAuthenticationFix;

console.log(`
🔧 FONCTION DE TEST DE CORRECTION D'AUTHENTIFICATION DISPONIBLE
================================================================

Pour tester la correction, exécutez dans la console:
testAuthenticationFix()

Cette fonction teste:
1. ✅ Authentification de base
2. ✅ Mise à jour de photo
3. ✅ Authentification maintenue après mise à jour

Si le test passe, le problème de déconnexion est résolu !
================================================================
`);