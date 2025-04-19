import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "../components/ui/LoadingSpinner";

// Types pour les plannings générés
interface ScheduleData {
  [day: string]: string[]; // Ex: { "lundi": ["08:00-12:00", "14:00-18:00"] }
}

interface GeneratedSchedule {
  _id: string;
  employeeId: string;
  employeeName: string; // Nom complet de l'employé
  photoUrl?: string; // Photo de l'employé
  weekNumber: number;
  year: number;
  scheduleData: ScheduleData;
  status: "draft" | "approved";
  generatedBy: string; // ID de l'IA ou du système qui a généré
  timestamp: string; // Date de génération
}

// Types pour les employés (utilisé pour l'affichage)
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

// Types pour les composants d'UI réutilisables
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

// Jours de la semaine pour l'affichage
const DAYS_OF_WEEK = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

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

/**
 * Utilitaire pour obtenir le numéro de semaine ISO pour une date donnée
 * @param date Date pour laquelle obtenir le numéro de semaine
 * @returns {number} Numéro de semaine ISO
 */
const getISOWeek = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
};

/**
 * Obtient le numéro de semaine ISO actuel
 * @returns {number} Numéro de semaine ISO actuel
 */
const getCurrentISOWeek = (): number => {
  return getISOWeek(new Date());
};

/**
 * Obtient l'année actuelle
 * @returns {number} Année actuelle
 */
const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

/**
 * Formatage du nom du mois en français
 * @param month Numéro du mois (0-11)
 * @returns {string} Nom du mois en français
 */
const getMonthName = (month: number): string => {
  const monthNames = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  return monthNames[month];
};

/**
 * Obtient la plage de dates pour une semaine donnée
 * @param year Année
 * @param weekNumber Numéro de semaine ISO
 * @returns {string} Plage de dates formatée (ex: "du 15 au 21 avril")
 */
const getWeekDateRange = (year: number, weekNumber: number): string => {
  // Fonction pour trouver la date du premier jour de la semaine ISO
  const getDateOfISOWeek = (year: number, week: number): Date => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const ISOWeekStart = simple;
    if (dayOfWeek <= 4) {
      ISOWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return ISOWeekStart;
  };

  // Trouver le premier jour (lundi) de la semaine ISO
  const firstDayOfWeek = getDateOfISOWeek(year, weekNumber);

  // Calculer le dernier jour (dimanche)
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

  // Formater la plage de dates
  const firstDay = firstDayOfWeek.getDate();
  const lastDay = lastDayOfWeek.getDate();
  const monthName = getMonthName(firstDayOfWeek.getMonth());
  const lastMonthName = getMonthName(lastDayOfWeek.getMonth());

  if (firstDayOfWeek.getMonth() === lastDayOfWeek.getMonth()) {
    return `du ${firstDay} au ${lastDay} ${monthName}`;
  } else {
    return `du ${firstDay} ${monthName} au ${lastDay} ${lastMonthName}`;
  }
};

/**
 * Utilitaire pour obtenir la couleur du badge de statut
 * @param status Statut du planning
 * @returns {string} Classes CSS pour la couleur du badge
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "draft":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Formatte le statut pour l'affichage
 * @param status Statut du planning
 * @returns {string} Statut formatté en français
 */
const formatStatus = (status: string): string => {
  switch (status) {
    case "approved":
      return "Validé";
    case "draft":
      return "Brouillon";
    default:
      return status;
  }
};

/**
 * Composant principal pour la page de validation des plannings
 * Accessible uniquement aux managers
 */
const PlanningValidationPage: React.FC = () => {
  // États pour gérer les plannings et l'UI
  const [schedules, setSchedules] = useState<GeneratedSchedule[]>([]);
  const [weekNumber, setWeekNumber] = useState<number>(getCurrentISOWeek());
  const [year, setYear] = useState<number>(getCurrentYear());
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Générer la liste des semaines pour la sélection
  const weekOptions = Array.from({ length: 52 }, (_, i) => i + 1);

  // Générer quelques années pour la sélection (année actuelle et +/- 2 ans)
  const currentYear = getCurrentYear();
  const yearOptions = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ];

  // Fonction pour récupérer les plannings générés pour la semaine/année sélectionnée
  const fetchGeneratedSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<{
        success: boolean;
        data: GeneratedSchedule[];
      }>(`/api/schedules/generated/team?weekNumber=${weekNumber}&year=${year}`);

      setSchedules(response.data.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des plannings:", error);
      setError("Impossible de récupérer les plannings. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [weekNumber, year]);

  // Chargement initial des données
  useEffect(() => {
    fetchGeneratedSchedules();
  }, [fetchGeneratedSchedules]);

  // Gestionnaire pour le changement de semaine
  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWeekNumber(parseInt(e.target.value, 10));
  };

  // Gestionnaire pour le changement d'année
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(parseInt(e.target.value, 10));
  };

  // Fonction pour valider un planning
  const handleValidation = async (scheduleId: string) => {
    setSubmitting(true);
    setError(null);

    try {
      await axios.patch(`/api/schedules/generated/${scheduleId}`, {
        status: "approved",
      });

      setSuccess("Planning validé avec succès");

      // Mettre à jour l'état local
      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) =>
          schedule._id === scheduleId
            ? { ...schedule, status: "approved" }
            : schedule
        )
      );
    } catch (error) {
      console.error("Erreur lors de la validation du planning:", error);
      setError("Impossible de valider le planning. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour fermer les notifications
  const closeNotification = () => {
    setError(null);
    setSuccess(null);
  };

  // Fonction pour aller à la semaine précédente
  const goToPreviousWeek = () => {
    if (weekNumber > 1) {
      setWeekNumber(weekNumber - 1);
    } else {
      // Si on est à la semaine 1, passer à la semaine 52 de l'année précédente
      setWeekNumber(52);
      setYear(year - 1);
    }
  };

  // Fonction pour aller à la semaine suivante
  const goToNextWeek = () => {
    if (weekNumber < 52) {
      setWeekNumber(weekNumber + 1);
    } else {
      // Si on est à la semaine 52, passer à la semaine 1 de l'année suivante
      setWeekNumber(1);
      setYear(year + 1);
    }
  };

  // Données de secours si l'API n'est pas disponible (pour développement)
  const fallbackSchedules: GeneratedSchedule[] =
    schedules.length > 0
      ? schedules
      : [
          {
            _id: "1",
            employeeId: "101",
            employeeName: "Jean Dupont",
            photoUrl: "https://randomuser.me/api/portraits/men/1.jpg",
            weekNumber: 16,
            year: 2025,
            scheduleData: {
              lundi: ["08:00-12:00", "14:00-18:00"],
              mardi: ["08:00-12:00", "14:00-18:00"],
              mercredi: ["08:00-12:00"],
              jeudi: ["08:00-12:00", "14:00-18:00"],
              vendredi: ["08:00-12:00", "14:00-16:00"],
              samedi: [],
              dimanche: [],
            },
            status: "draft",
            generatedBy: "IA-123",
            timestamp: "2025-04-10T10:30:00Z",
          },
          {
            _id: "2",
            employeeId: "102",
            employeeName: "Marie Martin",
            photoUrl: "https://randomuser.me/api/portraits/women/1.jpg",
            weekNumber: 16,
            year: 2025,
            scheduleData: {
              lundi: ["08:00-12:00", "14:00-18:00"],
              mardi: ["08:00-12:00"],
              mercredi: ["08:00-12:00", "14:00-18:00"],
              jeudi: ["08:00-12:00", "14:00-18:00"],
              vendredi: ["08:00-12:00"],
              samedi: [],
              dimanche: [],
            },
            status: "approved",
            generatedBy: "IA-123",
            timestamp: "2025-04-10T10:35:00Z",
          },
        ];

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Validation des plannings
        </h1>
        <p className="text-gray-600">
          Visualisez et validez les plannings générés par l'IA pour votre équipe
        </p>
      </div>

      {/* Sélecteur de semaine/année */}
      <div className="mb-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-2">
              Semaine {weekNumber} - {getMonthName(new Date().getMonth())}{" "}
              {year} ({getWeekDateRange(year, weekNumber)})
            </h2>
          </div>

          <div className="flex-grow"></div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={goToPreviousWeek}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none"
              disabled={loading || submitting}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
            </motion.button>

            <div className="flex items-center space-x-2">
              <label
                htmlFor="weekNumber"
                className="text-sm font-medium text-gray-700"
              >
                Semaine
              </label>
              <select
                id="weekNumber"
                name="weekNumber"
                value={weekNumber}
                onChange={handleWeekChange}
                className="rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || submitting}
              >
                {weekOptions.map((week) => (
                  <option key={week} value={week}>
                    {week}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label
                htmlFor="year"
                className="text-sm font-medium text-gray-700"
              >
                Année
              </label>
              <select
                id="year"
                name="year"
                value={year}
                onChange={handleYearChange}
                className="rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || submitting}
              >
                {yearOptions.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={goToNextWeek}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none"
              disabled={loading || submitting}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Contenu principal - Liste des plannings */}
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : fallbackSchedules.length > 0 ? (
        <div className="space-y-8">
          {fallbackSchedules.map((schedule) => (
            <motion.div
              key={schedule._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* En-tête du planning */}
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center">
                  {schedule.photoUrl ? (
                    <img
                      src={schedule.photoUrl}
                      alt={schedule.employeeName}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-4">
                      {schedule.employeeName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {schedule.employeeName}
                    </h2>
                    <div className="flex items-center mt-1">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          schedule.status
                        )}`}
                      >
                        {formatStatus(schedule.status)}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        Généré le{" "}
                        {new Date(schedule.timestamp).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton de validation */}
                {schedule.status === "draft" && (
                  <div className="mt-4 md:mt-0">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleValidation(schedule._id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        "Valider le planning"
                      )}
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Grille du planning */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {DAYS_OF_WEEK.map((day) => (
                        <th
                          key={day}
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      {DAYS_OF_WEEK.map((day) => (
                        <td key={day} className="px-6 py-4">
                          <div className="space-y-1">
                            {schedule.scheduleData[day] &&
                            schedule.scheduleData[day].length > 0 ? (
                              schedule.scheduleData[day].map(
                                (timeSlot, index) => (
                                  <div
                                    key={index}
                                    className="bg-blue-50 text-blue-800 text-sm rounded-md px-3 py-1.5 text-center"
                                  >
                                    {timeSlot}
                                  </div>
                                )
                              )
                            ) : (
                              <div className="text-gray-400 text-center text-sm">
                                Repos
                              </div>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-lg text-gray-500 mb-2">
            Aucun planning généré pour cette semaine
          </p>
          <p className="text-sm text-gray-400">
            Sélectionnez une autre semaine ou contactez le support si nécessaire
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanningValidationPage;
