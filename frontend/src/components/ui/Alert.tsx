/**
 * Alert - Composant d'alerte visuelle
 *
 * Affiche un message d'alerte avec une icône et une animation,
 * en utilisant différents styles selon le type d'alerte.
 */
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

/**
 * Interface pour les propriétés du composant Alert
 */
export interface AlertProps {
  /** Type d'alerte qui définit le style visuel */
  type: "info" | "success" | "warning" | "error";
  /** Titre optionnel de l'alerte */
  title?: string;
  /** Message principal de l'alerte */
  message: string;
  /** Active l'animation si true */
  animate?: boolean;
  /** Type d'animation si animate est true */
  animationType?: "fade" | "slide";
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant Alert
 *
 * Affiche une alerte stylisée avec icône, titre optionnel et message.
 * Supporte différents types d'alertes et des animations configurable.
 */
const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  animate = false,
  animationType = "fade",
  className = "",
}) => {
  // Variations d'animation basées sur le type d'animation
  const variants = {
    fade: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.2 },
    },
    slide: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { duration: 0.3 },
    },
  };

  // Configuration des propriétés d'animation
  const motionProps = animate
    ? {
        initial: variants[animationType].initial,
        animate: variants[animationType].animate,
        exit: variants[animationType].exit,
        transition: variants[animationType].transition,
      }
    : {};

  // Classes de base pour toutes les alertes
  const baseClasses = "flex items-start gap-3 rounded-xl p-4 border shadow-sm";

  // Classes spécifiques selon le type d'alerte
  const typeClasses = {
    info: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/30",
    success:
      "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30",
    warning:
      "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30",
    error: "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/30",
  };

  // Assemblage des classes CSS
  const alertClasses = `${baseClasses} ${typeClasses[type]} ${className}`;

  // Icônes selon le type d'alerte
  const AlertIcon = () => {
    switch (type) {
      case "info":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "success":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  // Rendu de l'alerte
  const alertContent = (
    <div role="alert" className={alertClasses}>
      {/* Icône */}
      <div className="flex-shrink-0 pt-0.5">
        <AlertIcon />
      </div>

      {/* Contenu */}
      <div className="flex-1">
        {title && <div className="font-semibold text-sm mb-1">{title}</div>}
        <div className="text-sm leading-snug">{message}</div>
      </div>
    </div>
  );

  // Rendu avec ou sans animation
  return animate ? (
    <AnimatePresence mode="wait">
      <motion.div key={`alert-${type}-${message}`} {...motionProps}>
        {alertContent}
      </motion.div>
    </AnimatePresence>
  ) : (
    alertContent
  );
};

export default Alert;
