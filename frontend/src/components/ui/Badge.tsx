/**
 * Badge - Composant d'étiquette de statut
 *
 * Affiche une étiquette colorée compacte selon différents types (succès, erreur, etc.)
 * S'adapte automatiquement au thème clair/sombre via les variables CSS.
 */
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
 * Utilise les variables CSS du thème pour s'adapter automatiquement aux modes clair/sombre.
 */
const Badge: React.FC<BadgeProps> = ({
  label,
  type = "info",
  className = "",
}) => {
  // Mapping des types aux classes utilisant les variables CSS du thème
  const typeClasses = {
    // Succès : vert adaptatif en fonction du thème
    success:
      "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
    // Erreur : rouge adaptatif en fonction du thème
    error: "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20",
    // Info : couleur d'accent primaire adaptative en fonction du thème
    info: "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20",
    // Avertissement : orange/jaune adaptatif en fonction du thème
    warning:
      "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
  };

  return (
    <motion.span
      role="status" // Rôle sémantique pour l'accessibilité
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeClasses[type]} ${className}`}
      // Animations avec Framer Motion
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
