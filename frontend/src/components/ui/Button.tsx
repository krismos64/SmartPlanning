/**
 * Button - Composant de bouton interactif
 *
 * Bouton polyvalent avec plusieurs variantes, tailles, états,
 * et support d'animation, d'icônes et de spinner de chargement.
 */
import { motion } from "framer-motion";
import React from "react";

/**
 * Interface des propriétés du composant Button
 */
export interface ButtonProps {
  /** Contenu du bouton */
  children: React.ReactNode;
  /** Fonction appelée lors du clic */
  onClick?: () => void;
  /** Type HTML du bouton */
  type?: "button" | "submit" | "reset";
  /** Variante visuelle du bouton */
  variant?: "primary" | "secondary" | "danger" | "ghost";
  /** Taille du bouton */
  size?: "sm" | "md" | "lg";
  /** État désactivé */
  disabled?: boolean;
  /** État de chargement */
  isLoading?: boolean;
  /** Icône à afficher à gauche du texte */
  icon?: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
  /** Si true, le bouton prend toute la largeur disponible */
  fullWidth?: boolean;
}

/**
 * Composant Button
 *
 * Bouton avec support de différentes variantes, tailles et états.
 * Utilise Framer Motion pour les animations et s'adapte au thème.
 */
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  icon,
  className = "",
  fullWidth = false,
}) => {
  // Mapping des variantes vers les classes CSS appropriées
  const variantClasses = {
    primary:
      "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-dark)] focus:ring-[var(--accent-primary)]/40",
    secondary:
      "bg-[var(--background-tertiary)] text-[var(--text-primary)] hover:bg-[var(--background-tertiary)]/80 focus:ring-[var(--background-tertiary)]/60",
    danger:
      "bg-[var(--error)] text-white hover:bg-[var(--error-dark)] focus:ring-[var(--error)]/40",
    ghost:
      "bg-transparent text-[var(--text-primary)] hover:bg-[var(--background-secondary)] focus:ring-[var(--background-tertiary)]",
  };

  // Mapping des tailles vers les classes CSS appropriées
  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded",
    md: "text-sm px-4 py-2 rounded-md",
    lg: "text-base px-6 py-2.5 rounded-lg",
  };

  // Classes de base communes à tous les boutons
  const baseClasses =
    "font-medium transition-colors focus:outline-none focus:ring-2 flex items-center justify-center gap-2";

  // Classes pour gérer l'état désactivé
  const disabledClasses =
    disabled || isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer";

  // Classes pour la largeur du bouton
  const widthClasses = fullWidth ? "w-full" : "";

  // Assemblage final des classes CSS
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClasses} ${className}`;

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      aria-busy={isLoading}
    >
      {/* Affichage conditionnel du spinner de chargement */}
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}

      {/* Affichage conditionnel de l'icône */}
      {!isLoading && icon}

      {/* Contenu principal du bouton */}
      {children}
    </motion.button>
  );
};

export default Button;
