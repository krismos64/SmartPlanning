import { motion } from "framer-motion";
import React from "react";

/**
 * Interface pour les propriétés du composant PageWrapper
 */
export interface PageWrapperProps {
  /** Contenu de la page */
  children: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant PageWrapper
 *
 * Wrapper pour les pages de l'application, avec animation d'apparition
 * et mise en page responsive standardisée.
 */
const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className = "",
}) => {
  return (
    <motion.div
      className={`min-h-screen w-full bg-gray-50 py-6 px-4 sm:px-6 lg:px-8 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </motion.div>
  );
};

export default PageWrapper;
