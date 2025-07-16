/**
 * Debug pour la boucle infinie et la perte de token
 */

import axiosInstance from "../api/axiosInstance";

/**
 * Analyse le problème de boucle infinie et perte de token
 */
export const debugInfiniteLoop = async () => {
  console.log(`
🔄 DEBUG BOUCLE INFINIE ET PERTE DE TOKEN
================================================================

PROBLÈMES OBSERVÉS:
- Boucle infinie dans ProfileChecker
- Token JWT disparu des cookies
- GET /auth/me retourne 401

ANALYSE EN COURS...
================================================================
  `);

  // 1. Vérifier l'état des cookies
  console.log("1️⃣ Vérification des cookies...");
  const cookies = document.cookie;
  console.log("🍪 Cookies actuels:", cookies);
  
  const tokenMatch = cookies.match(/token=([^;]+)/);
  const hasToken = !!tokenMatch;
  
  console.log("🔑 Token JWT:", {
    present: hasToken,
    value: tokenMatch ? tokenMatch[1].substring(0, 50) + "..." : "NON TROUVÉ"
  });

  // 2. Vérifier l'état du localStorage
  console.log("\n2️⃣ Vérification du localStorage...");
  const localStorageKeys = Object.keys(localStorage);
  console.log("💾 Keys localStorage:", localStorageKeys);
  
  // 3. Tester l'authentification
  console.log("\n3️⃣ Test d'authentification...");
  try {
    const authResponse = await axiosInstance.get("/auth/me");
    console.log("✅ /auth/me:", authResponse.data);
  } catch (error) {
    console.log("❌ /auth/me failed:", error.response?.status, error.response?.data);
  }

  // 4. Vérifier l'état du contexte d'authentification
  console.log("\n4️⃣ Vérification du contexte d'authentification...");
  
  // Accès au contexte depuis la console
  const authContext = (window as any).authContext;
  if (authContext) {
    console.log("🔍 État du contexte:", {
      isAuthenticated: authContext.isAuthenticated,
      loading: authContext.loading,
      hasUser: !!authContext.user,
      shouldCompleteProfile: authContext.shouldCompleteProfile
    });
  } else {
    console.log("❌ Contexte d'authentification non accessible");
  }

  // 5. Recommandations
  console.log(`
🔧 RECOMMANDATIONS:
================================================================

SI TOKEN MANQUANT:
- Vérifier si l'utilisateur doit se reconnecter
- Vérifier la configuration des cookies (sameSite, secure, etc.)
- Vérifier l'expiration du token

SI BOUCLE INFINIE:
- Vérifier les dépendances useEffect dans ProfileChecker
- Vérifier si shouldCompleteProfile change constamment
- Vérifier les re-rendus dans AuthContext

SOLUTIONS POSSIBLES:
1. Forcer une reconnexion: window.location.href = "/connexion"
2. Vider les cookies: document.cookie = "token=; Max-Age=0"
3. Vider le localStorage: localStorage.clear()

================================================================
  `);

  return {
    hasToken,
    cookies,
    localStorageKeys,
    timestamp: new Date().toISOString()
  };
};

/**
 * Force une reconnexion en supprimant tous les cookies et localStorage
 */
export const forceReconnection = () => {
  console.log("🔄 Forçage de la reconnexion...");
  
  // Supprimer tous les cookies
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });
  
  // Vider le localStorage
  localStorage.clear();
  
  // Rediriger vers la page de connexion
  window.location.href = "/connexion";
};

// Exposer pour utilisation dans la console
(window as any).debugInfiniteLoop = debugInfiniteLoop;
(window as any).forceReconnection = forceReconnection;

console.log(`
🔄 FONCTIONS DE DEBUG DISPONIBLES
================================================================

Pour analyser le problème:
debugInfiniteLoop()

Pour forcer une reconnexion:
forceReconnection()

================================================================
`);