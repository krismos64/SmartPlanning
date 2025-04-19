import axios from "axios";
import React, { createContext, useEffect, useState } from "react";

// Type pour l'utilisateur
export interface User {
  id: string;
  email: string;
  role: "admin" | "manager" | "user";
  firstName: string;
  lastName: string;
}

// Type pour le contexte d'authentification
export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Création du contexte avec des valeurs par défaut
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

// Props pour le composant AuthProvider
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Fournisseur de contexte d'authentification
 * Gère l'état d'authentification global de l'application
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // États pour gérer l'authentification
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Effet pour vérifier l'authentification au chargement et quand le token change
  useEffect(() => {
    const verifyToken = async () => {
      // Si pas de token, on arrête le chargement et on n'est pas authentifié
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Configuration de l'en-tête Authorization pour axios
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Appel à l'API pour vérifier le token et récupérer les données utilisateur
        const response = await axios.get("/api/auth/me");

        if (response.data.success) {
          // Utilisateur authentifié
          setUser(response.data.data);
          setIsAuthenticated(true);
        } else {
          // Token invalide, suppression du token et déconnexion
          logout();
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        // En cas d'erreur, on déconnecte l'utilisateur
        logout();
      }

      setLoading(false);
    };

    verifyToken();
  }, [token]);

  /**
   * Connecter un utilisateur
   * @param userData Données de l'utilisateur
   * @param userToken Token JWT
   */
  const login = (userData: User, userToken: string) => {
    // Enregistrer le token dans le localStorage
    localStorage.setItem("token", userToken);

    // Configurer l'en-tête pour tous les futurs appels axios
    axios.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;

    // Mettre à jour l'état
    setToken(userToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  /**
   * Déconnecter l'utilisateur
   */
  const logout = () => {
    // Supprimer le token du localStorage
    localStorage.removeItem("token");

    // Supprimer l'en-tête d'autorisation
    delete axios.defaults.headers.common["Authorization"];

    // Réinitialiser l'état
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Valeur du contexte à fournir aux composants enfants
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
