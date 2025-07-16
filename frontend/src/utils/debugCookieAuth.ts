/**
 * Debugging des cookies JWT pour comprendre le problème d'authentification
 */

import axiosInstance from "../api/axiosInstance";

/**
 * Vérifie l'état des cookies et l'authentification
 */
export const debugCookieAuth = async () => {
  console.log(`
🍪 DEBUG COOKIES ET AUTHENTIFICATION
================================================================

DIAGNOSTIC DU PROBLÈME:
- Photo mise à jour : SUCCESS (200)
- /api/auth/me après : FAIL (401)
- Suspicion: Cookie JWT corrompu ou perdu

TESTS EN COURS...
================================================================
  `);

  try {
    // 1. Vérifier les cookies actuels
    console.log("1️⃣ Vérification des cookies...");
    const cookies = document.cookie;
    console.log("🍪 Cookies actuels:", cookies);
    
    // Chercher spécifiquement le token JWT
    const tokenMatch = cookies.match(/token=([^;]+)/);
    const hasToken = !!tokenMatch;
    const tokenValue = tokenMatch ? tokenMatch[1] : null;
    
    console.log("🔑 Token JWT:", {
      present: hasToken,
      length: tokenValue?.length,
      preview: tokenValue?.substring(0, 50) + "..."
    });

    // 2. Tester l'authentification AVANT mise à jour
    console.log("\n2️⃣ Test d'authentification AVANT mise à jour...");
    const beforeAuth = await axiosInstance.get("/auth/me");
    console.log("✅ Auth AVANT:", beforeAuth.data.success ? "SUCCESS" : "FAIL");
    
    if (!beforeAuth.data.success) {
      console.log("❌ Déjà un problème d'authentification");
      return { success: false, error: "Problème d'authentification initial" };
    }

    const user = beforeAuth.data.data;
    console.log("👤 Utilisateur avant:", user.firstName, user.lastName);

    // 3. Mise à jour de photo
    console.log("\n3️⃣ Mise à jour de photo...");
    const testBlob = new Blob(['debug-cookie-test'], { type: 'image/png' });
    const testFile = new File([testBlob], 'debug-cookie.png', { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('file', testFile);

    // Vérifier les cookies juste AVANT la requête
    console.log("🍪 Cookies AVANT requête photo:", document.cookie);

    const photoResponse = await axiosInstance.put(`/users/${user._id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log("📸 Photo update:", photoResponse.data.success ? "SUCCESS" : "FAIL");

    // Vérifier les cookies juste APRÈS la requête
    console.log("🍪 Cookies APRÈS requête photo:", document.cookie);

    // 4. Test de l'endpoint de debug auth
    console.log("\n4️⃣ Test de l'endpoint de debug auth...");
    try {
      const debugAuth = await axiosInstance.post("/users/debug-auth");
      console.log("🔍 Debug auth endpoint:", debugAuth.data);
    } catch (debugError) {
      console.log("❌ Debug auth endpoint failed:", debugError.response?.status);
    }

    // 5. Tester l'authentification APRÈS mise à jour
    console.log("\n5️⃣ Test d'authentification APRÈS mise à jour...");
    
    // Petit délai pour simuler les conditions réelles
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterAuth = await axiosInstance.get("/auth/me");
    console.log("🔍 Auth APRÈS:", afterAuth.data.success ? "SUCCESS" : "FAIL");

    if (afterAuth.data.success) {
      console.log("✅ PROBLÈME RÉSOLU: Authentification maintenue");
      return { 
        success: true, 
        message: "Authentification maintenue après mise à jour photo",
        tokenPersistent: true
      };
    } else {
      console.log("❌ PROBLÈME CONFIRMÉ: Authentification échouée");
      
      // Vérifier si le cookie est encore présent
      const cookiesAfter = document.cookie;
      const tokenAfter = cookiesAfter.match(/token=([^;]+)/);
      
      console.log("🔍 Analyse post-erreur:", {
        cookiesAfter: cookiesAfter,
        tokenStillPresent: !!tokenAfter,
        tokenChanged: tokenAfter?.[1] !== tokenValue
      });
      
      return { 
        success: false, 
        error: "Authentification échouée après mise à jour photo",
        tokenPersistent: !!tokenAfter,
        tokenChanged: tokenAfter?.[1] !== tokenValue
      };
    }

  } catch (error) {
    console.error("❌ Erreur durant le debug:", error);
    
    // Analyser l'erreur
    if (error.response?.status === 401) {
      console.log("🔍 Erreur 401 détectée:", error.response.data);
      return { 
        success: false, 
        error: "Erreur 401",
        stage: "Photo update ou auth check"
      };
    }
    
    return { 
      success: false, 
      error: error.message || "Erreur inconnue"
    };
  }
};

// Exposer pour utilisation dans la console
(window as any).debugCookieAuth = debugCookieAuth;

console.log(`
🍪 DEBUG COOKIES ET AUTHENTIFICATION DISPONIBLE
================================================================

Pour diagnostiquer le problème de cookies JWT, exécutez:
debugCookieAuth()

Cette fonction analyse:
1. 🍪 État des cookies avant/après
2. 🔑 Présence du token JWT
3. 📸 Mise à jour de photo
4. 🔍 Authentification avant/après

================================================================
`);