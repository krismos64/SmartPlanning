/**
 * Instance Axios pré-configurée pour l'API SmartPlanning
 *
 * Cette instance est configurée avec des paramètres par défaut
 * pour faciliter les appels API dans toute l'application.
 */

import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://smartplanning.onrender.com/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Les cookies httpOnly sont automatiquement envoyés grâce à withCredentials: true
// Plus besoin d'intercepteur pour ajouter manuellement le token

export default axiosInstance;
