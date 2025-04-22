import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Hook personnalisé pour accéder au contexte d'authentification
 *
 * Fournit un accès facile à:
 * - user: l'utilisateur actuellement connecté ou null
 * - isAuthenticated: booléen indiquant si l'utilisateur est authentifié
 * - loading: booléen indiquant si l'authentification est en cours de vérification
 * - login, logout: fonctions pour gérer l'authentification
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth doit être utilisé à l'intérieur d'un AuthProvider"
    );
  }

  return context;
};
