import { motion } from "framer-motion";
import React from "react";

/**
 * Interface pour les propriétés du composant LoadingSpinner
 */
interface LoadingSpinnerProps {
  /** Taille du spinner (xs, sm, md, lg) */
  size?: "xs" | "sm" | "md" | "lg";
  /** Couleur du spinner (classes TailwindCSS) */
  color?: string;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant LoadingSpinner
 *
 * Affiche un indicateur de chargement animé.
 * Utilisé dans les composants et pages où des données sont en cours de chargement.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "border-blue-600",
  className = "",
}) => {
  // Mapping des tailles aux classes CSS
  const sizeClasses = {
    xs: "w-4 h-4 border-1",
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  // Animation de rotation avec Framer Motion
  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 1,
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} rounded-full border-t-transparent ${color} border-solid`}
        animate={{ rotate: 360 }}
        transition={spinTransition}
        style={{ borderTopColor: "transparent" }}
      />
    </div>
  );
};

export default LoadingSpinner;
