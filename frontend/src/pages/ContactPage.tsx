/**
 * ContactPage - Page de contact futuriste
 *
 * Design ultra-moderne avec animations avancées et layout full-width
 * Optimisé pour une expérience utilisateur immersive
 */
import { AnimatePresence, motion, useInView } from "framer-motion";
import React, { useRef, useState } from "react";
import { MdOutlineMail, MdPhone, MdLocationOn, MdAccessTime } from "react-icons/md";
import { FiSend, FiCheck, FiAlertCircle } from "react-icons/fi";
import axiosInstance from "../api/axiosInstance";
import styled, { keyframes } from "styled-components";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import SEO from "../components/layout/SEO";
import { useTheme } from "../components/ThemeProvider";

// Animations keyframes
const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.3); }
  50% { box-shadow: 0 0 40px rgba(79, 70, 229, 0.6); }
  100% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.3); }
`;

// Container principal full-width
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
  position: relative;
  overflow-x: hidden;
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
  width: 4px;
  height: 4px;
  background: linear-gradient(45deg, #4f46e5, #8b5cf6);
  border-radius: 50%;
  opacity: 0.6;
`;

// Section héro futuriste
const HeroSection = styled.section`
  padding: 8rem 2rem 4rem;
  text-align: center;
  position: relative;
  z-index: 1;
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(2.5rem, 6vw, 4rem);
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

const HeroSubtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto 3rem;
  line-height: 1.6;
`;

// Layout principal responsive
const MainContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 4rem;
  align-items: start;
  
  @media (max-width: 1200px) {
    max-width: 900px;
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  
  @media (max-width: 768px) {
    padding: 0 1rem 2rem;
    gap: 2rem;
  }
`;

// Formulaire futuriste
const FormContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.surface};
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #4f46e5, #8b5cf6, #06b6d4);
    background-size: 300% 100%;
    animation: ${gradientShift} 3s ease infinite;
  }
  
  @media (max-width: 768px) {
    padding: 2rem;
    border-radius: 16px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
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

const InputField = styled(motion.input)`
  width: 100%;
  padding: 1rem 1.5rem;
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

const TextareaField = styled(motion.textarea)`
  width: 100%;
  padding: 1rem 1.5rem;
  border: 2px solid rgba(79, 70, 229, 0.2);
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  resize: vertical;
  min-height: 120px;
  transition: all 0.3s ease;
  font-family: inherit;
  
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

// Sidebar d'informations
const InfoSidebar = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  
  @media (max-width: 1200px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
`;

const InfoCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(79, 70, 229, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(79, 70, 229, 0.15);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4f46e5, #8b5cf6);
  }
`;

const IconWrapper = styled(motion.div)`
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4f46e5, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  animation: ${float} 3s ease-in-out infinite;
`;

const InfoTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.5rem;
`;

const InfoText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  
  a {
    color: #4f46e5;
    text-decoration: none;
    transition: color 0.3s ease;
    
    &:hover {
      color: #8b5cf6;
    }
  }
`;

// Messages de feedback
const FeedbackMessage = styled(motion.div)<{ type: 'success' | 'error' }>`
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  
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

const ErrorMessage = styled(motion.p)`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ContactPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const formRef = useRef(null);
  const isInView = useInView(formRef);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animation des particules
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
  }));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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

    if (!formData.subject.trim()) {
      newErrors.subject = "Le sujet est requis";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Le message est requis";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Le message doit contenir au moins 10 caractères";
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
      const response = await axiosInstance.post("/contact", formData);

      if (response.status === 200) {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 6000);
      } else {
        setErrors({
          form: "Une erreur est survenue lors de l'envoi du message",
        });
      }
    } catch (error) {
      console.error("Contact form error:", error);
      setErrors({ form: "Une erreur est survenue lors de l'envoi du message" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Contact - SmartPlanning | Contactez nos experts"
        description="Contactez l'équipe SmartPlanning pour toute question ou assistance concernant votre planning. Support professionnel et réactif."
      />

      <Header />

      <PageContainer>
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
                y: [-20, 20, -20],
                opacity: [0.3, 0.8, 0.3],
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

        {/* Section héro */}
        <HeroSection>
          <HeroTitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Contactez-nous
          </HeroTitle>
          <HeroSubtitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Notre équipe d'experts est là pour répondre à vos questions et vous accompagner dans votre transformation digitale
          </HeroSubtitle>
        </HeroSection>

        {/* Contenu principal */}
        <MainContent>
          {/* Formulaire */}
          <FormContainer
            ref={formRef}
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <AnimatePresence>
              {isSuccess && (
                <FeedbackMessage
                  type="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiCheck size={20} />
                  Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
                </FeedbackMessage>
              )}

              {errors.form && (
                <FeedbackMessage
                  type="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiAlertCircle size={20} />
                  {errors.form}
                </FeedbackMessage>
              )}
            </AnimatePresence>

            <Form onSubmit={handleSubmit}>
              <FormGrid>
                <FormGroup
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Label>Prénom *</Label>
                  <InputField
                    type="text"
                    name="firstName"
                    placeholder="Votre prénom"
                    value={formData.firstName}
                    onChange={handleChange}
                    whileFocus={{ scale: 1.02 }}
                    required
                  />
                  <AnimatePresence>
                    {errors.firstName && (
                      <ErrorMessage
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <FiAlertCircle size={14} />
                        {errors.firstName}
                      </ErrorMessage>
                    )}
                  </AnimatePresence>
                </FormGroup>

                <FormGroup
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                >
                  <Label>Nom *</Label>
                  <InputField
                    type="text"
                    name="lastName"
                    placeholder="Votre nom"
                    value={formData.lastName}
                    onChange={handleChange}
                    whileFocus={{ scale: 1.02 }}
                    required
                  />
                  <AnimatePresence>
                    {errors.lastName && (
                      <ErrorMessage
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <FiAlertCircle size={14} />
                        {errors.lastName}
                      </ErrorMessage>
                    )}
                  </AnimatePresence>
                </FormGroup>
              </FormGrid>

              <FormGrid>
                <FormGroup
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Label>Email *</Label>
                  <InputField
                    type="email"
                    name="email"
                    placeholder="votre.email@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                    whileFocus={{ scale: 1.02 }}
                    required
                  />
                  <AnimatePresence>
                    {errors.email && (
                      <ErrorMessage
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <FiAlertCircle size={14} />
                        {errors.email}
                      </ErrorMessage>
                    )}
                  </AnimatePresence>
                </FormGroup>

                <FormGroup
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                >
                  <Label>Téléphone</Label>
                  <InputField
                    type="tel"
                    name="phone"
                    placeholder="Votre numéro de téléphone"
                    value={formData.phone}
                    onChange={handleChange}
                    whileFocus={{ scale: 1.02 }}
                  />
                </FormGroup>
              </FormGrid>

              <FormGroup
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Label>Sujet *</Label>
                <InputField
                  type="text"
                  name="subject"
                  placeholder="Sujet de votre message"
                  value={formData.subject}
                  onChange={handleChange}
                  whileFocus={{ scale: 1.02 }}
                  required
                />
                <AnimatePresence>
                  {errors.subject && (
                    <ErrorMessage
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <FiAlertCircle size={14} />
                      {errors.subject}
                    </ErrorMessage>
                  )}
                </AnimatePresence>
              </FormGroup>

              <FormGroup
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <Label>Message *</Label>
                <TextareaField
                  name="message"
                  placeholder="Décrivez votre besoin ou votre question..."
                  value={formData.message}
                  onChange={handleChange}
                  whileFocus={{ scale: 1.02 }}
                  rows={6}
                  required
                />
                <AnimatePresence>
                  {errors.message && (
                    <ErrorMessage
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <FiAlertCircle size={14} />
                      {errors.message}
                    </ErrorMessage>
                  )}
                </AnimatePresence>
              </FormGroup>

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
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <FiSend />
                      Envoyer le message
                    </>
                  )}
                </SubmitButton>
              </motion.div>
            </Form>
          </FormContainer>

          {/* Sidebar d'informations */}
          <InfoSidebar
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <InfoCard
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <IconWrapper
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <MdOutlineMail />
              </IconWrapper>
              <InfoTitle>Email professionnel</InfoTitle>
              <InfoText>
                <a href="mailto:contact@smartplanning.fr">
                  contact@smartplanning.fr
                </a>
                <br />
                Réponse sous 24h ouvrées
              </InfoText>
            </InfoCard>

            <InfoCard
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <IconWrapper
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3 }}
              >
                <MdPhone />
              </IconWrapper>
              <InfoTitle>Rappel sur demande</InfoTitle>
              <InfoText>
                Besoin d'un échange téléphonique ?
                <br />
                Précisez-le dans votre message et nous vous rappelons
              </InfoText>
            </InfoCard>

            <InfoCard
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <IconWrapper
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <MdAccessTime />
              </IconWrapper>
              <InfoTitle>Temps de réponse</InfoTitle>
              <InfoText>
                Questions générales : 24h
                <br />
                Support technique : 2-4h
                <br />
                Urgences : Immédiat
              </InfoText>
            </InfoCard>

            <InfoCard
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <IconWrapper
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3 }}
              >
                <MdLocationOn />
              </IconWrapper>
              <InfoTitle>Notre équipe</InfoTitle>
              <InfoText>
                Basée en France
                <br />
                Experts en gestion RH
                <br />
                Support en français
              </InfoText>
            </InfoCard>
          </InfoSidebar>
        </MainContent>
      </PageContainer>

      <Footer />
    </>
  );
};

export default ContactPage;