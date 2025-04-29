/**
 * Instance Axios pré-configurée pour l'API SmartPlanning
 *
 * Cette instance est configurée avec des paramètres par défaut
 * pour faciliter les appels API dans toute l'application.
 */

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
