import React from "react";
import ReactSelect, { ActionMeta, MultiValue } from "react-select";

// Interface pour les options du select
export interface SelectOption {
  value: string;
  label: string;
}

// Interface pour les props du composant
interface SelectMultiProps {
  label?: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

/**
 * Composant Select avec support de la multi-sélection
 * Basé sur react-select
 */
const SelectMulti: React.FC<SelectMultiProps> = ({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "Sélectionner...",
  error,
  required = false,
}) => {
  // Transformer les valeurs en format attendu par react-select
  const selectedOptions = options.filter((option) =>
    value.includes(option.value)
  );

  // Gérer le changement de valeur
  const handleChange = (
    newValue: MultiValue<SelectOption>,
    actionMeta: ActionMeta<SelectOption>
  ) => {
    const selectedValues = newValue.map((item) => item.value);
    onChange(selectedValues);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <ReactSelect
        isMulti
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        isDisabled={disabled}
        placeholder={placeholder}
        className="react-select-container"
        classNamePrefix="react-select"
        styles={{
          // Styles personnalisés pour s'adapter au thème clair/sombre
          control: (base, state) => ({
            ...base,
            backgroundColor: "var(--select-bg, #ffffff)",
            borderColor: error
              ? "#ef4444"
              : state.isFocused
              ? "#3b82f6"
              : "var(--select-border, #d1d5db)",
            boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
            "&:hover": {
              borderColor: state.isFocused
                ? "#3b82f6"
                : "var(--select-hover-border, #9ca3af)",
            },
            borderRadius: "0.375rem",
            minHeight: "42px",
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "var(--select-bg, #ffffff)",
            zIndex: 50,
          }),
          option: (base, { isSelected, isFocused }) => ({
            ...base,
            backgroundColor: isSelected
              ? "#3b82f6"
              : isFocused
              ? "var(--select-hover-bg, #f3f4f6)"
              : "transparent",
            color: isSelected ? "white" : "var(--select-text, #111827)",
            "&:hover": {
              backgroundColor: isSelected
                ? "#3b82f6"
                : "var(--select-hover-bg, #f3f4f6)",
            },
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: "var(--select-tag-bg, #e5e7eb)",
            borderRadius: "0.25rem",
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: "var(--select-tag-text, #374151)",
            fontSize: "0.875rem",
            padding: "0.125rem 0.25rem",
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: "var(--select-tag-remove, #6b7280)",
            "&:hover": {
              backgroundColor: "#ef4444",
              color: "white",
            },
          }),
        }}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: "#3b82f6",
            primary25: "var(--select-hover-bg, #f3f4f6)",
            neutral0: "var(--select-bg, #ffffff)",
            neutral10: "var(--select-tag-bg, #e5e7eb)",
            neutral20: "var(--select-border, #d1d5db)",
            neutral30: "var(--select-hover-border, #9ca3af)",
            neutral80: "var(--select-text, #111827)",
          },
        })}
      />

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default SelectMulti;
