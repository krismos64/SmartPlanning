/**
 * Utilitaire de test pour vérifier l'authentification
 * Utilise axiosInstance pour tester l'envoi automatique des cookies JWT
 */

import axiosInstance from "../api/axiosInstance";

/**
 * Teste l'authentification avec l'endpoint /auth/me
 * Vérifie que le cookie JWT httpOnly est automatiquement envoyé
 */
export const testUserAuthentication = async () => {
  try {
    const response = await axiosInstance.get("/auth/me");
    
    if (response.data.success) {
      console.log("✅ Authentification réussie via cookie JWT httpOnly");
      console.log("👤 Utilisateur connecté:", response.data.data);
      return {
        success: true,
        user: response.data.data,
        message: "Authentification réussie"
      };
    } else {
      console.log("❌ Échec de l'authentification");
      return {
        success: false,
        message: "Échec de l'authentification"
      };
    }
  } catch (error) {
    console.error("❌ Erreur lors du test d'authentification:", error);
    return {
      success: false,
      message: "Erreur lors du test d'authentification",
      error
    };
  }
};

/**
 * Teste l'upload de photo de profil
 * Vérifie que l'endpoint PUT /users/:id/photo fonctionne avec les cookies
 */
export const testPhotoUpload = async (userId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await axiosInstance.put(`/users/${userId}/photo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    if (response.data.success) {
      console.log("✅ Upload de photo réussi");
      console.log("🖼️ Nouvelle URL:", response.data.photoUrl);
      return {
        success: true,
        photoUrl: response.data.photoUrl,
        message: "Photo uploadée avec succès"
      };
    } else {
      console.log("❌ Échec de l'upload de photo");
      return {
        success: false,
        message: "Échec de l'upload de photo"
      };
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'upload de photo:", error);
    return {
      success: false,
      message: "Erreur lors de l'upload de photo",
      error
    };
  }
};

// Fonction pour tester depuis la console du navigateur
(window as any).testAuth = testUserAuthentication;
(window as any).testPhotoUpload = testPhotoUpload;