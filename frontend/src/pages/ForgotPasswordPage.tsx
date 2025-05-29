import { motion } from "framer-motion";
import { ArrowLeft, Loader } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";

import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import PageWrapper from "../components/layout/PageWrapper";
import SEO from "../components/layout/SEO";
import { useTheme } from "../components/ThemeProvider";
import Button from "../components/ui/Button";
import FormContainer from "../components/ui/FormContainer";
import InputField from "../components/ui/InputField";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { passwordService } from "../services/api";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const BackLink = styled(Link)<{ isDarkMode?: boolean }>`
  display: inline-flex;
  align-items: center;
  margin-bottom: 1.5rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#64748B")};
  font-size: 0.875rem;
  text-decoration: none;

  &:hover {
    color: ${({ isDarkMode }) => (isDarkMode ? "#E2E8F0" : "#334155")};
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const StyledButton = styled(Button)`
  margin-top: 1rem;
  width: 100%;
`;

const SuccessMessageContainer = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const SuccessText = styled.p<{ isDarkMode?: boolean }>`
  margin-bottom: 1rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#64748B")};
`;

const ForgotPasswordPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { toast, showSuccessToast, showErrorToast, hideToast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("L'adresse email est requise");
      return;
    }

    if (!validateEmail(email)) {
      setError("Format d'adresse email invalide");
      return;
    }

    setIsLoading(true);

    try {
      await passwordService.forgotPassword(email);
      setEmailSent(true);
      showSuccessToast(
        "Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé."
      );
    } catch (error: any) {
      console.error("Erreur:", error);
      showErrorToast(
        error.response?.data?.message ||
          "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Mot de passe oublié - SmartPlanning"
        description="Réinitialisez votre mot de passe SmartPlanning"
      />

      <Header />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
        position="top-center"
        duration={5000}
      />

      <PageWrapper>
        <FormContainer
          title="Mot de passe oublié"
          description="Saisissez votre adresse email pour recevoir un lien de réinitialisation"
        >
          <BackLink to="/connexion" isDarkMode={isDarkMode}>
            <ArrowLeft size={16} />
            Retour à la connexion
          </BackLink>

          {!emailSent ? (
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="dark-input forgot-password-field"
                  />
                  {error && <ErrorMessage>{error}</ErrorMessage>}
                </FormGroup>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <StyledButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size={16} className="animate-spin mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le lien de réinitialisation"
                  )}
                </StyledButton>
              </motion.div>
            </Form>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <SuccessMessageContainer>
                <SuccessText isDarkMode={isDarkMode}>
                  Si un compte existe avec cette adresse email, un email de
                  réinitialisation a été envoyé.
                </SuccessText>
                <SuccessText isDarkMode={isDarkMode}>
                  Veuillez vérifier votre boîte de réception et vos spams.
                </SuccessText>
              </SuccessMessageContainer>

              <StyledButton
                type="button"
                variant="primary"
                size="lg"
                onClick={() => navigate("/connexion")}
              >
                Retourner à la connexion
              </StyledButton>
            </motion.div>
          )}
        </FormContainer>
      </PageWrapper>

      <Footer />
    </>
  );
};

export default ForgotPasswordPage;
