import axios from "axios";

// Configuration de base d'axios
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token JWT aux requêtes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Service d'upload de fichiers vers Cloudinary via notre backend
 * @param file - Le fichier à uploader
 * @returns - Une promesse avec l'URL du fichier uploadé
 */
export const uploadFile = async (file: File): Promise<string> => {
  try {
    // Créer un objet FormData pour envoyer le fichier
    const formData = new FormData();
    formData.append("file", file);

    // Définir le type de contenu comme multipart/form-data
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    // Faire la requête POST vers l'endpoint d'upload
    const response = await api.post("/upload", formData, config);

    // Retourner l'URL du fichier uploadé
    return response.data.url;
  } catch (error) {
    console.error("Erreur lors de l'upload du fichier:", error);
    throw error;
  }
};

/**
 * Service pour les opérations administratives liées aux utilisateurs
 */
export const adminUserService = {
  // Créer un nouvel utilisateur
  createUser: async (userData: any) => {
    try {
      const response = await api.post("/admin/users", userData);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      throw error;
    }
  },

  // Autres méthodes pour la gestion des utilisateurs...
};

export default api;
