import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";

// Types
interface Schedule {
  _id: string;
  employeeId: string;
  employeeName: string;
  scheduleData: Record<string, string[]>;
  notes?: string;
  updatedBy: string;
  year: number;
  weekNumber: number;
}

interface ScheduleData {
  [day: string]: string[];
}

interface EmployeeOption {
  _id: string;
  fullName: string;
}

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

// Composant Toast pour les notifications
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  // Fermeture automatique après 3 secondes
  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [onClose]);

  const baseClasses =
    "fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-md";
  const typeClasses =
    type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white";

  return (
    <motion.div
      className={`${baseClasses} ${typeClasses}`}
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-100 focus:outline-none"
        aria-label="Fermer"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </motion.div>
  );
};

// Composant LoadingSpinner pour les états de chargement
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md" }) => {
  const sizeMap = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div className="flex justify-center items-center w-full h-full">
      <motion.div
        className={`${sizeMap[size]} rounded-full border-blue-500 border-t-transparent`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
        aria-label="Chargement en cours"
      />
    </div>
  );
};

// Jours de la semaine pour l'affichage
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

// Composant principal WeeklySchedulePage
const WeeklySchedulePage: React.FC = () => {
  // État pour la sélection de semaine
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState<number>(
    // Calcul du numéro de semaine actuel
    Math.ceil(
      (new Date().getTime() -
        new Date(new Date().getFullYear(), 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    )
  );

  // États pour les données et le chargement
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // États pour le formulaire de création
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [newScheduleData, setNewScheduleData] = useState<ScheduleData>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });
  const [notes, setNotes] = useState<string>("");
  const [creatingSchedule, setCreatingSchedule] = useState<boolean>(false);

  // Références pour le défilement
  const formRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Fonction pour récupérer les plannings
  const fetchSchedules = useCallback(async () => {
    if (year < 2020 || year > 2050 || weekNumber < 1 || weekNumber > 53) {
      setError(
        "Veuillez saisir une année valide (2020-2050) et une semaine valide (1-53)"
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<{
        success: boolean;
        data: Schedule[];
        count: number;
      }>(`/api/schedules/week/${year}/${weekNumber}`);

      setSchedules(response.data.data);

      // Défilement vers le tableau des résultats s'il y a des données
      if (response.data.data.length > 0 && tableRef.current) {
        setTimeout(() => {
          tableRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des plannings:", error);
      setError(
        "Erreur lors de la récupération des plannings. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  }, [year, weekNumber]);

  // Fonction pour récupérer la liste des employés
  const fetchEmployees = useCallback(async () => {
    try {
      // Cette requête devrait être implémentée sur votre backend
      const response = await axios.get<{
        success: boolean;
        data: { _id: string; firstName: string; lastName: string }[];
      }>("/api/employees");

      const employeeOptions = response.data.data.map((emp) => ({
        _id: emp._id,
        fullName: `${emp.firstName} ${emp.lastName}`,
      }));

      setEmployees(employeeOptions);
    } catch (error) {
      console.error("Erreur lors de la récupération des employés:", error);
      // On ne définit pas d'erreur pour ne pas perturber l'UX principale
    }
  }, []);

  // Chargement initial des données
  useEffect(() => {
    fetchSchedules();
    fetchEmployees();
  }, [fetchSchedules, fetchEmployees]);

  // Gestionnaire de changement pour le formulaire de création
  const handleScheduleDataChange = (day: string, value: string) => {
    // Split par virgule et nettoyage des heures
    const hours = value
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);

    setNewScheduleData((prev) => ({
      ...prev,
      [day]: hours,
    }));
  };

  // Fonction pour créer un nouveau planning
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      setError("Veuillez sélectionner un employé");
      return;
    }

    // Vérifier si au moins une journée contient des horaires
    const hasScheduleData = Object.values(newScheduleData).some(
      (arr) => arr.length > 0
    );
    if (!hasScheduleData) {
      setError("Veuillez spécifier au moins un horaire");
      return;
    }

    setCreatingSchedule(true);
    setError(null);

    try {
      await axios.post("/api/schedules", {
        employeeId: selectedEmployeeId,
        year,
        weekNumber,
        scheduleData: newScheduleData,
        notes: notes.trim() || undefined,
      });

      setSuccess("Planning créé avec succès");

      // Réinitialiser le formulaire
      setSelectedEmployeeId("");
      setNewScheduleData({
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      });
      setNotes("");

      // Rafraîchir les plannings
      fetchSchedules();
    } catch (error: any) {
      console.error("Erreur lors de la création du planning:", error);

      // Gestion spécifique de l'erreur de doublon (code 409)
      if (error.response && error.response.status === 409) {
        setError("Un planning existe déjà pour cet employé sur cette semaine");
      } else {
        setError("Erreur lors de la création du planning. Veuillez réessayer.");
      }
    } finally {
      setCreatingSchedule(false);
    }
  };

  // Fonction pour fermer les notifications
  const closeNotification = () => {
    setError(null);
    setSuccess(null);
  };

  // Formatage des horaires pour l'affichage
  const formatScheduleTimes = (times: string[] | undefined): string => {
    if (!times || times.length === 0) return "—";
    return times.join(", ");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <Toast message={error} type="error" onClose={closeNotification} />
        )}
        {success && (
          <Toast message={success} type="success" onClose={closeNotification} />
        )}
      </AnimatePresence>

      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Plannings Hebdomadaires
        </h1>
      </motion.div>

      {/* Section de recherche */}
      <motion.div
        className="bg-white rounded-lg shadow-md p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Rechercher un planning
        </h2>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Année
            </label>
            <input
              type="number"
              id="year"
              min="2020"
              max="2050"
              value={year}
              onChange={(e) =>
                setYear(parseInt(e.target.value) || new Date().getFullYear())
              }
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full md:w-1/3">
            <label
              htmlFor="weekNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Semaine
            </label>
            <input
              type="number"
              id="weekNumber"
              min="1"
              max="53"
              value={weekNumber}
              onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full md:w-1/3 flex items-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchSchedules}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : "Rechercher"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tableau des plannings */}
      <motion.div
        ref={tableRef}
        className="bg-white rounded-lg shadow-md p-6 mb-8 overflow-x-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Plannings validés - Semaine {weekNumber}, {year}
        </h2>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : schedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Employé
                  </th>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <th
                      key={day}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {day}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <motion.tr
                    key={schedule._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ backgroundColor: "#f9fafb" }}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {schedule.employeeName}
                    </td>
                    {DAY_KEYS.map((day) => (
                      <td
                        key={`${schedule._id}-${day}`}
                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {formatScheduleTimes(schedule.scheduleData[day])}
                      </td>
                    ))}
                    <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {schedule.notes || "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Aucun planning validé trouvé pour cette semaine.
          </div>
        )}
      </motion.div>

      {/* Formulaire de création de planning */}
      <motion.div
        ref={formRef}
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Créer un nouveau planning
        </h2>

        <form onSubmit={handleCreateSchedule}>
          <div className="mb-4">
            <label
              htmlFor="employeeId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Employé
            </label>
            <select
              id="employeeId"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un employé</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Horaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              {DAY_KEYS.map((day, index) => (
                <div key={day} className="mb-2">
                  <label
                    htmlFor={`schedule-${day}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {DAYS_OF_WEEK[index]}
                  </label>
                  <input
                    type="text"
                    id={`schedule-${day}`}
                    placeholder="9h-12h, 14h-17h"
                    value={newScheduleData[day].join(", ")}
                    onChange={(e) =>
                      handleScheduleDataChange(day, e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes (optionnel)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Informations complémentaires..."
            />
          </div>

          <div className="flex justify-end">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              disabled={creatingSchedule}
            >
              {creatingSchedule ? (
                <LoadingSpinner size="sm" />
              ) : (
                "Créer le planning"
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default WeeklySchedulePage;
