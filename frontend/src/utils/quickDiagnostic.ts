/**
 * Diagnostic rapide pour identifier le problème de synchronisation
 */

import axiosInstance from "../api/axiosInstance";

/**
 * Diagnostic express pour la synchronisation inter-utilisateur
 */
export const quickDiagnostic = async () => {
  console.log(`
🚀 DIAGNOSTIC RAPIDE - SYNCHRONISATION INTER-UTILISATEUR
================================================================

1. Vérification de base...
  `);

  const results = {
    auth: false,
    userInfo: null,
    syncActive: false,
    polling: false,
    endpoints: {
      authMe: false,
      usersPhoto: false
    }
  };

  try {
    // 1. Test d'authentification
    const authResponse = await axiosInstance.get("/auth/me");
    results.auth = authResponse.data.success;
    results.userInfo = authResponse.data.data;

    console.log("✅ Authentification:", results.auth ? "OK" : "ÉCHEC");
    if (results.auth) {
      console.log("👤 Utilisateur:", `${results.userInfo.firstName} ${results.userInfo.lastName} (${results.userInfo.role})`);
      console.log("📸 Photo actuelle:", results.userInfo.photoUrl);
    }

    // 2. Vérification de la synchronisation
    const syncStatus = (window as any).getSyncStatus?.();
    results.syncActive = !!syncStatus;
    
    console.log("🔄 Synchronisation active:", results.syncActive ? "OUI" : "NON");
    if (syncStatus) {
      console.log("⏱️ Intervalle:", syncStatus.interval + "ms");
    }

    // 3. Test de l'endpoint de mise à jour photo
    console.log("\n2. Test de l'endpoint de mise à jour photo...");
    
    const testFile = new File([new Blob(['test'])], 'test.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', testFile);
    
    try {
      const photoResponse = await axiosInstance.put(`/users/${results.userInfo._id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      results.endpoints.usersPhoto = photoResponse.data.success;
      console.log("📸 Endpoint photo:", results.endpoints.usersPhoto ? "OK" : "ÉCHEC");
      
      if (results.endpoints.usersPhoto) {
        console.log("🔗 Nouvelle photo URL:", photoResponse.data.photoUrl);
      }
    } catch (error) {
      console.log("❌ Erreur endpoint photo:", error.message);
    }

    // 4. Instructions pour le test inter-utilisateur
    console.log(`
📋 RÉSOLUTION DU PROBLÈME DE SYNCHRONISATION
================================================================

VOTRE SITUATION:
- Utilisateur: ${results.userInfo.firstName} ${results.userInfo.lastName}
- Rôle: ${results.userInfo.role}
- Photo: ${results.userInfo.photoUrl}
- Sync active: ${results.syncActive ? 'OUI' : 'NON'}

SOLUTION RECOMMANDÉE:

1. POUR TESTER LA SYNCHRONISATION DIRECTRICE → EMPLOYÉ:

   A. Préparer le test:
      - Ouvrir Firefox: Se connecter comme directrice
      - Ouvrir Chrome: Se connecter comme employé
      - Dans Chrome (employé): Ouvrir console et taper: monitorPhotoChanges(120)

   B. Effectuer le test:
      - Dans Firefox (directrice): Modifier la photo de l'employé
      - Dans Chrome (employé): Surveiller les logs pendant 2 minutes
      - Rechercher: "🔄 CHANGEMENT DE PHOTO DÉTECTÉ!"

   C. Vérifications:
      - Si changement détecté: ✅ Synchronisation fonctionne
      - Si pas de changement: ❌ Problème d'environnement local

2. SOLUTION ALTERNATIVE:
   - Utiliser deux onglets incognito du même navigateur
   - Ou tester directement sur un serveur de développement

3. COMMANDES UTILES:
   - testCrossUserSync() : Test complet inter-utilisateur
   - monitorPhotoChanges(60) : Surveiller les changements
   - getSyncStatus() : Vérifier l'état de la synchronisation

DIAGNOSTIC TECHNIQUE:
${results.syncActive ? '✅' : '❌'} Système de synchronisation
${results.endpoints.usersPhoto ? '✅' : '❌'} Endpoint de mise à jour photo
${results.auth ? '✅' : '❌'} Authentification

${results.syncActive && results.endpoints.usersPhoto && results.auth ? 
  '🎉 TOUT FONCTIONNE - Le problème vient probablement de l\'environnement local' : 
  '⚠️ PROBLÈME DÉTECTÉ - Vérifiez les éléments marqués ❌'}

================================================================
    `);

    return results;

  } catch (error) {
    console.error("❌ Erreur lors du diagnostic:", error);
    return { ...results, error: error.message };
  }
};

// Exposer la fonction pour utilisation rapide
(window as any).quickDiagnostic = quickDiagnostic;

console.log(`
🚀 DIAGNOSTIC RAPIDE DISPONIBLE
================================================================

Pour un diagnostic rapide du problème:
quickDiagnostic()

================================================================
`);