/**
 * Fichier de configuration des interceptors pour axios
 *
 * Ce fichier configure des intercepteurs de requêtes et réponses pour gérer:
 * - L'ajout automatique du token d'authentification aux requêtes
 * - La gestion automatique des erreurs d'authentification (401)
 */

import { InternalAxiosRequestConfig } from "axios";
import axiosInstance from "./axiosInstance";

/**
 * Configure les intercepteurs de requêtes et réponses pour axiosInstance
 * À appeler au démarrage de l'application
 */
export function setupAxiosInterceptors(): void {
  // Intercepteur de requêtes
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Récupération du token depuis le localStorage
      const accessToken = localStorage.getItem("accessToken");

      // Si un token existe, l'ajouter à l'en-tête d'autorisation
      if (accessToken) {
        // S'assurer que headers existe dans config
        config.headers = config.headers || {};

        // Ajouter le token Bearer à l'en-tête Authorization
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error) => {
      // En cas d'erreur dans l'intercepteur de requête
      console.error("Erreur dans l'intercepteur de requête:", error);
      return Promise.reject(error);
    }
  );

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

          // Supprimer le token d'authentification
          localStorage.removeItem("accessToken");

          // Rediriger vers la page de connexion
          window.location.href = "/login";
        }
      }

      // Rejeter la promesse avec l'erreur pour que le code appelant puisse la gérer
      return Promise.reject(error);
    }
  );
}
