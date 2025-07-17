/**
 * SearchInput - Composant de champ de recherche
 *
 * Permet aux utilisateurs d'effectuer des recherches avec debounce optionnel,
 * indicateur de chargement et adaptation au thème clair/sombre.
 */
import { Search, X } from "lucide-react";
import React, { useState } from "react";

/**
 * Interface pour les propriétés du composant SearchInput
 */
interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
  autoFocus?: boolean; // Déconseillé pour l'accessibilité
  debounceTime?: number;
  modern?: boolean;
  label?: string; // Label accessible pour le champ de recherche
  id?: string; // ID unique pour l'association label-input
}

/**
 * Composant de champ de recherche réutilisable
 *
 * Inclut une icône de recherche, un champ de saisie et un bouton pour effacer la recherche
 * Supporte le debounce pour éviter trop d'appels lors de la saisie rapide
 * Supporte un mode moderne avec un design plus futuriste
 */
const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Rechercher...",
  value,
  onChange,
  onClear,
  className = "",
  autoFocus = false,
  debounceTime = 300,
  modern = false,
  label,
  id,
}) => {
  const [localValue, setLocalValue] = useState<string>(value);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Gestion de la saisie avec debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Effacer le timeout précédent s'il existe
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Créer un nouveau timeout pour le debounce
    const timeout = setTimeout(() => {
      onChange(newValue);
    }, debounceTime);

    setDebounceTimeout(timeout);
  };

  // Effacer la recherche
  const handleClear = () => {
    setLocalValue("");
    onChange("");
    if (onClear) onClear();
  };

  // Classes pour le style moderne ou classique
  const inputClasses = modern
    ? `w-full py-2.5 bg-transparent text-gray-800 dark:text-gray-200 
       border-none focus:ring-0 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500
       transition-all duration-200`
    : `w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 
       focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-500
       transition-colors duration-200`;

  // Générer un ID unique si non fourni
  const inputId = id || `search-input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`relative ${className}`}>
      {/* Label visible si fourni */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {!modern && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search 
              size={18} 
              className="text-gray-500 dark:text-gray-400" 
              aria-hidden="true"
            />
          </div>
        )}

        <input
          type="text"
          id={inputId}
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          /* autoFocus désactivé pour l'accessibilité */
          className={inputClasses}
          aria-label={label || placeholder}
          aria-describedby={localValue ? `${inputId}-clear` : undefined}
        />

        {localValue && (
          <button
            type="button"
            id={`${inputId}-clear`}
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-md transition-colors"
            aria-label="Effacer la recherche"
            title="Effacer la recherche"
          >
            <X
              size={16}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchInput;
