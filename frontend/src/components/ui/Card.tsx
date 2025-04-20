/**
 * Card - Composant de carte
 *
 * Conteneur stylisé pour regrouper du contenu associé.
 * Personnalisable avec différentes options visuelles.
 */
import React from "react";

/**
 * Interface pour les propriétés du composant Card
 */
export interface CardProps {
  /** Contenu principal de la carte */
  children: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
  /** Titre optionnel de la carte */
  title?: string;
  /** Description optionnelle sous le titre */
  description?: string;
  /** Réduit les marges et padding si true */
  compact?: boolean;
  /** Ajoute un effet visuel au survol si true */
  hoverable?: boolean;
  /** Ajoute une bordure si true */
  bordered?: boolean;
}

/**
 * Composant Card
 *
 * Carte stylisée pour contenir du contenu, avec options
 * de personnalisation visuelle et de structure.
 */
const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  description,
  compact = false,
  hoverable = false,
  bordered = true,
}) => {
  // Classes de base pour toutes les cartes
  const baseClasses =
    "bg-[var(--background-secondary)] rounded-2xl shadow-md transition-shadow";

  // Padding variable selon l'option compact
  const paddingClasses = compact ? "p-4" : "p-6";

  // Effet au survol si l'option hoverable est activée
  const hoverClasses = hoverable
    ? "hover:shadow-lg hover:translate-y-[-2px] transition-all"
    : "";

  // Bordure conditionnelle
  const borderClasses = bordered ? "border border-[var(--border)]" : "";

  // Assemblage des classes CSS
  const cardClasses = `${baseClasses} ${paddingClasses} ${hoverClasses} ${borderClasses} ${className}`;

  return (
    <div className={cardClasses}>
      {/* Affichage conditionnel du titre et de la description */}
      {(title || description) && (
        <div className={`${children ? "mb-4" : ""}`}>
          {title && (
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Contenu principal de la carte */}
      {children}
    </div>
  );
};

export default Card;
