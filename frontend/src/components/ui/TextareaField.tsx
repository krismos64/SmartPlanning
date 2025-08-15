import { motion } from "framer-motion";
import React, { useState, FocusEvent } from "react";
import { useTheme } from "../ThemeProvider";

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
  helperText?: string;
  onFocus?: (e: FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLTextAreaElement>) => void;
}

const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  rows = 4,
  required = false,
  className = "",
  error,
  helperText,
  onFocus,
  onBlur,
}) => {
  const { isDarkMode } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value !== "";

  const handleFocus = (e: FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const darkModeStyle = isDarkMode
    ? {
        backgroundColor: "rgba(30, 41, 59, 0.5)",
        color: "#e2e8f0",
        borderColor: "rgba(100, 116, 139, 0.3)",
        WebkitTextFillColor: "#e2e8f0",
        caretColor: "#818cf8",
      }
    : {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        color: "#1e293b",
        borderColor: "rgba(203, 213, 225, 0.5)",
      };

  return (
    <div className={`relative mb-4 ${className}`}>
      {label && (
        <motion.label
          htmlFor={name}
          className={`absolute transition-all duration-300 pointer-events-none z-10 ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          } ${
            isActive
              ? `text-xs ${
                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                } top-1 font-medium`
              : `text-base ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                } top-1/2 -translate-y-1/2`
          }`}
          initial={false}
          animate={{
            top: isActive ? "0.25rem" : "2rem",
            translateY: isActive ? "0" : "-50%",
            fontSize: isActive ? "0.75rem" : "1rem",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            left: "1rem"
          }}
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </motion.label>
      )}

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={isFocused ? placeholder : ""}
        rows={rows}
        required={required}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          ...darkModeStyle,
          backdropFilter: "blur(10px)",
          transition: "all 0.3s ease",
          resize: "vertical",
        }}
        className={`w-full px-4 pt-6 pb-2 rounded-xl outline-none transition-all duration-300
          ${isDarkMode 
            ? "placeholder-gray-500 hover:bg-slate-800/60" 
            : "placeholder-gray-400 hover:bg-white"}
          ${isFocused 
            ? isDarkMode 
              ? "ring-2 ring-indigo-500/40 border-indigo-500/60 bg-slate-800/70" 
              : "ring-2 ring-indigo-500/30 border-indigo-500 bg-white"
            : ""}
          border-2
          ${error 
            ? "border-red-500 dark:border-red-400" 
            : isDarkMode 
              ? "border-slate-600/30" 
              : "border-gray-200"}
          ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />

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

export default TextareaField;