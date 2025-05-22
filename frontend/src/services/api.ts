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
 * Service d'upload d'images vers Cloudinary via notre backend
 * @param file - Le fichier image à uploader
 * @returns - Une promesse avec l'URL du fichier uploadé sur Cloudinary
 */
export const uploadFile = async (file: File): Promise<string> => {
  try {
    // Créer un objet FormData pour envoyer le fichier
    const formData = new FormData();

    // Ajouter le fichier sous la clé 'image' comme attendu par le backend
    formData.append("image", file);

    // Faire la requête POST vers l'endpoint d'upload d'avatar
    // Note: Pas besoin de définir le Content-Type ici car axios le détecte automatiquement pour FormData
    const response = await api.post("/upload/avatar", formData);

    // Vérifier que la réponse contient une URL d'image
    if (response.data && response.data.success && response.data.imageUrl) {
      // Retourner uniquement l'URL de l'image uploadée
      return response.data.imageUrl;
    } else {
      // Si la structure de la réponse n'est pas celle attendue
      throw new Error("Format de réponse invalide du serveur d'upload");
    }
  } catch (error) {
    // Loguer l'erreur dans la console pour le débogage
    console.error("Erreur lors de l'upload de l'image:", error);

    // Créer un message d'erreur plus descriptif selon le type d'erreur
    if (axios.isAxiosError(error) && error.response) {
      // Erreur avec une réponse du serveur (4xx, 5xx)
      throw new Error(
        `Échec de l'upload (${error.response.status}): ${
          error.response.data.message || "Erreur inconnue"
        }`
      );
    } else {
      // Autres types d'erreurs (réseau, etc.)
      throw new Error("Impossible d'uploader l'image. Veuillez réessayer.");
    }
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
