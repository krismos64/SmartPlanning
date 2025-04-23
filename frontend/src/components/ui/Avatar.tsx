import { User } from "lucide-react";
import React, { useState } from "react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Photo de profil",
  size = "md",
  className = "",
  fallbackClassName = "",
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-24 h-24 text-lg",
  };

  const handleError = () => setHasError(true);

  return (
    <div
      className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleError}
        />
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
