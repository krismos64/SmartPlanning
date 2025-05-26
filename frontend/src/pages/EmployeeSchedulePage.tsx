import { addDays, format, getISOWeek, startOfISOWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  User,
  Users,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import { useAuth } from "../hooks/useAuth";
import {
  generateSchedulePDF,
  generateTeamSchedulePDF,
} from "../services/pdfGenerator";

// Types
interface Schedule {
  _id: string;
  employeeId: string;
  employeeName: string;
  employeePhotoUrl?: string;
  scheduleData: Record<string, string[]>;
  dailyNotes?: Record<string, string>;
  totalWeeklyMinutes: number;
  notes?: string;
  year: number;
  weekNumber: number;
  status: "approved" | "draft";
  updatedAt: string;
  teamName?: string;
  teamId?: string;
}

interface TeamInfo {
  _id: string;
  name: string;
  description?: string;
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

const EmployeeSchedulePage: React.FC = () => {
  const { user } = useAuth();

  // États principaux
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear()
  );
  const [currentWeek, setCurrentWeek] = useState<number>(
    getISOWeek(new Date())
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"personal" | "team">("personal");

  // États des données
  const [personalSchedules, setPersonalSchedules] = useState<Schedule[]>([]);
  const [teamSchedules, setTeamSchedules] = useState<Schedule[]>([]);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [employeeData, setEmployeeData] = useState<any>(null); // Données de l'employé
  const [availableWeeks, setAvailableWeeks] = useState<
    Array<{ year: number; week: number }>
  >([]);

  // États UI
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);

  // Calcul des dates de la semaine
  const weekDates = useMemo(() => {
    const startDate = startOfISOWeek(
      new Date(currentYear, 0, (currentWeek - 1) * 7 + 1)
    );

    return DAY_KEYS.reduce((acc, day, index) => {
      const date = addDays(startDate, index);
      return { ...acc, [day]: date };
    }, {} as Record<string, Date>);
  }, [currentYear, currentWeek]);

  // Fonctions utilitaires
  const calculateDuration = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    return endTotalMin - startTotalMin;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0
      ? `${hours}h${mins.toString().padStart(2, "0")}`
      : `${hours}h`;
  };

  const calculateTotalHours = (
    scheduleData: Record<string, string[]>
  ): string => {
    let totalMinutes = 0;
    Object.values(scheduleData).forEach((slots) => {
      slots.forEach((slot) => {
        const [start, end] = slot.split("-");
        if (start && end) {
          totalMinutes += calculateDuration(start, end);
        }
      });
    });
    return formatDuration(totalMinutes);
  };

  // Chargement des données
  const fetchPersonalSchedules = async () => {
    if (!user?._id) {
      return;
    }

    try {
      setLoading(true);

      // D'abord, récupérer l'employeeId basé sur le userId
      const employeeResponse = await axiosInstance.get(`/employees/me`);
      const employeeData = employeeResponse.data.data;

      if (!employeeData || !employeeData._id) {
        throw new Error("Profil employé non trouvé");
      }

      // Stocker les données de l'employé pour les utiliser ailleurs
      setEmployeeData(employeeData);

      // Ensuite, récupérer les plannings avec l'employeeId
      const response = await axiosInstance.get(
        `/weekly-schedules/employee/${employeeData._id}`
      );

      setPersonalSchedules(response.data.data || []);

      // Extraire les semaines disponibles
      const weeks = response.data.data.map((schedule: Schedule) => ({
        year: schedule.year,
        week: schedule.weekNumber,
      }));
      setAvailableWeeks(weeks);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des plannings personnels:",
        error
      );
      toast.error("Erreur lors du chargement de vos plannings");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamSchedules = async () => {
    // Extraire l'ID du teamId (gérer le cas où c'est un objet populé)
    const teamIdValue = employeeData?.teamId?._id || employeeData?.teamId;

    if (!teamIdValue) {
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.get(
        `/weekly-schedules/week/${currentYear}/${currentWeek}?teamId=${teamIdValue}`
      );
      setTeamSchedules(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des plannings d'équipe:", error);
      toast.error("Erreur lors du chargement des plannings d'équipe");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamInfo = async () => {
    // Extraire l'ID du teamId (gérer le cas où c'est un objet populé)
    const teamIdValue = employeeData?.teamId?._id || employeeData?.teamId;

    if (!teamIdValue) {
      return;
    }

    try {
      const response = await axiosInstance.get(`/teams/${teamIdValue}`);
      setTeamInfo(response.data.data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des informations d'équipe:",
        error
      );
    }
  };

  // Effects
  useEffect(() => {
    if (user?._id) {
      fetchPersonalSchedules();
    }
  }, [user]);

  // Déclencher fetchTeamInfo quand les données employé sont chargées
  useEffect(() => {
    const teamIdValue = employeeData?.teamId?._id || employeeData?.teamId;
    if (teamIdValue) {
      fetchTeamInfo();
    }
  }, [employeeData]);

  useEffect(() => {
    const teamIdValue = employeeData?.teamId?._id || employeeData?.teamId;
    if (viewMode === "team" && teamIdValue) {
      fetchTeamSchedules();
    }
  }, [viewMode, currentYear, currentWeek, employeeData]);

  // Gestionnaires d'événements
  const handleDateChange = (date: Date | null) => {
    if (!date) return;

    const week = getISOWeek(date);
    const year = date.getFullYear();
    setSelectedDate(date);
    setCurrentWeek(week);
    setCurrentYear(year);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const currentDate = new Date(currentYear, 0, (currentWeek - 1) * 7 + 1);
    const newDate = addDays(currentDate, direction === "next" ? 7 : -7);
    const newWeek = getISOWeek(newDate);
    const newYear = newDate.getFullYear();

    setCurrentWeek(newWeek);
    setCurrentYear(newYear);
    setSelectedDate(newDate);
  };

  const handleViewSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsViewModalOpen(true);
  };

  const handleDownloadPersonalPDF = () => {
    const currentSchedule = personalSchedules.find(
      (s) => s.year === currentYear && s.weekNumber === currentWeek
    );

    if (currentSchedule) {
      generateSchedulePDF(
        currentSchedule,
        user?.companyName || "Smart Planning"
      );
      toast.success("PDF généré avec succès");
    } else {
      toast.error("Aucun planning trouvé pour cette semaine");
    }
  };

  const handleDownloadTeamPDF = () => {
    if (teamSchedules.length > 0) {
      generateTeamSchedulePDF(
        teamSchedules,
        teamInfo?.name || "Équipe",
        user?.companyName || "Smart Planning"
      );
      toast.success("PDF de l'équipe généré avec succès");
    } else {
      toast.error("Aucun planning d'équipe trouvé pour cette semaine");
    }
  };

  // Rendu des composants
  const renderPersonalSchedules = () => {
    const currentSchedule = personalSchedules.find(
      (s) => s.year === currentYear && s.weekNumber === currentWeek
    );

    if (!currentSchedule) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
            Aucun planning pour cette semaine
          </h3>
          <p className="text-gray-400 dark:text-gray-500">
            Semaine {currentWeek}, {currentYear}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Résumé hebdomadaire */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                Planning de la semaine {currentWeek}
              </h3>
              <p className="text-blue-600 dark:text-blue-300">
                {format(weekDates.monday, "dd MMMM", { locale: fr })} au{" "}
                {format(weekDates.sunday, "dd MMMM yyyy", { locale: fr })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {calculateTotalHours(currentSchedule.scheduleData)}
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Total hebdomadaire
              </p>
            </div>
          </div>
        </div>

        {/* Planning quotidien */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Jour
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Horaires
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Durée
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {DAY_KEYS.map((day, index) => {
                  const daySlots = currentSchedule.scheduleData[day] || [];
                  const dayDate = weekDates[day];
                  const dayNotes = currentSchedule.dailyNotes?.[day] || "";

                  const dayTotalMinutes = daySlots.reduce((total, slot) => {
                    const [start, end] = slot.split("-");
                    return total + calculateDuration(start, end);
                  }, 0);

                  return (
                    <tr
                      key={day}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {DAYS_OF_WEEK[index]}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {format(dayDate, "dd/MM", { locale: fr })}
                      </td>
                      <td className="px-4 py-3">
                        {daySlots.length > 0 ? (
                          <div className="space-y-1">
                            {daySlots.map((slot, slotIndex) => (
                              <span
                                key={slotIndex}
                                className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs mr-1"
                              >
                                {slot}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Repos</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">
                        {dayTotalMinutes > 0
                          ? formatDuration(dayTotalMinutes)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {dayNotes ? (
                          <span className="text-sm">{dayNotes}</span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes générales */}
        {currentSchedule.notes && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Notes générales
            </h4>
            <p className="text-yellow-700 dark:text-yellow-300">
              {currentSchedule.notes}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderTeamSchedules = () => {
    // Extraire l'ID du teamId (gérer le cas où c'est un objet populé)
    const teamIdValue = employeeData?.teamId?._id || employeeData?.teamId;

    if (!teamIdValue) {
      return (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
            Vous n'êtes assigné à aucune équipe
          </h3>
          <p className="text-gray-400 dark:text-gray-500">
            Contactez votre manager pour être assigné à une équipe.
          </p>
        </div>
      );
    }

    if (teamSchedules.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
            Aucun planning d'équipe pour cette semaine
          </h3>
          <p className="text-gray-400 dark:text-gray-500">
            Semaine {currentWeek}, {currentYear}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* En-tête équipe */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Planning de l'équipe {teamInfo?.name}
              </h3>
              <p className="text-green-600 dark:text-green-300">
                Semaine {currentWeek}, {currentYear} • {teamSchedules.length}{" "}
                membre(s)
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadTeamPDF}
              icon={<Download className="h-4 w-4" />}
              className="bg-green-600 hover:bg-green-700"
            >
              Télécharger PDF
            </Button>
          </div>
        </div>

        {/* Liste des plannings */}
        <div className="grid gap-4">
          {teamSchedules.map((schedule) => (
            <motion.div
              key={schedule._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={schedule.employeePhotoUrl}
                    alt={`Photo de ${schedule.employeeName}`}
                    size="md"
                    fallbackName={schedule.employeeName}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {schedule.employeeName}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {calculateTotalHours(schedule.scheduleData)} cette semaine
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewSchedule(schedule)}
                  icon={<Eye className="h-4 w-4" />}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Voir détails
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <LayoutWithSidebar activeItem="plannings" pageTitle="Mes Plannings">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Mes Plannings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Consultez vos plannings personnels et ceux de votre équipe
            </p>
          </div>

          {/* Navigation et contrôles */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Sélecteur de mode */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("personal")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "personal"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <User className="h-4 w-4 inline mr-2" />
                  Mes plannings
                </button>
                <button
                  onClick={() => setViewMode("team")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "team"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Mon équipe
                </button>
              </div>

              {/* Navigation semaine */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek("prev")}
                    className="px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="text-center min-w-[120px]">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Semaine {currentWeek}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {currentYear}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek("next")}
                    className="px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sélecteur de date - temporairement commenté à cause des erreurs de type */}
                {/* 
                <DatePicker
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-48"
                />
                */}

                {/* Bouton PDF pour planning personnel */}
                {viewMode === "personal" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadPersonalPDF}
                    icon={<Download className="h-4 w-4" />}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    PDF Personnel
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : viewMode === "personal" ? (
              renderPersonalSchedules()
            ) : (
              renderTeamSchedules()
            )}
          </div>

          {/* Modal de visualisation détaillée */}
          <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title={`Planning de ${selectedSchedule?.employeeName}`}
            className="max-w-4xl"
          >
            {selectedSchedule && (
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Employé
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedSchedule.employeeName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Période
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      Semaine {selectedSchedule.weekNumber},{" "}
                      {selectedSchedule.year}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total hebdomadaire
                    </label>
                    <p className="text-green-600 dark:text-green-400 font-semibold">
                      {calculateTotalHours(selectedSchedule.scheduleData)}
                    </p>
                  </div>
                </div>

                {/* Planning détaillé */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left">
                          Jour
                        </th>
                        <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left">
                          Horaires
                        </th>
                        <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left">
                          Durée
                        </th>
                        <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {DAY_KEYS.map((day, index) => {
                        const daySlots =
                          selectedSchedule.scheduleData[day] || [];
                        const dayNotes =
                          selectedSchedule.dailyNotes?.[day] || "";

                        const dayTotalMinutes = daySlots.reduce(
                          (total, slot) => {
                            const [start, end] = slot.split("-");
                            return total + calculateDuration(start, end);
                          },
                          0
                        );

                        return (
                          <tr key={day}>
                            <td className="border border-gray-200 dark:border-gray-600 px-4 py-2 font-medium">
                              {DAYS_OF_WEEK[index]}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-600 px-4 py-2">
                              {daySlots.length > 0
                                ? daySlots.join(", ")
                                : "Repos"}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-green-600 dark:text-green-400">
                              {dayTotalMinutes > 0
                                ? formatDuration(dayTotalMinutes)
                                : "-"}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-600 px-4 py-2">
                              {dayNotes || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Notes générales */}
                {selectedSchedule.notes && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Notes générales
                    </h4>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      {selectedSchedule.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="primary"
                    onClick={() => {
                      generateSchedulePDF(
                        selectedSchedule,
                        user?.companyName || "Smart Planning"
                      );
                      toast.success("PDF généré avec succès");
                    }}
                    icon={<Download className="h-4 w-4" />}
                  >
                    Télécharger PDF
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </LayoutWithSidebar>
  );
};

export default EmployeeSchedulePage;
