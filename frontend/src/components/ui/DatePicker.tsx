import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  isDate,
  isSameDay,
  isToday,
  isValid,
  parse,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export interface DatePickerProps {
  /** Date sélectionnée (peut être un objet Date, une chaîne de date ISO, ou null) */
  selectedDate?: Date | string | null;
  /** Fonction appelée lorsqu'une date est sélectionnée */
  onChange: (date: Date | null) => void;
  /** Date minimum sélectionnable */
  minDate?: Date;
  /** Date maximum sélectionnable */
  maxDate?: Date;
  /** Format d'affichage de la date (format date-fns) */
  dateFormat?: string;
  /** Texte d'espace réservé quand aucune date n'est sélectionnée */
  placeholder?: string;
  /** Libellé du champ */
  label?: string;
  /** Désactive le sélecteur de date */
  disabled?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
  /** Mode lecture seule */
  readOnly?: boolean;
  /** Indique si le champ est requis */
  required?: boolean;
  /** Message d'erreur à afficher */
  error?: string;
}

/**
 * Composant DatePicker
 *
 * Un sélecteur de date accessible et animé qui permet aux utilisateurs de choisir
 * une date à partir d'un calendrier interactif ou en saisissant une date manuellement.
 */
const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate = null,
  onChange,
  minDate,
  maxDate,
  dateFormat = "dd/MM/yyyy",
  placeholder = "Sélectionner une date",
  label,
  disabled = false,
  className = "",
  readOnly = false,
  required = false,
  error,
}) => {
  // Référence pour le conteneur du calendrier (utilisé pour la détection des clics extérieurs)
  const calendarRef = useRef<HTMLDivElement>(null);
  // Référence pour l'élément d'entrée
  const inputRef = useRef<HTMLInputElement>(null);

  // État pour suivre si le calendrier est visible
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // État pour le mois affiché dans le calendrier
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate
      ? isDate(selectedDate)
        ? (selectedDate as Date)
        : parseISO(selectedDate as string)
      : new Date()
  );

  // État pour la valeur saisie dans l'entrée
  const [inputValue, setInputValue] = useState(() => {
    if (!selectedDate) return "";
    try {
      const dateObj = isDate(selectedDate)
        ? (selectedDate as Date)
        : parseISO(selectedDate as string);
      return isValid(dateObj)
        ? format(dateObj, dateFormat, { locale: fr })
        : "";
    } catch (e) {
      return "";
    }
  });

  // Effet pour mettre à jour la valeur d'entrée lorsque selectedDate change
  useEffect(() => {
    if (!selectedDate) {
      setInputValue("");
      return;
    }

    try {
      const dateObj = isDate(selectedDate)
        ? (selectedDate as Date)
        : parseISO(selectedDate as string);
      if (isValid(dateObj)) {
        setInputValue(format(dateObj, dateFormat, { locale: fr }));
        setCurrentMonth(dateObj);
      }
    } catch (e) {
      setInputValue("");
    }
  }, [selectedDate, dateFormat]);

  // Ferme le calendrier quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fonction pour vérifier si une date est désactivée
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  };

  // Gestionnaire pour aller au mois précédent
  const handlePrevMonth = () => {
    setCurrentMonth((prevMonth) => subMonths(prevMonth, 1));
  };

  // Gestionnaire pour aller au mois suivant
  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1));
  };

  // Gestionnaire pour sélectionner une date
  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    onChange(date);
    setIsCalendarOpen(false);
  };

  // Gestionnaire pour le changement de l'entrée
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (!value) {
      onChange(null);
      return;
    }

    try {
      const parsedDate = parse(value, dateFormat, new Date(), { locale: fr });
      if (isValid(parsedDate)) {
        onChange(parsedDate);
      }
    } catch (e) {
      // Ignore les erreurs d'analyse
    }
  };

  // Gestionnaire pour le focus de l'entrée
  const handleInputFocus = () => {
    if (!readOnly && !disabled) {
      setIsCalendarOpen(true);
    }
  };

  // Fonction pour générer les jours du mois actuel
  const generateDaysOfMonth = () => {
    const firstDayOfMonth = startOfMonth(currentMonth);
    const lastDayOfMonth = endOfMonth(currentMonth);
    const days = eachDayOfInterval({
      start: firstDayOfMonth,
      end: lastDayOfMonth,
    });

    // Obtenir le jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
    let firstDayOfWeek = getDay(firstDayOfMonth);
    // Ajuster pour que la semaine commence le lundi (0 = lundi, 6 = dimanche)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Ajouter des jours vides au début pour aligner correctement les jours
    const daysWithPadding = [...Array(firstDayOfWeek).fill(null), ...days];

    return daysWithPadding;
  };

  // Récupérer le nom du mois et l'année pour l'en-tête du calendrier
  const monthYearDisplay = format(currentMonth, "MMMM yyyy", { locale: fr });

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor="date-input"
          className={`block text-sm font-medium mb-1 ${
            error ? "text-red-500" : "text-[var(--text-primary)]"
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id="date-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`w-full px-4 py-2 rounded-md border transition duration-200 
            focus:outline-none focus:ring-2 bg-[var(--background-secondary)] 
            placeholder-[var(--text-secondary)]
            ${
              error
                ? "border-red-500 focus:ring-red-300"
                : "border-[var(--border)] focus:ring-[var(--accent-primary)]"
            }
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? "date-error" : undefined}
        />
        <button
          type="button"
          onClick={() => {
            if (!disabled && !readOnly) {
              setIsCalendarOpen(!isCalendarOpen);
            }
          }}
          disabled={disabled || readOnly}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]"
          aria-label={
            isCalendarOpen ? "Fermer le calendrier" : "Ouvrir le calendrier"
          }
        >
          <Calendar size={18} />
        </button>
      </div>

      {error && (
        <p id="date-error" className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}

      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            ref={calendarRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-1 bg-[var(--background-primary)] border border-[var(--border)] rounded-md shadow-lg p-3 w-72"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-full hover:bg-[var(--background-tertiary)] text-[var(--text-primary)]"
                aria-label="Mois précédent"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-sm font-medium text-[var(--text-primary)] capitalize">
                {monthYearDisplay}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-full hover:bg-[var(--background-tertiary)] text-[var(--text-primary)]"
                aria-label="Mois suivant"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs text-[var(--text-secondary)] font-medium"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {generateDaysOfMonth().map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-8" />;
                }

                const isSelected = selectedDate
                  ? isSameDay(
                      day,
                      isDate(selectedDate)
                        ? (selectedDate as Date)
                        : parseISO(selectedDate as string)
                    )
                  : false;

                const isDisabled = isDateDisabled(day);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={format(day, "yyyy-MM-dd")}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    disabled={isDisabled}
                    className={`h-8 w-8 flex items-center justify-center text-sm rounded-full transition-colors
                      ${
                        isSelected
                          ? "bg-[var(--accent-primary)] text-white"
                          : isTodayDate
                          ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                          : "text-[var(--text-primary)] hover:bg-[var(--background-tertiary)]"
                      }
                      ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}
                    `}
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border-t border-[var(--border)] pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => handleDateSelect(new Date())}
                className="text-xs text-[var(--accent-primary)] hover:underline"
                disabled={isDateDisabled(new Date())}
              >
                Aujourd'hui
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setInputValue("");
                  setIsCalendarOpen(false);
                }}
                className="text-xs text-[var(--text-secondary)] hover:underline"
              >
                Effacer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;
