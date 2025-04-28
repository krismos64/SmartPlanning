/**
 * MiniCalendarPicker - Composant de sélection rapide d'une semaine
 *
 * Affiche un bouton textuel indiquant la semaine sélectionnée,
 * et un petit calendrier popup permettant de choisir une autre semaine.
 */

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useMemo, useRef, useState } from "react";

export interface MiniCalendarPickerProps {
  /** Date actuellement sélectionnée */
  selectedDate: Date;
  /** Callback appelé lors de la sélection d'une nouvelle semaine */
  onWeekChange: (date: Date) => void;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * MiniCalendarPicker - Permet de sélectionner facilement une semaine
 */
const MiniCalendarPicker: React.FC<MiniCalendarPickerProps> = ({
  selectedDate: initialSelectedDate,
  onWeekChange,
  className = "",
}) => {
  // Validation de la date d'entrée
  const selectedDate = useMemo(() => {
    if (!initialSelectedDate || !isValid(initialSelectedDate)) {
      return new Date();
    }
    return initialSelectedDate;
  }, [initialSelectedDate]);

  // États du composant
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate);

  // Référence pour la détection de click à l'extérieur
  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calcul des dates de début et fin de semaine (ISO: lundi au dimanche)
  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );
  const weekEnd = useMemo(
    () => endOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );

  // Texte du bouton (ex: "Semaine du 22 Avril au 28 Avril 2023")
  const buttonText = useMemo(() => {
    const startDateFormatted = format(weekStart, "d MMMM", { locale: fr });
    const endDateFormatted = format(weekEnd, "d MMMM yyyy", { locale: fr });
    return `Semaine du ${startDateFormatted} au ${endDateFormatted}`;
  }, [weekStart, weekEnd]);

  // Gestionnaire pour ouvrir/fermer le calendrier
  const toggleCalendar = () => {
    setIsCalendarOpen((prev) => !prev);
    // Si on ouvre le calendrier, on s'assure que le mois affiché est celui de la date sélectionnée
    if (!isCalendarOpen) {
      setCurrentMonth(selectedDate);
    }
  };

  // Ferme le calendrier si on clique en dehors
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isCalendarOpen &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCalendarOpen]);

  // Navigation dans les mois
  const handlePrevMonth = () => {
    setCurrentMonth((prevMonth) => subMonths(prevMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1));
  };

  // Sélection d'une date
  const handleDateSelect = (day: Date) => {
    onWeekChange(day);
    setIsCalendarOpen(false);
  };

  // Génère les jours du mois pour l'affichage
  const renderCalendarGrid = useMemo(() => {
    // En-têtes des jours de la semaine (Lu, Ma, Me, Je, Ve, Sa, Di)
    const weekDays = [...Array(7)].map((_, i) => {
      const day = (i + 1) % 7; // Ajustement pour commencer par lundi (1)
      return (
        <div
          key={`weekday-${i}`}
          className="text-center text-xs font-medium text-gray-500 dark:text-gray-400"
        >
          {format(new Date(2023, 3, day), "EEEEE", { locale: fr })}
        </div>
      );
    });

    // Jours du mois
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    // Tous les jours à afficher (incluant jours des mois précédent/suivant si nécessaire)
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Création de la grille de jours
    const calendarDays = days.map((day) => {
      const isCurrentMonthDay = isSameMonth(day, currentMonth);
      const isSelectedDay = isSameDay(day, selectedDate);
      const isSelectedWeek =
        day >= startOfWeek(selectedDate, { weekStartsOn: 1 }) &&
        day <= endOfWeek(selectedDate, { weekStartsOn: 1 });
      const isTodayDay = isToday(day);

      return (
        <button
          key={day.toString()}
          type="button"
          onClick={() => handleDateSelect(day)}
          className={`
            relative w-full aspect-square flex items-center justify-center text-xs rounded-full transition-colors
            ${
              isCurrentMonthDay
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-400 dark:text-gray-500"
            }
            ${
              isSelectedDay
                ? "bg-indigo-500 text-white dark:bg-indigo-600"
                : isSelectedWeek
                ? "bg-indigo-100 dark:bg-indigo-900/30"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }
            ${
              isTodayDay && !isSelectedDay
                ? "border border-indigo-500 dark:border-indigo-400"
                : ""
            }
          `}
        >
          {format(day, "d")}
        </button>
      );
    });

    return (
      <>
        <div className="grid grid-cols-7 gap-1 mb-1">{weekDays}</div>
        <div className="grid grid-cols-7 gap-1">{calendarDays}</div>
      </>
    );
  }, [currentMonth, selectedDate, handleDateSelect]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Bouton qui affiche la semaine sélectionnée */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleCalendar}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        <span className="whitespace-nowrap">{buttonText}</span>
      </button>

      {/* Calendrier popup */}
      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            ref={calendarRef}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 mt-1 p-3 bg-white dark:bg-gray-850 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 w-[280px]"
          >
            {/* En-tête du calendrier avec navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {format(currentMonth, "MMMM yyyy", { locale: fr })}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Grille du calendrier */}
            {renderCalendarGrid}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MiniCalendarPicker;
