import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useId, useRef, useState } from "react";

// Définition des types pour les options et les props
export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  // Props obligatoires
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;

  // Props optionnelles
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  icon?: React.ReactNode; // Icône personnalisable
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  disabled = false,
  label,
  className = "",
  icon,
}) => {
  // État local pour gérer l'ouverture/fermeture du menu
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // État local pour le suivi de l'index de l'option active (navigation clavier)
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Référence pour le composant Select
  const selectRef = useRef<HTMLDivElement>(null);

  // Générer un ID unique pour les attributs ARIA
  const id = useId();
  const labelId = `select-label-${id}`;
  const listboxId = `select-listbox-${id}`;

  // Trouver l'option sélectionnée
  const selectedOption = options.find((option) => option.value === value);

  // Variantes d'animation pour le menu déroulant
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -5,
      transition: {
        duration: 0.15,
        ease: "easeInOut",
      },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  // Gestionnaire pour ouvrir/fermer le menu
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);

      // Réinitialiser l'index actif quand on ouvre le menu
      if (!isOpen) {
        const currentIndex = options.findIndex(
          (option) => option.value === value
        );
        setActiveIndex(currentIndex !== -1 ? currentIndex : 0);
      }
    }
  };

  // Gestionnaire pour sélectionner une option
  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  // Gestionnaire pour la navigation au clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        if (!isOpen) {
          setIsOpen(true);
        } else if (activeIndex >= 0 && activeIndex < options.length) {
          handleSelect(options[activeIndex]);
        }
        e.preventDefault();
        break;
      case "Escape":
        setIsOpen(false);
        e.preventDefault();
        break;
      case "ArrowDown":
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setActiveIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          );
        }
        e.preventDefault();
        break;
      case "ArrowUp":
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
        e.preventDefault();
        break;
      case "Tab":
        if (isOpen) {
          setIsOpen(false);
        }
        break;
      default:
        break;
    }
  };

  // Gestionnaire pour fermer le menu lors d'un clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Faire défiler jusqu'à l'option active lors de la navigation au clavier
  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      const activeOption = document.getElementById(
        `select-option-${activeIndex}`
      );
      if (activeOption) {
        activeOption.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex, isOpen]);

  return (
    <div className={`relative ${className}`}>
      {/* Label du select (si fourni) */}
      {label && (
        <label
          id={labelId}
          htmlFor={listboxId}
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
        >
          {label}
        </label>
      )}

      {/* Conteneur principal */}
      <div
        ref={selectRef}
        className={`relative w-full`}
        onKeyDown={handleKeyDown}
      >
        {/* Bouton de sélection */}
        <button
          type="button"
          id={listboxId}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? labelId : undefined}
          aria-disabled={disabled}
          className={`
            w-full px-3 py-2 
            bg-[var(--background-primary)]
            text-[var(--text-primary)]
            border border-[var(--border)]
            rounded-lg
            flex justify-between items-center
            transition-colors duration-200
            ${!disabled && "hover:border-[var(--accent-primary)]"}
            ${
              isOpen &&
              !disabled &&
              "border-[var(--accent-primary)] ring-2 ring-[var(--focus)] ring-opacity-50"
            }
            ${disabled && "opacity-60 cursor-not-allowed"}
            focus:outline-none
            focus:ring-2 focus:ring-[var(--focus)] focus:ring-opacity-50
          `}
          onClick={toggleDropdown}
          disabled={disabled}
        >
          {/* Texte affiché (selected option ou placeholder) */}
          <span className="block truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          {/* Icône (personnalisée ou chevron par défaut) */}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-2 flex items-center text-[var(--text-secondary)]"
          >
            {icon || (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </motion.span>
        </button>

        {/* Liste déroulante */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={dropdownVariants}
              className="
                absolute z-10 w-full mt-1 
                bg-[var(--background-secondary)]
                border border-[var(--border)]
                rounded-lg shadow-lg
                max-h-60 overflow-auto
                focus:outline-none
              "
              role="listbox"
              aria-labelledby={labelId}
            >
              <ul className="py-1">
                {options.map((option, index) => (
                  <li
                    id={`select-option-${index}`}
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                    className={`
                      px-3 py-2 cursor-pointer
                      transition-colors duration-150
                      truncate
                      ${
                        option.value === value
                          ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                          : "text-[var(--text-primary)]"
                      }
                      ${
                        activeIndex === index &&
                        "bg-[var(--background-tertiary)]"
                      }
                      hover:bg-[var(--background-tertiary)]
                      focus:bg-[var(--background-tertiary)]
                      focus:outline-none
                    `}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Select;
