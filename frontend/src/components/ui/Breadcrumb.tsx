/**
 * Breadcrumb - Composant de fil d'ariane
 *
 * Affiche une navigation hiérarchique des pages visitées,
 * avec le dernier élément représentant la page active.
 */
import { motion } from "framer-motion";
import React from "react";

/**
 * Interface pour un élément du fil d'ariane
 */
export interface BreadcrumbItem {
  /** Libellé de l'élément */
  label: string;
  /** URL de destination (absent pour l'élément actif) */
  href?: string;
}

/**
 * Interface des propriétés du composant Breadcrumb
 */
export interface BreadcrumbProps {
  /** Liste des éléments du fil d'ariane */
  items: BreadcrumbItem[];
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant Breadcrumb
 *
 * Fil d'ariane responsive qui indique le chemin de navigation
 * avec une hiérarchie claire entre les pages visitées.
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = "" }) => {
  // Vérification de la présence d'éléments
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <motion.nav
      role="navigation"
      aria-label="Fil d'ariane"
      className={`flex items-center text-sm ${className}`}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          // Détermine si c'est l'élément actif (dernier élément)
          const isLast = index === items.length - 1;
          // Détermine si un séparateur doit être affiché après cet élément
          const showSeparator = index < items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center">
              {/* Élément du fil d'ariane */}
              {isLast || !item.href ? (
                /* Élément actif (non cliquable) */
                <span
                  className="text-[var(--text-primary)] font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                /* Lien cliquable */
                <motion.a
                  href={item.href}
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                  whileHover={{ scale: 1.02 }}
                >
                  {item.label}
                </motion.a>
              )}

              {/* Séparateur (chevron) */}
              {showSeparator && (
                <motion.span
                  className="text-[var(--text-tertiary)] mx-2 select-none"
                  whileHover={{ x: 1 }}
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </motion.span>
              )}
            </li>
          );
        })}
      </ol>
    </motion.nav>
  );
};

export default Breadcrumb;
