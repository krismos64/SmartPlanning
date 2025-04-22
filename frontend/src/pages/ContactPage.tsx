/**
 * ContactPage - Page de contact
 *
 * Permet aux utilisateurs d'envoyer des messages à l'équipe support.
 * Comprend un formulaire avec validation et un système de feedback visuel.
 */
import { motion } from "framer-motion";
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { MdOutlineMail } from "react-icons/md";
import styled from "styled-components";
import { useTheme } from "../components/ThemeProvider";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import PageWrapper from "../components/layout/PageWrapper";
import Button from "../components/ui/Button";
import FormContainer from "../components/ui/FormContainer";
import InputField from "../components/ui/InputField";
import TextareaField from "../components/ui/TextareaField";

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

const StyledButton = styled(Button)`
  margin-top: 1rem;
  width: 100%;
`;

const ContactInfoSection = styled.div`
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ContactItem = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({ isDarkMode }) =>
    isDarkMode ? "rgba(26, 34, 52, 0.7)" : "rgba(248, 250, 252, 0.7)"};
  box-shadow: ${({ isDarkMode }) =>
    isDarkMode
      ? "0 4px 12px rgba(0, 0, 0, 0.2)"
      : "0 4px 12px rgba(0, 0, 0, 0.05)"};
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ isDarkMode }) =>
      isDarkMode
        ? "0 8px 16px rgba(0, 0, 0, 0.3)"
        : "0 8px 16px rgba(0, 0, 0, 0.1)"};
  }
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #4f46e5;
  color: white;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const ContactItemTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#334155" : "#334155")};
`;

const ContactItemText = styled.p<{ isDarkMode?: boolean }>`
  font-size: 0.875rem;
  color: ${({ isDarkMode }) =>
    isDarkMode ? "#CBD5E1" : "#334155"}; // gris clair / gris foncé
  a {
    color: inherit;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const SuccessMessage = styled(motion.div)<{ isDarkMode?: boolean }>`
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#065f46" : "#ecfdf5")};
  color: ${({ isDarkMode }) => (isDarkMode ? "#d1fae5" : "#065f46")};
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const ContactPage: React.FC = () => {
  const { isDarkMode } = useTheme();
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      // Simuler un appel API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Contact form submitted:", formData);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error("Contact form error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact - SmartPlanning</title>
        <meta
          name="description"
          content="Contactez l'équipe SmartPlanning pour toute question ou assistance concernant votre planning."
        />
      </Helmet>

      <Header />

      <PageWrapper>
        <FormContainer
          title="Contactez-nous"
          description="Nous sommes là pour répondre à vos questions et vous accompagner"
        >
          {isSuccess && (
            <SuccessMessage
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              isDarkMode={isDarkMode}
            >
              Votre message a été envoyé avec succès. Nous vous répondrons dans
              les plus brefs délais.
            </SuccessMessage>
          )}

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
              <FormRow>
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

                <FormGroup>
                  <InputField
                    type="tel"
                    label="Numéro de téléphone (optionnel)"
                    name="phone"
                    placeholder="Votre numéro de téléphone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </FormGroup>
              </FormRow>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <FormGroup>
                <InputField
                  type="text"
                  label="Sujet"
                  name="subject"
                  placeholder="Sujet de votre message"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
                {errors.subject && (
                  <ErrorMessage>{errors.subject}</ErrorMessage>
                )}
              </FormGroup>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <FormGroup>
                <TextareaField
                  label="Message"
                  name="message"
                  placeholder="Votre message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  required
                />
                {errors.message && (
                  <ErrorMessage>{errors.message}</ErrorMessage>
                )}
              </FormGroup>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <StyledButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Envoi en cours..." : "Envoyer le message"}
              </StyledButton>
            </motion.div>
          </Form>

          <ContactInfoSection>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ContactItem isDarkMode={isDarkMode}>
                <IconWrapper>
                  <MdOutlineMail />
                </IconWrapper>
                <ContactItemTitle>Email</ContactItemTitle>
                <ContactItemText isDarkMode={isDarkMode}>
                  <a
                    href="mailto:contact@smartplanning.fr"
                    className="hover:underline"
                  >
                    contact@smartplanning.fr
                  </a>
                </ContactItemText>
              </ContactItem>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            ></motion.div>
          </ContactInfoSection>
        </FormContainer>
      </PageWrapper>

      <Footer />
    </>
  );
};

export default ContactPage;
