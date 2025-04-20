/**
 * Avatar - Composant d'avatar utilisateur
 *
 * Affiche une photo de profil ou des initiales générées
 * avec option de badge pour indiquer un statut
 */
import { motion } from "framer-motion";
import React, { useMemo, useState } from "react";

/**
 * Interface des propriétés du composant Avatar
 */
export interface AvatarProps {
  /** Nom complet de l'utilisateur (ex: "Claire Dupont") */
  name: string;
  /** URL optionnelle de la photo de profil */
  src?: string;
  /** Taille de l'avatar */
  size?: "sm" | "md" | "lg";
  /** Couleur du badge (ex: "#16a34a" ou "var(--success)") */
  badgeColor?: string;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Tailles prédéfinies en pixels pour chaque option
 */
const SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
};

/**
 * Palettes de couleurs pastel pour le fond des avatars textuels
 */
const BACKGROUND_COLORS = [
  "#f0f9ff", // bleu très clair
  "#fef2f2", // rouge très clair
  "#f0fdf4", // vert très clair
  "#faf5ff", // violet très clair
  "#fff7ed", // orange très clair
  "#fdf2f8", // rose très clair
  "#f8fafc", // gris très clair
  "#f0fdfa", // turquoise très clair
];

/**
 * Couleurs de texte correspondantes pour assurer le contraste
 */
const TEXT_COLORS = [
  "#0369a1", // bleu
  "#b91c1c", // rouge
  "#15803d", // vert
  "#7e22ce", // violet
  "#c2410c", // orange
  "#be185d", // rose
  "#334155", // gris
  "#0f766e", // turquoise
];

/**
 * Composant Avatar
 *
 * Affiche soit une photo de profil, soit les initiales de l'utilisateur
 * dans un cercle coloré, avec option de badge de statut
 */
const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = "md",
  badgeColor,
  className = "",
}) => {
  // État pour suivre si l'image a échoué à se charger
  const [imageError, setImageError] = useState<boolean>(false);

  /**
   * Génère les initiales à partir du nom complet
   * Prend la première lettre du prénom et du nom
   */
  const initials = useMemo(() => {
    if (!name) return "?";

    const nameParts = name.split(" ").filter((part) => part.length > 0);

    if (nameParts.length === 0) return "?";
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

    // Prendre la première lettre du premier et du dernier mot
    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  }, [name]);

  /**
   * Génère une couleur de fond et de texte cohérentes basées sur le nom
   * La même personne aura toujours la même couleur
   */
  const { backgroundColor, textColor } = useMemo(() => {
    // Calculer un index basé sur la somme des codes caractères du nom
    const charSum = name
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colorIndex = charSum % BACKGROUND_COLORS.length;

    return {
      backgroundColor: BACKGROUND_COLORS[colorIndex],
      textColor: TEXT_COLORS[colorIndex],
    };
  }, [name]);

  /**
   * Détermine si on doit afficher l'image ou les initiales
   */
  const showImage = src && !imageError;

  /**
   * Gère l'erreur de chargement de l'image
   */
  const handleImageError = () => {
    setImageError(true);
  };

  /**
   * Calcule les styles dynamiques basés sur la taille
   */
  const sizeInPx = SIZES[size];
  const fontSize =
    size === "lg" ? "text-xl" : size === "md" ? "text-sm" : "text-xs";
  const badgeSize =
    size === "lg" ? "w-4 h-4" : size === "md" ? "w-3 h-3" : "w-2 h-2";

  return (
    <motion.div
      className={`relative inline-flex flex-shrink-0 ${className}`}
      style={{ width: sizeInPx, height: sizeInPx }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      aria-label={name}
    >
      {/* Avatar - Image ou initiales */}
      {showImage ? (
        /* Image de profil */
        <img
          src={src}
          alt={name}
          className="rounded-full w-full h-full object-cover border border-[var(--border)]"
          onError={handleImageError}
        />
      ) : (
        /* Cercle avec initiales */
        <div
          className={`flex items-center justify-center rounded-full w-full h-full border border-[var(--border)]`}
          style={{ backgroundColor, color: textColor }}
        >
          <span className={`font-medium ${fontSize}`}>{initials}</span>
          {/* Texte pour lecteurs d'écran mais caché visuellement */}
          <span className="sr-only">{name}</span>
        </div>
      )}

      {/* Badge de statut (optionnel) */}
      {badgeColor && (
        <div
          className={`absolute bottom-0 right-0 ${badgeSize} rounded-full border-2 border-[var(--background-primary)]`}
          style={{ backgroundColor: badgeColor }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
};

export default Avatar;
