import { format, isValid, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
  label?: string;
}

/**
 * Composant DatePicker amélioré qui gère correctement les fuseaux horaires
 * en utilisant toujours midi UTC comme heure de référence.
 */
const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  name,
  id,
  required = false,
  disabled = false,
  className = "",
  min,
  max,
  label,
}) => {
  // Référence au champ input
  const inputRef = useRef<HTMLInputElement>(null);

  // État pour la valeur affichée dans l'input (pour l'UX)
  const [displayValue, setDisplayValue] = useState<string>("");

  // Convertir une chaîne ISO en date à midi UTC
  const parseISOToUTCNoon = (isoString: string): Date | null => {
    if (!isoString) return null;

    try {
      // Extraire seulement la partie YYYY-MM-DD
      const datePart = isoString.split("T")[0];
      const [year, month, day] = datePart
        .split("-")
        .map((n) => parseInt(n, 10));

      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
      }

      // Créer une date à midi UTC
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } catch (error) {
      console.error("Erreur lors du parsing de la date ISO:", error);
      return null;
    }
  };

  // Convertir une date en chaîne ISO à midi UTC
  const formatDateToISOWithNoon = (date: Date): string => {
    if (!isValid(date)) return "";

    // Créer une nouvelle date à midi UTC
    const utcNoon = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
    );

    return utcNoon.toISOString();
  };

  // Formater la date pour l'affichage (format français)
  const formatDateForDisplay = (isoString: string): string => {
    const date = parseISOToUTCNoon(isoString);
    if (!date) return "";

    return format(date, "dd MMMM yyyy", { locale: fr });
  };

  // Mettre à jour la valeur affichée quand value change
  useEffect(() => {
    if (value) {
      setDisplayValue(formatDateForDisplay(value));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  // Gérer le changement direct dans l'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    // Essayer de parser la date entrée par l'utilisateur
    try {
      // Tenter de parser au format français "dd/MM/yyyy"
      const parsedDate = parse(inputValue, "dd/MM/yyyy", new Date());

      if (isValid(parsedDate)) {
        // Convertir en format ISO à midi UTC
        onChange(formatDateToISOWithNoon(parsedDate));
      }
    } catch (error) {
      // L'utilisateur est peut-être en train de taper, ne rien faire
    }
  };

  // Gérer la sélection via l'input date natif
  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value: dateValue } = e.target;

    if (dateValue) {
      // Convertir la date YYYY-MM-DD en objet Date
      const [year, month, day] = dateValue
        .split("-")
        .map((n) => parseInt(n, 10));
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

      // Mettre à jour à la fois la valeur du parent et la valeur affichée
      onChange(formatDateToISOWithNoon(date));
      setDisplayValue(formatDateForDisplay(formatDateToISOWithNoon(date)));
    } else {
      onChange("");
      setDisplayValue("");
    }
  };

  // Ouvrir le sélecteur de date natif
  const openDatePicker = () => {
    if (inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  return (
    <div className="relative w-full">
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex">
        {/* Input pour l'affichage utilisateur */}
        <div className="relative flex-grow">
          <input
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`block w-full rounded-l-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white ${className}`}
            disabled={disabled}
            id={id || name}
            name={name}
            required={required}
            autoComplete="off"
          />

          {/* Input date natif caché pour le picker */}
          <input
            ref={inputRef}
            type="date"
            className="absolute opacity-0 w-0 h-0"
            min={min}
            max={max}
            onChange={handleNativeChange}
            value={value ? value.split("T")[0] : ""}
            required={required}
            disabled={disabled}
          />
        </div>

        {/* Bouton pour ouvrir le sélecteur */}
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-700 rounded-r-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          onClick={openDatePicker}
          disabled={disabled}
        >
          <CalendarIcon size={20} />
        </button>
      </div>
    </div>
  );
};

export default DatePicker;
