import { motion } from "framer-motion";
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import styled from "styled-components";
import { useTheme } from "../components/ThemeProvider";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import Card from "../components/ui/Card";

const Container = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#0A0F1A" : "#F8F9FA")};
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  transition: background-color 0.3s ease, color 0.3s ease;
  overflow-x: hidden;
`;

const GlobalStyles = styled.div<{ isDarkMode?: boolean }>`
  ${({ isDarkMode }) =>
    isDarkMode
      ? `
    --background-secondary: #121829;
    --text-primary: #F1F5F9;
    --text-secondary: #94A3B8;
    --border: #2D3748;
    --input-bg: #1A2234;
    --input-focus: #2D3748;
  `
      : `
    --background-secondary: #FFFFFF;
    --text-primary: #1A202C;
    --text-secondary: #6b7280;
    --border: #E2E8F0;
    --input-bg: #F1F5F9;
    --input-focus: #E2E8F0;
  `}
`;

const PageContent = styled.main`
  max-width: 56rem;
  width: 100%;
  margin: 0 auto;
  padding: 2.5rem 1rem;
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  color: #4f46e5;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p<{ isDarkMode?: boolean }>`
  font-size: 1.125rem;
  text-align: center;
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  margin-bottom: 3rem;
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
`;

const StyledCard = styled(Card)<{ isDarkMode?: boolean }>`
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#121829" : "#FFFFFF")};
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  border-color: ${({ isDarkMode }) => (isDarkMode ? "#2D3748" : "#E2E8F0")};
  margin-bottom: 2rem;
  box-shadow: ${({ isDarkMode }) =>
    isDarkMode
      ? "0 10px 25px rgba(0, 0, 0, 0.3)"
      : "0 10px 25px rgba(0, 0, 0, 0.1)"};
  border-radius: 1rem;
  overflow: hidden;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label<{ isDarkMode?: boolean }>`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
`;

const Input = styled.input<{ isDarkMode?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background-color: ${({ isDarkMode }) =>
    isDarkMode ? "var(--input-bg)" : "var(--input-bg)"};
  border: 1px solid
    ${({ isDarkMode }) => (isDarkMode ? "var(--border)" : "var(--border)")};
  color: ${({ isDarkMode }) =>
    isDarkMode ? "var(--text-primary)" : "var(--text-primary)"};
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }

  &::placeholder {
    color: ${({ isDarkMode }) =>
      isDarkMode ? "var(--text-secondary)" : "var(--text-secondary)"};
  }
`;

const TextArea = styled.textarea<{ isDarkMode?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background-color: ${({ isDarkMode }) =>
    isDarkMode ? "var(--input-bg)" : "var(--input-bg)"};
  border: 1px solid
    ${({ isDarkMode }) => (isDarkMode ? "var(--border)" : "var(--border)")};
  color: ${({ isDarkMode }) =>
    isDarkMode ? "var(--text-primary)" : "var(--text-primary)"};
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  min-height: 10rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }

  &::placeholder {
    color: ${({ isDarkMode }) =>
      isDarkMode ? "var(--text-secondary)" : "var(--text-secondary)"};
  }
`;

const SubmitButton = styled(motion.button)`
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ContactInfo = styled.div<{ isDarkMode?: boolean }>`
  margin-top: 3rem;
  text-align: center;
  padding: 1.5rem;
  border-radius: 0.75rem;
  background-color: ${({ isDarkMode }) =>
    isDarkMode ? "rgba(79, 70, 229, 0.1)" : "rgba(79, 70, 229, 0.05)"};
`;

const ContactTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #4f46e5;
  margin-bottom: 1rem;
`;

const ContactText = styled.p<{ isDarkMode?: boolean }>`
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  margin-bottom: 0.5rem;
`;

const EmailLink = styled.a`
  color: #4f46e5;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const ContactPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Cette fonction serait connectée à un backend dans une implémentation réelle
    console.log("Form submitted:", formData);
    // Reset form après soumission (pour démonstration)
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <Container isDarkMode={isDarkMode}>
      <GlobalStyles isDarkMode={isDarkMode} />
      <Helmet>
        <title>Contact - SmartPlanning</title>
        <meta
          name="description"
          content="Contactez l'équipe SmartPlanning pour toute question, demande d'assistance ou information concernant notre solution de gestion de planning."
        />
      </Helmet>

      <Header />

      <PageContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PageTitle>Contactez SmartPlanning</PageTitle>
          <Subtitle isDarkMode={isDarkMode}>
            Une question, un retour ou besoin d'assistance ? Notre équipe vous
            répond sous 24h.
          </Subtitle>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <StyledCard isDarkMode={isDarkMode}>
              <form onSubmit={handleSubmit}>
                <FormGrid>
                  <FormGroup>
                    <Label isDarkMode={isDarkMode} htmlFor="lastName">
                      Nom*
                    </Label>
                    <Input
                      isDarkMode={isDarkMode}
                      type="text"
                      id="lastName"
                      name="lastName"
                      placeholder="Votre nom"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label isDarkMode={isDarkMode} htmlFor="firstName">
                      Prénom*
                    </Label>
                    <Input
                      isDarkMode={isDarkMode}
                      type="text"
                      id="firstName"
                      name="firstName"
                      placeholder="Votre prénom"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </FormGrid>

                <FormGroup>
                  <Label isDarkMode={isDarkMode} htmlFor="email">
                    Adresse email*
                  </Label>
                  <Input
                    isDarkMode={isDarkMode}
                    type="email"
                    id="email"
                    name="email"
                    placeholder="votre.email@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label isDarkMode={isDarkMode} htmlFor="subject">
                    Sujet*
                  </Label>
                  <Input
                    isDarkMode={isDarkMode}
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder="Sujet de votre message"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label isDarkMode={isDarkMode} htmlFor="message">
                    Message*
                  </Label>
                  <TextArea
                    isDarkMode={isDarkMode}
                    id="message"
                    name="message"
                    placeholder="Détaillez votre demande ici..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>

                <SubmitButton
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Envoyer</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </SubmitButton>
              </form>
            </StyledCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ContactInfo isDarkMode={isDarkMode}>
              <ContactTitle>Autres moyens de nous contacter</ContactTitle>
              <ContactText isDarkMode={isDarkMode}>
                Pour toute question ou assistance, vous pouvez également nous
                contacter par email à :
                <EmailLink href="mailto:contact@smartplanning.fr">
                  {" "}
                  contact@smartplanning.fr
                </EmailLink>
              </ContactText>
              <ContactText isDarkMode={isDarkMode}>
                Nous vous répondrons dans les plus brefs délais.
              </ContactText>
            </ContactInfo>
          </motion.div>
        </motion.div>
      </PageContent>

      <Footer />
    </Container>
  );
};

export default ContactPage;
