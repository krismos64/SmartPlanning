import { motion } from "framer-motion";
import React, {
  ChangeEvent,
  FocusEvent,
  InputHTMLAttributes,
  useState,
} from "react";
import { useTheme } from "../ThemeProvider";

/**
 * Interface pour les propriétés du composant PasswordField
 */
interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Libellé du champ */
  label?: string;
  /** Nom du champ (attribut name) */
  name: string;
  /** Valeur actuelle du champ */
  value: string;
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
 * Composant PasswordField
 *
 * Champ de mot de passe moderne avec animation du label et bouton pour afficher/masquer le mot de passe.
 * Basé sur InputField avec fonctionnalité supplémentaire d'œil pour la visibilité.
 */
const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "",
  className = "",
  error,
  autoComplete,
  helperText,
  onFocus,
  onBlur,
  containerClassName = "",
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  // Toggle de la visibilité du mot de passe
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </motion.label>
      )}

      <div className="relative">
        <input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-theme-mode={isDarkMode ? "dark" : "light"}
          style={darkModeStyle}
          className={`w-full px-3 pt-6 pb-2 pr-12 rounded-lg outline-none transition-colors duration-200
            ${disabled ? "opacity-70 cursor-not-allowed" : ""} 
            placeholder-gray-400 dark:placeholder-gray-300
            focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500
            border
            ${error ? "border-red-500 dark:border-red-500" : ""}
            ${className}`}
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
        />

        {/* Bouton œil pour afficher/masquer le mot de passe */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          className={`absolute inset-y-0 right-0 pr-3 flex items-center
            ${disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
            ${
              isDarkMode
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-600 hover:text-gray-800"
            }
            transition-colors duration-200`}
          aria-label={
            showPassword
              ? "Masquer le mot de passe"
              : "Afficher le mot de passe"
          }
        >
          {showPassword ? (
            // Icône œil fermé (masquer)
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          ) : (
            // Icône œil ouvert (afficher)
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
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

export default PasswordField;
