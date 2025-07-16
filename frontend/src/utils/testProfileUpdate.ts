/**
 * Utilitaire de test pour vérifier la mise à jour du profil avec les cookies
 */

import axiosInstance from "../api/axiosInstance";

/**
 * Teste la mise à jour du profil pour diagnostiquer les problèmes d'auth
 */
export const testProfileUpdate = async () => {
  try {
    console.log("🧪 Test de mise à jour du profil...");
    
    // 1. Vérifier d'abord l'authentification
    console.log("1️⃣ Vérification de l'authentification...");
    const authCheck = await axiosInstance.get("/auth/me");
    console.log("✅ Utilisateur authentifié:", authCheck.data.data);
    
    const user = authCheck.data.data;
    
    // 2. Tester la mise à jour du profil sans changement
    console.log("2️⃣ Test de mise à jour du profil...");
    const profileUpdate = await axiosInstance.put("/profile/update", {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      photoUrl: user.photoUrl
    });
    
    console.log("✅ Mise à jour réussie:", profileUpdate.data);
    
    return {
      success: true,
      message: "Test de mise à jour réussi",
      user: user,
      updatedProfile: profileUpdate.data.data
    };
    
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    
    if (error.response) {
      console.error("📄 Status:", error.response.status);
      console.error("📄 Data:", error.response.data);
      console.error("📄 Headers:", error.response.headers);
    }
    
    return {
      success: false,
      message: "Erreur lors du test",
      error: error.response ? error.response.data : error.message
    };
  }
};

/**
 * Teste l'upload d'une image fictive
 */
export const testImageUpload = async () => {
  try {
    console.log("🧪 Test d'upload d'image...");
    
    // Créer un fichier blob fictif pour le test
    const blob = new Blob(['test'], { type: 'image/png' });
    const file = new File([blob], 'test.png', { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('image', file);
    
    const uploadResponse = await axiosInstance.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log("✅ Upload réussi:", uploadResponse.data);
    
    return {
      success: true,
      message: "Test d'upload réussi",
      imageUrl: uploadResponse.data.imageUrl
    };
    
  } catch (error) {
    console.error("❌ Erreur lors de l'upload:", error);
    
    return {
      success: false,
      message: "Erreur lors de l'upload",
      error: error.response ? error.response.data : error.message
    };
  }
};

/**
 * Teste le workflow complet d'upload + mise à jour
 */
export const testCompletePhotoUpdate = async () => {
  try {
    console.log("🧪 Test du workflow complet de mise à jour de photo...");
    
    // 1. Test d'upload
    const uploadResult = await testImageUpload();
    if (!uploadResult.success) {
      throw new Error("Échec de l'upload");
    }
    
    // 2. Test de mise à jour du profil avec la nouvelle image
    const authCheck = await axiosInstance.get("/auth/me");
    const user = authCheck.data.data;
    
    const profileUpdate = await axiosInstance.put("/profile/update", {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      photoUrl: uploadResult.imageUrl
    });
    
    console.log("✅ Workflow complet réussi:", profileUpdate.data);
    
    return {
      success: true,
      message: "Workflow complet réussi",
      uploadedImageUrl: uploadResult.imageUrl,
      updatedProfile: profileUpdate.data.data
    };
    
  } catch (error) {
    console.error("❌ Erreur dans le workflow complet:", error);
    
    return {
      success: false,
      message: "Erreur dans le workflow complet",
      error: error.response ? error.response.data : error.message
    };
  }
};

// Exposer les fonctions pour tests depuis la console
(window as any).testProfileUpdate = testProfileUpdate;
(window as any).testImageUpload = testImageUpload;
(window as any).testCompletePhotoUpdate = testCompletePhotoUpdate;