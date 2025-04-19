import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// Utilisation du composant LoadingSpinner global
import LoadingSpinner from "../components/ui/LoadingSpinner";

// Types pour les données du formulaire
interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Types pour les composants d'UI réutilisables
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

// Composant Toast pour les notifications
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  // Fermeture automatique après 3 secondes
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [onClose]);

  const baseClasses =
    "fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-md";
  const typeClasses =
    type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white";

  return (
    <motion.div
      className={`${baseClasses} ${typeClasses}`}
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-100 focus:outline-none"
        aria-label="Fermer"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </motion.div>
  );
};

/**
 * Composant Page d'inscription
 * Permet la création d'un compte utilisateur avec validation des champs
 * et support pour l'authentification Google OAuth
 */
const RegisterPage: React.FC = () => {
  // État local pour le formulaire d'inscription
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // États pour l'UI
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Hook de navigation
  const navigate = useNavigate();

  // Gestionnaire de changement de champ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: value,
    });
  };

  // Gestionnaire de soumission du formulaire
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation basique
    if (
      !registerData.firstName ||
      !registerData.lastName ||
      !registerData.email ||
      !registerData.password ||
      !registerData.confirmPassword
    ) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    // Validation de la correspondance des mots de passe
    if (registerData.password !== registerData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      setError("Veuillez saisir une adresse email valide");
      return;
    }

    // Validation de la longueur du mot de passe
    if (registerData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Préparation des données à envoyer (sans confirmPassword)
      const { confirmPassword, ...dataToSend } = registerData;

      // Appel API pour l'inscription
      const response = await axios.post("/api/auth/register", dataToSend);

      // Succès de l'inscription
      setSuccess(
        response.data.message ||
          "Inscription réussie! Vous pouvez maintenant vous connecter."
      );

      // Redirection vers la page de connexion après 2 secondes
      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Votre compte a été créé avec succès. Veuillez vous connecter.",
          },
        });
      }, 2000);
    } catch (error) {
      console.error("Erreur d'inscription:", error);

      // Gérer les différents types d'erreurs
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || "Erreur lors de l'inscription");
      } else {
        setError(
          "Une erreur s'est produite lors de l'inscription. Veuillez réessayer."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire pour l'inscription avec Google
  const handleGoogleRegister = () => {
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
            Créer un compte SmartPlanning
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inscrivez-vous pour accéder à toutes les fonctionnalités
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Champ Prénom */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                Prénom
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={registerData.firstName}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Votre prénom"
                disabled={loading}
              />
            </div>

            {/* Champ Nom */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Nom
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={registerData.lastName}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Votre nom"
                disabled={loading}
              />
            </div>

            {/* Champ Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={registerData.email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Votre adresse email"
                disabled={loading}
              />
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={registerData.password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Votre mot de passe (min. 6 caractères)"
                disabled={loading}
              />
            </div>

            {/* Champ Confirmation du mot de passe */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={registerData.confirmPassword}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirmez votre mot de passe"
                disabled={loading}
              />
            </div>
          </div>

          {/* Bouton d'inscription */}
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
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  S'inscrire
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* Séparateur */}
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
        </div>

        {/* Bouton Google */}
        <div className="mt-6">
          <motion.button
            type="button"
            onClick={handleGoogleRegister}
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

        {/* Lien vers la page de connexion */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Déjà inscrit ?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
