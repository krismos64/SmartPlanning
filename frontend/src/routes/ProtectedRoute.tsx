import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types/User";

interface ProtectedRouteProps {
  /**
   * Rôle requis pour accéder à cette route (optionnel)
   * Si non défini, seule l'authentification est vérifiée
   */
  requiredRole?: UserRole;
}

/**
 * Composant de protection de routes qui vérifie:
 * 1. Si l'utilisateur est authentifié
 * 2. Si l'utilisateur a le rôle requis (si spécifié)
 *
 * Redirige vers la page de connexion si non authentifié
 * Redirige vers le tableau de bord si authentifié mais sans les permissions
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  // Récupération de l'état d'authentification et des infos utilisateur
  const { user, isAuthenticated, loading } = useAuth();

  // Récupération de la location courante pour redirection post-login
  const location = useLocation();

  // Affichage d'un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-indigo-600">Chargement...</span>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  // en conservant la location d'origine pour redirection post-login
  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  // Si un rôle spécifique est requis et que l'utilisateur n'a pas ce rôle
  // rediriger vers le tableau de bord
  if (requiredRole && user && user.role !== requiredRole) {
    return <Navigate to="/tableau-de-bord" replace />;
  }

  // Si toutes les vérifications sont passées, afficher le contenu protégé
  return <Outlet />;
};

export default ProtectedRoute;
