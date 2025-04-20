/**
 * Tooltip - Composant d'infobulle accessible et animé
 *
 * Affiche une infobulle contextuelle au survol ou focus d'un élément.
 * Supporte différentes positions et s'adapte automatiquement au thème.
 */
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useId, useRef, useState } from "react";

export interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number; // délai avant apparition en ms
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 300,
  className = "",
}) => {
  // États
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Références
  const childRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ID unique pour l'accessibilité
  const id = useId();
  const tooltipId = `tooltip-${id}`;

  // Gestionnaires d'événements
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const handleFocus = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  // Nettoyage au démontage
  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsMounted(false);
    };
  }, []);

  // Variants d'animation pour différentes positions
  const tooltipVariants = {
    // Variantes pour la position top
    topHidden: {
      opacity: 0,
      y: 10,
    },
    topVisible: {
      opacity: 1,
      y: 0,
    },
    // Variantes pour la position bottom
    bottomHidden: {
      opacity: 0,
      y: -10,
    },
    bottomVisible: {
      opacity: 1,
      y: 0,
    },
    // Variantes pour la position left
    leftHidden: {
      opacity: 0,
      x: 10,
    },
    leftVisible: {
      opacity: 1,
      x: 0,
    },
    // Variantes pour la position right
    rightHidden: {
      opacity: 0,
      x: -10,
    },
    rightVisible: {
      opacity: 1,
      x: 0,
    },
  };

  // Classe de positionnement selon la prop position
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
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  // Flèche de direction selon la position
  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-t-[var(--background-secondary)] border-x-transparent border-b-transparent";
      case "bottom":
        return "top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-b-[var(--background-secondary)] border-x-transparent border-t-transparent";
      case "left":
        return "right-0 top-1/2 transform translate-x-full -translate-y-1/2 border-l-[var(--background-secondary)] border-y-transparent border-r-transparent";
      case "right":
        return "left-0 top-1/2 transform -translate-x-full -translate-y-1/2 border-r-[var(--background-secondary)] border-y-transparent border-l-transparent";
      default:
        return "bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-t-[var(--background-secondary)] border-x-transparent border-b-transparent";
    }
  };

  // Variantes d'animation selon la position
  const getAnimationVariants = () => {
    switch (position) {
      case "top":
        return {
          initial: "topHidden",
          animate: "topVisible",
          exit: "topHidden",
        };
      case "bottom":
        return {
          initial: "bottomHidden",
          animate: "bottomVisible",
          exit: "bottomHidden",
        };
      case "left":
        return {
          initial: "leftHidden",
          animate: "leftVisible",
          exit: "leftHidden",
        };
      case "right":
        return {
          initial: "rightHidden",
          animate: "rightVisible",
          exit: "rightHidden",
        };
      default:
        return {
          initial: "topHidden",
          animate: "topVisible",
          exit: "topHidden",
        };
    }
  };

  // Rendu du composant
  return (
    <div className={`inline-block relative ${className}`}>
      {/* Élément déclencheur */}
      <div
        ref={childRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children}
      </div>

      {/* Tooltip avec animation */}
      <AnimatePresence>
        {isVisible && isMounted && (
          <motion.div
            id={tooltipId}
            ref={tooltipRef}
            role="tooltip"
            className={`absolute z-50 whitespace-normal max-w-xs ${getPositionClasses()}`}
            {...getAnimationVariants()}
            variants={tooltipVariants}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Contenu du tooltip */}
            <div className="bg-[var(--background-secondary)] text-[var(--text-primary)] px-3 py-2 rounded-lg shadow-lg text-sm">
              {content}

              {/* Flèche directionnelle */}
              <div
                className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
