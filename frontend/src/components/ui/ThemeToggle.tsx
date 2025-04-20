import React from "react";
import { useTheme } from "../ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { mode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 ${
        mode === "dark"
          ? "bg-[var(--accent-primary)]"
          : "bg-[var(--background-tertiary)]"
      } ${className}`}
      aria-label={`Basculer vers le thème ${
        mode === "light" ? "sombre" : "clair"
      }`}
    >
      <span className="sr-only">
        Basculer vers le thème {mode === "light" ? "sombre" : "clair"}
      </span>

      {/* Icône de lune (visible en mode clair) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`absolute w-4 h-4 transition-all duration-200 ease-in-out ${
          mode === "light"
            ? "opacity-100 translate-x-[0.75rem]"
            : "opacity-0 translate-x-6"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>

      {/* Icône de soleil (visible en mode sombre) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`absolute w-4 h-4 text-white transition-all duration-200 ease-in-out ${
          mode === "dark"
            ? "opacity-100 translate-x-[0.75rem]"
            : "opacity-0 translate-x-0"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>

      {/* Cercle de commutation (thumb) */}
      <span
        className={`absolute block w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out transform ${
          mode === "dark" ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
};

export default ThemeToggle;
