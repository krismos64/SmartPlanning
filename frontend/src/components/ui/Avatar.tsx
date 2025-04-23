/**
 * Avatar - Composant d'avatar utilisateur
 *
 * Affiche une photo de profil ou des initiales générées
 * avec option de badge pour indiquer un statut
 */
import { User } from "lucide-react";
import React from "react";

/**
 * Interface des propriétés du composant Avatar
 */
interface AvatarProps {
  /** URL optionnelle de la photo de profil */
  src?: string | null;
  /** Texte alternatif pour l'image */
  alt?: string;
  /** Taille de l'avatar */
  size?: "sm" | "md" | "lg" | "xl";
  /** Classes CSS additionnelles */
  className?: string;
  /** Classes CSS additionnelles pour le fallback */
  fallbackClassName?: string;
}

/**
 * Composant Avatar pour afficher une photo de profil avec fallback
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Photo de profil",
  size = "md",
  className = "",
  fallbackClassName = "",
}) => {
  // Déterminer les classes de taille
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-24 h-24 text-lg",
  };

  // En cas d'erreur de chargement de l'image
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = "none";
    const parent = e.currentTarget.parentElement;
    if (parent) {
      const fallback = parent.querySelector(".avatar-fallback");
      if (fallback) {
        fallback.classList.remove("hidden");
      }
    }
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {src ? (
        <>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={handleError}
          />
          <div
            className={`avatar-fallback hidden absolute inset-0 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 ${fallbackClassName}`}
          >
            <User />
          </div>
        </>
      ) : (
        <div
          className={`flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 w-full h-full ${fallbackClassName}`}
        >
          <User />
        </div>
      )}
    </div>
  );
};

export default Avatar;
