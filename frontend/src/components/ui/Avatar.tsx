import { User } from "lucide-react";
import React, { useEffect, useState } from "react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  fallbackClassName?: string;
  fallback?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Photo de profil",
  size = "md",
  className = "",
  fallbackClassName = "",
  fallback,
}) => {
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Vérifier et traiter l'URL de l'image
  useEffect(() => {
    // Réinitialiser l'état d'erreur si une nouvelle URL est fournie
    setHasError(false);

    if (src) {
      // Accepter les URLs complètes (http, https) et les URLs data:image
      if (
        !src.startsWith("http://") &&
        !src.startsWith("https://") &&
        !src.startsWith("data:image/")
      ) {
        setHasError(true);
        return;
      }

      // Vérifier si l'URL est accessible (sauf pour les data:image qui sont déjà chargées)
      if (src.startsWith("data:image/")) {
        setImageSrc(src);
        setHasError(false);
      } else {
        // Pour les URLs http/https, vérifier qu'elles sont accessibles
        const img = new Image();
        img.onload = () => {
          setImageSrc(src);
          setHasError(false);
        };
        img.onerror = () => {
          setHasError(true);
        };
        img.src = src;
      }
    } else {
      setHasError(true);
    }
  }, [src]);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-24 h-24 text-lg",
    "2xl": "w-32 h-32 text-xl",
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {!hasError && imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      ) : (
        <div
          className={`flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 w-full h-full ${fallbackClassName}`}
        >
          {fallback ? (
            <span className="font-medium">{fallback}</span>
          ) : (
            <User />
          )}
        </div>
      )}
    </div>
  );
};

export default Avatar;
