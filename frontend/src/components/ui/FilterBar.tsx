import { ChevronDown, Filter, Search } from "lucide-react";
import React, { useState } from "react";
import SearchInput from "./SearchInput";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: {
    [key: string]: {
      label: string;
      value: string;
      options: FilterOption[];
      onChange: (value: string) => void;
    };
  };
  className?: string;
  showFilterLabels?: boolean;
}

/**
 * Composant de barre de filtres réutilisable avec design moderne
 *
 * Combine une barre de recherche et des filtres déroulants alignés horizontalement
 * Design futuriste adapté au mode clair et sombre
 */
const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Rechercher par nom ou email...",
  filters,
  className = "",
  showFilterLabels = true,
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className={`${className} w-full`}>
      <div className="flex flex-col lg:flex-row gap-3 w-full">
        {/* Conteneur principal avec effet glassmorphism */}
        <div className="flex-1 flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 dark:border-gray-700/50 p-1.5">
          {/* Icône de recherche */}
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <Search size={18} />
          </div>

          {/* Barre de recherche */}
          <div className="flex-grow">
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="w-full"
              modern={true}
            />
          </div>

          {/* Bouton pour afficher/masquer les filtres sur mobile */}
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter size={18} />
          </button>
        </div>

        {/* Filtres version desktop - toujours visibles sur lg et plus */}
        <div className="hidden lg:flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 dark:border-gray-700/50 p-1.5">
          {Object.entries(filters).map(([key, filter]) => (
            <div key={key} className="flex items-center">
              {showFilterLabels && (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                  {filter.label}:
                </span>
              )}
              <div className="relative">
                <select
                  id={`filter-desktop-${key}`}
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg
                           bg-white/90 dark:bg-gray-700/90 text-gray-800 dark:text-gray-200
                           border border-transparent hover:border-indigo-300 dark:hover:border-indigo-700
                           focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-500
                           transition-all duration-200"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-500 dark:text-indigo-400">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtres version mobile - visibles uniquement si showMobileFilters est true */}
      {showMobileFilters && (
        <div className="lg:hidden mt-3 grid grid-cols-2 gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 dark:border-gray-700/50 p-3 animate-fade-in">
          {Object.entries(filters).map(([key, filter]) => (
            <div key={key} className="flex flex-col">
              {showFilterLabels && (
                <label
                  htmlFor={`filter-mobile-${key}`}
                  className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1"
                >
                  {filter.label}
                </label>
              )}
              <div className="relative">
                <select
                  id={`filter-mobile-${key}`}
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="appearance-none w-full pl-3 pr-8 py-2.5 rounded-lg
                           bg-white/90 dark:bg-gray-700/90 text-gray-800 dark:text-gray-200
                           border border-transparent hover:border-indigo-300 dark:hover:border-indigo-700
                           focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-500
                           transition-all duration-200"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-500 dark:text-indigo-400">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
