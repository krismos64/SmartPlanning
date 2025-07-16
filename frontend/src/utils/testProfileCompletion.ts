/**
 * Utilitaire de test pour vérifier le workflow de complétion de profil
 */

import axiosInstance from "../api/axiosInstance";

/**
 * Teste le workflow complet de complétion de profil
 */
export const testProfileCompletionWorkflow = async () => {
  try {
    console.log("🧪 Test du workflow de complétion de profil...");
    
    // 1. Vérifier l'état actuel de l'utilisateur
    const currentUser = await axiosInstance.get("/auth/me");
    console.log("👤 Utilisateur actuel:", currentUser.data.data);
    
    const user = currentUser.data.data;
    console.log("🔍 Profil complet ?", user.profileCompleted);
    
    // 2. Simuler la mise à jour du profil
    if (!user.profileCompleted) {
      console.log("⏳ Mise à jour du profil pour le marquer comme complet...");
      
      const profileUpdate = await axiosInstance.put("/profile/update", {
        firstName: user.firstName || "Test",
        lastName: user.lastName || "User",
        email: user.email,
        photoUrl: user.photoUrl || "https://via.placeholder.com/150"
      });
      
      console.log("✅ Profil mis à jour:", profileUpdate.data.data);
      console.log("🎉 Profil complet ?", profileUpdate.data.data.profileCompleted);
      
      // 3. Vérifier que l'utilisateur est bien mis à jour
      const updatedUser = await axiosInstance.get("/auth/me");
      console.log("🔄 Utilisateur après mise à jour:", updatedUser.data.data);
      
      return {
        success: true,
        message: "Workflow de complétion de profil testé avec succès",
        before: user,
        after: updatedUser.data.data
      };
    } else {
      console.log("✅ Le profil est déjà complet");
      return {
        success: true,
        message: "Le profil est déjà complet",
        user: user
      };
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    return {
      success: false,
      message: "Erreur lors du test du workflow",
      error
    };
  }
};

/**
 * Teste la redirection automatique
 */
export const testProfileRedirection = () => {
  console.log("🧪 Test de redirection automatique...");
  console.log("💡 Pour tester la redirection :");
  console.log("1. Connectez-vous avec un utilisateur qui a profileCompleted = false");
  console.log("2. Essayez de naviguer vers n'importe quelle page privée");
  console.log("3. Vous devriez être redirigé vers /complete-profile");
  console.log("4. Complétez le profil");
  console.log("5. Vous devriez être redirigé vers /user/profile");
};

/**
 * Simule un utilisateur avec profil incomplet
 */
export const simulateIncompleteProfile = async () => {
  try {
    console.log("🧪 Simulation d'un profil incomplet...");
    
    // Marquer le profil comme incomplet (pour les tests)
    const user = await axiosInstance.get("/auth/me");
    const userId = user.data.data._id;
    
    console.log("⚠️  Note: Cette fonction ne peut pas vraiment marquer le profil comme incomplet");
    console.log("💡 Pour tester un profil incomplet :");
    console.log("1. Connectez-vous avec un compte Google OAuth nouveau");
    console.log("2. Ou modifiez manuellement la base de données pour mettre profileCompleted = false");
    
    return {
      success: true,
      message: "Instructions pour simuler un profil incomplet affichées",
      userId
    };
  } catch (error) {
    console.error("❌ Erreur:", error);
    return {
      success: false,
      message: "Erreur lors de la simulation",
      error
    };
  }
};

// Exposer les fonctions pour tests depuis la console
(window as any).testProfileCompletion = testProfileCompletionWorkflow;
(window as any).testProfileRedirection = testProfileRedirection;
(window as any).simulateIncompleteProfile = simulateIncompleteProfile;