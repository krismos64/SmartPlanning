import axios from "axios";

// Configuration de base d'axios
const API_URL =
  import.meta.env.VITE_API_URL || "https://smartplanning.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Autoriser l'envoi des cookies avec les requêtes cross-origin
  withCredentials: true,
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

    // Faire la requête POST vers l'endpoint d'upload d'avatar avec des configurations spécifiques
    // Définir explicitement le Content-Type à multipart/form-data
    const response = await api.post("/upload/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

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
 * Service pour mettre à jour le profil de l'utilisateur
 * @param userData - Les données du profil à mettre à jour
 * @returns - Les données de l'utilisateur mises à jour
 */
export const updateUserProfile = async (userData: any) => {
  try {
    // Utiliser la nouvelle route dédiée au profil sans vérification de rôle
    const response = await api.put("/profile/update", userData);

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        "Format de réponse invalide lors de la mise à jour du profil"
      );
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Échec de la mise à jour (${error.response.status}): ${
          error.response.data.message || "Erreur inconnue"
        }`
      );
    } else {
      throw new Error(
        "Impossible de mettre à jour le profil. Veuillez réessayer."
      );
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
      console.log("API createUser - Données envoyées:", userData);
      const response = await api.post("/admin/users", userData);
      console.log("API createUser - Réponse reçue:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      if (error.response) {
        console.error("Détails de l'erreur:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }
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

/**
 * Service pour la gestion des mots de passe
 */
export const passwordService = {
  /**
   * Demander un lien de réinitialisation de mot de passe
   * @param email - Email de l'utilisateur
   * @returns Réponse du serveur
   */
  forgotPassword: async (email: string) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation:", error);
      throw error;
    }
  },

  /**
   * Réinitialiser le mot de passe avec un token
   * @param email - Email de l'utilisateur
   * @param token - Token de réinitialisation
   * @param newPassword - Nouveau mot de passe
   * @returns Réponse du serveur
   */
  resetPassword: async (email: string, token: string, newPassword: string) => {
    try {
      const response = await api.post("/auth/reset-password", {
        email,
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la réinitialisation du mot de passe:",
        error
      );
      throw error;
    }
  },
};

/**
 * Service pour interagir avec l'IA de manière conversationnelle
 * @param conversationData - Données de la conversation
 * @returns - Réponse de l'IA avec questions et suggestions
 */
export const aiConversation = async (conversationData: {
  teamId: string;
  year: number;
  weekNumber: number;
  message: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
}) => {
  try {
    const response = await api.post("/ai/conversation", conversationData);

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error("Format de réponse invalide lors de l'interaction IA");
    }
  } catch (error) {
    console.error("Erreur lors de l'interaction IA:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Échec de l'interaction IA (${error.response.status}): ${
          error.response.data.message || "Erreur inconnue"
        }`
      );
    } else {
      throw new Error(
        "Impossible de communiquer avec l'IA. Veuillez réessayer."
      );
    }
  }
};

/**
 * Service pour générer un planning avec contexte enrichi
 * @param enhancedData - Données enrichies pour la génération
 * @returns - Planning généré avec métadonnées
 */
export const generateScheduleWithContext = async (enhancedData: {
  teamId: string;
  year: number;
  weekNumber: number;
  constraints: string[];
  notes?: string;
  conversationSummary?: string;
  additionalRequirements?: string;
}) => {
  try {
    const response = await api.post("/ai/generate-with-context", enhancedData);

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        "Format de réponse invalide lors de la génération enrichie"
      );
    }
  } catch (error) {
    console.error("Erreur lors de la génération enrichie:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Échec de la génération enrichie (${error.response.status}): ${
          error.response.data.message || "Erreur inconnue"
        }`
      );
    } else {
      throw new Error(
        "Impossible de générer le planning enrichi. Veuillez réessayer."
      );
    }
  }
};

/**
 * Service pour générer un planning classique (amélioré)
 * @param scheduleData - Données du planning à générer
 * @returns - Planning généré
 */
export const generateSchedule = async (scheduleData: {
  teamId: string;
  year: number;
  weekNumber: number;
  constraints: string[];
  notes?: string;
}) => {
  try {
    const response = await api.post("/ai/generate-schedule", scheduleData);

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error("Format de réponse invalide lors de la génération");
    }
  } catch (error) {
    console.error("Erreur lors de la génération de planning:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Échec de la génération (${error.response.status}): ${
          error.response.data.message || "Erreur inconnue"
        }`
      );
    } else {
      throw new Error("Impossible de générer le planning. Veuillez réessayer.");
    }
  }
};

/**
 * Service pour récupérer les plannings générés par l'IA
 * @returns - Liste des plannings générés
 */
export const getGeneratedSchedules = async () => {
  try {
    const response = await api.get("/ai/generated-schedules");

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error("Format de réponse invalide lors de la récupération");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des plannings IA:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Échec de la récupération (${error.response.status}): ${
          error.response.data.message || "Erreur inconnue"
        }`
      );
    } else {
      throw new Error(
        "Impossible de récupérer les plannings. Veuillez réessayer."
      );
    }
  }
};

export default api;
