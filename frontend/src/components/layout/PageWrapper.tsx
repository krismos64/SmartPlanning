import { AnimatePresence, motion } from "framer-motion";
import React, { ReactNode } from "react";
import styled from "styled-components";
import { useTheme } from "../../components/ThemeProvider";

/**
 * Interface pour les propriétés du composant PageWrapper
 */
interface PageWrapperProps {
  /** Contenu de la page */
  children: ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
}

const Container = styled.div<{ isDarkMode?: boolean }>`
  min-height: 100vh;
  width: 100%;
  overflow: visible;
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#0A0F1A" : "#F8F9FA")};
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  transition: background-color 0.3s ease, color 0.3s ease;
  padding: 3rem 1rem;
  display: flex;
  flex-direction: column;

  @media (min-width: 640px) {
    padding: 3rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 3rem 2rem;
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  flex: 1;
`;

/**
 * PageWrapper - Composant conteneur pour les pages
 *
 * Fournit un conteneur centré, responsive avec animations fluides
 * et support du thème clair/sombre.
 */
const PageWrapper: React.FC<PageWrapperProps> = ({ children, className }) => {
  const { isDarkMode } = useTheme();

  return (
    <Container isDarkMode={isDarkMode} className={className}>
      <AnimatePresence mode="wait">
        <motion.div
          key="page-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.4,
            ease: "easeInOut",
          }}
        >
          <ContentContainer>{children}</ContentContainer>
        </motion.div>
      </AnimatePresence>
    </Container>
  );
};

export default PageWrapper;
