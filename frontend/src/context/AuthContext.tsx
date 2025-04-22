import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
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
  // Fonction pour connecter l'utilisateur
  login: (email: string, password: string) => Promise<void>;
  // Fonction pour déconnecter l'utilisateur
  logout: () => Promise<void>;
}

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

  // Vérifier l'authentification au chargement du composant
  useEffect(() => {
    // Fonction pour vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      setLoading(true);
      try {
        // Récupérer l'utilisateur depuis le localStorage (ou un token)
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          // Si l'utilisateur est stocké, vérifier la validité du token
          try {
            // Appel à l'API pour vérifier le token (endpoint fictif)
            // const response = await axios.get('/api/auth/verify-token');
            // Simuler une vérification réussie
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            // Token invalide ou expiré
            localStorage.removeItem("user");
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // Aucun utilisateur stocké
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        setError("Erreur lors de la vérification de l'authentification");
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
      // Appel à l'API d'authentification (à remplacer par votre API réelle)
      // const response = await axios.post('/api/auth/login', { email, password });

      // Simulation d'une réponse API pour démonstration
      const mockUser: User = {
        _id: "123",
        firstName: "John",
        lastName: "Doe",
        email: email,
        role: email.includes("admin") ? "admin" : "employé",
        status: "active",
        createdAt: new Date().toISOString(),
      };

      // Stocker l'utilisateur dans le localStorage
      localStorage.setItem("user", JSON.stringify(mockUser));

      // Mettre à jour l'état
      setUser(mockUser);
      setIsAuthenticated(true);
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
      // Appel à l'API de déconnexion (si nécessaire)
      // await axios.post('/api/auth/logout');

      // Supprimer l'utilisateur du localStorage
      localStorage.removeItem("user");

      // Mettre à jour l'état
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      setError("Erreur lors de la déconnexion");
      throw error;
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
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
