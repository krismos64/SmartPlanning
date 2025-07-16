/**
 * Guide de debug pour les problèmes de mise à jour de photo
 */

import axiosInstance from "../api/axiosInstance";

/**
 * Fonction de debug complète pour les mises à jour de photo
 */
export const debugPhotoUpdateIssue = async () => {
  console.log(`
🔍 DEBUG: PROBLÈME DE MISE À JOUR DE PHOTO DE PROFIL
================================================================

PROBLÈME RAPPORTÉ:
- L'utilisateur change sa photo de profil
- Pas de toast de succès
- Utilisateur déconnecté vers page login
- Mais la photo est bien sauvegardée

CORRECTIONS APPORTÉES:
1. ✅ Workflow simplifié: utilise /users/:id/photo au lieu de upload + update
2. ✅ Toast de succès repositionné à la fin du processus
3. ✅ Intercepteur axios modifié pour ne pas rediriger automatiquement
4. ✅ Gestion d'erreurs améliorée

TESTS À EFFECTUER:
================================================================
  `);

  // Test 1: Vérifier l'authentification
  console.log("TEST 1: Vérification de l'authentification...");
  try {
    const authResponse = await axiosInstance.get("/auth/me");
    if (authResponse.data.success) {
      console.log("✅ Utilisateur authentifié:", authResponse.data.data.firstName, authResponse.data.data.lastName);
    } else {
      console.log("❌ Utilisateur non authentifié");
      return;
    }
  } catch (error) {
    console.log("❌ Erreur d'authentification:", error.message);
    return;
  }

  // Test 2: Vérifier l'endpoint de mise à jour de photo
  console.log("\nTEST 2: Test de l'endpoint /users/:id/photo...");
  try {
    const user = (await axiosInstance.get("/auth/me")).data.data;
    
    // Créer un fichier de test
    const blob = new Blob(['test-debug-photo'], { type: 'image/png' });
    const testFile = new File([blob], 'debug-test.png', { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('file', testFile);
    
    const photoResponse = await axiosInstance.put(`/users/${user._id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (photoResponse.data.success) {
      console.log("✅ Endpoint /users/:id/photo fonctionne:", photoResponse.data.photoUrl);
    } else {
      console.log("❌ Problème avec l'endpoint /users/:id/photo");
    }
    
    // Vérifier que l'utilisateur est toujours authentifié
    const authAfter = await axiosInstance.get("/auth/me");
    if (authAfter.data.success) {
      console.log("✅ Utilisateur toujours authentifié après mise à jour");
    } else {
      console.log("❌ PROBLÈME: Utilisateur déconnecté après mise à jour");
    }
    
  } catch (error) {
    console.log("❌ Erreur lors du test endpoint:", error.message);
    
    // Vérifier si l'erreur a causé une déconnexion
    try {
      const authCheck = await axiosInstance.get("/auth/me");
      if (!authCheck.data.success) {
        console.log("❌ CONFIRMED: L'erreur a causé une déconnexion");
      } else {
        console.log("✅ Utilisateur toujours connecté malgré l'erreur");
      }
    } catch (authError) {
      console.log("❌ CONFIRMED: Utilisateur déconnecté");
    }
  }

  console.log(`
INSTRUCTIONS POUR L'UTILISATEUR:
================================================================

POUR TESTER LA CORRECTION:
1. Ouvrir la console (F12)
2. Exécuter: debugPhotoUpdateIssue()
3. Aller sur la page de profil utilisateur
4. Changer votre photo de profil
5. Vérifier:
   - ✅ Toast de succès apparaît
   - ✅ Vous restez connecté
   - ✅ Photo mise à jour visible

SI LE PROBLÈME PERSISTE:
1. Vérifier les logs de la console
2. Exécuter: quickAuthTest() pour vérifier l'auth
3. Exécuter: testPhotoUpdateWorkflow() pour test complet

AUTRES FONCTIONS DE DEBUG DISPONIBLES:
- quickAuthTest() : Vérification rapide d'authentification
- testPhotoUpdateWorkflow() : Test complet du workflow
- forceUserRefresh() : Force un rafraîchissement des données user
  `);
};

/**
 * Check rapide de l'état du système
 */
export const systemHealthCheck = async () => {
  console.log("🏥 HEALTH CHECK DU SYSTÈME...");
  
  const results = {
    auth: false,
    uploadEndpoint: false,
    profileEndpoint: false,
    photoEndpoint: false
  };
  
  // Test auth
  try {
    const authResponse = await axiosInstance.get("/auth/me");
    results.auth = authResponse.data.success;
    console.log("🔐 Authentification:", results.auth ? "✅ OK" : "❌ NOK");
  } catch (error) {
    console.log("🔐 Authentification: ❌ ERREUR");
  }
  
  if (!results.auth) {
    console.log("❌ Impossible de continuer les tests sans authentification");
    return results;
  }
  
  const user = (await axiosInstance.get("/auth/me")).data.data;
  
  // Test endpoints
  const testFile = new File([new Blob(['test'])], 'test.png', { type: 'image/png' });
  
  // Test upload endpoint
  try {
    const formData = new FormData();
    formData.append('image', testFile);
    const uploadResponse = await axiosInstance.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    results.uploadEndpoint = uploadResponse.data.success;
    console.log("📤 Upload endpoint:", results.uploadEndpoint ? "✅ OK" : "❌ NOK");
  } catch (error) {
    console.log("📤 Upload endpoint: ❌ ERREUR");
  }
  
  // Test profile endpoint
  try {
    const profileResponse = await axiosInstance.put('/profile/update', {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      photoUrl: user.photoUrl
    });
    results.profileEndpoint = profileResponse.data.success;
    console.log("👤 Profile endpoint:", results.profileEndpoint ? "✅ OK" : "❌ NOK");
  } catch (error) {
    console.log("👤 Profile endpoint: ❌ ERREUR");
  }
  
  // Test photo endpoint
  try {
    const formData = new FormData();
    formData.append('file', testFile);
    const photoResponse = await axiosInstance.put(`/users/${user._id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    results.photoEndpoint = photoResponse.data.success;
    console.log("📸 Photo endpoint:", results.photoEndpoint ? "✅ OK" : "❌ NOK");
  } catch (error) {
    console.log("📸 Photo endpoint: ❌ ERREUR");
  }
  
  const allOk = Object.values(results).every(r => r);
  console.log("\n🏥 RÉSULTAT GLOBAL:", allOk ? "✅ SYSTÈME OK" : "❌ PROBLÈMES DÉTECTÉS");
  
  return results;
};

// Exposer les fonctions
(window as any).debugPhotoUpdateIssue = debugPhotoUpdateIssue;
(window as any).systemHealthCheck = systemHealthCheck;

// Importer et exposer le test de correction d'authentification
import { testAuthenticationFix } from './testAuthFix';
(window as any).testAuthenticationFix = testAuthenticationFix;

// Importer et exposer les fonctions de debug pour la boucle infinie
import { debugInfiniteLoop, forceReconnection } from './debugInfiniteLoop';
(window as any).debugInfiniteLoop = debugInfiniteLoop;
(window as any).forceReconnection = forceReconnection;

// Importer et exposer les fonctions de test de synchronisation
import { testUserSync, testSyncForUser } from './testUserSync';
(window as any).testUserSync = testUserSync;
(window as any).testSyncForUser = testSyncForUser;

// Importer et exposer les fonctions de test de synchronisation inter-utilisateur
import { testCrossUserSync, monitorPhotoChanges } from './testCrossUserSync';
(window as any).testCrossUserSync = testCrossUserSync;
(window as any).monitorPhotoChanges = monitorPhotoChanges;

// Importer et exposer le diagnostic rapide
import { quickDiagnostic } from './quickDiagnostic';
(window as any).quickDiagnostic = quickDiagnostic;