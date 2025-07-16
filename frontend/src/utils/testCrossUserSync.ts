/**
 * Test spécialisé pour la synchronisation inter-utilisateur
 */

import axiosInstance from "../api/axiosInstance";

/**
 * Teste la synchronisation lorsqu'un autre utilisateur modifie votre profil
 */
export const testCrossUserSync = async () => {
  console.log(`
🔄 TEST DE SYNCHRONISATION INTER-UTILISATEUR
================================================================

PROBLÈME RAPPORTÉ:
- Directrice met à jour la photo d'un employé
- Photo mise à jour dans l'espace directrice
- Photo PAS mise à jour dans l'espace employé
- Suspicion: problème en environnement local

DIAGNOSTIC EN COURS...
================================================================
  `);

  try {
    // 1. Identifier l'utilisateur actuel
    console.log("1️⃣ Identification de l'utilisateur actuel...");
    const userResponse = await axiosInstance.get("/auth/me");
    
    if (!userResponse.data.success) {
      console.log("❌ Utilisateur non authentifié");
      return;
    }

    const currentUser = userResponse.data.data;
    console.log("✅ Utilisateur actuel:", {
      id: currentUser._id,
      name: `${currentUser.firstName} ${currentUser.lastName}`,
      role: currentUser.role,
      photoUrl: currentUser.photoUrl
    });

    // 2. Vérifier l'état de la synchronisation
    console.log("\n2️⃣ Vérification du système de synchronisation...");
    
    const syncStatus = {
      userSyncProvider: !!(window as any).userSyncProvider,
      forceUserRefresh: !!(window as any).forceUserRefresh,
      emitUserSyncEvent: !!(window as any).emitUserSyncEvent,
      intervalActive: !!((window as any).syncIntervalActive)
    };

    console.log("🔍 État de la synchronisation:", syncStatus);

    // 3. Simuler une mise à jour externe
    console.log("\n3️⃣ Simulation d'une mise à jour externe...");
    
    const beforePhoto = currentUser.photoUrl;
    console.log("📸 Photo actuelle:", beforePhoto);
    
    // Attendre 2 secondes et vérifier à nouveau
    console.log("⏱️ Attente de 2 secondes puis vérification...");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const afterResponse = await axiosInstance.get("/auth/me");
    const afterUser = afterResponse.data.data;
    const afterPhoto = afterUser.photoUrl;
    
    console.log("📸 Photo après vérification:", afterPhoto);
    
    if (beforePhoto !== afterPhoto) {
      console.log("✅ Changement détecté! La synchronisation fonctionne");
    } else {
      console.log("ℹ️ Aucun changement détecté (normal si pas de mise à jour externe)");
    }

    // 4. Tester le polling manuel
    console.log("\n4️⃣ Test du polling manuel...");
    
    let pollingCount = 0;
    const maxPolls = 3;
    
    const testPolling = async () => {
      pollingCount++;
      console.log(`📡 Polling ${pollingCount}/${maxPolls}...`);
      
      const pollResponse = await axiosInstance.get("/auth/me");
      if (pollResponse.data.success) {
        console.log(`📊 Données reçues (${pollingCount}):`, {
          photoUrl: pollResponse.data.data.photoUrl,
          updatedAt: pollResponse.data.data.updatedAt || 'N/A'
        });
      }
      
      if (pollingCount < maxPolls) {
        setTimeout(testPolling, 3000); // 3 secondes entre chaque poll
      } else {
        console.log("✅ Test de polling terminé");
      }
    };
    
    testPolling();

    // 5. Instructions pour test manuel
    console.log(`
📋 INSTRUCTIONS POUR TEST DE SYNCHRONISATION
================================================================

POUR TESTER EN ENVIRONNEMENT LOCAL:

1. PRÉPARER DEUX SESSIONS:
   - Session A: Ouvrez un navigateur (Chrome) et connectez-vous comme directrice
   - Session B: Ouvrez un autre navigateur (Firefox/Safari) et connectez-vous comme employé

2. DANS LA SESSION A (Directrice):
   - Allez dans la gestion des employés
   - Sélectionnez un employé
   - Modifiez sa photo de profil
   - Vérifiez que la photo est mise à jour dans votre interface

3. DANS LA SESSION B (Employé):
   - Restez sur votre page de profil
   - Ouvrez la console (F12)
   - Surveillez les logs toutes les 10 secondes
   - Recherchez: "🔄 Photo de profil mise à jour détectée"

4. VÉRIFICATIONS:
   - La photo doit se mettre à jour automatiquement dans les 10 secondes
   - Si pas de mise à jour automatique, rafraîchissez la page (F5)
   - La nouvelle photo doit apparaître après rafraîchissement

5. SI LE PROBLÈME PERSISTE:
   - Vérifiez les logs réseau (onglet Network)
   - Recherchez les requêtes GET /api/auth/me
   - Vérifiez si la photoUrl change dans les réponses

6. FONCTIONS DE DEBUG:
   - testCrossUserSync() : Ce test
   - forceUserRefresh() : Force un rafraîchissement
   - testUserSync() : Test complet de synchronisation

LIMITATIONS EN ENVIRONNEMENT LOCAL:
================================================================
- Les cookies httpOnly peuvent avoir des limitations cross-browser
- La synchronisation localStorage ne fonctionne qu'entre onglets du même navigateur
- Pour un test complet, utilisez deux navigateurs différents

SOLUTION ALTERNATIVE:
- Testez avec deux onglets incognito du même navigateur
- Ou testez directement en production où les cookies sont partagés

================================================================
    `);

    return {
      success: true,
      currentUser,
      syncStatus,
      message: "Test de synchronisation terminé - suivez les instructions pour test manuel"
    };

  } catch (error) {
    console.error("❌ Erreur durant le test de synchronisation:", error);
    return {
      success: false,
      error: error.message || "Erreur inconnue"
    };
  }
};

/**
 * Surveille les changements de photo pendant une durée déterminée
 */
export const monitorPhotoChanges = async (durationSeconds: number = 60) => {
  console.log(`📸 MONITORING DES CHANGEMENTS DE PHOTO (${durationSeconds}s)...`);
  
  const startTime = Date.now();
  let lastPhotoUrl = '';
  
  // Obtenir la photo initiale
  try {
    const initialResponse = await axiosInstance.get("/auth/me");
    lastPhotoUrl = initialResponse.data.data.photoUrl;
    console.log("📸 Photo initiale:", lastPhotoUrl);
  } catch (error) {
    console.error("❌ Erreur lors de l'obtention de la photo initiale:", error);
    return;
  }
  
  const checkInterval = setInterval(async () => {
    try {
      const response = await axiosInstance.get("/auth/me");
      const currentPhotoUrl = response.data.data.photoUrl;
      
      if (currentPhotoUrl !== lastPhotoUrl) {
        console.log("🔄 CHANGEMENT DE PHOTO DÉTECTÉ!", {
          ancienne: lastPhotoUrl,
          nouvelle: currentPhotoUrl,
          timestamp: new Date().toLocaleTimeString()
        });
        lastPhotoUrl = currentPhotoUrl;
      }
      
      // Vérifier si la durée est écoulée
      if (Date.now() - startTime > durationSeconds * 1000) {
        clearInterval(checkInterval);
        console.log("⏱️ Monitoring terminé");
      }
      
    } catch (error) {
      console.error("❌ Erreur lors du monitoring:", error);
      clearInterval(checkInterval);
    }
  }, 2000); // Vérifier toutes les 2 secondes
  
  return checkInterval;
};

// Exposer les fonctions pour utilisation dans la console
(window as any).testCrossUserSync = testCrossUserSync;
(window as any).monitorPhotoChanges = monitorPhotoChanges;

console.log(`
🔄 FONCTIONS DE TEST INTER-UTILISATEUR DISPONIBLES
================================================================

Pour tester la synchronisation inter-utilisateur:
testCrossUserSync()

Pour surveiller les changements de photo:
monitorPhotoChanges(60) // surveille pendant 60 secondes

================================================================
`);