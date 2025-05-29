import { motion } from "framer-motion";
import { ArrowLeft, Loader, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import PageWrapper from "../components/layout/PageWrapper";
import SEO from "../components/layout/SEO";
import { useTheme } from "../components/ThemeProvider";
import Button from "../components/ui/Button";
import FormContainer from "../components/ui/FormContainer";
import PasswordField from "../components/ui/PasswordField";
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
  position: relative;
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

const PasswordRequirements = styled.div<{ isDarkMode?: boolean }>`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#1E293B" : "#F8FAFC")};
  border: 1px solid ${({ isDarkMode }) => (isDarkMode ? "#334155" : "#E2E8F0")};
`;

const RequirementItem = styled.div<{ isMet: boolean; isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: ${({ isMet, isDarkMode }) =>
    isMet ? "#22c55e" : isDarkMode ? "#94A3B8" : "#64748B"};

  svg {
    margin-right: 0.5rem;
    color: ${({ isMet }) => (isMet ? "#22c55e" : "#cbd5e1")};
  }
`;

const IconButton = styled.button`
  position: absolute;
  right: 10px;
  top: 35px;
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #334155;
  }
`;

const SuccessMessage = styled.div<{ isDarkMode?: boolean }>`
  text-align: center;
  margin-bottom: 1.5rem;

  svg {
    color: #22c55e;
    margin-bottom: 1rem;
  }

  h2 {
    color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1E293B")};
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#64748B")};
  }
`;

const ResetPasswordPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showSuccessToast, showErrorToast, hideToast } = useToast();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  // Extraire les paramètres d'URL
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Validation du mot de passe
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    const emailParam = params.get("email");

    if (!tokenParam || !emailParam) {
      showErrorToast("Lien de réinitialisation invalide. Veuillez réessayer.");
      navigate("/forgot-password");
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);
  }, [location, navigate, showErrorToast]);

  useEffect(() => {
    const { newPassword } = formData;

    setPasswordChecks({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[@$!%*?&]/.test(newPassword),
    });
  }, [formData.newPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Effacer l'erreur quand l'utilisateur commence à taper
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
    const { newPassword, confirmPassword } = formData;

    // Vérifier que tous les critères de mot de passe sont respectés
    const isValidPassword =
      passwordChecks.length &&
      passwordChecks.uppercase &&
      passwordChecks.lowercase &&
      passwordChecks.number &&
      passwordChecks.special;

    if (!isValidPassword) {
      newErrors.newPassword =
        "Votre mot de passe ne répond pas aux exigences de sécurité.";
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
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
      if (!token || !email) {
        throw new Error("Paramètres manquants");
      }

      await passwordService.resetPassword(email, token, formData.newPassword);
      setResetComplete(true);
      showSuccessToast("Votre mot de passe a été réinitialisé avec succès.");
    } catch (error: any) {
      console.error("Erreur:", error);
      showErrorToast(
        error.response?.data?.message ||
          "Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Réinitialisation de mot de passe - SmartPlanning"
        description="Définissez un nouveau mot de passe pour votre compte SmartPlanning"
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
          title="Réinitialisation du mot de passe"
          description={
            !resetComplete
              ? "Choisissez un nouveau mot de passe sécurisé pour votre compte"
              : ""
          }
        >
          <BackLink to="/connexion" isDarkMode={isDarkMode}>
            <ArrowLeft size={16} />
            Retour à la connexion
          </BackLink>

          {!resetComplete ? (
            <Form onSubmit={handleSubmit}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <FormGroup>
                  <PasswordField
                    label="Nouveau mot de passe"
                    name="newPassword"
                    placeholder="••••••••••••"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className="dark-input reset-password-field"
                  />
                  {errors.newPassword && (
                    <ErrorMessage>{errors.newPassword}</ErrorMessage>
                  )}
                </FormGroup>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <FormGroup>
                  <PasswordField
                    label="Confirmer le mot de passe"
                    name="confirmPassword"
                    placeholder="••••••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="dark-input reset-password-field"
                  />
                  {errors.confirmPassword && (
                    <ErrorMessage>{errors.confirmPassword}</ErrorMessage>
                  )}
                </FormGroup>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <PasswordRequirements isDarkMode={isDarkMode}>
                  <RequirementItem
                    isMet={passwordChecks.length}
                    isDarkMode={isDarkMode}
                  >
                    <ShieldCheck size={14} />
                    Au moins 8 caractères
                  </RequirementItem>
                  <RequirementItem
                    isMet={passwordChecks.uppercase}
                    isDarkMode={isDarkMode}
                  >
                    <ShieldCheck size={14} />
                    Au moins 1 lettre majuscule
                  </RequirementItem>
                  <RequirementItem
                    isMet={passwordChecks.lowercase}
                    isDarkMode={isDarkMode}
                  >
                    <ShieldCheck size={14} />
                    Au moins 1 lettre minuscule
                  </RequirementItem>
                  <RequirementItem
                    isMet={passwordChecks.number}
                    isDarkMode={isDarkMode}
                  >
                    <ShieldCheck size={14} />
                    Au moins 1 chiffre
                  </RequirementItem>
                  <RequirementItem
                    isMet={passwordChecks.special}
                    isDarkMode={isDarkMode}
                  >
                    <ShieldCheck size={14} />
                    Au moins 1 caractère spécial (@, $, !, %, *, ?, &)
                  </RequirementItem>
                </PasswordRequirements>
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
                >
                  {isLoading ? (
                    <>
                      <Loader size={16} className="animate-spin mr-2" />
                      Réinitialisation en cours...
                    </>
                  ) : (
                    "Réinitialiser mon mot de passe"
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
              <SuccessMessage isDarkMode={isDarkMode}>
                <ShieldCheck size={48} />
                <h2>Mot de passe réinitialisé !</h2>
                <p>Votre mot de passe a été réinitialisé avec succès.</p>
              </SuccessMessage>

              <StyledButton
                type="button"
                variant="primary"
                size="lg"
                onClick={() => navigate("/connexion")}
              >
                Se connecter
              </StyledButton>
            </motion.div>
          )}
        </FormContainer>
      </PageWrapper>

      <Footer />
    </>
  );
};

export default ResetPasswordPage;
