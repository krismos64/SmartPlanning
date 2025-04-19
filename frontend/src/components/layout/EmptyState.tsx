import { motion } from "framer-motion";
import React from "react";

/**
 * Interface pour les propriétés du composant EmptyState
 */
export interface EmptyStateProps {
  /** Titre principal à afficher */
  title: string;
  /** Description optionnelle */
  description?: string;
  /** Icône ou illustration à afficher */
  icon?: React.ReactNode;
  /** Bouton d'action ou autre élément interactif */
  action?: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant EmptyState
 *
 * Affiche un état vide stylisé avec une icône, un titre, une description optionnelle
 * et une action possible. Utile pour les listes vides, résultats de recherche, etc.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = "",
}) => {
  return (
    <motion.div
      className={`w-full py-12 px-4 flex flex-col items-center justify-center ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {icon && (
        <motion.div
          className="mb-4 text-gray-400"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {icon}
        </motion.div>
      )}

      <motion.h3
        className="text-lg font-medium text-gray-900 mb-2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          className="text-sm text-gray-500 text-center max-w-md mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
