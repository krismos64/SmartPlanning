import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import styled from "styled-components";
import { useTheme } from "../components/ThemeProvider";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

const Container = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#0A0F1A" : "#F8F9FA")};
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  transition: background-color 0.3s ease, color 0.3s ease;
  overflow-x: hidden;
`;

const PageContent = styled.main`
  max-width: 56rem;
  width: 100%;
  margin: 0 auto;
  padding: 2.5rem 1rem;
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  text-align: center;
  color: #4f46e5;
  margin-bottom: 1rem;
`;

const UpdatedDate = styled.p<{ isDarkMode?: boolean }>`
  font-size: 0.875rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  text-align: center;
  margin-bottom: 2rem;
`;

const ContentSection = styled.section`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #4f46e5;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
`;

const SectionText = styled.p<{ isDarkMode?: boolean }>`
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  margin-bottom: 1rem;
`;

const SectionList = styled.ul<{ isDarkMode?: boolean }>`
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
`;

const ListItem = styled.li`
  margin-bottom: 0.5rem;
`;

const EmailLink = styled.a`
  color: #4f46e5;
  margin-left: 0.25rem;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const BackToTopButton = styled(motion.button)`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background-color: #4f46e5;
  color: white;
  padding: 0.5rem;
  border-radius: 9999px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  z-index: 50;

  &:hover {
    transform: translateY(-2px);
  }
`;

const TermsOfUsePage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [showTopButton, setShowTopButton] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Container ref={topRef} isDarkMode={isDarkMode}>
      <Helmet>
        <title>Conditions d'utilisation - SmartPlanning</title>
        <meta
          name="description"
          content="Conditions générales d'utilisation du service SmartPlanning"
        />
      </Helmet>

      <Header />

      <PageContent>
        <PageTitle>
          Conditions Générales d'Utilisation - SmartPlanning
        </PageTitle>
        <UpdatedDate isDarkMode={isDarkMode}>
          Dernière mise à jour : 10 avril 2025
        </UpdatedDate>

        <ContentSection>
          <SectionTitle>1. Introduction</SectionTitle>
          <SectionText isDarkMode={isDarkMode}>
            Bienvenue sur SmartPlanning. Ces conditions régissent votre
            utilisation de notre site, application, et services. En les
            acceptant, vous vous engagez à les respecter. Si vous êtes en
            désaccord, merci de ne pas utiliser nos services.
          </SectionText>
        </ContentSection>

        <ContentSection>
          <SectionTitle>2. Définitions</SectionTitle>
          <SectionList isDarkMode={isDarkMode}>
            <ListItem>
              <strong>SmartPlanning</strong> : plateforme SaaS de gestion RH.
            </ListItem>
            <ListItem>
              <strong>Utilisateur</strong> : personne accédant à la plateforme.
            </ListItem>
            <ListItem>
              <strong>Contenu</strong> : données publiées ou stockées via la
              plateforme.
            </ListItem>
          </SectionList>
        </ContentSection>

        <ContentSection>
          <SectionTitle>3. Services Proposés</SectionTitle>
          <SectionList isDarkMode={isDarkMode}>
            <ListItem>Gestion de plannings</ListItem>
            <ListItem>Gestion des congés</ListItem>
            <ListItem>Suivi de tâches et incidents</ListItem>
            <ListItem>Événements internes</ListItem>
            <ListItem>Optimisation IA et chatbot</ListItem>
          </SectionList>
        </ContentSection>

        <ContentSection>
          <SectionTitle>4. Compte Utilisateur</SectionTitle>
          <SectionText isDarkMode={isDarkMode}>
            Vous devez créer un compte pour accéder à certaines fonctionnalités.
            Vous êtes responsable de vos identifiants et devez fournir des
            informations exactes et à jour.
          </SectionText>
        </ContentSection>

        <ContentSection>
          <SectionTitle>5. Propriété Intellectuelle</SectionTitle>
          <SectionText isDarkMode={isDarkMode}>
            Tous les contenus et fonctionnalités sont protégés et appartiennent
            à SmartPlanning. Vous ne pouvez pas reproduire ou distribuer sans
            autorisation.
          </SectionText>
        </ContentSection>

        <ContentSection>
          <SectionTitle>6. Confidentialité des Données</SectionTitle>
          <SectionText isDarkMode={isDarkMode}>
            Nous respectons le RGPD. Consultez notre Politique de
            Confidentialité pour plus d'informations. Vos données sont
            protégées.
          </SectionText>
        </ContentSection>

        <ContentSection>
          <SectionTitle>7. Responsabilités de l'Utilisateur</SectionTitle>
          <SectionList isDarkMode={isDarkMode}>
            <ListItem>Respecter les lois applicables</ListItem>
            <ListItem>
              Ne pas compromettre la sécurité ou surcharger les systèmes
            </ListItem>
            <ListItem>Ne pas tenter d'accès non autorisé</ListItem>
            <ListItem>
              Ne pas publier de contenus illicites ou nuisibles
            </ListItem>
          </SectionList>
        </ContentSection>

        <ContentSection>
          <SectionTitle>8. Limitations de Responsabilité</SectionTitle>
          <SectionText isDarkMode={isDarkMode}>
            Les services sont fournis « tels quels », sans garantie.
            SmartPlanning n'est pas responsable des pertes indirectes ou
            punitives.
          </SectionText>
        </ContentSection>

        <ContentSection>
          <SectionTitle>9. Modifications des Conditions</SectionTitle>
          <SectionText isDarkMode={isDarkMode}>
            Nous pouvons modifier ces conditions à tout moment. L'utilisation
            continue vaut acceptation des nouvelles conditions.
          </SectionText>
        </ContentSection>

        <ContentSection>
          <SectionTitle>10. Résiliation</SectionTitle>
          <SectionText isDarkMode={isDarkMode}>
            Nous pouvons suspendre ou supprimer un compte sans préavis en cas de
            non-respect. Vous pouvez résilier à tout moment.
          </SectionText>
        </ContentSection>

        <ContentSection>
          <SectionTitle>11. Droit Applicable</SectionTitle>
          <SectionText isDarkMode={isDarkMode}>
            Ces conditions sont régies par le droit français. Tout litige sera
            soumis aux tribunaux compétents.
          </SectionText>
        </ContentSection>

        <ContentSection>
          <SectionTitle>12. Contact</SectionTitle>
          <SectionText isDarkMode={isDarkMode}>
            Pour toute question, écrivez-nous à :
            <EmailLink href="mailto:contact@smartplanning.fr">
              contact@smartplanning.fr
            </EmailLink>
          </SectionText>
        </ContentSection>

        {showTopButton && (
          <BackToTopButton
            onClick={scrollToTop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Retour en haut"
          >
            ↑
          </BackToTopButton>
        )}
      </PageContent>

      <Footer scrollToTop={scrollToTop} />
    </Container>
  );
};

export default TermsOfUsePage;
