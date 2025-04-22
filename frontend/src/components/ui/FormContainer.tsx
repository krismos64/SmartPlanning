import { motion } from "framer-motion";
import React, { ReactNode } from "react";
import styled from "styled-components";
import { useTheme } from "../ThemeProvider";

interface FormContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

const Container = styled(motion.div)<{ isDarkMode?: boolean }>`
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#121829" : "#FFFFFF")};
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  border-radius: 1rem;
  box-shadow: ${({ isDarkMode }) =>
    isDarkMode
      ? "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)"
      : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"};
  border: 1px solid ${({ isDarkMode }) => (isDarkMode ? "#2D3748" : "#E2E8F0")};
  padding: 2rem;
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
  overflow: hidden;

  @media (min-width: 640px) {
    padding: 2.5rem;
  }
`;

const Title = styled(motion.h2)`
  font-size: 1.875rem;
  font-weight: 700;
  text-align: center;
  color: #4f46e5;
  margin-bottom: 0.75rem;
`;

const Description = styled(motion.p)<{ isDarkMode?: boolean }>`
  font-size: 1rem;
  text-align: center;
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  margin-bottom: 2rem;
`;

/**
 * FormContainer - Conteneur stylisé pour les formulaires
 *
 * Fournit un cadre visuellement attrayant pour les formulaires
 * avec titres, descriptions et animations. S'adapte automatiquement
 * au thème clair/sombre.
 */
const FormContainer: React.FC<FormContainerProps> = ({
  children,
  title,
  description,
  className,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <Container
      isDarkMode={isDarkMode}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {title && (
        <Title
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {title}
        </Title>
      )}

      {description && (
        <Description
          isDarkMode={isDarkMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {description}
        </Description>
      )}

      {children}
    </Container>
  );
};

export default FormContainer;
