import React from "react";

/**
 * Interface pour les propriétés du composant SelectField
 */
export interface SelectFieldProps {
  /** Libellé du champ */
  label: string;
  /** Nom du champ (attribut name) */
  name: string;
  /** Valeur actuelle du champ */
  value: string;
  /** Fonction appelée lors du changement de valeur */
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Liste des options disponibles */
  options: { value: string; label: string }[];
  /** Désactive le champ s'il est à true */
  disabled?: boolean;
  /** Indique si le champ est requis */
  required?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant SelectField
 *
 * Champ de sélection moderne avec animation du label et support des thèmes.
 * Compatible avec le mode sombre et suit le design system de SmartPlanning.
 */
const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  className = "",
}) => {
  return (
    <div className={`relative mb-4 ${className}`}>
      <label
        htmlFor={name}
        className="absolute top-1 left-3 text-xs text-[var(--accent-primary)] dark:text-gray-300 pointer-events-none"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full px-3 pt-6 pb-2 rounded-lg outline-none transition-colors duration-200
          ${
            disabled
              ? "bg-[var(--background-tertiary)] cursor-not-allowed"
              : "bg-[var(--background-secondary)] dark:bg-gray-800"
          } 
          text-[var(--text-primary)] dark:text-white
          border border-[var(--border)] dark:border-gray-600 focus:ring-[var(--accent-primary)]/30
          focus:ring-4`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectField;
