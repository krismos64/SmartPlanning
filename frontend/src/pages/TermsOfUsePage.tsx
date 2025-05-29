import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useTheme } from "../components/ThemeProvider";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import SEO from "../components/layout/SEO";
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

const FullWidthCard = styled.div`
  margin-bottom: 1.5rem;
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
  "1. Introduction": "📝",
  "2. Définitions": "📚",
  "3. Services Proposés": "🛠️",
  "4. Compte Utilisateur": "👤",
  "5. Propriété Intellectuelle": "©️",
  "6. Confidentialité des Données": "🔒",
  "7. Responsabilités de l'Utilisateur": "⚠️",
  "8. Limitations de Responsabilité": "⚖️",
  "9. Modifications des Conditions": "🔄",
  "10. Résiliation": "🚫",
  "11. Droit Applicable": "📜",
  "12. Contact": "📧",
};

// Type pour regrouper les données de section
interface SectionData {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
  fullWidth?: boolean;
}

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

  // Définir le contenu pour chaque section
  const sections: SectionData[] = [
    {
      id: "intro",
      title: "1. Introduction",
      icon: sectionIcons["1. Introduction"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          Bienvenue sur SmartPlanning. Ces conditions régissent votre
          utilisation de notre site, application, et services. En les acceptant,
          vous vous engagez à les respecter. Si vous êtes en désaccord, merci de
          ne pas utiliser nos services.
        </SectionText>
      ),
    },
    {
      id: "definitions",
      title: "2. Définitions",
      icon: sectionIcons["2. Définitions"],
      content: (
        <SectionList isDarkMode={isDarkMode}>
          <ListItem>
            <strong>SmartPlanning</strong> : désigne notre plateforme de gestion
            de plannings et de personnel, y compris le site web, les
            applications et tous les services associés.
          </ListItem>
          <ListItem>
            <strong>Utilisateur</strong> : désigne toute personne qui accède à
            nos Services, y compris les administrateurs, les gestionnaires et
            les employés.
          </ListItem>
          <ListItem>
            <strong>Contenu</strong> : désigne toutes les informations, données,
            textes, images, graphiques, vidéos, messages ou autres matériels que
            vous publiez, téléchargez, partagez, stockez ou rendez disponible
            sur nos Services.
          </ListItem>
        </SectionList>
      ),
    },
    {
      id: "services",
      title: "3. Services Proposés",
      icon: sectionIcons["3. Services Proposés"],
      content: (
        <>
          <SectionText isDarkMode={isDarkMode}>
            SmartPlanning fournit des outils de gestion de plannings, de suivi
            de temps de travail, de gestion des congés et d'optimisation des
            ressources humaines. Nos Services peuvent inclure :{" "}
          </SectionText>
          <SectionList isDarkMode={isDarkMode}>
            <ListItem>Gestion de plannings</ListItem>
            <ListItem>Gestion des congés</ListItem>
            <ListItem>Suivi de tâches et incidents</ListItem>
            <ListItem>Événements internes</ListItem>
            <ListItem>Optimisation IA et chatbot</ListItem>
          </SectionList>
        </>
      ),
    },
    {
      id: "user-account",
      title: "4. Compte Utilisateur",
      icon: sectionIcons["4. Compte Utilisateur"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            Pour utiliser certaines fonctionnalités de nos Services, vous devez
            créer un compte. Vous êtes responsable de maintenir la
            confidentialité de vos informations d'identification et de toutes
            les activités qui se produisent sous votre compte.
          </p>
          <p>
            Vous acceptez de nous fournir des informations précises, actuelles
            et complètes lors de la création de votre compte et de mettre à jour
            ces informations pour les maintenir exactes.
          </p>
        </SectionText>
      ),
    },
    {
      id: "intellectual-property",
      title: "5. Propriété Intellectuelle",
      icon: sectionIcons["5. Propriété Intellectuelle"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            SmartPlanning et son contenu sont et resteront la propriété
            exclusive de SmartPlanning et de ses concédants de licence. Nos
            Services sont protégés par le droit d'auteur, les marques et autres
            lois françaises et internationales.
          </p>
          <p>
            Vous ne pouvez pas reproduire, distribuer, modifier, créer des
            œuvres dérivées, afficher publiquement, exécuter publiquement,
            republier, télécharger, stocker ou transmettre tout matériel de nos
            Services, sauf si expressément permis par ces conditions.
          </p>
        </SectionText>
      ),
    },
    {
      id: "data-privacy",
      title: "6. Confidentialité des Données",
      icon: sectionIcons["6. Confidentialité des Données"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            Notre traitement de vos données personnelles est régi par notre
            Politique de Confidentialité, qui est incorporée à ces conditions
            d'utilisation. En utilisant nos Services, vous consentez à ces
            pratiques.
          </p>
          <p>
            Conformément au Règlement Général sur la Protection des Données
            (RGPD), nous nous engageons à protéger vos données personnelles et à
            respecter vos droits à la vie privée.
          </p>
        </SectionText>
      ),
    },
    {
      id: "user-responsibilities",
      title: "7. Responsabilités de l'Utilisateur",
      icon: sectionIcons["7. Responsabilités de l'Utilisateur"],
      content: (
        <SectionList isDarkMode={isDarkMode}>
          <ListItem>Respecter les lois applicables</ListItem>
          <ListItem>
            Ne pas utiliser nos Services d'une manière qui pourrait endommager,
            désactiver, surcharger ou compromettre nos systèmes
          </ListItem>
          <ListItem>
            Ne pas tenter d'accéder sans autorisation à des parties de nos
            Services auxquelles vous n'avez pas droit d'accès
          </ListItem>
          <ListItem>
            Ne pas utiliser nos Services pour transmettre du matériel illégal,
            diffamatoire, harcelant, invasif de la vie privée d'autrui, ou
            autrement répréhensible
          </ListItem>
        </SectionList>
      ),
    },
    {
      id: "liability-limitations",
      title: "8. Limitations de Responsabilité",
      icon: sectionIcons["8. Limitations de Responsabilité"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            SmartPlanning fournit ses Services "tels quels" et "tels que
            disponibles", sans garantie d'aucune sorte. Nous ne garantissons pas
            que nos Services seront ininterrompus, opportuns, sécurisés ou
            exempts d'erreurs.
          </p>
          <p>
            En aucun cas, SmartPlanning ne sera responsable des dommages
            indirects, accessoires, spéciaux, consécutifs ou punitifs, ou de
            toute perte de profits ou de revenus, résultant de votre utilisation
            de nos Services.
          </p>
        </SectionText>
      ),
    },
    {
      id: "terms-modifications",
      title: "9. Modifications des Conditions",
      icon: sectionIcons["9. Modifications des Conditions"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            Nous nous réservons le droit de modifier ces conditions
            d'utilisation à tout moment. Les modifications entreront en vigueur
            dès leur publication sur nos Services.
          </p>
          <p>
            Votre utilisation continue de nos Services après la publication des
            modifications constitue votre acceptation des nouvelles conditions.
          </p>
          <p>
            Nous vous informerons des modifications substantielles par email ou
            par une notification sur nos Services.
          </p>
        </SectionText>
      ),
    },
    {
      id: "termination",
      title: "10. Résiliation",
      icon: sectionIcons["10. Résiliation"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            Nous nous réservons le droit de suspendre ou de résilier votre accès
            à nos Services, à notre seule discrétion, sans préavis, pour des
            violations de ces conditions d'utilisation ou pour toute autre
            raison.
          </p>
          <p>
            Vous pouvez résilier votre compte à tout moment en suivant les
            instructions sur nos Services ou en nous contactant directement.
          </p>
        </SectionText>
      ),
    },
    {
      id: "applicable-law",
      title: "11. Droit Applicable",
      icon: sectionIcons["11. Droit Applicable"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          <p>
            Ces conditions d'utilisation sont régies et interprétées
            conformément aux lois françaises, sans égard aux principes de
            conflits de lois.
          </p>
          <p>
            Tout litige découlant de ou lié à ces conditions sera soumis à la
            juridiction exclusive des tribunaux français.
          </p>
        </SectionText>
      ),
    },
    {
      id: "contact",
      title: "12. Contact",
      icon: sectionIcons["12. Contact"],
      content: (
        <SectionText isDarkMode={isDarkMode}>
          Si vous avez des questions concernant ces conditions d'utilisation,
          veuillez nous contacter à l'adresse suivante :
          <EmailLink href="mailto:contact@smartplanning.fr">
            contact@smartplanning.fr
          </EmailLink>
        </SectionText>
      ),
    },
  ];

  return (
    <Container ref={topRef} isDarkMode={isDarkMode}>
      <GlobalStyles isDarkMode={isDarkMode} />
      <SEO
        title="Conditions d'utilisation - SmartPlanning"
        description="Conditions générales d'utilisation du service SmartPlanning"
      />

      <Header />

      <PageContent>
        <PageTitle>
          Conditions Générales d'Utilisation - SmartPlanning
        </PageTitle>
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

export default TermsOfUsePage;
