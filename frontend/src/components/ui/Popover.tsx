/**
 * Popover - Composant de contenu contextuel
 *
 * Affiche un contenu flottant déclenché par un élément (bouton, texte, icône...)
 * avec animation et positionnement dynamique. Entièrement accessible et adapté
 * au thème clair/sombre.
 */
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useId, useRef, useState } from "react";

// Interface des props du composant Popover
export interface PopoverProps {
  trigger: React.ReactNode; // Élément déclencheur (bouton, texte, icône, etc.)
  children: React.ReactNode; // Contenu du panel
  position?: "top" | "bottom" | "left" | "right"; // Position du panel
  className?: string; // Classes supplémentaires optionnelles
  title?: string; // Titre optionnel pour l'accessibilité
  closeOnClickInside?: boolean; // Fermer le popover si on clique à l'intérieur
  role?: "dialog" | "tooltip"; // Rôle ARIA du popover
}

// Helper pour déterminer la valeur correcte de aria-haspopup selon le rôle
const getAriaHasPopup = (
  role: string
): boolean | "dialog" | "menu" | "listbox" | "tree" | "grid" => {
  switch (role) {
    case "dialog":
      return "dialog";
    case "tooltip":
      return true;
    default:
      return true;
  }
};

const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  position = "bottom",
  className = "",
  title,
  closeOnClickInside = false,
  role = "dialog",
}) => {
  // État pour suivre si le popover est ouvert ou fermé
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Références pour les éléments DOM
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);

  // ID unique pour l'accessibilité
  const uniqueId = useId();
  const popoverId = `popover-${uniqueId}`;
  const titleId = title ? `popover-title-${uniqueId}` : undefined;

  // Gestionnaire pour basculer l'état ouvert/fermé du popover
  const togglePopover = () => {
    setIsOpen(!isOpen);
  };

  // Gestionnaire pour fermer le popover
  const closePopover = () => {
    setIsOpen(false);
  };

  // Gestionnaire de clic pour le contenu du popover
  const handleContentClick = (e: React.MouseEvent) => {
    // Arrêter la propagation pour éviter que le clic soit détecté comme en dehors
    e.stopPropagation();

    // Si closeOnClickInside est activé, fermer le popover
    if (closeOnClickInside) {
      closePopover();
    }
  };

  // Gestionnaire de clic en dehors du popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Vérifier si le clic est en dehors du popover et du déclencheur
      if (
        isOpen &&
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        closePopover();
      }
    };

    // Gestionnaire de touche Échap
    const handleEscKey = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        closePopover();
      }
    };

    // Ajouter les écouteurs d'événements
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    // Nettoyage des écouteurs d'événements lors du démontage
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen]);

  // Gestion du focus trap à l'ouverture du popover
  useEffect(() => {
    if (isOpen && popoverRef.current) {
      // Trouver le premier élément focusable dans le popover
      const focusableElements = popoverRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        // Stocker la référence du premier élément focusable
        firstFocusableRef.current = focusableElements[0] as HTMLElement;
        // Mettre le focus sur cet élément
        firstFocusableRef.current.focus();
      } else {
        // Si aucun élément focusable, mettre le focus sur le popover lui-même
        popoverRef.current.focus();
      }
    }
  }, [isOpen]);

  // Bloquer le scroll du body quand le popover est ouvert (si role="dialog")
  useEffect(() => {
    if (role === "dialog") {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }

      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, role]);

  // Classes de positionnement pour le popover
  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      default:
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
    }
  };

  // Variantes d'animation pour différentes positions
  const getAnimationVariants = () => {
    const baseVariants = {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    };

    // Ajouter un déplacement spécifique selon la position
    switch (position) {
      case "top":
        return {
          hidden: { ...baseVariants.hidden, y: 10 },
          visible: { ...baseVariants.visible, y: 0 },
        };
      case "bottom":
        return {
          hidden: { ...baseVariants.hidden, y: -10 },
          visible: { ...baseVariants.visible, y: 0 },
        };
      case "left":
        return {
          hidden: { ...baseVariants.hidden, x: 10 },
          visible: { ...baseVariants.visible, x: 0 },
        };
      case "right":
        return {
          hidden: { ...baseVariants.hidden, x: -10 },
          visible: { ...baseVariants.visible, x: 0 },
        };
      default:
        return baseVariants;
    }
  };

  return (
    <div className="relative inline-block">
      {/* Élément déclencheur */}
      <div
        ref={triggerRef}
        onClick={togglePopover}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePopover();
          }
        }}
        className="inline-block cursor-pointer"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup={getAriaHasPopup(role)}
        aria-controls={isOpen ? popoverId : undefined}
      >
        {trigger}
      </div>

      {/* Popover avec animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={popoverId}
            ref={popoverRef}
            role={role}
            aria-labelledby={titleId}
            className={`
              absolute z-50 min-w-[200px] max-w-sm
              bg-[var(--background-secondary)]
              border border-[var(--border)]
              rounded-xl shadow-lg
              text-[var(--text-primary)]
              focus:outline-none
              ${getPositionClasses()}
              ${className}
            `}
            variants={getAnimationVariants()}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 350,
            }}
            onClick={handleContentClick}
            tabIndex={-1}
          >
            <div className="p-4">
              {title && (
                <h3
                  id={titleId}
                  className="text-sm font-semibold border-b border-[var(--border)] pb-2 mb-2"
                >
                  {title}
                </h3>
              )}
              <div>{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Popover;
