/**
 * TagSelector - Composant de sélection de tags avec filtrage
 *
 * Permet de filtrer et sélectionner plusieurs tags avec animation,
 * accessibilité et adaptation au thème clair/sombre.
 */
import { AnimatePresence, motion } from "framer-motion";
import React, { KeyboardEvent, useEffect, useRef, useState } from "react";

/**
 * Interface pour les propriétés du composant TagSelector
 */
export interface TagSelectorProps {
  /** Liste des tags disponibles */
  availableTags: string[];
  /** Tags actuellement sélectionnés */
  selectedTags: string[];
  /** Callback appelé lorsqu'un tag est ajouté ou supprimé */
  onChange: (tags: string[]) => void;
  /** Texte de placeholder pour l'input de recherche */
  placeholder?: string;
  /** Nombre maximum de tags sélectionnables (illimité si non défini) */
  maxSelectable?: number;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant TagSelector
 */
const TagSelector: React.FC<TagSelectorProps> = ({
  availableTags,
  selectedTags,
  onChange,
  placeholder = "Rechercher des tags...",
  maxSelectable,
  className = "",
}) => {
  // État pour la valeur du champ de recherche
  const [searchValue, setSearchValue] = useState<string>("");
  // État pour l'affichage des suggestions
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  // Référence pour le conteneur des suggestions pour gérer le clic extérieur
  const suggestionsRef = useRef<HTMLDivElement>(null);
  // Référence pour l'input de recherche
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrer les tags disponibles en fonction de la recherche et des tags déjà sélectionnés
  const filteredTags = availableTags.filter(
    (tag) =>
      tag.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selectedTags.includes(tag)
  );

  // Vérifier si la limite de sélection est atteinte
  const isMaxReached =
    maxSelectable !== undefined && selectedTags.length >= maxSelectable;

  // Fonction pour ajouter un tag
  const addTag = (tag: string) => {
    // Vérifier si le tag n'est pas déjà sélectionné et que la limite n'est pas atteinte
    if (!selectedTags.includes(tag) && !isMaxReached) {
      onChange([...selectedTags, tag]);
      setSearchValue("");
    }
  };

  // Fonction pour supprimer un tag
  const removeTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  // Gestionnaire pour les touches clavier dans l'input
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Si l'utilisateur appuie sur Entrée et qu'il y a une valeur de recherche
    if (e.key === "Enter" && searchValue.trim() !== "") {
      e.preventDefault();
      // S'il y a des suggestions filtrées, ajouter la première
      if (filteredTags.length > 0) {
        addTag(filteredTags[0]);
      }
    }
    // Si l'utilisateur appuie sur Backspace et que le champ est vide, supprimer le dernier tag
    else if (
      e.key === "Backspace" &&
      searchValue === "" &&
      selectedTags.length > 0
    ) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  // Gérer le clic à l'extérieur pour fermer les suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`w-full ${className}`} aria-label="Sélecteur de tags">
      {/* Affichage des tags sélectionnés */}
      <div className="flex flex-wrap gap-2 mb-2">
        <AnimatePresence>
          {selectedTags.map((tag) => (
            <motion.span
              key={tag}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              layout
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1.5 text-[var(--accent-primary)]/70 hover:text-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/50 rounded-full"
                aria-label={`Supprimer le tag ${tag}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Affichage d'un message si la limite est atteinte */}
      {isMaxReached && (
        <div className="text-sm text-[var(--text-secondary)] mb-2">
          Limite de {maxSelectable} tags atteinte
        </div>
      )}

      {/* Zone de recherche de tags */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={isMaxReached ? "Limite de tags atteinte" : placeholder}
          disabled={isMaxReached}
          className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Rechercher des tags"
          aria-expanded={showSuggestions}
          aria-controls="tag-suggestions"
        />

        {/* Liste des suggestions */}
        <AnimatePresence>
          {showSuggestions && searchValue && !isMaxReached && (
            <motion.div
              id="tag-suggestions"
              ref={suggestionsRef}
              className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-lg"
              role="listbox"
              aria-label="Suggestions de tags"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <motion.div
                    key={tag}
                    className="px-3 py-2 cursor-pointer hover:bg-[var(--background-tertiary)] text-[var(--text-primary)]"
                    onClick={() => {
                      addTag(tag);
                      setShowSuggestions(false);
                    }}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.1 }}
                    role="option"
                    aria-selected={false}
                  >
                    {tag}
                  </motion.div>
                ))
              ) : (
                <div className="px-3 py-2 text-[var(--text-secondary)]">
                  Aucun tag disponible
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Message d'indication sur l'utilisation */}
      <div className="mt-1 text-xs text-[var(--text-tertiary)]">
        {!isMaxReached && (
          <>
            Appuyez sur Entrée pour ajouter un tag
            {selectedTags.length > 0 && ", Backspace pour supprimer le dernier"}
          </>
        )}
      </div>
    </div>
  );
};

export default TagSelector;
