import { motion } from "framer-motion";
import React, { useEffect } from "react";

/**
 * Props pour le composant Toast
 */
export interface ToastProps {
  /** Texte à afficher dans le toast */
  message: string;
  /** Type de toast définissant son style et son icône */
  type: "success" | "error";
  /** Fonction à exécuter lors de la fermeture */
  onClose: () => void;
  /** Durée en ms avant fermeture automatique (défaut: 3000ms) */
  duration?: number;
}

/**
 * Composant Toast - Affiche une notification temporaire
 *
 * Utilisé pour les messages de réussite, d'erreur ou autres notifications
 * importantes. Se ferme automatiquement après une durée définie ou peut
 * être fermé manuellement.
 */
const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 3000,
}) => {
  // Fermeture automatique après la durée spécifiée
  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose();
    }, duration);

    // Nettoyage du timeout en cas de démontage anticipé
    return () => clearTimeout(timeout);
  }, [onClose, duration]);

  // Classes de base pour le toast
  const baseClasses =
    "fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-md";

  // Classes spécifiques selon le type de toast
  const typeClasses =
    type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white";

  return (
    <motion.div
      className={`${baseClasses} ${typeClasses}`}
      initial={{ opacity: 0, y: -40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      aria-live="polite"
    >
      <div className="flex items-center">
        {/* Icône dynamique selon le type */}
        {type === "success" ? (
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        ) : (
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
        )}
        <span>{message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-100 focus:outline-none"
        aria-label="Fermer"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </motion.div>
  );
};

export default Toast;
