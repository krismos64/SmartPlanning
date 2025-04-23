import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

export interface DropdownItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface DropdownProps {
  triggerText: string;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  position?: "top" | "bottom" | "left" | "right";
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  triggerText,
  items,
  onSelect,
  position = "bottom",
  icon,
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full mb-2";
      case "left":
        return "right-0 mr-2 top-0";
      case "right":
        return "left-0 ml-2 top-0";
      default:
        return "top-full mt-2";
    }
  };

  const getAnimationVariants = () => {
    const base = {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    };
    switch (position) {
      case "top":
        return {
          hidden: { ...base.hidden, y: 10 },
          visible: { ...base.visible, y: 0 },
        };
      case "left":
        return {
          hidden: { ...base.hidden, x: 10 },
          visible: { ...base.visible, x: 0 },
        };
      case "right":
        return {
          hidden: { ...base.hidden, x: -10 },
          visible: { ...base.visible, x: 0 },
        };
      default:
        return {
          hidden: { ...base.hidden, y: -10 },
          visible: { ...base.visible, y: 0 },
        };
    }
  };

  const handleToggle = () => !disabled && setIsOpen(!isOpen);
  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const close = (e: MouseEvent) =>
      !dropdownRef.current?.contains(e.target as Node) && setIsOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block text-left ${className}`}
    >
      <button
        type="button"
        className={`inline-flex justify-between items-center w-full px-4 py-2 text-sm font-medium rounded-md shadow-sm border 
        text-[var(--text-primary)] bg-[var(--background-secondary)] border-[var(--border)] 
        hover:bg-[var(--background-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {triggerText}
        </span>
        <svg
          className={`w-5 h-5 ml-2 -mr-1 transition-transform duration-200 text-[var(--text-secondary)] ${
            isOpen ? "rotate-180" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute z-10 w-56 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none 
            bg-[var(--background-primary)] border-[var(--border)] divide-y divide-[var(--border)] ${getPositionClasses()}`}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={getAnimationVariants()}
            transition={{ duration: 0.2 }}
            role="menu"
          >
            <div className="py-1" role="none">
              {items.map((item) => (
                <button
                  key={item.value}
                  className={`group flex items-center w-full px-4 py-2 text-sm 
                  text-[var(--text-primary)] hover:bg-[var(--background-tertiary)] 
                  ${
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={() => !item.disabled && handleSelect(item.value)}
                  disabled={item.disabled}
                  role="menuitem"
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
