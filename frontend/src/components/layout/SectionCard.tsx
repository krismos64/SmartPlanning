import { motion } from "framer-motion";
import React from "react";

/**
 * Interface pour les propriétés du composant SectionCard
 */
export interface SectionCardProps {
  /** Contenu principal de la carte */
  children: React.ReactNode;
  /** Titre optionnel de la section */
  title?: string;
  /** Actions à afficher dans l'en-tête (boutons, liens, etc.) */
  actions?: React.ReactNode;
  /** Afficher une bordure en haut avec une couleur spécifique */
  accentColor?: string;
  /** Rendre la carte plus compacte */
  compact?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant SectionCard
 *
 * Carte de contenu réutilisable avec titre et actions optionnels.
 * Conçue pour structurer le contenu des pages et améliorer la lisibilité.
 */
const SectionCard: React.FC<SectionCardProps> = ({
  children,
  title,
  actions,
  accentColor,
  compact = false,
  className = "",
}) => {
  // Styling conditionnel en fonction des props
  const headerPadding = compact ? "px-4 py-3" : "px-6 py-4";
  const bodyPadding = compact ? "px-4 py-3" : "px-6 py-5";

  // Style de l'accent de couleur
  const accentStyle = accentColor
    ? { borderTop: `3px solid ${accentColor}` }
    : {};

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}
      style={accentStyle}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {(title || actions) && (
        <div
          className={`${headerPadding} border-b border-gray-200 flex items-center justify-between`}
        >
          {title && (
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          )}
          {actions && (
            <div className="flex items-center space-x-2">{actions}</div>
          )}
        </div>
      )}

      <div className={bodyPadding}>{children}</div>
    </motion.div>
  );
};

export default SectionCard;
