/**
 * Fichier de configuration des interceptors pour axios
 *
 * Ce fichier configure des intercepteurs de réponses pour gérer:
 * - La gestion automatique des erreurs d'authentification (401)
 * - Les tokens sont maintenant gérés via des cookies httpOnly
 */

import axiosInstance from "./axiosInstance";

/**
 * Configure les intercepteurs de réponses pour axiosInstance
 * À appeler au démarrage de l'application
 */
export function setupAxiosInterceptors(): void {
  // Plus besoin d'intercepteur de requêtes - les cookies sont automatiques

  // Intercepteur de réponses
  axiosInstance.interceptors.response.use(
    // Comportement normal en cas de succès
    (response) => response,

    // Gestion des erreurs
    (error) => {
      // Vérifier si l'erreur est une réponse du serveur
      if (error.response) {
        // Si statut 401 Unauthorized
        if (error.response.status === 401) {
          console.warn("Session expirée ou non autorisée pour:", error.config?.url);

          // Ne pas rediriger automatiquement dans certains cas:
          const isLoginPage = window.location.pathname === "/connexion";
          const isLoginRequest = error.config?.url?.includes("/auth/login");
          const isProfileUpdate = error.config?.url?.includes("/profile/update");
          const isPhotoUpload = error.config?.url?.includes("/upload/") || 
                                error.config?.url?.includes("/photo");
          
          // Si c'est une mise à jour de profil ou photo, ne pas rediriger immédiatement
          // Laisser le composant gérer l'erreur
          if (isProfileUpdate || isPhotoUpload) {
            console.warn("Erreur 401 sur mise à jour de profil/photo - pas de redirection automatique");
            return Promise.reject(error);
          }

          if (!isLoginPage && !isLoginRequest) {
            // Ne pas rediriger automatiquement si on est sur la page d'accueil
            // et que l'utilisateur n'a pas encore tenté de se connecter
            const isHomePage = window.location.pathname === "/" || 
                              window.location.pathname === "/accueil";
            
            if (!isHomePage) {
              // Délai avant redirection pour permettre au composant de gérer l'erreur
              setTimeout(() => {
                // Vérifier si on est toujours sur la même page (l'utilisateur n'a pas navigué)
                if (window.location.pathname !== "/connexion") {
                  console.warn("Redirection vers la page de connexion après délai");
                  window.location.href = "/connexion";
                }
              }, 2000); // 2 secondes de délai
            }
          }
        }
      }

      // Rejeter la promesse avec l'erreur pour que le code appelant puisse la gérer
      return Promise.reject(error);
    }
  );
}
