import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

/**
 * Interface pour les éléments du menu dropdown
 */
export interface DropdownItem {
  /** Valeur unique de l'élément */
  value: string;
  /** Texte à afficher pour l'élément */
  label: string;
  /** Icône optionnelle pour l'élément (composant React) */
  icon?: React.ReactNode;
  /** Désactiver l'élément */
  disabled?: boolean;
}

/**
 * Interface pour les propriétés du composant Dropdown
 */
export interface DropdownProps {
  /** Texte du bouton déclencheur */
  triggerText: string;
  /** Liste des éléments du menu */
  items: DropdownItem[];
  /** Fonction appelée lorsqu'un élément est sélectionné */
  onSelect: (value: string) => void;
  /** Position du menu par rapport au bouton déclencheur */
  position?: "top" | "bottom" | "left" | "right";
  /** Icône optionnelle pour le bouton déclencheur */
  icon?: React.ReactNode;
  /** Classes CSS additionnelles pour le conteneur */
  className?: string;
  /** Désactiver le dropdown */
  disabled?: boolean;
}

/**
 * Composant Dropdown
 *
 * Menu déroulant interactif permettant à l'utilisateur de sélectionner une option
 * parmi une liste d'éléments. S'affiche/se masque avec des animations fluides.
 */
const Dropdown: React.FC<DropdownProps> = ({
  triggerText,
  items,
  onSelect,
  position = "bottom",
  icon,
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Détermine les classes de positionnement du menu
  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full mb-2";
      case "left":
        return "right-0 mr-2 top-0";
      case "right":
        return "left-0 ml-2 top-0";
      default:
        return "top-full mt-2";
    }
  };

  // Gère les animations selon la position
  const getAnimationVariants = () => {
    const baseVariants = {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    };

    switch (position) {
      case "top":
        return {
          hidden: { ...baseVariants.hidden, y: 10 },
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
        return {
          hidden: { ...baseVariants.hidden, y: -10 },
          visible: { ...baseVariants.visible, y: 0 },
        };
    }
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  // Ferme le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Ferme le dropdown si on appuie sur la touche Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block text-left ${className}`}
    >
      <button
        type="button"
        className={`inline-flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {triggerText}
        </span>
        <svg
          className={`w-5 h-5 ml-2 -mr-1 text-gray-400 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute z-10 w-56 mt-2 bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${getPositionClasses()}`}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={getAnimationVariants()}
            transition={{ duration: 0.2 }}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="dropdown-button"
          >
            <div className="py-1" role="none">
              {items.map((item) => (
                <button
                  key={item.value}
                  className={`group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={() => !item.disabled && handleSelect(item.value)}
                  disabled={item.disabled}
                  role="menuitem"
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
