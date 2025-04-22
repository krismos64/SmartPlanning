import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
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

// Définition des variables CSS pour le mode sombre
const GlobalStyles = styled.div<{ isDarkMode?: boolean }>`
  ${({ isDarkMode }) =>
    isDarkMode
      ? `
    --background-secondary: #121829;
    --text-primary: #F1F5F9;
    --text-secondary: #94A3B8;
    --border: #2D3748;
  `
      : `
    --background-secondary: #FFFFFF;
    --text-primary: #1A202C;
    --text-secondary: #6b7280;
    --border: #E2E8F0;
  `}
`;

// Un composant Card personnalisé qui s'adapte au mode sombre
const StyledCard = styled(Card)<{ isDarkMode?: boolean }>`
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#121829" : "#FFFFFF")};
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  border-color: ${({ isDarkMode }) => (isDarkMode ? "#2D3748" : "#E2E8F0")};

  h3 {
    color: #4f46e5 !important;
  }

  &:hover {
    box-shadow: ${({ isDarkMode }) =>
      isDarkMode
        ? "0 10px 25px rgba(0, 0, 0, 0.3)"
        : "0 10px 25px rgba(0, 0, 0, 0.1)"};
  }
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

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CardIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #4f46e515;
  margin-bottom: 1rem;
  color: #4f46e5;
  font-size: 1.25rem;
`;

const SectionText = styled.div<{ isDarkMode?: boolean }>`
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  margin-bottom: 1rem;

  p {
    margin-bottom: 0.75rem;
  }
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

// Configurer les icônes pour chaque section
const sectionIcons: Record<string, string> = {
  "1. Introduction": "🔒",
  "2. Données Que Nous Collectons": "📊",
  "3. Comment Nous Utilisons Vos Données": "🔍",
  "4. Partage des Données": "🤝",
  "5. Vos Droits": "⚖️",
  "6. Sécurité des Données": "🛡️",
  "7. Cookies et Technologies Similaires": "🍪",
  "8. Modifications de la Politique de Confidentialité": "📝",
  "9. Contact": "📧",
};

// Type pour regrouper les données de section
interface SectionData {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
  fullWidth?: boolean;
}

const PrivacyPolicyPage: React.FC = () => {
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

  // Définir le contenu pour chaque section
  const sections: SectionData[] = [
    {
      id: "intro",
      title: "1. Introduction",
      icon: sectionIcons["1. Introduction"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            Chez SmartPlanning, nous accordons une importance particulière à la
            protection de vos données personnelles. Cette politique de
            confidentialité décrit quelles informations nous collectons à votre
            sujet, comment nous les utilisons et comment nous les protégeons.
          </p>
          <p>
            En utilisant notre plateforme, vous acceptez les pratiques décrites
            dans cette politique. Nous nous engageons à respecter votre vie
            privée conformément au Règlement Général sur la Protection des
            Données (RGPD) et autres lois applicables en matière de protection
            des données.
          </p>
        </SectionText>
      ),
    },
    {
      id: "data-collection",
      title: "2. Données Que Nous Collectons",
      icon: sectionIcons["2. Données Que Nous Collectons"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            Nous collectons les types d'informations suivants pour fournir et
            améliorer nos services :
          </p>
          <SectionList isDarkMode={isDarkMode}>
            <ListItem>
              <strong>Informations de compte</strong> : nom, prénom, adresse
              email, mot de passe, rôle dans l'entreprise, etc.
            </ListItem>
            <ListItem>
              <strong>Informations de profil</strong> : photo (optionnelle),
              préférences de travail, compétences, etc.
            </ListItem>
            <ListItem>
              <strong>Données d'utilisation</strong> : comment vous interagissez
              avec notre plateforme, quelles fonctionnalités vous utilisez, etc.
            </ListItem>
            <ListItem>
              <strong>Données de planification</strong> : horaires, congés,
              disponibilités, etc.
            </ListItem>
            <ListItem>
              <strong>Informations techniques</strong> : adresse IP, type
              d'appareil, navigateur, fichiers journaux, etc.
            </ListItem>
          </SectionList>
        </SectionText>
      ),
    },
    {
      id: "data-usage",
      title: "3. Comment Nous Utilisons Vos Données",
      icon: sectionIcons["3. Comment Nous Utilisons Vos Données"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            Nous utilisons vos données personnelles pour les finalités suivantes
            :
          </p>
          <SectionList isDarkMode={isDarkMode}>
            <ListItem>Fournir, maintenir et améliorer nos services</ListItem>
            <ListItem>
              Générer des plannings optimisés grâce à notre algorithme d'IA
            </ListItem>
            <ListItem>
              Envoyer des notifications importantes concernant votre compte ou
              vos plannings
            </ListItem>
            <ListItem>Vous fournir une assistance client et technique</ListItem>
            <ListItem>
              Analyser l'utilisation de nos services pour les améliorer
            </ListItem>
            <ListItem>Personnaliser votre expérience utilisateur</ListItem>
            <ListItem>
              Prévenir et détecter les activités frauduleuses ou abusives
            </ListItem>
            <ListItem>Respecter nos obligations légales</ListItem>
          </SectionList>
          <p>Nous ne vendons jamais vos données personnelles à des tiers.</p>
        </SectionText>
      ),
    },
    {
      id: "data-sharing",
      title: "4. Partage des Données",
      icon: sectionIcons["4. Partage des Données"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>Nous pouvons partager vos données dans les contextes suivants :</p>
          <SectionList isDarkMode={isDarkMode}>
            <ListItem>
              <strong>Au sein de votre organisation</strong> : Les
              administrateurs et managers de votre organisation peuvent accéder
              à certaines de vos données pour gérer les plannings.
            </ListItem>
            <ListItem>
              <strong>Avec nos sous-traitants</strong> : Nous utilisons des
              fournisseurs de services tiers pour nous aider à fournir et
              améliorer nos services (hébergement, analyse, assistance client,
              etc.). Ces prestataires sont soumis à des obligations strictes de
              confidentialité.
            </ListItem>
            <ListItem>
              <strong>Pour des obligations légales</strong> : Nous pouvons
              divulguer vos informations si nous sommes légalement tenus de le
              faire ou si nous croyons de bonne foi que cette divulgation est
              nécessaire pour (a) respecter une obligation légale, (b) protéger
              nos droits ou notre propriété, (c) prévenir ou enquêter sur
              d'éventuels méfaits en lien avec le service, ou (d) protéger la
              sécurité personnelle des utilisateurs de nos services ou du
              public.
            </ListItem>
          </SectionList>
          <p>Nous limitons le partage de vos données au strict nécessaire.</p>
        </SectionText>
      ),
    },
    {
      id: "your-rights",
      title: "5. Vos Droits",
      icon: sectionIcons["5. Vos Droits"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            En tant qu'utilisateur de SmartPlanning, vous disposez des droits
            suivants concernant vos données personnelles :
          </p>
          <SectionList isDarkMode={isDarkMode}>
            <ListItem>
              <strong>Droit d'accès</strong> : Vous pouvez demander une copie
              des données personnelles que nous détenons à votre sujet.
            </ListItem>
            <ListItem>
              <strong>Droit de rectification</strong> : Vous pouvez demander la
              correction de données inexactes ou incomplètes.
            </ListItem>
            <ListItem>
              <strong>Droit à l'effacement</strong> : Vous pouvez demander la
              suppression de vos données dans certaines circonstances.
            </ListItem>
            <ListItem>
              <strong>Droit à la limitation du traitement</strong> : Vous pouvez
              nous demander de limiter le traitement de vos données dans
              certaines circonstances.
            </ListItem>
            <ListItem>
              <strong>Droit à la portabilité des données</strong> : Vous pouvez
              demander à recevoir vos données dans un format structuré,
              couramment utilisé et lisible par machine.
            </ListItem>
            <ListItem>
              <strong>Droit d'opposition</strong> : Vous pouvez vous opposer au
              traitement de vos données dans certaines circonstances.
            </ListItem>
          </SectionList>
          <p>
            Pour exercer l'un de ces droits, veuillez nous contacter à l'adresse
            email indiquée dans la section "Contact" ci-dessous.
          </p>
        </SectionText>
      ),
    },
    {
      id: "data-security",
      title: "6. Sécurité des Données",
      icon: sectionIcons["6. Sécurité des Données"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            La sécurité de vos données est notre priorité. Nous mettons en œuvre
            des mesures techniques et organisationnelles appropriées pour
            protéger vos données personnelles contre tout accès non autorisé,
            altération, divulgation ou destruction.
          </p>
          <p>Ces mesures comprennent, sans s'y limiter :</p>
          <SectionList isDarkMode={isDarkMode}>
            <ListItem>Chiffrement des données en transit et au repos</ListItem>
            <ListItem>Accès limité aux données personnelles</ListItem>
            <ListItem>Audits de sécurité réguliers</ListItem>
            <ListItem>
              Formation de notre personnel aux pratiques de sécurité et de
              confidentialité
            </ListItem>
            <ListItem>Plans de réponse aux incidents</ListItem>
          </SectionList>
          <p>
            Toutefois, aucune méthode de transmission sur Internet ou méthode de
            stockage électronique n'est totalement sécurisée. Bien que nous nous
            efforcions de protéger vos données personnelles, nous ne pouvons
            garantir leur sécurité absolue.
          </p>
        </SectionText>
      ),
    },
    {
      id: "cookies",
      title: "7. Cookies et Technologies Similaires",
      icon: sectionIcons["7. Cookies et Technologies Similaires"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            SmartPlanning utilise des cookies et des technologies similaires
            pour améliorer votre expérience, comprendre comment nos services
            sont utilisés et personnaliser notre contenu.
          </p>
          <p>Nous utilisons les types de cookies suivants :</p>
          <SectionList isDarkMode={isDarkMode}>
            <ListItem>
              <strong>Cookies essentiels</strong> : Nécessaires au
              fonctionnement de base de notre plateforme.
            </ListItem>
            <ListItem>
              <strong>Cookies de fonctionnalité</strong> : Permettent de
              mémoriser vos préférences et paramètres.
            </ListItem>
            <ListItem>
              <strong>Cookies analytiques</strong> : Nous aident à comprendre
              comment notre plateforme est utilisée afin de l'améliorer.
            </ListItem>
          </SectionList>
          <p>
            Vous pouvez gérer vos préférences en matière de cookies en modifiant
            les paramètres de votre navigateur pour refuser certains ou tous les
            cookies. Toutefois, si vous choisissez de désactiver les cookies,
            certaines fonctionnalités de notre plateforme pourraient ne pas
            fonctionner correctement.
          </p>
        </SectionText>
      ),
    },
    {
      id: "changes",
      title: "8. Modifications de la Politique de Confidentialité",
      icon: sectionIcons["8. Modifications de la Politique de Confidentialité"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            Nous pouvons mettre à jour cette politique de confidentialité de
            temps à autre pour refléter des changements dans nos pratiques ou
            pour d'autres raisons opérationnelles, légales ou réglementaires.
          </p>
          <p>
            En cas de modifications substantielles, nous vous en informerons par
            email ou par une notification sur notre plateforme avant que les
            changements ne prennent effet.
          </p>
          <p>
            Nous vous encourageons à consulter régulièrement cette page pour
            rester informé des dernières mises à jour. Votre utilisation
            continue de nos services après la publication des changements
            constitue votre acceptation de ces changements.
          </p>
        </SectionText>
      ),
    },
    {
      id: "contact",
      title: "9. Contact",
      icon: sectionIcons["9. Contact"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            Si vous avez des questions, des préoccupations ou des demandes
            concernant cette politique de confidentialité ou le traitement de
            vos données personnelles, veuillez nous contacter à l'adresse
            suivante :
            <EmailLink href="mailto:privacy@smartplanning.fr">
              contact@smartplanning.fr
            </EmailLink>
          </p>
          <p>
            Si vous estimez, après nous avoir contactés, que vos droits en
            matière de protection des données n'ont pas été respectés, vous
            pouvez adresser une réclamation à la Commission Nationale de
            l'Informatique et des Libertés (CNIL) en France ou à l'autorité de
            contrôle compétente dans votre pays de résidence.
          </p>
        </SectionText>
      ),
    },
  ];

  return (
    <Container ref={topRef} isDarkMode={isDarkMode}>
      <GlobalStyles isDarkMode={isDarkMode} />
      <Helmet>
        <title>Politique de confidentialité - SmartPlanning</title>
        <meta
          name="description"
          content="Politique de confidentialité de SmartPlanning - Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée conformément au RGPD"
        />
      </Helmet>

      <Header />

      <PageContent>
        <PageTitle>Politique de Confidentialité - SmartPlanning</PageTitle>
        <UpdatedDate isDarkMode={isDarkMode}>
          Dernière mise à jour : 10 avril 2025
        </UpdatedDate>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardGrid>
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <StyledCard
                  title={section.title}
                  hoverable
                  bordered
                  className="h-full"
                  isDarkMode={isDarkMode}
                >
                  <CardIconWrapper>{section.icon}</CardIconWrapper>
                  {section.content}
                </StyledCard>
              </motion.div>
            ))}
          </CardGrid>
        </motion.div>

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

export default PrivacyPolicyPage;
