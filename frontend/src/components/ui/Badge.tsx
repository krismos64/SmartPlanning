import { motion } from "framer-motion";
import React from "react";

/**
 * Interface pour les propriétés du composant Badge
 */
export interface BadgeProps {
  /** Texte à afficher dans le badge */
  label: string;
  /** Type de badge (détermine la couleur) */
  type?: "success" | "error" | "info" | "warning";
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant Badge
 *
 * Badge compact avec différentes variantes de couleur selon le type.
 * Utilisé pour afficher des statuts, notifications ou étiquettes dans l'interface.
 */
const Badge: React.FC<BadgeProps> = ({
  label,
  type = "info",
  className = "",
}) => {
  // Mapping des types aux classes de couleur
  const typeClasses = {
    success: "bg-green-100 text-green-800 border-green-200",
    error: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  return (
    <motion.span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeClasses[type]} ${className}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.05 }}
    >
      {label}
    </motion.span>
  );
};

export default Badge;
