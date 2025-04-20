/**
 * LoginPage - Page de connexion utilisateur
 *
 * Permet aux utilisateurs de se connecter à l'application SmartPlanning
 * via email/mot de passe ou OAuth Google. Utilise les composants
 * du design system pour une expérience cohérente.
 */
import axios from "axios";
import { motion } from "framer-motion";
import { Key, LogIn, Mail } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormContainer from "../components/layout/FormContainer";
import PageWrapper from "../components/layout/PageWrapper";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import InputField from "../components/ui/InputField";
import ThemeToggle from "../components/ui/ThemeToggle";
import Toast from "../components/ui/Toast";
import { AuthContext } from "../context/AuthContext";

/**
 * Interface pour le formulaire de connexion
 */
interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Page de connexion
 */
const LoginPage: React.FC = () => {
  // État local pour le formulaire de connexion
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  // États pour l'UI
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Hooks de navigation et contexte d'authentification
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);

  // Éléments du fil d'ariane
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Connexion" },
  ];

  // Animation de transition pour les éléments du formulaire
  const formAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  };

  /**
   * Gestion de l'authentification OAuth via token dans l'URL
   */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      // Afficher un indicateur de chargement
      setLoading(true);

      try {
        // Stocker le token dans localStorage
        localStorage.setItem("token", token);

        // Décoder le token pour obtenir les informations utilisateur
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

        // Afficher un message de succès
        setSuccess("Connexion réussie!");
        setShowSuccessToast(true);

        // Rediriger selon le rôle après un court délai
        setTimeout(() => {
          if (user.role === "admin") {
            navigate("/dashboard/admin");
          } else if (user.role === "manager") {
            navigate("/dashboard/manager");
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
        setError("Erreur d'authentification. Veuillez réessayer.");
        setShowErrorToast(true);
        setLoading(false);
      }
    }
  }, [location, navigate, auth]);

  /**
   * Gestionnaire de changement de champ
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  /**
   * Gestionnaire de soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation basique
    if (!formData.email || !formData.password) {
      setError("Veuillez remplir tous les champs");
      setShowErrorToast(true);
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

      // Afficher le message de succès
      setSuccess("Connexion réussie!");
      setShowSuccessToast(true);

      // Rediriger selon le rôle après un court délai
      setTimeout(() => {
        if (user.role === "admin") {
          navigate("/dashboard/admin");
        } else if (user.role === "manager") {
          navigate("/dashboard/manager");
        } else {
          navigate("/dashboard");
        }
      }, 1500);
    } catch (error) {
      console.error("Erreur de connexion:", error);

      // Gérer les différents types d'erreurs
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || "Identifiants incorrects");
      } else {
        setError("Erreur de connexion. Veuillez réessayer.");
      }
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gestionnaire de connexion Google
   */
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Redirection vers l'API OAuth de Google
    window.location.href = `${
      process.env.REACT_APP_API_URL || "http://localhost:5000"
    }/api/auth/google`;
  };

  /**
   * Fermeture des notifications Toast
   */
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  return (
    <PageWrapper>
      {/* En-tête avec Breadcrumb et ThemeToggle */}
      <div className="flex justify-between items-center w-full mb-8">
        <Breadcrumb items={breadcrumbItems} />
        <ThemeToggle />
      </div>

      {/* Notifications Toast */}
      <Toast
        message={error || ""}
        type="error"
        isVisible={showErrorToast}
        onClose={closeErrorToast}
      />
      <Toast
        message={success || ""}
        type="success"
        isVisible={showSuccessToast}
        onClose={closeSuccessToast}
      />

      {/* Contenu principal */}
      <motion.div
        className="w-full max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <FormContainer>
          {/* En-tête du formulaire */}
          <motion.div
            className="text-center mb-8"
            variants={formAnimation}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Connexion à SmartPlanning
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Connectez-vous pour accéder à votre espace
            </p>
          </motion.div>

          {/* Formulaire de connexion */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <InputField
                name="email"
                type="email"
                label="Adresse email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                icon={<Mail size={18} />}
              />
            </motion.div>

            {/* Mot de passe */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              <InputField
                name="password"
                type="password"
                label="Mot de passe"
                placeholder="Votre mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                icon={<Key size={18} />}
              />
            </motion.div>

            {/* Options supplémentaires */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex items-center justify-between text-sm pt-1"
            >
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/30 border-[var(--border)] rounded"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 text-[var(--text-secondary)]"
                >
                  Se souvenir de moi
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-[var(--accent-primary)] hover:underline"
              >
                Mot de passe oublié?
              </Link>
            </motion.div>

            {/* Bouton de connexion */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={4}
              className="pt-4"
            >
              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                fullWidth
              >
                Se connecter
              </Button>
            </motion.div>

            {/* Séparateur */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={5}
              className="relative my-6"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--background-primary)] text-[var(--text-tertiary)]">
                  Ou continuer avec
                </span>
              </div>
            </motion.div>

            {/* Bouton Google */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={6}
            >
              <Button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                isLoading={googleLoading}
                variant="secondary"
                fullWidth
              >
                {!googleLoading && (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
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
                )}
                Continuer avec Google
              </Button>
            </motion.div>

            {/* Lien d'inscription */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={7}
              className="text-center mt-6"
            >
              <p className="text-sm text-[var(--text-secondary)]">
                Vous n'avez pas de compte ?{" "}
                <Link
                  to="/register"
                  className="text-[var(--accent-primary)] hover:underline font-medium"
                >
                  <span className="inline-flex items-center">
                    <LogIn size={14} className="mr-1" />
                    S'inscrire
                  </span>
                </Link>
              </p>
            </motion.div>
          </form>
        </FormContainer>
      </motion.div>
    </PageWrapper>
  );
};

export default LoginPage;
