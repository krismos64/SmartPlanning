/**
 * SearchInput - Composant de champ de recherche
 *
 * Permet aux utilisateurs d'effectuer des recherches avec debounce optionnel,
 * indicateur de chargement et adaptation au thème clair/sombre.
 */
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef } from "react";

/**
 * Interface pour les propriétés du composant SearchInput
 */
export interface SearchInputProps {
  /** Valeur actuelle du champ de recherche */
  value: string;
  /** Callback appelé lors du changement de valeur */
  onChange: (value: string) => void;
  /** Texte de placeholder */
  placeholder?: string;
  /** Classes CSS additionnelles */
  className?: string;
  /** Affiche un indicateur de chargement si true */
  isLoading?: boolean;
  /** Délai de debounce en ms (pas de debounce si non défini) */
  debounceDelay?: number;
  /** Focus automatique à l'affichage */
  autoFocus?: boolean;
}

/**
 * Composant SearchInput
 *
 * Champ de recherche avec icône de loupe, bouton de réinitialisation,
 * indicateur de chargement et debounce optionnel.
 */
const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Rechercher...",
  className = "",
  isLoading = false,
  debounceDelay,
  autoFocus = false,
}) => {
  // Référence vers l'élément input pour focus et interactions clavier
  const inputRef = useRef<HTMLInputElement>(null);

  // Référence pour le timer de debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Référence pour stocker la dernière valeur non debouncée
  const lastValueRef = useRef<string>(value);

  // Gestion du changement avec debounce optionnel
  const handleChange = (newValue: string) => {
    // Mettre à jour la référence de la dernière valeur
    lastValueRef.current = newValue;

    // Si le debounce est activé
    if (debounceDelay && debounceDelay > 0) {
      // Annuler le timer précédent s'il existe
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Déclencher le callback après le délai de debounce
      debounceTimerRef.current = setTimeout(() => {
        onChange(lastValueRef.current);
      }, debounceDelay);
    } else {
      // Sans debounce, appeler le callback immédiatement
      onChange(newValue);
    }
  };

  // Fonction pour effacer le champ de recherche
  const handleClear = () => {
    // Appeler le callback avec une chaîne vide
    onChange("");
    // Donner le focus à l'input
    inputRef.current?.focus();
  };

  // Gestion des touches clavier (Échap pour effacer)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && value) {
      handleClear();
    }
  };

  // Nettoyage du timer de debounce au démontage
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      className={`relative w-full ${className}`}
      role="search"
      aria-label="Champ de recherche"
      initial={{ opacity: 0.9, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Icône de recherche (loupe) */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-[var(--text-tertiary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Champ de recherche */}
      <input
        ref={inputRef}
        type="text"
        className="w-full pl-10 pr-10 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)]/40 transition-shadow"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        aria-label={placeholder}
        aria-busy={isLoading}
      />

      {/* Bouton de réinitialisation ou spinner de chargement */}
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        <AnimatePresence mode="wait">
          {value &&
            (isLoading ? (
              /* Spinner de chargement */
              <motion.div
                key="spinner"
                className="h-5 w-5 text-[var(--text-tertiary)]"
                initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.2,
                  rotate: { repeat: Infinity, duration: 1, ease: "linear" },
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </motion.div>
            ) : (
              /* Bouton de réinitialisation (croix) */
              <motion.button
                key="clear-button"
                type="button"
                className="h-5 w-5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] focus:outline-none focus:text-[var(--text-primary)]"
                onClick={handleClear}
                aria-label="Effacer la recherche"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SearchInput;
