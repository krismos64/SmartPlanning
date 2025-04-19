import { motion } from "framer-motion";
import React from "react";

/**
 * Props du composant LoadingSpinner
 */
interface LoadingSpinnerProps {
  /**
   * Taille du spinner
   * - sm: petit (24px)
   * - md: moyen (40px) - par défaut
   * - lg: grand (64px)
   */
  size?: "sm" | "md" | "lg";
}

/**
 * Composant LoadingSpinner
 *
 * Affiche un indicateur de chargement animé avec une rotation continue
 * Utilisable dans n'importe quelle partie de l'application nécessitant
 * un état de chargement visuel.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md" }) => {
  // Mapping des tailles vers les classes Tailwind correspondantes
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-4",
  };

  // Classes CSS pour le spinner
  const spinnerClasses = `
    ${sizeClasses[size]}
    rounded-full
    border-blue-500
    border-t-transparent
  `;

  return (
    <div className="flex justify-center items-center">
      <motion.div
        className={spinnerClasses}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
        aria-label="Chargement en cours"
      />
    </div>
  );
};

export default LoadingSpinner;
