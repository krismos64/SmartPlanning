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
  if (token && config.headers) {
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
 * Types pour les utilisateurs
 */
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "directeur" | "manager" | "employee";
  status: "active" | "inactive";
  createdAt: string;
  photoUrl?: string;
  companyId?: string;
}

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

  // Récupérer tous les utilisateurs depuis l'API
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get("/admin/users");
      return response.data.users; // ✅ maintenant on retourne directement le tableau
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      throw error;
    }
  },

  // Mettre à jour un utilisateur existant
  updateUser: async (id: string, userData: Partial<User>) => {
    try {
      const response = await api.put(`/admin/users/${id}`, userData);
      return response.data.user;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      throw error;
    }
  },

  // Supprimer un utilisateur
  deleteUser: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/users/${id}`);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      throw error;
    }
  },
};

export default api;
