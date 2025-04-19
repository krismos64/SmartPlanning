import { motion } from "framer-motion";
import React from "react";

/**
 * Interface pour les propriétés du composant SectionTitle
 */
export interface SectionTitleProps {
  /** Titre principal de la section */
  title: string;
  /** Sous-titre optionnel de la section */
  subtitle?: string;
  /** Icône optionnelle à afficher à gauche du titre */
  icon?: React.ReactNode;
  /** Alignement du titre et sous-titre */
  align?: "left" | "center" | "right";
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant SectionTitle
 *
 * Affiche un titre de section avec une animation d'apparition subtile.
 * Peut inclure un sous-titre et une icône décorative.
 */
const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  icon,
  align = "left",
  className = "",
}) => {
  // Définition des classes d'alignement
  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <motion.div
      className={`mb-6 ${alignmentClasses[align]} ${className}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="text-blue-600"
          >
            {icon}
          </motion.div>
        )}
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
      </div>

      {subtitle && (
        <motion.p
          className="mt-2 text-sm text-gray-500 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
};

export default SectionTitle;
