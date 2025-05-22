import { motion } from "framer-motion";
import React, { ChangeEvent } from "react";

/**
 * Interface pour les propriétés du composant InputField
 */
export interface InputFieldProps {
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
  /** Contrôler les styles du mode clair */
  lightMode?: boolean;
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
  lightMode = false,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const isActive = isFocused || value !== "";

  return (
    <div className={`relative mb-4 ${className}`}>
      {label && (
        <motion.label
          htmlFor={name}
          className={`absolute transition-all duration-200 pointer-events-none ${
            lightMode ? "text-gray-500" : "text-gray-300"
          } ${
            isActive
              ? `text-xs ${
                  lightMode ? "text-indigo-600" : "text-indigo-400"
                } top-1`
              : `text-base ${
                  lightMode ? "text-gray-600" : "text-gray-400"
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
          placeholder={isActive ? placeholder : ""}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full px-3 pt-6 pb-2 rounded-lg outline-none transition-colors duration-200
            ${
              lightMode
                ? disabled
                  ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  : "bg-white hover:bg-white focus:bg-white text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-white"
                : disabled
                ? "bg-gray-800 cursor-not-allowed"
                : "bg-gray-900 hover:bg-gray-800 focus:bg-gray-800 text-white"
            } 
            ${
              lightMode ? "text-gray-900 dark:text-white" : "text-white"
            } placeholder-gray-400
            ${
              error
                ? "border border-red-500 focus:ring-red-500/20"
                : lightMode
                ? "border border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-500/20"
                : "border border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20"
            }
            focus:ring-4
            ${icon ? "pl-10" : "pl-3"}
            ${className}`}
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${name}-error` : undefined}
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
            lightMode ? "text-gray-600" : "text-gray-400"
          }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default InputField;
