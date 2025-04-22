// src/components/ui/TextareaField.tsx

import React from "react";

interface TextareaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  required,
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full px-3 pt-6 pb-2 border rounded-lg outline-none transition-colors duration-200
        bg-white text-gray-900 placeholder-gray-400
        border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
      />
    </div>
  );
};

export default TextareaField;
