/**
 * Button - Composant de bouton interactif
 *
 * Bouton polyvalent avec plusieurs variantes, tailles, états,
 * et support d'animation, d'icônes et de spinner de chargement.
 */
import { motion } from "framer-motion";
import React from "react";
import { useTheme } from "../ThemeProvider";

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
  const { isDarkMode } = useTheme();
  
  // Mapping des variantes vers les classes CSS appropriées avec support mode sombre amélioré
  const variantClasses = {
    primary: isDarkMode
      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-500/25 border border-indigo-400/20"
      : "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 shadow-md shadow-indigo-500/20 border border-indigo-600",
    secondary: isDarkMode
      ? "bg-slate-800/70 text-gray-100 hover:bg-slate-700/70 border border-slate-600/30 backdrop-blur-sm"
      : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300",
    danger: isDarkMode
      ? "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/25 border border-red-400/20"
      : "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md shadow-red-500/20 border border-red-600",
    ghost: isDarkMode
      ? "bg-transparent text-gray-300 hover:bg-slate-800/50 hover:text-white"
      : "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900",
    outline: isDarkMode
      ? "bg-transparent border-2 border-slate-600/50 text-gray-300 hover:bg-slate-800/50 hover:border-indigo-500/50 hover:text-white backdrop-blur-sm"
      : "bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-indigo-500 hover:text-gray-900",
  };

  // Mapping des tailles vers les classes CSS appropriées
  const sizeClasses = {
    sm: "text-xs px-3 py-1.5 rounded-lg",
    md: "text-sm px-4 py-2 rounded-xl",
    lg: "text-base px-6 py-3 rounded-xl",
    xs: "text-xs px-2 py-1 rounded-lg",
  };

  // Classes de base communes à tous les boutons avec animations améliorées
  const baseClasses =
    "font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 transform hover:scale-[1.02]";

  // Classes pour gérer l'état désactivé
  const disabledClasses =
    disabled || isLoading ? "opacity-50 cursor-not-allowed hover:scale-100" : "cursor-pointer";

  // Classes pour la largeur du bouton
  const widthClasses = fullWidth ? "w-full" : "";
  
  // Classes pour le focus ring selon le mode
  const focusRingClasses = isDarkMode 
    ? "focus:ring-offset-slate-900" 
    : "focus:ring-offset-white";

  // Assemblage final des classes CSS
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClasses} ${focusRingClasses} ${className}`;

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
