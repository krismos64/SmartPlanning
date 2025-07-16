import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Props pour le composant PrivateRoute
 */
interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * Composant de route privée
 * Protège l'accès aux routes en vérifiant l'état d'authentification
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié
 * Affiche un loader pendant la vérification de l'authentification
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // Récupération du contexte d'authentification
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const location = useLocation();

  // Affichage du loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirection vers la page de connexion si l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  // Vérifier si l'utilisateur doit compléter son profil
  // Ne pas rediriger si l'utilisateur est déjà sur la page de complétion de profil
  if (user && user.profileCompleted === false && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }

  // Si l'utilisateur est authentifié, afficher le contenu de la route
  return <>{children}</>;
};

export default PrivateRoute;
