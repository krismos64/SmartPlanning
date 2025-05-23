import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";

/**
 * Types de toast disponibles
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Interface pour les propriétés du composant Toast
 */
export interface ToastProps {
  /** Message à afficher */
  message: string;
  /** Type de toast (détermine la couleur et l'icône) */
  type?: ToastType;
  /** Durée d'affichage en millisecondes */
  duration?: number;
  /** Fonction pour fermer le toast */
  onClose: () => void;
  /** Afficher ou non le toast */
  isVisible: boolean;
  /** Position du toast */
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant Toast
 *
 * Affiche une notification temporaire stylisée avec différentes variantes.
 * Disparaît automatiquement après une durée spécifiée.
 */
const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 3000,
  onClose,
  isVisible,
  position = "top-right",
  className = "",
}) => {
  // Configuration des couleurs et icônes selon le type
  const toastConfig = {
    success: {
      bgColor: "bg-green-50",
      textColor: "text-green-800",
      borderColor: "border-green-200",
      icon: (
        <svg
          className="w-5 h-5 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    error: {
      bgColor: "bg-red-50",
      textColor: "text-red-800",
      borderColor: "border-red-200",
      icon: (
        <svg
          className="w-5 h-5 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    info: {
      bgColor: "bg-blue-50",
      textColor: "text-blue-800",
      borderColor: "border-blue-200",
      icon: (
        <svg
          className="w-5 h-5 text-blue-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-200",
      icon: (
        <svg
          className="w-5 h-5 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  // Configuration de la position
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-24 left-1/2 transform -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  // Animation selon la position
  const getAnimationVariants = () => {
    switch (position) {
      case "top-right":
        return {
          hidden: { opacity: 0, x: 20, y: 0 },
          visible: { opacity: 1, x: 0, y: 0 },
          exit: { opacity: 0, x: 20, y: 0 },
        };
      case "top-left":
        return {
          hidden: { opacity: 0, x: -20, y: 0 },
          visible: { opacity: 1, x: 0, y: 0 },
          exit: { opacity: 0, x: -20, y: 0 },
        };
      case "bottom-right":
        return {
          hidden: { opacity: 0, x: 20, y: 0 },
          visible: { opacity: 1, x: 0, y: 0 },
          exit: { opacity: 0, x: 20, y: 0 },
        };
      case "bottom-left":
        return {
          hidden: { opacity: 0, x: -20, y: 0 },
          visible: { opacity: 1, x: 0, y: 0 },
          exit: { opacity: 0, x: -20, y: 0 },
        };
      case "top-center":
      case "bottom-center":
        return {
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  // Fermeture automatique après la durée spécifiée
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence mode="sync">
      {isVisible && (
        <motion.div
          className={`fixed z-50 ${positionClasses[position]} max-w-sm ${className}`}
          variants={getAnimationVariants()}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          style={{ zIndex: 200 }}
        >
          <div
            className={`flex items-center p-4 ${toastConfig[type].bgColor} ${toastConfig[type].textColor} rounded-lg border ${toastConfig[type].borderColor} shadow-md`}
            role="alert"
          >
            <div className="inline-flex flex-shrink-0 mr-3">
              {toastConfig[type].icon}
            </div>
            <div className="text-sm font-medium">{message}</div>
            <button
              type="button"
              className="ml-auto -mx-1.5 -my-1.5 bg-transparent hover:bg-opacity-10 hover:bg-gray-500 rounded-lg p-1.5 inline-flex h-8 w-8 items-center justify-center"
              aria-label="Fermer"
              onClick={onClose}
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
