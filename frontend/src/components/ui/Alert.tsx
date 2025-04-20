/**
 * Alert - Composant d'alerte contextuelle
 *
 * Affiche un message d'alerte statique avec une icône et un style visuel
 * correspondant au type (info, success, warning, error).
 * S'adapte automatiquement au thème clair/sombre.
 */
import React from "react";

export interface AlertProps {
  type: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  className?: string;
  animate?: boolean; // Active l'animation
  animationType?: "fade" | "slide"; // Type d'animation
}

const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  className = "",
  animate = true,
  animationType = "fade",
}) => {
  // Configuration des styles selon le type
  const alertConfig = {
    info: {
      bgColor: "bg-[var(--accent-primary)]/10",
      borderColor: "border-[var(--accent-primary)]/30",
      textColor: "text-[var(--accent-primary)]",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    success: {
      bgColor: "bg-[var(--success)]/10",
      borderColor: "border-[var(--success)]/30",
      textColor: "text-[var(--success)]",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    warning: {
      bgColor: "bg-[var(--warning)]/10",
      borderColor: "border-[var(--warning)]/30",
      textColor: "text-[var(--warning)]",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    error: {
      bgColor: "bg-[var(--error)]/10",
      borderColor: "border-[var(--error)]/30",
      textColor: "text-[var(--error)]",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  // Classe d'animation selon le type
  const animationClass = animate
    ? animationType === "fade"
      ? "animate-fade-in"
      : "animate-slide-down"
    : "";

  const { bgColor, borderColor, textColor, icon } = alertConfig[type];

  return (
    <div
      role="alert"
      className={`
        ${bgColor}
        ${borderColor}
        ${animationClass}
        border-l-4
        rounded-lg
        p-4
        shadow-sm
        flex
        ${className}
      `}
    >
      {/* Icône */}
      <div className={`flex-shrink-0 ${textColor}`}>{icon}</div>

      {/* Contenu */}
      <div className="ml-3">
        {title && (
          <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
        )}
        <div
          className={`text-sm ${
            title ? "mt-1" : ""
          } text-[var(--text-primary)]`}
        >
          {message}
        </div>
      </div>
    </div>
  );
};

export default Alert;
