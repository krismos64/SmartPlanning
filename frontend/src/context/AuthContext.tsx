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

// Configuration axios pour les cookies et fallback localStorage
const clearAuthHeaders = () => {
  delete axiosInstance.defaults.headers.common["Authorization"];
  localStorage.removeItem('token'); // Supprimer le token du localStorage
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

  // Plus besoin de charger le token manuellement - les cookies sont automatiques

  // Vérifier l'authentification au chargement du composant
  useEffect(() => {
    // Fonction pour vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      // Vérifier si on est sur une page publique où l'authentification n'est pas requise
      const publicPages = [
        '/',
        '/connexion',
        '/inscription',
        '/forgot-password',
        '/reset-password',
        '/create-password',
        '/contact',
        '/politique-de-confidentialite',
        '/mentions-legales',
        '/oauth/callback'
      ];
      
      const currentPath = window.location.pathname;
      const isPublicPage = publicPages.includes(currentPath);
      
      // Sur les pages publiques, ne pas faire la vérification automatique
      if (isPublicPage) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Vérifier si on a un token dans localStorage (fallback)
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
      
      try {
        // Appel direct à l'API - le cookie sera automatiquement envoyé OU utiliser le header Authorization
        const response = await axiosInstance.get("/auth/me");

        if (response.data.success) {
          // S'assurer que l'ID est disponible dans le format attendu par le backend
          const userData = response.data.data;
          // Ajouter userId qui est attendu par le middleware d'authentification
          setUser({
            ...userData,
            userId: userData._id, // Assurer la cohérence avec le format attendu par le backend
            companyId: userData.companyId, // ✅ nécessaire pour filtrage multi-tenant (ex: collaborateurs, plannings)
          });
          setIsAuthenticated(true);
        } else {
          // Token invalide
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error: any) {
        // Gestion plus fine des erreurs pour éviter les redirections intempestives
        if (error?.response?.status === 429) {
          console.warn("Rate limit atteint, retry dans quelques secondes...");
          // Ne pas déconnecter l'utilisateur pour un rate limit
          setError("Trop de requêtes, veuillez patienter un moment");
          return;
        }
        
        if (error?.response?.status === 401) {
          console.log("Session expirée ou non authentifié");
        } else if (error?.code === 'ERR_NETWORK') {
          console.warn("Problème de connexion au serveur");
          setError("Vérifiez que le serveur backend est démarré (port 5050)");
          return; // Ne pas déconnecter pour un problème réseau
        } else {
          console.error("Erreur de vérification d'authentification:", error);
        }
        
        clearAuthHeaders();
        setUser(null);
        setIsAuthenticated(false);
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
        // Le token est maintenant automatiquement stocké dans un cookie httpOnly
        const { user, token } = response.data;

        // Fallback : si les cookies ne fonctionnent pas, utiliser localStorage + headers
        if (token) {
          localStorage.setItem('token', token);
          // Ajouter le token aux headers par défaut pour les futures requêtes
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        // Mettre à jour l'état en ajoutant userId pour la cohérence avec le backend
        setUser({
          ...user,
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
      // Appel à l'API de déconnexion pour supprimer le cookie httpOnly
      await axiosInstance.post("/auth/logout");

      // Nettoyer les headers et localStorage
      clearAuthHeaders();

      // Mettre à jour l'état
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Même si l'API échoue, on déconnecte l'utilisateur localement
      clearAuthHeaders();
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
      setLoading(true);

      // Appel direct à l'API - les cookies sont automatiquement envoyés
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
            userId: userData._id,
            photoUrl: updatedPhotoUrl,
            companyId: userData.companyId, // ✅ nécessaire pour filtrage multi-tenant (ex: collaborateurs, plannings)
          };
        });

        // Vérifier si le profil utilisateur est incomplet
        const isProfileIncomplete =
          !userData.companyId ||
          !userData.photoUrl ||
          !userData.firstName ||
          !userData.lastName;

        // Debug: Log des données pour comprendre pourquoi ça oscille
        console.log("🔍 Debug profil incomplet:", {
          companyId: userData.companyId,
          photoUrl: userData.photoUrl,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isProfileIncomplete
        });

        // Mettre à jour l'état shouldCompleteProfile seulement s'il a changé
        setShouldCompleteProfile(prevState => {
          if (prevState !== isProfileIncomplete) {
            console.log("🔄 shouldCompleteProfile changed:", prevState, "→", isProfileIncomplete);
            return isProfileIncomplete;
          }
          return prevState;
        });
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
