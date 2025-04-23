/**
 * Breadcrumb - Composant de fil d'ariane
 *
 * Affiche une navigation hiérarchique des pages visitées,
 * avec le dernier élément représentant la page active.
 */
import { motion } from "framer-motion";
import React from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = "" }) => {
  if (!items || items.length === 0) return null;

  return (
    <motion.nav
      role="navigation"
      aria-label="Fil d'ariane"
      className={`flex items-center text-sm text-gray-700 dark:text-white ${className}`}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const showSeparator = index < items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center">
              {isLast || !item.href ? (
                <span
                  className="text-[var(--text-primary)] dark:text-white font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <motion.a
                  href={item.href}
                  className="text-[var(--text-secondary)] dark:text-white hover:text-[var(--accent-primary)] dark:hover:text-[var(--accent-secondary)] transition-colors"
                  whileHover={{ scale: 1.02 }}
                >
                  {item.label}
                </motion.a>
              )}

              {showSeparator && (
                <motion.span
                  className="text-[var(--text-tertiary)] dark:text-[var(--text-secondary)] mx-2 select-none"
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
