import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  withHover?: boolean;
  withAnimation?:
    | "fade"
    | "scale"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | null;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = "",
  withHover = false,
  withAnimation = null,
}) => {
  // Définition des classes d'animation
  const animationClass = withAnimation
    ? {
        fade: "animate-fade-in",
        scale: "animate-scale-in",
        "slide-up": "animate-slide-up",
        "slide-down": "animate-slide-down",
        "slide-left": "animate-slide-left",
        "slide-right": "animate-slide-right",
      }[withAnimation]
    : "";

  // Effet de survol
  const hoverClass = withHover ? "hover:shadow-lg hover:scale-[1.02]" : "";

  return (
    <div
      className={`
        bg-[var(--background-secondary)] 
        text-[var(--text-primary)]
        rounded-2xl 
        p-6 
        shadow-md 
        transition-all 
        duration-300 
        ease-in-out
        ${hoverClass}
        ${animationClass}
        ${className}
      `}
    >
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;
