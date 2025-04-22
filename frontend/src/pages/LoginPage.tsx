/**
 * LoginPage - Page de connexion utilisateur
 *
 * Permet aux utilisateurs de se connecter à l'application SmartPlanning
 * via email/mot de passe ou OAuth Google. Utilise les composants
 * du design system pour une expérience cohérente.
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

const RememberForgotRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CheckboxLabel = styled.label<{ isDarkMode?: boolean }>`
  font-size: 0.875rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  cursor: pointer;
`;

const ForgotPassword = styled(Link)<{ isDarkMode?: boolean }>`
  font-size: 0.875rem;
  color: #4f46e5;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    text-decoration: underline;
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

const RegisterLink = styled.div<{ isDarkMode?: boolean }>`
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

const LoginPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simuler un appel API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Login submitted:", formData);
      // Naviguer vers le dashboard après connexion
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
    // Logique d'authentification Google
  };

  return (
    <>
      <Helmet>
        <title>Connexion - SmartPlanning</title>
        <meta
          name="description"
          content="Connectez-vous à votre compte SmartPlanning pour accéder à votre espace de gestion."
        />
      </Helmet>

      <Header />

      <PageWrapper>
        <FormContainer
          title="Connexion à SmartPlanning"
          description="Accédez à votre espace de gestion de planning"
        >
          <Form onSubmit={handleSubmit}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
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
              </FormGroup>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
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
              </FormGroup>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <RememberForgotRow>
                <CheckboxContainer>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <CheckboxLabel htmlFor="rememberMe" isDarkMode={isDarkMode}>
                    Se souvenir de moi
                  </CheckboxLabel>
                </CheckboxContainer>

                <ForgotPassword to="/reset-password" isDarkMode={isDarkMode}>
                  Mot de passe oublié ?
                </ForgotPassword>
              </RememberForgotRow>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <StyledButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </StyledButton>
            </motion.div>
          </Form>

          <Divider isDarkMode={isDarkMode}>
            <span>ou</span>
          </Divider>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <GoogleButton
              type="button"
              onClick={handleGoogleLogin}
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

          <RegisterLink isDarkMode={isDarkMode}>
            Pas encore inscrit ?<Link to="/register">Créer un compte</Link>
          </RegisterLink>
        </FormContainer>
      </PageWrapper>

      <Footer />
    </>
  );
};

export default LoginPage;
