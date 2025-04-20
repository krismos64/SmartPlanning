/**
 * RegisterPage - Page d'inscription utilisateur
 *
 * Permet la création d'un compte utilisateur avec validation des champs
 * et support pour l'authentification Google OAuth. Utilise les composants
 * du design system SmartPlanning pour une expérience cohérente.
 */
import axios from "axios";
import { motion } from "framer-motion";
import { LogIn, Mail, User } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormContainer from "../components/layout/FormContainer";
import PageWrapper from "../components/layout/PageWrapper";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import InputField from "../components/ui/InputField";
import ThemeToggle from "../components/ui/ThemeToggle";
import Toast from "../components/ui/Toast";

/**
 * Interface pour le formulaire d'inscription
 */
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: "manager" | "employee";
}

/**
 * Page d'inscription
 */
const RegisterPage: React.FC = () => {
  // État local pour le formulaire d'inscription
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    role: "manager",
  });

  // États pour l'UI
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

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
      setError("Veuillez remplir tous les champs obligatoires");
      setShowErrorToast(true);
      return;
    }

    // Validation de la correspondance des mots de passe
    if (registerData.password !== registerData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setShowErrorToast(true);
      return;
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      setError("Veuillez saisir une adresse email valide");
      setShowErrorToast(true);
      return;
    }

    // Validation de la longueur du mot de passe
    if (registerData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setShowErrorToast(true);
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
          "Inscription réussie! Redirection vers le tableau de bord..."
      );
      setShowSuccessToast(true);

      // Redirection vers le dashboard après 2 secondes
      setTimeout(() => {
        navigate("/dashboard");
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
      setShowErrorToast(true);
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
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  // Éléments du fil d'ariane
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Inscription" },
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

  return (
    <PageWrapper>
      {/* Zone Header avec Breadcrumb et ThemeToggle */}
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
              Créer un compte SmartPlanning
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Inscrivez-vous pour accéder à toutes les fonctionnalités
            </p>
          </motion.div>

          {/* Formulaire d'inscription */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Prénom */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <InputField
                id="firstName"
                name="firstName"
                type="text"
                label="Prénom"
                placeholder="Votre prénom"
                value={registerData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
                icon={<User size={18} />}
              />
            </motion.div>

            {/* Nom */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              <InputField
                id="lastName"
                name="lastName"
                type="text"
                label="Nom"
                placeholder="Votre nom"
                value={registerData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
                icon={<User size={18} />}
              />
            </motion.div>

            {/* Email */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <InputField
                id="email"
                name="email"
                type="email"
                label="Adresse email"
                placeholder="votre@email.com"
                value={registerData.email}
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
              custom={4}
            >
              <InputField
                id="password"
                name="password"
                type="password"
                label="Mot de passe"
                placeholder="Minimum 6 caractères"
                value={registerData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </motion.div>

            {/* Confirmation mot de passe */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={5}
            >
              <InputField
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirmer le mot de passe"
                placeholder="Confirmez votre mot de passe"
                value={registerData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </motion.div>

            {/* Bouton de soumission */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={6}
              className="pt-2"
            >
              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                fullWidth
              >
                S'inscrire
              </Button>
            </motion.div>

            {/* Séparateur */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={7}
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
              custom={8}
            >
              <Button
                onClick={handleGoogleRegister}
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

            {/* Lien vers connexion */}
            <motion.div
              variants={formAnimation}
              initial="hidden"
              animate="visible"
              custom={9}
              className="text-center mt-6"
            >
              <p className="text-sm text-[var(--text-secondary)]">
                Déjà inscrit ?{" "}
                <Link
                  to="/login"
                  className="text-[var(--accent-primary)] hover:underline font-medium"
                >
                  <span className="inline-flex items-center">
                    <LogIn size={14} className="mr-1" />
                    Se connecter
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

export default RegisterPage;
