import { motion } from "framer-motion";
import React from "react";

/**
 * Interface pour les propriétés du composant FormContainer
 */
export interface FormContainerProps {
  /** Contenu du formulaire */
  children: React.ReactNode;
  /** Titre optionnel du formulaire */
  title?: string;
  /** Description optionnelle du formulaire */
  description?: string;
  /** Largeur maximale du conteneur */
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant FormContainer
 *
 * Conteneur stylisé pour les formulaires avec titre et description optionnels.
 * Inclut une animation d'apparition et s'adapte à différentes tailles d'écran.
 */
const FormContainer: React.FC<FormContainerProps> = ({
  children,
  title,
  description,
  maxWidth = "lg",
  className = "",
}) => {
  const maxWidthClasses = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  return (
    <motion.div
      className={`w-full ${maxWidthClasses[maxWidth]} mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {(title || description) && (
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <motion.h3
              className="text-xl font-semibold text-gray-900 dark:text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.h3>
          )}
          {description && (
            <motion.p
              className="mt-1 text-sm text-gray-500 dark:text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {description}
            </motion.p>
          )}
        </div>
      )}
      <div className={`px-6 py-5 ${!title && !description ? "pt-6" : ""}`}>
        {children}
      </div>
    </motion.div>
  );
};

export default FormContainer;
