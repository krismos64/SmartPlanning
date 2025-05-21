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
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  /** Taille du bouton */
  size?: "sm" | "md" | "lg" | "xs";
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
  /** Texte d'infobulle au survol */
  title?: string;
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
  title,
}) => {
  // Mapping des variantes vers les classes CSS appropriées
  const variantClasses = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500/40 border border-indigo-500",
    secondary:
      "bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-700/60 border border-gray-700",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/40 border border-red-500",
    ghost:
      "bg-transparent text-gray-200 hover:bg-gray-800 hover:text-white focus:ring-gray-700/30",
    outline:
      "bg-transparent border border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white focus:ring-gray-700/30",
  };

  // Mapping des tailles vers les classes CSS appropriées
  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-md",
    md: "text-sm px-4 py-2 rounded-md",
    lg: "text-base px-6 py-2.5 rounded-md",
    xs: "text-xs px-2 py-1 rounded",
  };

  // Classes de base communes à tous les boutons
  const baseClasses =
    "font-medium transition-colors duration-200 focus:outline-none focus:ring-2 flex items-center justify-center gap-2";

  // Classes pour gérer l'état désactivé
  const disabledClasses =
    disabled || isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer";

  // Classes pour la largeur du bouton
  const widthClasses = fullWidth ? "w-full" : "";

  // Modifier la section de la classe des icônes pour les rendre plus visibles en mode dark
  const iconClasses = `
    ${size === "sm" ? "mr-1.5" : size === "xs" ? "mr-1" : "mr-2"} 
    ${fullWidth ? "mr-2" : ""}
    ${
      variant === "ghost"
        ? "text-inherit group-hover:text-inherit dark:text-gray-300 dark:group-hover:text-white"
        : variant === "outline"
        ? "text-inherit group-hover:text-inherit dark:text-gray-300 dark:group-hover:text-white"
        : "text-inherit dark:text-white"
    }
    transition-colors
  `;

  // Assemblage final des classes CSS
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClasses} ${className} ${iconClasses}`;

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      aria-busy={isLoading}
      title={title}
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
