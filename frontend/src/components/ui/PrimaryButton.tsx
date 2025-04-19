import { motion } from "framer-motion";
import React from "react";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Interface pour les propriétés du composant PrimaryButton
 */
export interface PrimaryButtonProps {
  /** Texte du bouton */
  label: string;
  /** Fonction appelée au clic */
  onClick?: () => void;
  /** Affiche un spinner de chargement */
  loading?: boolean;
  /** Désactive le bouton */
  disabled?: boolean;
  /** Icône à afficher à gauche du texte */
  icon?: React.ReactNode;
  /** Type du bouton (submit, button, reset) */
  type?: "button" | "submit" | "reset";
  /** Couleur de fond (classes TailwindCSS) */
  bgColor?: string;
  /** Couleur de fond au survol */
  hoverBgColor?: string;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant PrimaryButton
 *
 * Bouton principal de l'application avec animation, support d'icônes et état de chargement.
 * Utilisé pour les actions principales dans les formulaires et interfaces.
 */
const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onClick,
  loading = false,
  disabled = false,
  icon,
  type = "button",
  bgColor = "bg-blue-600",
  hoverBgColor = "hover:bg-blue-700",
  className = "",
}) => {
  // Détermination des classes de base
  const baseClasses = `relative w-full flex justify-center items-center gap-2 py-2 px-4 
    rounded-lg font-medium text-white shadow-sm transition-all focus:outline-none 
    focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`;

  // Classes pour l'état actif ou désactivé
  const stateClasses =
    disabled || loading
      ? "opacity-70 cursor-not-allowed bg-gray-400"
      : `${bgColor} ${hoverBgColor} cursor-pointer`;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`${baseClasses} ${stateClasses} ${className}`}
      transition={{ duration: 0.2 }}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          {icon && <span className="flex items-center">{icon}</span>}
          <span>{label}</span>
        </>
      )}
    </motion.button>
  );
};

export default PrimaryButton;
