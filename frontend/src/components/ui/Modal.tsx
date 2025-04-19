import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef } from "react";

/**
 * Interface pour les propriétés du composant Modal
 */
export interface ModalProps {
  /** Titre de la fenêtre modale */
  title: string;
  /** Contenu de la fenêtre modale */
  children: React.ReactNode;
  /** État d'ouverture de la fenêtre modale */
  isOpen: boolean;
  /** Fonction pour fermer la fenêtre modale */
  onClose: () => void;
  /** Taille de la fenêtre modale */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Fonction exécutée lors de la validation (bouton principal) */
  onConfirm?: () => void;
  /** Texte du bouton de confirmation */
  confirmText?: string;
  /** Texte du bouton d'annulation */
  cancelText?: string;
  /** Afficher ou non le bouton de fermeture dans l'entête */
  showCloseButton?: boolean;
  /** Fermer la modale en cliquant sur l'arrière-plan */
  closeOnBackdropClick?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
  /** Empêcher la fermeture de la modale via Escape */
  preventEscapeClose?: boolean;
}

/**
 * Composant Modal
 *
 * Affiche une fenêtre modale avec animation et différentes tailles.
 * Gère la fermeture par clic sur l'arrière-plan, touche Escape ou boutons dédiés.
 */
const Modal: React.FC<ModalProps> = ({
  title,
  children,
  isOpen,
  onClose,
  size = "md",
  onConfirm,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = "",
  preventEscapeClose = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Détermine les classes CSS en fonction de la taille
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "max-w-sm";
      case "md":
        return "max-w-md";
      case "lg":
        return "max-w-lg";
      case "xl":
        return "max-w-xl";
      case "full":
        return "max-w-full mx-4";
      default:
        return "max-w-md";
    }
  };

  // Gère la fermeture par la touche Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !preventEscapeClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose, preventEscapeClose]);

  // Empêche le défilement du body quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Gère la fermeture en cliquant sur l'arrière-plan
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      closeOnBackdropClick &&
      modalRef.current &&
      !modalRef.current.contains(e.target as Node)
    ) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            className={`relative ${getSizeClasses()} w-full bg-white rounded-lg shadow-xl ${className}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
          >
            {/* En-tête */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              {showCloseButton && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={onClose}
                  aria-label="Fermer"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Corps */}
            <div className="p-6">{children}</div>

            {/* Pied de page avec boutons */}
            {(onConfirm || cancelText) && (
              <div className="flex justify-end p-4 space-x-2 border-t border-gray-200">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={onClose}
                >
                  {cancelText}
                </button>
                {onConfirm && (
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={onConfirm}
                  >
                    {confirmText}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
