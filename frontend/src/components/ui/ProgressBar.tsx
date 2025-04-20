/**
 * ProgressBar - Composant de barre de progression
 *
 * Affiche une barre de progression animée, personnalisable et accessible.
 * S'adapte automatiquement au thème clair/sombre via les variables CSS.
 */
import { motion } from "framer-motion";
import React from "react";

/**
 * Interface pour les propriétés du composant ProgressBar
 */
export interface ProgressBarProps {
  /** Valeur de progression (0-100) */
  value: number;
  /** Texte descriptif affiché à gauche de la barre */
  label?: string;
  /** Afficher ou non le pourcentage à droite */
  showPercentage?: boolean;
  /** Couleur de la barre de progression */
  color?: "primary" | "success" | "warning" | "error";
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant ProgressBar
 *
 * Barre de progression animée avec différentes variantes de couleur.
 * Supporte l'accessibilité et s'adapte au thème clair/sombre.
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = true,
  color = "primary",
  className = "",
}) => {
  // Valeur normalisée entre 0 et 100
  const normalizedValue = Math.min(Math.max(0, value), 100);

  // Mapping des couleurs selon le type
  const colorClasses = {
    primary: "bg-[var(--accent-primary)]",
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    error: "bg-[var(--error)]",
  };

  return (
    <div className={`w-full ${className}`}>
      {/* En-tête avec label et pourcentage */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {normalizedValue}%
            </span>
          )}
        </div>
      )}

      {/* Conteneur de la barre de progression */}
      <div
        className="w-full h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden border border-[var(--border)]"
        role="progressbar"
        aria-valuenow={normalizedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Barre de progression animée */}
        <motion.div
          className={`h-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${normalizedValue}%` }}
          transition={{
            duration: 0.6,
            ease: [0.4, 0.0, 0.2, 1], // Courbe d'animation fluide
            delay: 0.1, // Léger délai pour un effet plus naturel
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
