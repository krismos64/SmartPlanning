/**
 * Title - Composant de titre sémantique
 *
 * Affiche un titre de niveau h1 à h4 avec des styles adaptés
 * tout en respectant les normes d'accessibilité web.
 */
import React from "react";

/**
 * Interface pour les propriétés du composant Title
 */
export interface TitleProps {
  /** Niveau du titre (1=h1, 2=h2, etc.) */
  level?: 1 | 2 | 3 | 4;
  /** Contenu du titre */
  children: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant Title
 *
 * Rend un titre avec le niveau de heading HTML approprié (h1-h4)
 * et des styles visuels cohérents selon le niveau.
 */
const Title: React.FC<TitleProps> = ({
  level = 2,
  children,
  className = "",
}) => {
  // Ne rien rendre si children est vide
  if (!children) {
    return null;
  }

  // Styles Tailwind pour chaque niveau de titre
  const styles = {
    1: "text-3xl font-bold",
    2: "text-2xl font-semibold",
    3: "text-xl font-medium",
    4: "text-lg font-medium",
  };

  // Classes CSS complètes avec les styles du niveau et les classes personnalisées
  const titleClasses = `${styles[level]} text-[var(--text-primary)] ${className}`;

  // Rendu conditionnel basé sur le niveau du titre
  switch (level) {
    case 1:
      return <h1 className={titleClasses}>{children}</h1>;
    case 2:
      return <h2 className={titleClasses}>{children}</h2>;
    case 3:
      return <h3 className={titleClasses}>{children}</h3>;
    case 4:
      return <h4 className={titleClasses}>{children}</h4>;
    default:
      // Fallback au niveau 2 (au cas où)
      return <h2 className={titleClasses}>{children}</h2>;
  }
};

export default Title;
