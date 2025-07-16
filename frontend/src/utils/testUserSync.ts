/**
 * Utilitaire pour tester la synchronisation multi-utilisateur
 */

import axiosInstance from "../api/axiosInstance";

/**
 * Teste la synchronisation entre directrice et employé
 */
export const testUserSync = async () => {
  console.log(`
👥 TEST DE SYNCHRONISATION MULTI-UTILISATEUR
================================================================

SCÉNARIO:
- Directrice met à jour la photo d'un employé
- Employé doit voir la mise à jour dans son interface
- Polling toutes les 10 secondes active

TESTS EN COURS...
================================================================
  `);

  try {
    // 1. Vérifier l'état actuel de l'utilisateur
    console.log("1️⃣ Vérification de l'utilisateur actuel...");
    const currentUser = await axiosInstance.get("/auth/me");
    
    if (currentUser.data.success) {
      console.log("✅ Utilisateur actuel:", {
        name: `${currentUser.data.data.firstName} ${currentUser.data.data.lastName}`,
        role: currentUser.data.data.role,
        photoUrl: currentUser.data.data.photoUrl
      });
    } else {
      console.log("❌ Impossible de récupérer l'utilisateur actuel");
      return;
    }

    // 2. Vérifier si la synchronisation est active
    console.log("\n2️⃣ Vérification de la synchronisation...");
    const syncFunctions = {
      forceUserRefresh: !!(window as any).forceUserRefresh,
      emitUserSyncEvent: !!(window as any).emitUserSyncEvent,
      userSyncProvider: !!(window as any).userSyncProvider
    };
    
    console.log("🔍 Fonctions de synchronisation disponibles:", syncFunctions);

    // 3. Tester le rafraîchissement forcé
    console.log("\n3️⃣ Test du rafraîchissement forcé...");
    if ((window as any).forceUserRefresh) {
      console.log("🔄 Déclenchement d'un rafraîchissement forcé...");
      await (window as any).forceUserRefresh();
      console.log("✅ Rafraîchissement forcé terminé");
    } else {
      console.log("❌ Fonction forceUserRefresh non disponible");
    }

    // 4. Simuler un événement de synchronisation
    console.log("\n4️⃣ Test d'émission d'événement de synchronisation...");
    if ((window as any).emitUserSyncEvent) {
      const testEvent = {
        type: 'PHOTO_UPDATED',
        userId: currentUser.data.data._id,
        data: { photoUrl: 'https://test-sync-url.com/photo.jpg' },
        timestamp: Date.now()
      };
      
      console.log("📡 Émission d'un événement de test:", testEvent);
      (window as any).emitUserSyncEvent(testEvent);
      console.log("✅ Événement émis");
    } else {
      console.log("❌ Fonction emitUserSyncEvent non disponible");
    }

    // 5. Instructions pour tester manuellement
    console.log(`
📋 INSTRUCTIONS POUR TEST MANUEL:
================================================================

POUR TESTER LA SYNCHRONISATION DIRECTRICE → EMPLOYÉ:

1. Ouvrez deux navigateurs ou onglets incognito:
   - Navigateur A: Connectez-vous comme directrice
   - Navigateur B: Connectez-vous comme employé

2. Dans le navigateur A (directrice):
   - Allez dans la gestion des employés
   - Changez la photo d'un employé
   - Vérifiez que la photo est mise à jour

3. Dans le navigateur B (employé):
   - Attendez 10 secondes (intervalle de polling)
   - Vérifiez si la photo est mise à jour automatiquement
   - Ou rafraîchissez manuellement la page

4. Vérifiez les logs dans les deux navigateurs:
   - Recherchez "🔄 Photo de profil mise à jour détectée"
   - Recherchez "🔄 Synchronisation utilisateur activée"

FONCTIONS DE DEBUG DISPONIBLES:
- forceUserRefresh() : Force un rafraîchissement
- emitUserSyncEvent(event) : Émet un événement de sync
- debugPhotoUpdateIssue() : Debug complet

================================================================
    `);

    return {
      success: true,
      currentUser: currentUser.data.data,
      syncFunctions,
      message: "Test de synchronisation terminé - vérifiez les instructions"
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
 * Teste si la synchronisation fonctionne pour un utilisateur spécifique
 */
export const testSyncForUser = async (userId: string) => {
  console.log(`👤 Test de synchronisation pour l'utilisateur: ${userId}`);
  
  try {
    // Récupérer les données actuelles
    const currentResponse = await axiosInstance.get("/auth/me");
    const currentUser = currentResponse.data.data;
    
    // Vérifier si c'est l'utilisateur cible
    if (currentUser._id === userId) {
      console.log("✅ Utilisateur cible trouvé, déclenchement de la synchronisation...");
      
      // Forcer un rafraîchissement
      if ((window as any).forceUserRefresh) {
        await (window as any).forceUserRefresh();
        console.log("🔄 Rafraîchissement forcé terminé");
      }
      
      return { success: true, message: "Synchronisation forcée pour l'utilisateur cible" };
    } else {
      console.log("ℹ️ Utilisateur différent, pas de synchronisation nécessaire");
      return { success: false, message: "Utilisateur différent" };
    }
    
  } catch (error) {
    console.error("❌ Erreur lors du test de synchronisation:", error);
    return { success: false, error: error.message };
  }
};

// Exposer les fonctions pour utilisation dans la console
(window as any).testUserSync = testUserSync;
(window as any).testSyncForUser = testSyncForUser;

console.log(`
👥 FONCTIONS DE TEST DE SYNCHRONISATION DISPONIBLES
================================================================

Pour tester la synchronisation multi-utilisateur:
testUserSync()

Pour tester la synchronisation d'un utilisateur spécifique:
testSyncForUser("userId")

================================================================
`);