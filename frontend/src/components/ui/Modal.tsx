import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef } from "react";

/**
 * Interface pour les propriétés du composant Modal
 */
export interface ModalProps {
  /** État d'ouverture de la fenêtre modale */
  isOpen: boolean;
  /** Fonction pour fermer la fenêtre modale */
  onClose: () => void;
  /** Titre de la fenêtre modale */
  title?: string;
  /** Contenu de la fenêtre modale */
  children: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant Modal
 *
 * Affiche une fenêtre modale avec animation et différentes tailles.
 * Gère la fermeture par clic sur l'arrière-plan, touche Escape ou boutons dédiés.
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}) => {
  // Référence pour le contenu de la modale
  const contentRef = useRef<HTMLDivElement>(null);
  // Référence pour le bouton de fermeture (pour le focus initial)
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ID unique pour l'accessibilité ARIA
  const modalId = useRef<string>(
    `modal-${Math.random().toString(36).substr(2, 9)}`
  );
  const titleId = title ? `${modalId.current}-title` : undefined;

  // Variantes d'animation pour le fond et le contenu
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
  };

  // Écouteur d'événement pour la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Gestion du piège de focus (focus trap)
  useEffect(() => {
    if (!isOpen) return;

    // Focus le bouton de fermeture quand la modale s'ouvre
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    // Sauvegarde l'élément actif avant l'ouverture
    const activeElement = document.activeElement as HTMLElement;

    // Intercepte les événements de touche tab pour maintenir le focus dans la modale
    const handleTabKey = (e: KeyboardEvent) => {
      if (!contentRef.current || e.key !== "Tab") return;

      // Récupérer tous les éléments focusables dans la modale
      const focusableElements = contentRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      // Si on maintient Shift (tabulation arrière) et que le premier élément est actif,
      // aller au dernier élément
      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
      // Si on tabule en avant à partir du dernier élément, retourner au premier
      else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleTabKey);

    // Restaurer le focus à l'élément d'origine lorsque la modale se ferme
    return () => {
      document.removeEventListener("keydown", handleTabKey);
      if (activeElement) {
        setTimeout(() => activeElement.focus(), 0);
      }
    };
  }, [isOpen]);

  // Bloquer le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Gestionnaire de clic sur le fond pour fermer
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center p-4">
          {/* Fond semi-transparent avec flou */}
          <motion.div
            className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Contenu de la modale */}
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`
              w-full max-w-md
              bg-white text-gray-800
              dark:bg-gray-900 dark:text-gray-100
              rounded-xl
              shadow-xl dark:shadow-black/20
              border border-gray-200 dark:border-gray-700
              relative
              overflow-hidden
              flex flex-col
              max-h-[calc(100vh-2rem)]
              ${className}
            `}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={contentVariants}
            tabIndex={-1}
          >
            {/* Bouton de fermeture (X) */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="
                absolute top-4 right-4
                text-gray-500 dark:text-gray-400 
                hover:text-gray-700 dark:hover:text-white
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-400/50
                rounded-full
                p-1.5
                bg-gray-100 hover:bg-gray-200
                dark:bg-gray-800 dark:hover:bg-gray-700
                transition-colors
                duration-200
                z-10
              "
              aria-label="Fermer"
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Titre de la modale (si fourni) */}
            {title && (
              <div className="p-6 pb-0">
                <h2
                  id={titleId}
                  className="text-xl font-semibold mb-4 pr-8 text-indigo-600 dark:text-white"
                >
                  {title}
                </h2>
              </div>
            )}

            {/* Contenu de la modale avec défilement */}
            <div className="overflow-y-auto">
              <div className={`p-6 ${title ? "pt-0" : ""}`}>{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
