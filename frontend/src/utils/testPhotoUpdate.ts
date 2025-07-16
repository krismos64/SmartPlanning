/**
 * Utilitaire de test pour vérifier la mise à jour de photo sans déconnexion
 */

import axiosInstance from "../api/axiosInstance";

/**
 * Teste la mise à jour de photo avec vérification de session
 */
export const testPhotoUpdateWorkflow = async () => {
  try {
    console.log("🧪 Test complet de mise à jour de photo...");
    
    // 1. Vérifier l'authentification initiale
    console.log("1️⃣ Vérification de l'authentification initiale...");
    const initialAuth = await axiosInstance.get("/auth/me");
    
    if (!initialAuth.data.success) {
      throw new Error("Utilisateur non authentifié");
    }
    
    const user = initialAuth.data.data;
    console.log("✅ Utilisateur authentifié:", {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      photoUrl: user.photoUrl
    });

    // 2. Créer un fichier de test
    console.log("2️⃣ Création d'un fichier de test...");
    const blob = new Blob(['test-photo-data'], { type: 'image/png' });
    const testFile = new File([blob], 'test-profile-photo.png', { type: 'image/png' });
    
    // 3. Tester l'endpoint /users/:id/photo directement
    console.log("3️⃣ Test de l'endpoint /users/:id/photo...");
    const formData = new FormData();
    formData.append('file', testFile);
    
    const photoResponse = await axiosInstance.put(`/users/${user._id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (photoResponse.data.success) {
      console.log("✅ Photo mise à jour via endpoint dédié:", photoResponse.data.photoUrl);
    } else {
      throw new Error("Échec de la mise à jour de photo");
    }

    // 4. Vérifier que l'utilisateur est toujours authentifié
    console.log("4️⃣ Vérification de l'authentification après mise à jour...");
    const postUpdateAuth = await axiosInstance.get("/auth/me");
    
    if (!postUpdateAuth.data.success) {
      throw new Error("❌ PROBLÈME: Utilisateur déconnecté après mise à jour de photo");
    }
    
    const updatedUser = postUpdateAuth.data.data;
    console.log("✅ Utilisateur toujours authentifié:", {
      id: updatedUser._id,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`,
      photoUrl: updatedUser.photoUrl,
      photoChanged: user.photoUrl !== updatedUser.photoUrl
    });

    // 5. Tester le workflow complet avec uploadFile + updateUserProfile
    console.log("5️⃣ Test du workflow upload + profile update...");
    
    const blob2 = new Blob(['test-photo-data-2'], { type: 'image/jpeg' });
    const testFile2 = new File([blob2], 'test-profile-photo-2.jpg', { type: 'image/jpeg' });
    
    // Upload via /upload/avatar
    const formData2 = new FormData();
    formData2.append('image', testFile2);
    
    const uploadResponse = await axiosInstance.post('/upload/avatar', formData2, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (uploadResponse.data.success) {
      console.log("✅ Image uploadée via /upload/avatar:", uploadResponse.data.imageUrl);
      
      // Mettre à jour le profil avec la nouvelle image
      const profileResponse = await axiosInstance.put('/profile/update', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        photoUrl: uploadResponse.data.imageUrl
      });
      
      if (profileResponse.data.success) {
        console.log("✅ Profil mis à jour via /profile/update");
      } else {
        throw new Error("Échec de la mise à jour de profil");
      }
    }

    // 6. Vérification finale de l'authentification
    console.log("6️⃣ Vérification finale de l'authentification...");
    const finalAuth = await axiosInstance.get("/auth/me");
    
    if (!finalAuth.data.success) {
      throw new Error("❌ PROBLÈME: Utilisateur déconnecté après workflow complet");
    }
    
    console.log("✅ Test complet réussi - utilisateur reste authentifié");
    
    return {
      success: true,
      message: "Workflow de mise à jour de photo réussi sans déconnexion",
      initialPhoto: user.photoUrl,
      finalPhoto: finalAuth.data.data.photoUrl,
      authMaintained: true
    };

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    
    // Vérifier si l'utilisateur est toujours authentifié en cas d'erreur
    try {
      const authCheck = await axiosInstance.get("/auth/me");
      const stillAuthenticated = authCheck.data.success;
      
      return {
        success: false,
        message: "Erreur lors du test de mise à jour de photo",
        error: error.response ? error.response.data : error.message,
        authMaintained: stillAuthenticated,
        disconnected: !stillAuthenticated
      };
    } catch (authError) {
      return {
        success: false,
        message: "Erreur lors du test et utilisateur déconnecté",
        error: error.response ? error.response.data : error.message,
        authMaintained: false,
        disconnected: true
      };
    }
  }
};

/**
 * Test simple de l'authentification
 */
export const quickAuthTest = async () => {
  try {
    const response = await axiosInstance.get("/auth/me");
    console.log("🔐 État d'authentification:", response.data.success ? "✅ Connecté" : "❌ Déconnecté");
    if (response.data.success) {
      console.log("👤 Utilisateur:", response.data.data.firstName, response.data.data.lastName);
    }
    return response.data.success;
  } catch (error) {
    console.log("🔐 État d'authentification: ❌ Erreur de connexion");
    return false;
  }
};

// Exposer les fonctions pour tests
(window as any).testPhotoUpdateWorkflow = testPhotoUpdateWorkflow;
(window as any).quickAuthTest = quickAuthTest;