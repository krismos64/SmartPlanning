import { User } from "lucide-react";
import React, { useState } from "react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackName?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = "md",
  className = "",
  fallbackName,
}) => {
  const [imageError, setImageError] = useState(false);

  // Tailles prédéfinies
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  };

  // Générer les initiales à partir du nom
  const getInitials = (name?: string): string => {
    if (!name) return "";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Générer une couleur de fond basée sur le nom
  const getBackgroundColor = (name?: string): string => {
    if (!name) return "bg-gradient-to-br from-blue-500 to-purple-600";

    const colors = [
      "bg-gradient-to-br from-blue-500 to-purple-600",
      "bg-gradient-to-br from-green-500 to-teal-600",
      "bg-gradient-to-br from-orange-500 to-red-600",
      "bg-gradient-to-br from-pink-500 to-rose-600",
      "bg-gradient-to-br from-indigo-500 to-blue-600",
      "bg-gradient-to-br from-yellow-500 to-orange-600",
      "bg-gradient-to-br from-purple-500 to-pink-600",
      "bg-gradient-to-br from-cyan-500 to-blue-600",
    ];

    const index = name.length % colors.length;
    return colors[index];
  };

  const initials = getInitials(fallbackName);
  const backgroundColorClass = getBackgroundColor(fallbackName);

  // Si on a une image valide et qu'elle ne pose pas de problème
  if (src && !imageError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}
      >
        <img
          src={src}
          alt={alt || fallbackName || "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
          role="img"
        />
      </div>
    );
  }

  // Fallback : afficher les initiales ou l'icône
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${backgroundColorClass} ${className}`}
    >
      {initials ? (
        <span className="text-white font-medium text-sm">{initials}</span>
      ) : (
        <User className={`${iconSizes[size]} text-white`} />
      )}
    </div>
  );
};

export default Avatar;
