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
          console.warn("Session expirée ou non autorisée");

          // Plus besoin de supprimer manuellement les tokens - les cookies httpOnly 
          // sont automatiquement gérés côté serveur

          // Ne pas rediriger automatiquement si l'utilisateur est déjà sur la page de connexion
          // ou si la requête est une tentative de connexion
          const isLoginPage = window.location.pathname === "/connexion";
          const isLoginRequest = error.config?.url?.includes("/auth/login");

          if (!isLoginPage && !isLoginRequest) {
            // Rediriger vers la page de connexion uniquement si l'utilisateur n'est pas déjà sur cette page
            window.location.href = "/connexion";
          }
        }
      }

      // Rejeter la promesse avec l'erreur pour que le code appelant puisse la gérer
      return Promise.reject(error);
    }
  );
}
