import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  Clock,
  Plus,
  Trash,
  UserCheck,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import Button from "../ui/Button";
import Select from "../ui/Select";

// Styles
const styles = {
  glassCard:
    "bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-lg overflow-hidden",
  neonFocus:
    "focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/80",
  textGradient:
    "bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent dark:from-cyan-400 dark:to-purple-400",
  buttonPrimary:
    "px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300",
};

// Types
interface TimeSlot {
  start: string;
  end: string;
}

interface EmployeeOption {
  _id: string;
  fullName: string;
}

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  employees: EmployeeOption[];
  weekNumber: number;
  year: number;
  isEditMode: boolean;
  existingSchedule?: any;
  weekDates: Record<string, Date>;
  isLoading: boolean;
}

// Constantes
const DAYS_OF_WEEK = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Options de temps (00:00 à 23:45 par incréments de 15 minutes)
const TIME_OPTIONS = Array.from({ length: 24 * 4 + 1 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
});

const CreateScheduleModal: React.FC<CreateScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employees,
  weekNumber,
  year,
  isEditMode,
  existingSchedule,
  weekDates,
  isLoading,
}) => {
  // États
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [scheduleData, setScheduleData] = useState<Record<string, TimeSlot[]>>(
    DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
  );
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>(
    DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {})
  );
  const [notes, setNotes] = useState<string>("");

  // Initialisation des données pour le mode édition
  useEffect(() => {
    if (isEditMode && existingSchedule) {
      setSelectedEmployeeId(existingSchedule.employeeId);

      // Formatage des créneaux horaires
      const formattedScheduleData: Record<string, TimeSlot[]> = DAY_KEYS.reduce(
        (acc, day) => ({ ...acc, [day]: [] }),
        {}
      );

      Object.entries(existingSchedule.scheduleData || {}).forEach(
        ([day, slots]) => {
          if (Array.isArray(slots)) {
            formattedScheduleData[day] = slots.map((slot) => {
              const [start, end] = slot.split("-");
              return { start, end };
            });
          }
        }
      );

      setScheduleData(formattedScheduleData);
      setDailyNotes(
        existingSchedule.dailyNotes ||
          DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {})
      );
      setNotes(existingSchedule.notes || "");
    } else {
      resetForm();
    }
  }, [isEditMode, existingSchedule, isOpen]);

  // Réinitialisation du formulaire
  const resetForm = () => {
    setSelectedEmployeeId("");
    setScheduleData(DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {}));
    setDailyNotes(DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {}));
    setNotes("");
  };

  // Gestion des créneaux horaires
  const handleAddTimeSlot = (day: string) => {
    setScheduleData((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: "09:00", end: "17:00" }],
    }));
  };

  const handleRemoveTimeSlot = (day: string, index: number) => {
    setScheduleData((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const handleTimeSlotChange = (
    day: string,
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    setScheduleData((prev) => {
      const newSlots = [...prev[day]];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return { ...prev, [day]: newSlots };
    });
  };

  // Gestion des notes
  const handleDailyNoteChange = (day: string, value: string) => {
    setDailyNotes((prev) => ({
      ...prev,
      [day]: value,
    }));
  };

  // Soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Formatage des données pour l'API
    const formattedScheduleData: Record<string, string[]> = {};
    Object.entries(scheduleData).forEach(([day, slots]) => {
      if (slots.length > 0) {
        formattedScheduleData[day] = slots.map(
          (slot) => `${slot.start}-${slot.end}`
        );
      }
    });

    // Création des notes complètes avec chaînes vides pour les notes supprimées
    const formattedDailyNotes: Record<string, string> = {};
    Object.keys(dailyNotes).forEach((day) => {
      formattedDailyNotes[day] = dailyNotes[day]?.trim() || "";
    });

    // Création des dates quotidiennes
    const formattedDailyDates: Record<string, string> = {};
    Object.entries(weekDates).forEach(([day, date]) => {
      formattedDailyDates[day] = date.toISOString();
    });

    // Calcul du temps total
    const totalWeeklyMinutes = calculateTotalMinutes();

    // Préparation du payload
    const payload = {
      employeeId: selectedEmployeeId,
      year,
      weekNumber,
      status: "approved" as const,
      notes: notes.trim() || "",
      scheduleData: formattedScheduleData,
      dailyNotes: formattedDailyNotes,
      dailyDates: formattedDailyDates,
      totalWeeklyMinutes,
      _id: isEditMode && existingSchedule ? existingSchedule._id : undefined,
    };

    onSave(payload);
  };

  // Calcul du temps total en minutes
  const calculateTotalMinutes = () => {
    return Object.entries(scheduleData).reduce((total, [day, slots]) => {
      if (!slots || !Array.isArray(slots)) return total;

      const dayMinutes = slots.reduce((sum, slot) => {
        if (
          !slot ||
          typeof slot.start !== "string" ||
          typeof slot.end !== "string"
        ) {
          return sum;
        }
        return sum + calculateDuration(slot.start, slot.end);
      }, 0);
      return total + dayMinutes;
    }, 0);
  };

  // Calcul de la durée entre deux horaires
  const calculateDuration = (start: string, end: string): number => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    return endTotalMinutes - startTotalMinutes;
  };

  // Formatage de la durée
  const formatDuration = (minutes: number): string => {
    if (minutes <= 0) return "0min";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${remainingMinutes}min`;
    if (remainingMinutes === 0) return `${hours}h`;

    return `${hours}h ${remainingMinutes}min`;
  };

  // Rendu
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              styles.glassCard,
              "w-full max-w-2xl max-h-[90vh] overflow-hidden"
            )}
          >
            {/* En-tête */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700/30">
              <h2 className={cn(styles.textGradient, "text-2xl font-bold")}>
                {isEditMode ? "Modifier le planning" : "Nouveau planning"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                icon={<X size={20} />}
              >
                Fermer
              </Button>
            </div>

            {/* Corps de la modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* En-tête - Semaine */}
                <div className="p-3 mb-6 bg-gradient-to-r from-cyan-50/30 to-purple-50/30 dark:from-cyan-900/20 dark:to-purple-900/20 rounded-lg border border-cyan-100 dark:border-purple-800/30">
                  <div className="flex items-center gap-2 text-cyan-700 dark:text-purple-300">
                    <Calendar size={18} />
                    <span>
                      Semaine {weekNumber} • {year}
                    </span>
                  </div>
                </div>

                {/* Sélection d'employé */}
                <Select
                  label="Employé"
                  options={employees.map((emp) => ({
                    label: emp.fullName,
                    value: emp._id,
                  }))}
                  value={selectedEmployeeId}
                  onChange={setSelectedEmployeeId}
                  placeholder="Sélectionner un employé"
                  icon={<UserCheck size={18} />}
                  className="w-full"
                />

                {/* Planification par jour */}
                <div className="space-y-4">
                  {DAY_KEYS.map((day, dayIndex) => (
                    <div
                      key={day}
                      className="p-4 border border-gray-200 dark:border-gray-700/50 rounded-lg bg-white/30 dark:bg-gray-800/30"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            {DAYS_OF_WEEK[dayIndex]}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {weekDates && weekDates[day]
                              ? format(weekDates[day], "dd MMM", { locale: fr })
                              : ""}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddTimeSlot(day)}
                          icon={<Plus size={12} />}
                          className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400"
                        >
                          Ajouter
                        </Button>
                      </div>

                      {/* Liste des créneaux */}
                      <div className="space-y-2">
                        {!scheduleData[day] ||
                        scheduleData[day].length === 0 ? (
                          <div className="text-xs text-center text-gray-400 dark:text-gray-600 py-2 italic">
                            Repos
                          </div>
                        ) : (
                          scheduleData[day].map((slot, slotIndex) => (
                            <div
                              key={slotIndex}
                              className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-900/30 rounded"
                            >
                              <select
                                value={slot.start}
                                onChange={(e) =>
                                  handleTimeSlotChange(
                                    day,
                                    slotIndex,
                                    "start",
                                    e.target.value
                                  )
                                }
                                className="flex-1 text-xs py-1 px-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                {TIME_OPTIONS.filter(
                                  (time) => time < slot.end
                                ).map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </select>
                              <span className="text-gray-400 dark:text-gray-600 text-xs">
                                –
                              </span>
                              <select
                                value={slot.end}
                                onChange={(e) =>
                                  handleTimeSlotChange(
                                    day,
                                    slotIndex,
                                    "end",
                                    e.target.value
                                  )
                                }
                                className="flex-1 text-xs py-1 px-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                {TIME_OPTIONS.filter(
                                  (time) => time > slot.start
                                ).map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </select>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                onClick={() =>
                                  handleRemoveTimeSlot(day, slotIndex)
                                }
                                icon={<Trash size={14} />}
                              >
                                Suppr.
                              </Button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Notes quotidiennes */}
                      <textarea
                        value={dailyNotes[day] || ""}
                        onChange={(e) =>
                          handleDailyNoteChange(day, e.target.value)
                        }
                        className="mt-3 w-full text-xs p-2 rounded border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/60 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Notes..."
                        rows={1}
                      />
                    </div>
                  ))}
                </div>

                {/* Notes générales */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Notes Générales
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-sm p-2 rounded border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/60 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Informations complémentaires..."
                  />
                </div>
              </form>
            </div>

            {/* Pied de page */}
            <div className="p-5 border-t border-gray-200 dark:border-gray-700/30 flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>
                Annuler
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={isLoading || !selectedEmployeeId}
                  className={cn(
                    styles.buttonPrimary,
                    "flex items-center justify-center gap-2"
                  )}
                  icon={isEditMode ? <Check size={18} /> : <Clock size={18} />}
                >
                  {isEditMode ? "Mettre à jour" : "Enregistrer"}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateScheduleModal;
