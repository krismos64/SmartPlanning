import {
  addMonths,
  format,
  isSameDay,
  isToday,
  isValid,
  parse,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export interface DatePickerProps {
  /**
   * Date sélectionnée
   */
  selectedDate?: Date;
  /**
   * Fonction appelée lors du changement de date
   */
  onChange: (date: Date) => void;
  /**
   * Date minimale sélectionnable
   */
  minDate?: Date;
  /**
   * Date maximale sélectionnable
   */
  maxDate?: Date;
  /**
   * Format d'affichage de la date dans l'input
   */
  dateFormat?: string;
  /**
   * Placeholder de l'input
   */
  placeholder?: string;
  /**
   * Label du DatePicker
   */
  label?: string;
  /**
   * Désactive le DatePicker
   */
  disabled?: boolean;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  /**
   * Indique si le DatePicker est en lecture seule
   */
  readOnly?: boolean;
  /**
   * Indique si le DatePicker est obligatoire
   */
  required?: boolean;
  /**
   * Message d'erreur à afficher
   */
  error?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onChange,
  minDate,
  maxDate,
  dateFormat = "dd/MM/yyyy",
  placeholder = "JJ/MM/AAAA",
  label,
  disabled = false,
  className = "",
  readOnly = false,
  required = false,
  error,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedDate || new Date()
  );
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Met à jour l'input quand la date sélectionnée change
  useEffect(() => {
    if (selectedDate && isValid(selectedDate)) {
      setInputValue(format(selectedDate, dateFormat, { locale: fr }));
      setCurrentMonth(selectedDate);
    } else {
      setInputValue("");
    }
  }, [selectedDate, dateFormat]);

  // Gère le clic en dehors du calendrier pour le fermer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Navigation entre les mois
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Essaie de convertir l'input en Date
    const parsedDate = parse(value, dateFormat, new Date(), { locale: fr });

    if (isValid(parsedDate)) {
      // Vérifie si la date est dans les limites min/max
      const isAfterMinDate = minDate ? parsedDate >= minDate : true;
      const isBeforeMaxDate = maxDate ? parsedDate <= maxDate : true;

      if (isAfterMinDate && isBeforeMaxDate) {
        onChange(parsedDate);
        setCurrentMonth(parsedDate);
      }
    }
  };

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const toggleCalendar = () => {
    if (!disabled && !readOnly) {
      setIsOpen(!isOpen);
    }
  };

  // Génère les jours du mois
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Trouve le premier jour à afficher (peut être du mois précédent)
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const startOffset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Lundi = 0

    const daysToShow = [];

    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset; i > 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i + 1);
      daysToShow.push({
        date,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(date),
      });
    }

    // Jours du mois courant
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      daysToShow.push({
        date,
        isCurrentMonth: true,
        isDisabled: isDateDisabled(date),
      });
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - daysToShow.length; // 6 semaines x 7 jours
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      daysToShow.push({
        date,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(date),
      });
    }

    return daysToShow;
  };

  // Vérifie si une date est désactivée (en dehors des limites min/max)
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Noms des jours de la semaine
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor="date-picker-input"
          className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id="date-picker-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onClick={toggleCalendar}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? "date-picker-error" : undefined}
          className={`w-full px-4 py-2 pr-10 border rounded-md focus:ring-2 focus:outline-none 
            ${
              disabled
                ? "bg-gray-100 cursor-not-allowed"
                : "bg-white cursor-pointer"
            } 
            ${
              error
                ? "border-red-500 focus:ring-red-300"
                : "border-gray-300 focus:ring-blue-300"
            }
            dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
        />

        <button
          type="button"
          onClick={toggleCalendar}
          disabled={disabled || readOnly}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
          aria-label="Ouvrir le calendrier"
        >
          <Calendar size={18} />
        </button>
      </div>

      {error && (
        <p id="date-picker-error" className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={calendarRef}
            className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  aria-label="Mois précédent"
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">
                  {format(currentMonth, "MMMM yyyy", { locale: fr })}
                </h2>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  aria-label="Mois suivant"
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {/* En-têtes des jours de la semaine */}
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="flex items-center justify-center h-8 text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}

                {/* Jours du calendrier */}
                {getDaysInMonth().map((dayObj, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={dayObj.isDisabled}
                    onClick={() =>
                      !dayObj.isDisabled && handleDateSelect(dayObj.date)
                    }
                    className={`flex items-center justify-center w-8 h-8 text-sm rounded-full 
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      ${
                        !dayObj.isCurrentMonth
                          ? "text-gray-400 dark:text-gray-600"
                          : "text-gray-700 dark:text-gray-300"
                      }
                      ${isToday(dayObj.date) ? "font-bold" : ""}
                      ${
                        selectedDate && isSameDay(dayObj.date, selectedDate)
                          ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                          : ""
                      }
                      ${
                        dayObj.isDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }
                    `}
                    aria-label={format(dayObj.date, "EEEE d MMMM yyyy", {
                      locale: fr,
                    })}
                    aria-selected={
                      selectedDate
                        ? isSameDay(dayObj.date, selectedDate)
                        : false
                    }
                  >
                    {dayObj.date.getDate()}
                  </button>
                ))}
              </div>

              {/* Bouton "Aujourd'hui" */}
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    if (!isDateDisabled(today)) {
                      handleDateSelect(today);
                    }
                  }}
                  disabled={isDateDisabled(new Date())}
                  className={`px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300
                    ${
                      isDateDisabled(new Date())
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }
                  `}
                >
                  Aujourd'hui
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;
