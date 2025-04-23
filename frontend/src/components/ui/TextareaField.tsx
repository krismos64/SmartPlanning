import React from "react";

interface TextareaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
  error?: string;
}

const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  className = "",
  error,
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label
        htmlFor={name}
        className={`block text-sm font-medium mb-1 ${
          error ? "text-red-500" : "text-[var(--text-primary)]"
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={`w-full px-3 py-2 rounded-lg border transition-colors duration-200
          bg-[var(--background-secondary)]
          text-[var(--text-primary)]
          placeholder-[var(--text-tertiary)]
          ${
            error
              ? "border-red-500 focus:ring-red-300"
              : "border-[var(--border)] focus:ring-[var(--accent-primary)]/50"
          }
          focus:outline-none focus:ring-2`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />

      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextareaField;
