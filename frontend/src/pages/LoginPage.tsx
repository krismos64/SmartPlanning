import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Toast from "../components/ui/Toast"; // Import du composant Toast global

// Contexte d'authentification (à importer depuis votre AuthContext)
import { AuthContext } from "../context/AuthContext";
// Utilisation du composant LoadingSpinner global
import LoadingSpinner from "../components/ui/LoadingSpinner";

// Types pour les composants d'UI réutilisables
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

// Interface pour le formulaire de connexion
interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Composant Page de Connexion
 * Gère la connexion par email/mot de passe et l'authentification Google OAuth
 */
const LoginPage: React.FC = () => {
  // État local pour le formulaire de connexion
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  // États pour l'UI
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Hooks de navigation et contexte d'authentification
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);

  // Récupération du token JWT dans l'URL (pour OAuth)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      // Stocker le token dans localStorage
      localStorage.setItem("token", token);

      // Décoder le token pour obtenir les informations utilisateur
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );

        const { user } = JSON.parse(jsonPayload);

        // Mettre à jour le contexte d'authentification
        auth.login(user, token);

        // Rediriger selon le rôle
        if (user.role === "admin") {
          navigate("/dashboard/admin");
        } else if (user.role === "manager") {
          navigate("/dashboard/manager");
        } else {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
        setError("Erreur d'authentification. Veuillez réessayer.");
      }
    }
  }, [location, navigate, auth]);

  // Gestionnaire de changement de champ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation basique
    if (!formData.email || !formData.password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Appel API pour la connexion
      const response = await axios.post("/api/auth/login", formData);

      const { token, user } = response.data;

      // Stocker le token dans localStorage
      localStorage.setItem("token", token);

      // Mettre à jour le contexte d'authentification
      auth.login(user, token);

      setSuccess("Connexion réussie!");

      // Rediriger selon le rôle
      setTimeout(() => {
        if (user.role === "admin") {
          navigate("/dashboard/admin");
        } else if (user.role === "manager") {
          navigate("/dashboard/manager");
        } else {
          navigate("/dashboard");
        }
      }, 1000);
    } catch (error) {
      console.error("Erreur de connexion:", error);

      // Gérer les différents types d'erreurs
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || "Identifiants incorrects");
      } else {
        setError("Erreur de connexion. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire de connexion Google
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Redirection vers l'API OAuth de Google
    window.location.href = `${
      process.env.REACT_APP_API_URL || "http://localhost:5000"
    }/api/auth/google`;
  };

  // Fermer les notifications
  const closeNotification = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <Toast message={error} type="error" onClose={closeNotification} />
        )}
        {success && (
          <Toast message={success} type="success" onClose={closeNotification} />
        )}
      </AnimatePresence>

      <motion.div
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à SmartPlanning
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember_me"
                className="ml-2 block text-sm text-gray-900"
              >
                Se souvenir de moi
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Mot de passe oublié?
              </a>
            </div>
          </div>

          <div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg
                      className="h-5 w-5 text-blue-500 group-hover:text-blue-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  Se connecter
                </>
              )}
            </motion.button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Ou continuer avec
              </span>
            </div>
          </div>

          <div className="mt-6">
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={googleLoading}
            >
              {googleLoading ? (
                <span className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Connexion via Google...</span>
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      fill="white"
                    />
                    <path
                      d="M22 12.0001C22 10.8701 21.8599 9.74009 21.5899 8.67009H12.0099V12.4201H17.5699C17.3299 13.5601 16.6599 14.4901 15.6899 15.1001V17.5701H19.0099C21.0099 15.9901 22 14.2301 22 12.0001Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12.01 22C14.97 22 17.47 21.06 19.01 19.57L15.69 17.1C14.74 17.77 13.49 18.18 12.01 18.18C9.09 18.18 6.64 16.31 5.75 13.78H2.31V16.32C3.84 19.69 7.63 22 12.01 22Z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.75 13.7801C5.54 13.1901 5.43 12.5701 5.43 11.9901C5.43 11.4001 5.55 10.7901 5.75 10.2001V7.66016H2.31C1.62 9.06016 1.25 10.6002 1.25 12.0002C1.25 13.4002 1.62 14.9402 2.31 16.3402L5.75 13.7801Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.01 5.81C13.54 5.81 14.92 6.34 16.02 7.39L18.95 4.46C17.47 3.09 14.97 2.25 12.01 2.25C7.63 2.25 3.84 4.56 2.31 7.92L5.75 10.46C6.64 7.93 9.09 5.81 12.01 5.81Z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuer avec Google
                </span>
              )}
            </motion.button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Vous n'avez pas de compte?{" "}
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              S'inscrire
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
