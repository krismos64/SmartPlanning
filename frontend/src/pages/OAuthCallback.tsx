import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

/**
 * Composant qui gère la redirection après l'authentification OAuth
 * Récupère le token JWT de l'URL et l'enregistre dans le localStorage
 */
const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser, shouldCompleteProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processOAuthRedirect = async () => {
      try {
        // Récupérer les paramètres de l'URL
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get("token");
        const errorParam = queryParams.get("error");

        // Gérer les erreurs d'authentification
        if (errorParam) {
          console.error("Erreur OAuth:", errorParam);
          setError(
            errorParam === "googleauth"
              ? "Échec de l'authentification Google."
              : errorParam === "usernotfound"
              ? "Utilisateur non trouvé."
              : "Une erreur est survenue lors de l'authentification."
          );
          setTimeout(() => navigate("/connexion", { replace: true }), 3000);
          return;
        }

        // Vérifier si le token est présent
        if (!token) {
          console.error("Token manquant dans la redirection OAuth");
          setError("Échec de l'authentification: token manquant.");
          setTimeout(() => navigate("/connexion", { replace: true }), 3000);
          return;
        }

        // Enregistrer le token dans le localStorage
        localStorage.setItem("token", token);

        // Rafraîchir les données utilisateur
        await refreshUser();

        // Nettoyer l'URL (supprimer le token de l'URL pour des raisons de sécurité)
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        // Rediriger l'utilisateur en fonction de l'état de son profil
        navigate(
          shouldCompleteProfile ? "/complete-profile" : "/tableau-de-bord",
          { replace: true }
        );
      } catch (err) {
        console.error(
          "Erreur lors du traitement de la redirection OAuth:",
          err
        );
        setError("Une erreur est survenue lors de la connexion.");
        setTimeout(() => navigate("/connexion", { replace: true }), 3000);
      }
    };

    processOAuthRedirect();
  }, [location.search, navigate, refreshUser, shouldCompleteProfile]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      {error ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Échec de l'authentification
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Redirection vers la page de connexion...
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <LoadingSpinner size="lg" className="text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentification en cours...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Veuillez patienter pendant que nous traitons votre connexion.
          </p>
        </div>
      )}
    </div>
  );
};

export default OAuthCallback;
