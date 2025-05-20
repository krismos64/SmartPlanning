/**
 * Instance Axios pré-configurée pour l'API SmartPlanning
 *
 * Cette instance est configurée avec des paramètres par défaut
 * pour faciliter les appels API dans toute l'application.
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Ajouter un intercepteur pour inclure automatiquement le token d'authentification
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
