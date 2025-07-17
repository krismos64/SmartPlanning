import { motion } from "framer-motion";
import React, { ChangeEvent, FocusEvent, InputHTMLAttributes } from "react";
import { useTheme } from "../ThemeProvider";

/**
 * Interface pour les propriétés du composant InputField
 */
interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Libellé du champ */
  label?: string;
  /** Nom du champ (attribut name) */
  name: string;
  /** Valeur actuelle du champ */
  value: string;
  /** Type de l'input (text, email, password, etc.) */
  type?: string;
  /** Fonction appelée lors du changement de valeur */
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Désactive le champ s'il est à true */
  disabled?: boolean;
  /** Indique si le champ est requis */
  required?: boolean;
  /** Texte d'indication lorsque le champ est vide */
  placeholder?: string;
  /** Classes CSS additionnelles */
  className?: string;
  /** Message d'erreur à afficher */
  error?: string;
  /** Icone à afficher à gauche du champ */
  icon?: React.ReactNode;
  /** Auto-completion */
  autoComplete?: string;
  /** Texte d'aide à afficher sous le champ */
  helperText?: string;
  /** Événement quand le champ prend le focus */
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  /** Événement quand le champ perd le focus */
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  containerClassName?: string;
}

/**
 * Composant InputField
 *
 * Champ de saisie moderne avec animation du label et support des types d'input standard.
 * Utilisé pour les formulaires dans toute l'application.
 */
const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  type = "text",
  onChange,
  disabled = false,
  required = false,
  placeholder = "",
  className = "",
  error,
  icon,
  autoComplete,
  helperText,
  onFocus,
  onBlur,
  containerClassName = "",
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const isActive = isFocused || value !== "";
  const { isDarkMode } = useTheme();

  // Gestion du focus
  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  // Gestion de la perte du focus
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // Style inline pour le mode sombre
  const darkModeStyle = isDarkMode
    ? {
        backgroundColor: "#1A2234",
        color: "white",
        borderColor: "#4a5568",
        WebkitTextFillColor: "white",
        caretColor: "white",
      }
    : {};

  return (
    <div className={`relative mb-4 ${containerClassName}`}>
      {label && (
        <motion.label
          htmlFor={name}
          className={`absolute transition-all duration-200 pointer-events-none ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          } ${
            isActive
              ? `text-xs ${
                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                } top-1`
              : `text-base ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                } top-1/2 -translate-y-1/2`
          }`}
          initial={false}
          animate={{
            top: isActive ? "0.25rem" : "50%",
            translateY: isActive ? "0" : "-50%",
            fontSize: isActive ? "0.75rem" : "1rem",
          }}
          transition={{ duration: 0.2 }}
          style={{}}
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </motion.label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-theme-mode={isDarkMode ? "dark" : "light"}
          style={darkModeStyle}
          className={`w-full px-3 pt-6 pb-2 rounded-lg outline-none transition-colors duration-200
            ${disabled ? "opacity-70 cursor-not-allowed" : ""} 
            placeholder-gray-400 dark:placeholder-gray-300
            focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500
            ${icon ? "pl-10" : "pl-3"}
            border
            ${error ? "border-red-500 dark:border-red-500" : ""}
            ${className}`}
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
        />
      </div>

      {error && (
        <motion.p
          className="text-red-400 text-xs mt-1"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          id={`${name}-error`}
        >
          {error}
        </motion.p>
      )}

      {helperText && !error && (
        <p
          className={`mt-1 text-xs ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default InputField;
