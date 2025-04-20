import { motion } from "framer-motion";
import React, { useId } from "react";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className = "",
}) => {
  // Générer un ID unique pour l'accessibilité
  const id = useId();
  const switchId = `switch-${id}`;

  // Gestionnaire de changement d'état
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  // Gestionnaire d'événement clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {/* Switch interactif */}
      <div
        id={switchId}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={`
          relative 
          inline-flex 
          h-6 
          w-11 
          rounded-full 
          transition-colors 
          duration-200 
          ease-in-out 
          focus:outline-none 
          focus:ring-2 
          focus:ring-[var(--focus)] 
          focus:ring-offset-2
          ${
            checked
              ? "bg-[var(--accent-primary)]"
              : "bg-[var(--background-tertiary)]"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        onClick={handleChange}
        onKeyDown={handleKeyDown}
      >
        {/* Animation du cercle (thumb) */}
        <motion.span
          className="inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0"
          initial={false}
          animate={{
            x: checked ? 20 : 2,
            scale: checked ? 1 : 0.9,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          style={{
            position: "absolute",
            top: "2px", // Centre verticalement
          }}
        />
      </div>

      {/* Label associé (si fourni) */}
      {label && (
        <label
          htmlFor={switchId}
          className={`ml-2 text-sm font-medium text-[var(--text-primary)] ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Switch;
