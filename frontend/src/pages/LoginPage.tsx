/**
 * LoginPage - Page de connexion futuriste
 *
 * Design ultra-moderne avec animations avancées et layout full-width
 * Optimisé pour une expérience utilisateur immersive
 */
import { AnimatePresence, motion, useInView } from "framer-motion";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiCheck, FiAlertCircle } from "react-icons/fi";
import styled, { keyframes } from "styled-components";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import SEO from "../components/layout/SEO";
import { useTheme } from "../components/ThemeProvider";
import Toast from "../components/ui/Toast";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";

// Clés localStorage
const REMEMBER_EMAIL_KEY = "smartplanning_remembered_email";
const REMEMBER_ME_KEY = "smartplanning_remember_me";

// Animations keyframes
const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// Container principal full-width
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(79, 70, 229, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
  position: relative;
  overflow-x: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  padding-top: 6rem; /* Espace pour la navbar */
  
  @media (max-width: 768px) {
    padding-top: 5rem;
  }
`;

// Particules d'arrière-plan
const BackgroundParticles = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`;

const Particle = styled(motion.div)`
  position: absolute;
  width: 3px;
  height: 3px;
  background: linear-gradient(45deg, #4f46e5, #8b5cf6);
  border-radius: 50%;
  opacity: 0.7;
`;

// Layout principal responsive
const MainContent = styled.div`
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 4rem;
  align-items: center;
  z-index: 1;
  position: relative;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    max-width: 600px;
    gap: 2rem;
    text-align: center;
  }
  
  @media (max-width: 768px) {
    padding: 0;
    gap: 1.5rem;
  }
`;

// Section d'info à gauche
const InfoSection = styled(motion.div)`
  @media (max-width: 1024px) {
    order: 2;
  }
`;

const InfoTitle = styled(motion.h1)`
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  background: linear-gradient(135deg, #4f46e5, #8b5cf6, #06b6d4);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${gradientShift} 6s ease infinite;
  margin-bottom: 1.5rem;
  line-height: 1.1;
`;

const InfoSubtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const FeatureList = styled(motion.ul)`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled(motion.li)`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
`;

const FeatureIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  animation: ${float} 3s ease-in-out infinite;
`;

// Formulaire futuriste
const LoginContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.surface};
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  z-index: 10; /* S'assurer que le formulaire passe au-dessus */
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4f46e5, #8b5cf6, #06b6d4);
    background-size: 300% 100%;
    animation: ${gradientShift} 3s ease infinite;
  }
  
  @media (max-width: 1024px) {
    order: 1;
  }
  
  @media (max-width: 768px) {
    padding: 2rem;
    border-radius: 16px;
  }
`;

const LoginTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.5rem;
  text-align: center;
`;

const LoginSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled(motion.div)`
  position: relative;
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputField = styled(motion.input)`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid rgba(79, 70, 229, 0.2);
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 20px rgba(79, 70, 229, 0.2);
    transform: translateY(-2px);
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: color 0.3s ease;
  z-index: 1;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const OptionsRow = styled.div`
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

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid rgba(79, 70, 229, 0.3);
  background: ${({ theme }) => theme.colors.background};
  cursor: pointer;
  
  &:checked {
    background: #4f46e5;
    border-color: #4f46e5;
  }
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  user-select: none;
`;

const ForgotLink = styled(Link)`
  font-size: 0.875rem;
  color: #4f46e5;
  text-decoration: none;
  transition: color 0.3s ease;
  
  &:hover {
    color: #8b5cf6;
  }
`;

const SubmitButton = styled(motion.button)<{ isLoading?: boolean }>`
  padding: 1.2rem 2rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #8b5cf6);
  background-size: 200% 200%;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: ${({ isLoading }) => (isLoading ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-top: 1rem;
  
  &:hover:not(:disabled) {
    background-position: 100% 0;
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(79, 70, 229, 0.4);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
`;


const RegisterLink = styled.div`
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.secondary};

  a {
    color: #4f46e5;
    text-decoration: none;
    margin-left: 0.25rem;
    font-weight: 600;
    transition: color 0.3s ease;

    &:hover {
      color: #8b5cf6;
    }
  }
`;

// Messages de feedback
const FeedbackMessage = styled(motion.div)<{ type: 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  font-size: 0.9rem;
  
  ${({ type }) => type === 'success' ? `
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.2);
  ` : `
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
  `}
`;

const LoginPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { toast, showErrorToast, hideToast } = useToast();
  const containerRef = useRef(null);
  const isInView = useInView(containerRef);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Animation des particules
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
  }));

  // Récupérer l'email et l'état de "Se souvenir de moi" lors du chargement de la page
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    const rememberMeState = localStorage.getItem(REMEMBER_ME_KEY);

    if (rememberedEmail && rememberMeState === "true") {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Fonction pour gérer la sauvegarde de l'email
  const handleRememberMe = () => {
    if (formData.rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, formData.email);
      localStorage.setItem(REMEMBER_ME_KEY, "true");
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!auth) {
        setError("Erreur de contexte d'authentification");
        showErrorToast("Erreur de contexte d'authentification");
        return;
      }

      handleRememberMe();
      await auth.login(formData.email, formData.password);
      navigate("/tableau-de-bord");
    } catch (error: any) {
      console.error("Login error:", error);

      setFormData((prev) => ({
        ...prev,
        password: "",
      }));

      if (error.response) {
        if (error.response.status === 401) {
          const errorMessage =
            "Identifiants incorrects. Vérifiez votre adresse email et votre mot de passe.";
          setError(errorMessage);
          showErrorToast(errorMessage);
        } else {
          const errorMessage =
            error.response.data?.message ||
            "Une erreur est survenue. Veuillez réessayer plus tard.";
          setError(errorMessage);
          showErrorToast(errorMessage);
        }
      } else if (error.message) {
        setError(error.message);
        showErrorToast(error.message);
      } else {
        const errorMessage =
          "Une erreur est survenue. Veuillez réessayer plus tard.";
        setError(errorMessage);
        showErrorToast(errorMessage);
      }
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <SEO
        title="Connexion - SmartPlanning | Accédez à votre espace"
        description="Connectez-vous à votre compte SmartPlanning pour accéder à votre espace de gestion de planning professionnel."
      />
      
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href="https://smartplanning.fr/" />

      <Header />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
        position="top-center"
        duration={5000}
      />

      <PageContainer ref={containerRef}>
        {/* Particules d'arrière-plan */}
        <BackgroundParticles>
          {particles.map((particle) => (
            <Particle
              key={particle.id}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              animate={{
                y: [-15, 15, -15],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </BackgroundParticles>

        <MainContent>
          {/* Section d'information */}
          <InfoSection
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <InfoTitle
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              Bienvenue sur SmartPlanning
            </InfoTitle>
            <InfoSubtitle
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              La solution SaaS intelligente pour optimiser vos plannings d'équipe et révolutionner votre gestion RH.
            </InfoSubtitle>
            <FeatureList>
              {[
                "Planification automatisée par IA",
                "Gestion d'équipes simplifiée",
                "Tableaux de bord en temps réel",
                "Support client dédié"
              ].map((feature, index) => (
                <FeatureItem
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1, ease: "easeOut" }}
                >
                  <FeatureIcon>
                    <FiCheck size={12} />
                  </FeatureIcon>
                  {feature}
                </FeatureItem>
              ))}
            </FeatureList>
          </InfoSection>

          {/* Formulaire de connexion */}
          <LoginContainer
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <LoginTitle>Connexion</LoginTitle>
            <LoginSubtitle>
              Accédez à votre espace de gestion SmartPlanning
            </LoginSubtitle>

            <AnimatePresence>
              {error && (
                <FeedbackMessage
                  type="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiAlertCircle size={18} />
                  {error}
                </FeedbackMessage>
              )}
            </AnimatePresence>

            <Form onSubmit={handleSubmit}>
              <FormGroup
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Label>Adresse email</Label>
                <InputWrapper>
                  <InputIcon>
                    <FiMail size={18} />
                  </InputIcon>
                  <InputField
                    type="email"
                    name="email"
                    placeholder="votre.email@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                    whileFocus={{ scale: 1.02 }}
                    required
                  />
                </InputWrapper>
              </FormGroup>

              <FormGroup
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Label>Mot de passe</Label>
                <InputWrapper>
                  <InputIcon>
                    <FiLock size={18} />
                  </InputIcon>
                  <InputField
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Votre mot de passe"
                    value={formData.password}
                    onChange={handleChange}
                    whileFocus={{ scale: 1.02 }}
                    required
                  />
                  <PasswordToggle
                    type="button"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </PasswordToggle>
                </InputWrapper>
              </FormGroup>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <OptionsRow>
                  <CheckboxContainer>
                    <Checkbox
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                    />
                    <CheckboxLabel htmlFor="rememberMe">
                      Se souvenir de moi
                    </CheckboxLabel>
                  </CheckboxContainer>

                  <ForgotLink to="/forgot-password">
                    Mot de passe oublié ?
                  </ForgotLink>
                </OptionsRow>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <SubmitButton
                  type="submit"
                  disabled={isLoading}
                  isLoading={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        ⟳
                      </motion.div>
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <FiLogIn />
                      Se connecter
                    </>
                  )}
                </SubmitButton>
              </motion.div>
            </Form>

            <RegisterLink>
              Pas encore inscrit ?
              <Link to="/inscription">Créer un compte</Link>
            </RegisterLink>
          </LoginContainer>
        </MainContent>
      </PageContainer>

      <Footer />
    </>
  );
};

export default LoginPage;