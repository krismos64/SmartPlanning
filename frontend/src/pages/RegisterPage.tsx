/**
 * RegisterPage - Page d'inscription utilisateur
 *
 * Permet la création d'un compte utilisateur avec validation des champs
 * et support pour l'authentification Google OAuth. Utilise les composants
 * du design system SmartPlanning pour une expérience cohérente.
 */
import { motion } from "framer-motion";
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useTheme } from "../components/ThemeProvider";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import PageWrapper from "../components/layout/PageWrapper";
import Button from "../components/ui/Button";
import FormContainer from "../components/ui/FormContainer";
import InputField from "../components/ui/InputField";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const TermsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const TermsLabel = styled.label<{ isDarkMode?: boolean }>`
  font-size: 0.875rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  cursor: pointer;

  a {
    color: #4f46e5;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledButton = styled(Button)`
  margin-top: 1rem;
  width: 100%;
`;

const Divider = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid
      ${({ isDarkMode }) => (isDarkMode ? "#2D3748" : "#E2E8F0")};
  }

  span {
    padding: 0 1rem;
    font-size: 0.875rem;
    color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  }
`;

const GoogleButton = styled.button<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#1A2234" : "#FFFFFF")};
  border: 1px solid ${({ isDarkMode }) => (isDarkMode ? "#2D3748" : "#E2E8F0")};
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ isDarkMode }) =>
      isDarkMode ? "#242f48" : "#F8F9FA"};
  }
`;

const LoginLink = styled.div<{ isDarkMode?: boolean }>`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};

  a {
    color: #4f46e5;
    text-decoration: none;
    margin-left: 0.25rem;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const RegisterPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field when the user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms =
        "Vous devez accepter les conditions d'utilisation";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simuler un appel API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Registration submitted:", formData);
      // Naviguer vers le dashboard après inscription
      navigate("/tableau-de-bord");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    console.log("Google registration clicked");
    // Logique d'authentification Google
  };

  return (
    <>
      <Helmet>
        <title>Inscription - SmartPlanning</title>
        <meta
          name="description"
          content="Créez votre compte SmartPlanning pour accéder à notre solution de gestion de planning innovante."
        />
      </Helmet>

      <Header />

      <PageWrapper>
        <FormContainer
          title="Créer un compte SmartPlanning"
          description="Rejoignez-nous et découvrez une nouvelle façon de gérer vos plannings"
        >
          <Form onSubmit={handleSubmit}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <FormRow>
                <FormGroup>
                  <InputField
                    type="text"
                    label="Prénom"
                    name="firstName"
                    placeholder="Votre prénom"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                  {errors.firstName && (
                    <ErrorMessage>{errors.firstName}</ErrorMessage>
                  )}
                </FormGroup>

                <FormGroup>
                  <InputField
                    type="text"
                    label="Nom"
                    name="lastName"
                    placeholder="Votre nom"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                  {errors.lastName && (
                    <ErrorMessage>{errors.lastName}</ErrorMessage>
                  )}
                </FormGroup>
              </FormRow>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <FormGroup>
                <InputField
                  type="email"
                  label="Adresse email"
                  name="email"
                  placeholder="votre.email@exemple.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
              </FormGroup>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <FormGroup>
                <InputField
                  type="password"
                  label="Mot de passe"
                  name="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {errors.password && (
                  <ErrorMessage>{errors.password}</ErrorMessage>
                )}
              </FormGroup>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <FormGroup>
                <InputField
                  type="password"
                  label="Confirmer le mot de passe"
                  name="confirmPassword"
                  placeholder="********"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && (
                  <ErrorMessage>{errors.confirmPassword}</ErrorMessage>
                )}
              </FormGroup>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <TermsContainer>
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                />
                <TermsLabel htmlFor="acceptTerms" isDarkMode={isDarkMode}>
                  J'accepte les{" "}
                  <Link to="/mentions-legales">conditions d'utilisation</Link>{" "}
                  et la{" "}
                  <Link to="/politique-de-confidentialite">
                    politique de confidentialité
                  </Link>
                </TermsLabel>
              </TermsContainer>
              {errors.acceptTerms && (
                <ErrorMessage>{errors.acceptTerms}</ErrorMessage>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <StyledButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Inscription en cours..." : "S'inscrire"}
              </StyledButton>
            </motion.div>
          </Form>

          <Divider isDarkMode={isDarkMode}>
            <span>ou</span>
          </Divider>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <GoogleButton
              type="button"
              onClick={handleGoogleRegister}
              isDarkMode={isDarkMode}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
                  fill="#34A853"
                />
                <path
                  d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
                  fill="#EA4335"
                />
              </svg>
              Continuer avec Google
            </GoogleButton>
          </motion.div>

          <LoginLink isDarkMode={isDarkMode}>
            Déjà un compte ?<Link to="/connexion">Se connecter</Link>
          </LoginLink>
        </FormContainer>
      </PageWrapper>

      <Footer />
    </>
  );
};

export default RegisterPage;
