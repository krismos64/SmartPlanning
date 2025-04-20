/**
 * Table - Composant universel de tableau de données
 *
 * Affiche de manière dynamique des données tabulaires avec support de tri,
 * pagination et adaptation responsive.
 */
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

/**
 * Interface pour les colonnes du tableau
 */
interface TableColumn {
  /** Clé unique de la colonne (correspond à la clé dans les objets data) */
  key: string;
  /** Libellé affiché dans l'en-tête */
  label: string;
  /** Si la colonne peut être triée */
  sortable?: boolean;
  /** Classes CSS additionnelles pour la colonne */
  className?: string;
}

/**
 * Configuration de l'état vide
 */
interface EmptyStateConfig {
  /** Titre affiché lorsque le tableau est vide */
  title: string;
  /** Description optionnelle */
  description?: string;
  /** Icône optionnelle */
  icon?: React.ReactNode;
}

/**
 * Interface des propriétés du composant Table
 */
export interface TableProps {
  /** Définition des colonnes */
  columns: TableColumn[];
  /** Données à afficher (tableau d'objets) */
  data: Record<string, any>[];
  /** Activer la pagination */
  pagination?: boolean;
  /** Nombre de lignes par page */
  rowsPerPage?: number;
  /** Page initiale */
  initialPage?: number;
  /** Configuration de l'état vide */
  emptyState?: EmptyStateConfig;
  /** Classes CSS additionnelles */
  className?: string;
  /** Callback appelé à la sélection d'une ligne */
  onRowClick?: (row: Record<string, any>) => void;
}

/**
 * Type pour l'ordre de tri
 */
type SortOrder = "asc" | "desc" | null;

/**
 * Composant Table
 *
 * Tableau de données universel avec tri, pagination et adaptation responsive.
 */
const Table: React.FC<TableProps> = ({
  columns,
  data,
  pagination = false,
  rowsPerPage = 10,
  initialPage = 1,
  emptyState = {
    title: "Aucune donnée disponible",
    description: "Aucun élément à afficher dans ce tableau.",
  },
  className = "",
  onRowClick,
}) => {
  // État de tri
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // État de pagination
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);

  /**
   * Calcule le nombre total de pages en fonction des données et de rowsPerPage
   */
  useEffect(() => {
    if (pagination) {
      setTotalPages(Math.max(1, Math.ceil(data.length / rowsPerPage)));

      // Ajuste la page courante si elle dépasse le nouveau total
      if (currentPage > Math.ceil(data.length / rowsPerPage)) {
        setCurrentPage(Math.max(1, Math.ceil(data.length / rowsPerPage)));
      }
    }
  }, [data, rowsPerPage, pagination, currentPage]);

  /**
   * Gère le clic sur l'en-tête d'une colonne pour le tri
   */
  const handleSort = (column: TableColumn) => {
    if (!column.sortable) return;

    // Si on clique sur la même colonne, on change l'ordre (asc -> desc -> null)
    if (sortKey === column.key) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortKey(null);
        setSortOrder(null);
      }
    } else {
      // Nouvelle colonne sélectionnée, on commence par l'ordre ascendant
      setSortKey(column.key);
      setSortOrder("asc");
    }
  };

  /**
   * Récupère l'icône de tri adaptée à l'état courant
   */
  const getSortIcon = (column: TableColumn) => {
    if (!column.sortable) return null;

    if (sortKey !== column.key) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    if (sortOrder === "asc") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      );
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
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
    );
  };

  /**
   * Trie les données en fonction de l'état de tri
   */
  const getSortedData = () => {
    if (!sortKey || !sortOrder) return data;

    return [...data].sort((a, b) => {
      const valueA = a[sortKey];
      const valueB = b[sortKey];

      // Gestion des différents types de valeur
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortOrder === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (valueA === valueB) return 0;

      if (valueA === null || valueA === undefined)
        return sortOrder === "asc" ? -1 : 1;
      if (valueB === null || valueB === undefined)
        return sortOrder === "asc" ? 1 : -1;

      return sortOrder === "asc"
        ? valueA < valueB
          ? -1
          : 1
        : valueA < valueB
        ? 1
        : -1;
    });
  };

  /**
   * Récupère les données paginées
   */
  const getPaginatedData = () => {
    const sorted = getSortedData();

    if (!pagination) return sorted;

    const startIndex = (currentPage - 1) * rowsPerPage;
    return sorted.slice(startIndex, startIndex + rowsPerPage);
  };

  /**
   * Gère la navigation entre les pages
   */
  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  /**
   * Génère les boutons de pagination
   */
  const renderPagination = () => {
    // Si pas de pagination ou une seule page, on n'affiche rien
    if (!pagination || totalPages <= 1) return null;

    // Fonction pour générer un bouton de page
    const pageButton = (number: number, label?: string, disabled = false) => (
      <button
        key={`page-${label || number}`}
        onClick={() => !disabled && goToPage(number)}
        disabled={disabled}
        className={`px-3 py-1.5 rounded-md ${
          number === currentPage
            ? "bg-[var(--accent-primary)] text-white"
            : "bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        aria-current={number === currentPage ? "page" : undefined}
      >
        {label || number}
      </button>
    );

    // Génération des boutons de navigation
    const pageButtons = [];

    // Bouton "Précédent"
    pageButtons.push(pageButton(currentPage - 1, "←", currentPage === 1));

    // Pages spécifiques à afficher
    const pagesToShow = [];

    // Toujours afficher la première page
    pagesToShow.push(1);

    // Pages autour de la page courante
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (!pagesToShow.includes(i)) {
        pagesToShow.push(i);
      }
    }

    // Toujours afficher la dernière page si > 1
    if (totalPages > 1) {
      pagesToShow.push(totalPages);
    }

    // Tri et ajout des ellipses
    const sortedPages = [...new Set(pagesToShow)].sort((a, b) => a - b);

    // Génération des boutons avec ellipses si nécessaire
    sortedPages.forEach((page, index) => {
      if (index > 0 && page - sortedPages[index - 1] > 1) {
        // Ajouter une ellipse si écart > 1
        pageButtons.push(
          <span
            key={`ellipsis-${index}`}
            className="px-3 py-1.5 text-[var(--text-tertiary)]"
          >
            ...
          </span>
        );
      }
      pageButtons.push(pageButton(page));
    });

    // Bouton "Suivant"
    pageButtons.push(
      pageButton(currentPage + 1, "→", currentPage === totalPages)
    );

    return (
      <div className="flex justify-center mt-4 gap-1 text-sm">
        {pageButtons}
      </div>
    );
  };

  /**
   * Affiche un état vide quand il n'y a pas de données
   */
  const renderEmptyState = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--background-secondary)]/30"
      >
        {emptyState.icon && (
          <div className="mb-4 text-[var(--text-tertiary)]">
            {emptyState.icon}
          </div>
        )}
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          {emptyState.title}
        </h3>
        {emptyState.description && (
          <p className="text-[var(--text-secondary)] max-w-md">
            {emptyState.description}
          </p>
        )}
      </motion.div>
    );
  };

  /**
   * Rendu principal du tableau
   */
  return (
    <div className={`w-full ${className}`}>
      {data.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Tableau avec défilement horizontal pour mobile */}
          <div className="overflow-x-auto">
            <table role="table" className="w-full border-collapse text-sm">
              {/* En-tête du tableau */}
              <thead className="bg-[var(--background-secondary)]">
                <tr role="row">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      role="columnheader"
                      className={`text-left py-3 px-4 font-medium text-[var(--text-secondary)] border-b border-[var(--border)] ${
                        column.sortable ? "cursor-pointer select-none" : ""
                      } ${column.className || ""}`}
                      onClick={() => handleSort(column)}
                      aria-sort={
                        sortKey === column.key
                          ? sortOrder === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable && (
                          <span className="ml-1">{getSortIcon(column)}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Corps du tableau */}
              <tbody>
                <AnimatePresence mode="wait">
                  {getPaginatedData().map((row, rowIndex) => (
                    <motion.tr
                      key={rowIndex}
                      role="row"
                      className={`border-b border-[var(--border)] hover:bg-[var(--background-tertiary)]/50 transition-colors ${
                        onRowClick ? "cursor-pointer" : ""
                      }`}
                      onClick={() => onRowClick && onRowClick(row)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.2,
                        delay: rowIndex * 0.05,
                      }}
                      whileHover={{ scale: onRowClick ? 1.005 : 1 }}
                    >
                      {columns.map((column) => (
                        <td
                          key={`${rowIndex}-${column.key}`}
                          role="cell"
                          className={`py-3 px-4 text-[var(--text-primary)] align-middle ${
                            column.className || ""
                          }`}
                        >
                          {row[column.key] !== undefined
                            ? row[column.key]
                            : "-"}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default Table;
