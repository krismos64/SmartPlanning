import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Loader,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import PageWrapper from "../components/layout/PageWrapper";
import { useTheme } from "../components/ThemeProvider";
import Button from "../components/ui/Button";
import FormContainer from "../components/ui/FormContainer";
import InputField from "../components/ui/InputField";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";

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

const IconButton = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #374151;
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

const RequirementsList = styled.ul`
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
  list-style: none;
`;

const RequirementItem = styled.li<{ met: boolean; isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  color: ${({ met, isDarkMode }) => {
    if (met) return "#10B981";
    return isDarkMode ? "#94A3B8" : "#6B7280";
  }};
  font-size: 0.875rem;

  &::before {
    content: "${({ met }) => (met ? "✓" : "○")}";
    margin-right: 0.5rem;
    font-weight: bold;
  }
`;

const WelcomeMessage = styled.div<{ isDarkMode?: boolean }>`
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#1E293B" : "#EFF6FF")};
  border: 1px solid ${({ isDarkMode }) => (isDarkMode ? "#334155" : "#DBEAFE")};
`;

const WelcomeTitle = styled.h2<{ isDarkMode?: boolean }>`
  color: ${({ isDarkMode }) => (isDarkMode ? "#60A5FA" : "#2563EB")};
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const WelcomeText = styled.p<{ isDarkMode?: boolean }>`
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#64748B")};
  margin: 0;
  font-size: 1rem;
`;

const SuccessContainer = styled.div`
  text-align: center;
  padding: 2rem 0;
`;

const SuccessIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
`;

const SuccessTitle = styled.h2<{ isDarkMode?: boolean }>`
  color: ${({ isDarkMode }) => (isDarkMode ? "#E5E7EB" : "#111827")};
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const SuccessText = styled.p<{ isDarkMode?: boolean }>`
  color: ${({ isDarkMode }) => (isDarkMode ? "#9CA3AF" : "#6B7280")};
  margin: 0 0 2rem 0;
  font-size: 1rem;
`;

const CreatePasswordPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showSuccessToast, showErrorToast, hideToast } = useToast();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordCreated, setPasswordCreated] = useState(false);

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
      showErrorToast("Lien de création de mot de passe invalide.");
      navigate("/connexion");
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);
  }, [location, navigate, showErrorToast]);

  useEffect(() => {
    const { password } = formData;

    setPasswordChecks({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    });
  }, [formData.password]);

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
    const { password, confirmPassword } = formData;

    // Vérifier que tous les critères de mot de passe sont respectés
    const isValidPassword =
      passwordChecks.length &&
      passwordChecks.uppercase &&
      passwordChecks.lowercase &&
      passwordChecks.number &&
      passwordChecks.special;

    if (!isValidPassword) {
      newErrors.password =
        "Votre mot de passe ne répond pas aux exigences de sécurité.";
    }

    if (password !== confirmPassword) {
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

      await api.post("/auth/create-password", {
        email,
        token,
        password: formData.password,
      });

      setPasswordCreated(true);
      showSuccessToast("Votre mot de passe a été créé avec succès !");
    } catch (error: any) {
      console.error("Erreur:", error);
      showErrorToast(
        error.response?.data?.message ||
          "Erreur lors de la création du mot de passe. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/connexion");
  };

  return (
    <>
      <Helmet>
        <title>Créer votre mot de passe - SmartPlanning</title>
        <meta
          name="description"
          content="Bienvenue chez SmartPlanning ! Créez votre mot de passe sécurisé pour accéder à votre compte."
        />
        <style>
          {`
            .create-password-field input {
              background-color: ${isDarkMode ? "#2D3748" : "white"} !important;
              color: ${isDarkMode ? "white" : "#1A202C"} !important;
              border-color: ${isDarkMode ? "#4A5568" : "#E2E8F0"} !important;
            }
          `}
        </style>
      </Helmet>

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
          title={
            passwordCreated
              ? "Mot de passe créé !"
              : "Bienvenue chez SmartPlanning"
          }
          description={
            !passwordCreated
              ? "Créez votre mot de passe sécurisé pour accéder à votre tableau de bord"
              : ""
          }
        >
          {!passwordCreated && (
            <BackLink to="/connexion" isDarkMode={isDarkMode}>
              <ArrowLeft size={16} />
              Retour à la connexion
            </BackLink>
          )}

          {!passwordCreated ? (
            <>
              <WelcomeMessage isDarkMode={isDarkMode}>
                <WelcomeTitle isDarkMode={isDarkMode}>
                  <ShieldCheck
                    style={{ display: "inline", marginRight: "0.5rem" }}
                  />
                  Bienvenue dans l'équipe !
                </WelcomeTitle>
                <WelcomeText isDarkMode={isDarkMode}>
                  Votre compte SmartPlanning a été créé. Pour commencer,
                  veuillez créer un mot de passe sécurisé conforme aux exigences
                  de sécurité.
                </WelcomeText>
              </WelcomeMessage>

              <Form onSubmit={handleSubmit}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <FormGroup>
                    <InputField
                      type={showPassword ? "text" : "password"}
                      label="Créer votre mot de passe"
                      name="password"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="dark-input create-password-field"
                    />
                    <IconButton
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                    {errors.password && (
                      <ErrorMessage>{errors.password}</ErrorMessage>
                    )}
                  </FormGroup>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <FormGroup>
                    <InputField
                      type={showConfirmPassword ? "text" : "password"}
                      label="Confirmer votre mot de passe"
                      name="confirmPassword"
                      placeholder="••••••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="dark-input create-password-field"
                    />
                    <IconButton
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </IconButton>
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
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        fontWeight: "600",
                      }}
                    >
                      Exigences de sécurité :
                    </h4>
                    <RequirementsList>
                      <RequirementItem
                        met={passwordChecks.length}
                        isDarkMode={isDarkMode}
                      >
                        Au moins 8 caractères
                      </RequirementItem>
                      <RequirementItem
                        met={passwordChecks.uppercase}
                        isDarkMode={isDarkMode}
                      >
                        Au moins une lettre majuscule
                      </RequirementItem>
                      <RequirementItem
                        met={passwordChecks.lowercase}
                        isDarkMode={isDarkMode}
                      >
                        Au moins une lettre minuscule
                      </RequirementItem>
                      <RequirementItem
                        met={passwordChecks.number}
                        isDarkMode={isDarkMode}
                      >
                        Au moins un chiffre
                      </RequirementItem>
                      <RequirementItem
                        met={passwordChecks.special}
                        isDarkMode={isDarkMode}
                      >
                        Au moins un caractère spécial (@$!%*?&)
                      </RequirementItem>
                    </RequirementsList>
                  </PasswordRequirements>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <StyledButton type="submit" disabled={isLoading} size="lg">
                    {isLoading ? (
                      <>
                        <Loader className="animate-spin mr-2" size={20} />
                        Création en cours...
                      </>
                    ) : (
                      "Créer mon mot de passe"
                    )}
                  </StyledButton>
                </motion.div>
              </Form>
            </>
          ) : (
            <SuccessContainer>
              <SuccessIcon>
                <CheckCircle size={32} color="white" />
              </SuccessIcon>
              <SuccessTitle isDarkMode={isDarkMode}>
                Félicitations !
              </SuccessTitle>
              <SuccessText isDarkMode={isDarkMode}>
                Votre mot de passe a été créé avec succès. Vous pouvez
                maintenant vous connecter à SmartPlanning et accéder à votre
                tableau de bord.
              </SuccessText>
              <Button onClick={handleGoToLogin} size="lg">
                Se connecter
              </Button>
            </SuccessContainer>
          )}
        </FormContainer>
      </PageWrapper>

      <Footer />
    </>
  );
};

export default CreatePasswordPage;
