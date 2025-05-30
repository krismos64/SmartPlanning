import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { User } from "../types/User";

// Interface définissant la structure du contexte d'authentification
interface AuthContextType {
  // Utilisateur connecté ou null si non connecté
  user: User | null;
  // Indique si l'utilisateur est authentifié
  isAuthenticated: boolean;
  // Indique si les données d'authentification sont en cours de chargement
  loading: boolean;
  // Erreurs d'authentification
  error: string | null;
  // Indique si l'utilisateur doit compléter son profil
  shouldCompleteProfile: boolean;
  // Fonction pour connecter l'utilisateur
  login: (email: string, password: string) => Promise<void>;
  // Fonction pour déconnecter l'utilisateur
  logout: () => Promise<void>;
  // Fonction pour mettre à jour les données de l'utilisateur
  updateUser: (userData: Partial<User>) => void;
  // Fonction pour rafraîchir les données de l'utilisateur depuis le serveur
  refreshUser: () => Promise<void>;
}

// Configuration axios avec token
const setAuthToken = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
  }
};

// Création du contexte avec une valeur par défaut undefined
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Props pour le AuthProvider
interface AuthProviderProps {
  children: React.ReactNode;
}

// Provider qui enveloppe l'application et fournit le contexte d'authentification
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // États pour gérer l'authentification
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldCompleteProfile, setShouldCompleteProfile] =
    useState<boolean>(false);

  // Charger le token au démarrage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
    }
  }, []);

  // Vérifier l'authentification au chargement du composant
  useEffect(() => {
    // Fonction pour vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Configuration du token pour la requête
        setAuthToken(token);

        // Appel à l'API pour vérifier le token
        const response = await axiosInstance.get("/auth/me");

        if (response.data.success) {
          // S'assurer que l'ID est disponible dans le format attendu par le backend
          const userData = response.data.data;
          // Ajouter userId qui est attendu par le middleware d'authentification
          setUser({
            ...userData,
            token,
            userId: userData._id, // Assurer la cohérence avec le format attendu par le backend
            companyId: userData.companyId, // ✅ nécessaire pour filtrage multi-tenant (ex: collaborateurs, plannings)
          });
          setIsAuthenticated(true);
        } else {
          // Token invalide
          setAuthToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Erreur de vérification d'authentification:", error);
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setError("Session expirée, veuillez vous reconnecter");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fonction pour connecter l'utilisateur
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // Appel à l'API d'authentification
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      // Si la connexion est réussie
      if (response.data.success) {
        // Stocker le token JWT
        const { token, user } = response.data;
        setAuthToken(token);

        // Mettre à jour l'état en ajoutant userId pour la cohérence avec le backend
        setUser({
          ...user,
          token,
          userId: user._id || user.id, // Assurer la cohérence avec le format attendu par le backend
          photoUrl: user.photoUrl, // S'assurer que photoUrl est bien préservé
          companyId: user.companyId, // ✅ nécessaire pour filtrage multi-tenant (ex: collaborateurs, plannings)
        });
        setIsAuthenticated(true);
      } else {
        throw new Error(response.data.message || "Échec de la connexion");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || "Identifiants invalides");
      } else {
        setError("Erreur lors de la connexion");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour déconnecter l'utilisateur
  const logout = async () => {
    setLoading(true);
    try {
      // Appel à l'API de déconnexion
      await axiosInstance.post("/auth/logout");

      // Supprimer le token
      setAuthToken(null);

      // Mettre à jour l'état
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Même si l'API échoue, on déconnecte l'utilisateur localement
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setError("Erreur lors de la déconnexion");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour les données de l'utilisateur
  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    // Mise à jour de l'utilisateur avec les nouvelles données
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...userData,
      };
    });
  };

  // Fonction pour rafraîchir les données de l'utilisateur depuis le serveur
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);

      // Configuration du token pour la requête
      setAuthToken(token);

      // Appel à l'API pour obtenir les données utilisateur à jour
      const response = await axiosInstance.get("/auth/me");

      if (response.data.success) {
        // Mettre à jour l'utilisateur avec les données fraîches
        const userData = response.data.data;

        // S'assurer que photoUrl est bien défini, même si c'est undefined
        setUser((prevUser) => {
          // Si l'utilisateur a une photoUrl dans la réponse, l'utiliser
          // Sinon, conserver la photoUrl précédente si elle existe
          const updatedPhotoUrl =
            userData.photoUrl !== undefined
              ? userData.photoUrl
              : prevUser?.photoUrl;

          return {
            ...userData,
            token,
            userId: userData._id,
            photoUrl: updatedPhotoUrl,
            companyId: userData.companyId, // ✅ nécessaire pour filtrage multi-tenant (ex: collaborateurs, plannings)
          };
        });

        // Vérifier si le profil utilisateur est incomplet
        const isProfileIncomplete =
          !userData.companyId ||
          !userData.photoUrl ||
          !userData.bio ||
          !userData.firstName ||
          !userData.lastName;

        // Mettre à jour l'état shouldCompleteProfile
        setShouldCompleteProfile(isProfileIncomplete);
      }
    } catch (error) {
      console.error(
        "Erreur lors du rafraîchissement des données utilisateur:",
        error
      );
      // Ne pas déconnecter l'utilisateur en cas d'erreur de rafraîchissement
    } finally {
      setLoading(false);
    }
  };

  // Valeur du contexte
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    shouldCompleteProfile,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
