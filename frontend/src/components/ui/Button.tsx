import React, { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  withAnimation?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  isLoading = false,
  withAnimation = false,
  className = "",
  ...rest
}) => {
  // Variantes de style
  const variantClasses = {
    primary:
      "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)]",
    secondary:
      "bg-[var(--background-tertiary)] text-[var(--text-primary)] hover:bg-[var(--background-tertiary)]/80",
    outline:
      "border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--background-tertiary)]/50",
    text: "text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10",
  };

  // Tailles
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  // Animation au survol
  const animationClass = withAnimation
    ? "transform transition-transform hover:scale-[1.02] active:scale-[0.98]"
    : "";

  // Largeur complète
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`
        inline-flex items-center justify-center
        font-medium
        rounded-lg
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${animationClass}
        ${className}
      `}
      disabled={isLoading || rest.disabled}
      {...rest}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}

      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;
