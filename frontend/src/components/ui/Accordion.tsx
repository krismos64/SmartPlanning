/**
 * Accordion - Composant de panneau repliable
 *
 * Affiche une liste de sections pliables/dépliables avec animation fluide.
 * Supporte l'ouverture de plusieurs panneaux simultanément ou un seul à la fois.
 * S'adapte automatiquement au thème clair/sombre et respecte les critères d'accessibilité.
 */
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useMemo, useState } from "react";

// Types pour les éléments de l'accordéon
export interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

// Interface des props du composant Accordion
export interface AccordionProps {
  items: AccordionItem[]; // Liste des éléments à afficher
  multiple?: boolean; // Autoriser plusieurs panels ouverts simultanément
  defaultOpenIndexes?: number[]; // Indices des panels ouverts par défaut
  className?: string; // Classes CSS additionnelles
}

const Accordion: React.FC<AccordionProps> = ({
  items,
  multiple = false,
  defaultOpenIndexes = [],
  className = "",
}) => {
  // État pour suivre les panneaux ouverts (leurs indices)
  const [openIndexes, setOpenIndexes] = useState<number[]>(defaultOpenIndexes);

  // Vérifier si un item est ouvert par son index
  const isItemOpen = useCallback(
    (index: number) => openIndexes.includes(index),
    [openIndexes]
  );

  // Gestionnaire pour basculer l'état ouvert/fermé d'un item
  const toggleItem = useCallback(
    (index: number) => {
      setOpenIndexes((prevOpenIndexes) => {
        // Si l'item est déjà ouvert, on le ferme
        if (prevOpenIndexes.includes(index)) {
          return prevOpenIndexes.filter((i) => i !== index);
        }

        // Si multiple=false, on remplace l'item ouvert actuel
        // Sinon, on ajoute l'item à la liste des ouverts
        return multiple ? [...prevOpenIndexes, index] : [index];
      });
    },
    [multiple]
  );

  // Générer des IDs uniques pour l'accessibilité
  const itemIds = useMemo(
    () =>
      items.map(
        (_, index) =>
          `accordion-item-${index}-${Math.random()
            .toString(36)
            .substring(2, 9)}`
      ),
    [items]
  );

  // Variantes d'animation pour le contenu
  const contentVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        ease: [0.4, 0.0, 0.2, 1],
      },
    },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1],
      },
    },
  };

  // Variantes d'animation pour l'icône
  const iconVariants = {
    closed: { rotate: 0 },
    open: { rotate: 180 },
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => {
        const isOpen = isItemOpen(index);
        const headerId = `header-${itemIds[index]}`;
        const contentId = `content-${itemIds[index]}`;

        return (
          <div
            key={itemIds[index]}
            className="border border-[var(--border)] rounded-lg bg-[var(--background-secondary)] overflow-hidden shadow-sm"
          >
            {/* En-tête de l'item (bouton qui bascule l'état) */}
            <button
              id={headerId}
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => toggleItem(index)}
              className="flex justify-between items-center w-full px-4 py-3 text-left text-[var(--text-primary)] hover:bg-[var(--background-tertiary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:ring-inset transition-colors duration-200"
            >
              <span className="font-medium text-[var(--text-primary)]">
                {item.title}
              </span>

              {/* Icône de chevron animée */}
              <motion.div
                variants={iconVariants}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 text-[var(--text-secondary)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </motion.div>
            </button>

            {/* Contenu animé de l'item */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={contentId}
                  role="region"
                  aria-labelledby={headerId}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="overflow-hidden"
                >
                  <div className="px-4 py-3 border-t border-[var(--border)] text-[var(--text-primary)]">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
