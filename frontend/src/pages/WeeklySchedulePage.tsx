/**
 * WeeklySchedulePage - Page de gestion des plannings hebdomadaires
 *
 * Permet de visualiser, créer et mettre à jour des plannings hebdomadaires pour les employés.
 * Inclut la recherche par semaine/année et un formulaire interactif.
 */
import axios from "axios";
import { addDays, format, getISOWeek, getYear, startOfISOWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Brain,
  Calendar,
  Check,
  Clock,
  Edit,
  Plus,
  Search,
  Trash,
  Users,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Composants de layout
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Avatar from "../components/ui/Avatar";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import DatePicker from "../components/ui/DatePicker";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Select from "../components/ui/Select";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Composant de planning

// Types pour les différentes entités
interface Schedule {
  _id: string;
  employeeId: string;
  employeeName: string;
  scheduleData: Record<string, string[]>;
  dailyNotes?: Record<string, string>;
  dailyDates: Record<string, Date>;
  totalWeeklyMinutes: number;
  notes?: string;
  updatedBy: string;
  year: number;
  weekNumber: number;
  status: "approved" | "draft";
}

// Interface pour les données de time slots
interface TimeSlot {
  start: string;
  end: string;
}

// Interface pour les options d'employés dans le select
interface EmployeeOption {
  _id: string;
  fullName: string;
}

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

// Constantes pour les créneaux horaires
const TIME_OPTIONS = Array.from({ length: 24 * 4 + 1 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
});

/**
 * Calcule la durée en minutes entre deux horaires au format "HH:MM"
 */
const calculateDuration = (start: string, end: string): number => {
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  return endTotalMinutes - startTotalMinutes;
};

/**
 * Convertit une durée en minutes en format heures et minutes (ex: "5h 30min")
 */
const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return "0min";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}min`;
  if (remainingMinutes === 0) return `${hours}h`;

  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Composant principal WeeklySchedulePage
 */
const WeeklySchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // État pour la sélection de semaine et date
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState<number>(getISOWeek(new Date()));
  // État pour stocker la date sélectionnée dans le DatePicker
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // États pour les données et le chargement
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // États pour le formulaire de création/modification
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [existingScheduleId, setExistingScheduleId] = useState<string | null>(
    null
  );
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // État pour les données du planning
  const [scheduleData, setScheduleData] = useState<Record<string, TimeSlot[]>>(
    DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
  );

  // États pour les notes quotidiennes et globales
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>(
    DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {})
  );
  const [notes, setNotes] = useState<string>("");
  const [creatingSchedule, setCreatingSchedule] = useState<boolean>(false);

  // Références pour le défilement
  const formRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Calcul des dates pour chaque jour de la semaine
  const weekDates = useMemo(() => {
    const startDate = startOfISOWeek(
      new Date(year, 0, (weekNumber - 1) * 7 + 1)
    );

    return DAY_KEYS.reduce((acc, day, index) => {
      const date = addDays(startDate, index);
      return { ...acc, [day]: date };
    }, {} as Record<string, Date>);
  }, [year, weekNumber]);

  // Calcul du temps total hebdomadaire en minutes
  const totalWeeklyMinutes = useMemo(() => {
    return Object.values(scheduleData).reduce((total, daySlots) => {
      const dayMinutes = daySlots.reduce((sum, slot) => {
        return sum + calculateDuration(slot.start, slot.end);
      }, 0);
      return total + dayMinutes;
    }, 0);
  }, [scheduleData]);

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/tableau-de-bord" },
    { label: "Plannings", href: "/plannings-hebdomadaires" },
    { label: `Semaine ${weekNumber}` },
  ];

  /**
   * Gestionnaire de changement de date dans le DatePicker
   * Extrait l'année et le numéro de semaine ISO à partir de la date sélectionnée
   */
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setYear(getYear(date));
      setWeekNumber(getISOWeek(date));
    }
  };

  /**
   * Fonction pour récupérer les plannings
   */
  const fetchSchedules = useCallback(async () => {
    if (year < 2020 || year > 2050 || weekNumber < 1 || weekNumber > 53) {
      setError(
        "Veuillez saisir une année valide (2020-2050) et une semaine valide (1-53)"
      );
      setShowErrorToast(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<{
        success: boolean;
        data: Schedule[];
        count: number;
      }>(`/api/weekly-schedules/week/${year}/${weekNumber}`);

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
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, [year, weekNumber]);

  /**
   * Fonction pour récupérer la liste des employés
   */
  const fetchEmployees = useCallback(async () => {
    try {
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
    }
  }, []);

  /**
   * Chargement initial des données au montage du composant
   * et à chaque changement d'année ou de numéro de semaine
   */
  useEffect(() => {
    fetchSchedules();
    fetchEmployees();
  }, [fetchSchedules, fetchEmployees]);

  /**
   * Vérifie si un planning existe déjà pour l'employé sélectionné
   * et charge ses données dans le formulaire si nécessaire
   */
  const checkExistingSchedule = useCallback(() => {
    if (!selectedEmployeeId) {
      setExistingScheduleId(null);
      setIsEditMode(false);
      return;
    }

    const existingSchedule = schedules.find(
      (schedule) => schedule.employeeId === selectedEmployeeId
    );

    if (existingSchedule) {
      setExistingScheduleId(existingSchedule._id);
      setIsEditMode(true);

      // Conversion du format des créneaux horaires de l'API vers le format de l'UI
      const formattedScheduleData: Record<string, TimeSlot[]> = {};

      Object.entries(existingSchedule.scheduleData).forEach(([day, slots]) => {
        formattedScheduleData[day] = slots.map((slot) => {
          const [start, end] = slot.split("-");
          return { start, end };
        });
      });

      setScheduleData(formattedScheduleData);
      setDailyNotes(
        existingSchedule.dailyNotes ||
          DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {})
      );
      setNotes(existingSchedule.notes || "");
    } else {
      setExistingScheduleId(null);
      setIsEditMode(false);
      resetForm();
    }
  }, [selectedEmployeeId, schedules]);

  /**
   * Réinitialise le formulaire avec des valeurs par défaut
   */
  const resetForm = () => {
    setScheduleData(DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {}));
    setDailyNotes(DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {}));
    setNotes("");
  };

  /**
   * Mise à jour des données de formulaire quand l'employé est sélectionné
   */
  useEffect(() => {
    checkExistingSchedule();
  }, [selectedEmployeeId, checkExistingSchedule]);

  /**
   * Prépare le payload pour l'API
   */
  const preparePayload = () => {
    const userId = user?._id;
    if (!userId) {
      setError("Session utilisateur invalide. Veuillez vous reconnecter.");
      setShowErrorToast(true);
      return null;
    }

    // Formatage des horaires uniquement si slots présents
    const formattedScheduleData: Record<string, string[]> = {};
    Object.entries(scheduleData).forEach(([day, slots]) => {
      if (slots.length > 0) {
        formattedScheduleData[day] = slots.map(
          (slot) => `${slot.start}-${slot.end}`
        );
      }
    });

    if (Object.keys(formattedScheduleData).length === 0) {
      setError("Veuillez définir au moins un créneau horaire.");
      setShowErrorToast(true);
      return null;
    }

    const filteredDailyNotes: Record<string, string> = {};
    Object.entries(dailyNotes).forEach(([day, note]) => {
      if (note.trim()) {
        filteredDailyNotes[day] = note.trim();
      }
    });

    const validDailyDates = Object.fromEntries(
      Object.entries(weekDates).filter(([day]) => formattedScheduleData[day])
    );

    return {
      employeeId: selectedEmployeeId,
      updatedBy: userId,
      year,
      weekNumber,
      status: "approved" as const,
      notes: notes.trim() || undefined,
      scheduleData: formattedScheduleData,
      dailyNotes:
        Object.keys(filteredDailyNotes).length > 0
          ? filteredDailyNotes
          : undefined,
      dailyDates: validDailyDates,
      totalWeeklyMinutes,
    };
  };

  /**
   * Gère la création d'un nouveau planning hebdomadaire
   */
  const handleCreateSchedule = async () => {
    // Vérification de l'authentification
    if (!user || !user._id) {
      setError(
        "Utilisateur non authentifié : impossible de valider le planning."
      );
      setShowErrorToast(true);
      console.warn("User context manquant ou invalide :", user); // Debug
      return;
    }

    // Validation des données requises
    if (!selectedEmployeeId) {
      setError("Veuillez sélectionner un employé.");
      setShowErrorToast(true);
      return;
    }

    // Préparation des données à envoyer
    const payload = preparePayload();
    console.log("Payload envoyé au backend :", payload);

    if (!payload) {
      setError("Impossible de préparer les données du planning.");
      setShowErrorToast(true);
      return;
    }

    // Ajout explicite de l'utilisateur qui met à jour
    payload.updatedBy = user._id;

    // Activation de l'indicateur de chargement
    setCreatingSchedule(true);
    setError(null);

    try {
      // Requête vers l'API
      await axios.post("/api/weekly-schedules", payload); // ✅ suffit

      setSuccess("Planning hebdomadaire créé avec succès.");
      setShowSuccessToast(true);

      // Réinitialisation du formulaire et rechargement
      resetForm();
      setSelectedEmployeeId("");
      fetchSchedules();
    } catch (error: unknown) {
      handleApiError(error, "création");
    } finally {
      setCreatingSchedule(false);
    }
  };

  /**
   * Gère la mise à jour d'un planning hebdomadaire existant
   */
  const handleUpdateSchedule = async () => {
    // Vérification de l'authentification
    if (!user || !user._id) {
      setError(
        "Utilisateur non authentifié : impossible de valider le planning."
      );
      setShowErrorToast(true);
      console.log("User context:", user); // Debug temporaire
      return;
    }

    if (!existingScheduleId) {
      setError("Impossible de mettre à jour: planning introuvable");
      setShowErrorToast(true);
      return;
    }

    const payload = preparePayload();
    if (!payload) return;

    setCreatingSchedule(true);
    setError(null);

    try {
      // Envoi de la requête de mise à jour au backend
      await axios.post("/api/weekly-schedules", payload); // ✅ suffit

      // Notification de succès
      setSuccess("Planning hebdomadaire mis à jour avec succès");
      setShowSuccessToast(true);

      // Rechargement des plannings
      fetchSchedules();
    } catch (error: unknown) {
      handleApiError(error, "mise à jour");
    } finally {
      setCreatingSchedule(false);
    }
  };

  /**
   * Gère la soumission du formulaire
   */
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode) {
      await handleUpdateSchedule();
    } else {
      await handleCreateSchedule();
    }
  };

  /**
   * Gestion uniforme des erreurs d'API
   */
  const handleApiError = (error: unknown, operation: string) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409) {
        setError(`Un planning existe déjà pour cet employé sur cette semaine`);
      } else {
        setError(
          error.response?.data?.message ||
            `Erreur lors de la ${operation} du planning`
        );
      }
    } else {
      setError(`Une erreur inattendue s'est produite`);
      console.error(`Erreur lors de la ${operation} du planning:`, error);
    }

    setShowErrorToast(true);
  };

  /**
   * Ajout d'un créneau horaire
   */
  const handleAddTimeSlot = (day: string) => {
    setScheduleData((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: "09:00", end: "17:00" }],
    }));
  };

  /**
   * Suppression d'un créneau horaire
   */
  const handleRemoveTimeSlot = (day: string, index: number) => {
    setScheduleData((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  /**
   * Mise à jour d'un créneau horaire
   */
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

  /**
   * Mise à jour des notes quotidiennes
   */
  const handleDailyNoteChange = (day: string, value: string) => {
    setDailyNotes((prev) => ({
      ...prev,
      [day]: value,
    }));
  };

  /**
   * Fonction pour fermer les notifications
   */
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  /**
   * Renvoie les dates exactes (du lundi au dimanche) pour la semaine donnée
   * Exemple de sortie : "22 avr. → 28 avr. 2024"
   */
  const getWeekDateRange = (year: number, week: number): string => {
    const startDate = startOfISOWeek(new Date(year, 0, (week - 1) * 7 + 1));
    const endDate = addDays(startDate, 6);

    const formattedStart = format(startDate, "dd MMM", { locale: fr });
    const formattedEnd = format(endDate, "dd MMM yyyy", { locale: fr });

    return `${formattedStart} → ${formattedEnd}`;
  };

  /**
   * Formatage des horaires pour l'affichage
   */
  const formatScheduleTimes = (times: string[] | undefined): string => {
    if (!times || times.length === 0) return "—";
    return times.join(", ");
  };

  /**
   * Colonnes pour le composant Table
   */
  const tableColumns = [
    { key: "employee", label: "Employé", className: "w-40" },
    ...DAY_KEYS.map((day, index) => ({
      key: day,
      label: DAYS_OF_WEEK[index],
    })),
    { key: "total", label: "Total", className: "w-24" },
    { key: "actions", label: "Actions", className: "w-24" },
  ];

  /**
   * Formatage des données pour le composant Table
   */
  const tableData = schedules.map((schedule) => {
    // Calcul du temps total pour ce planning
    const totalMinutes = Object.values(schedule.scheduleData).reduce(
      (total, daySlots) => {
        return (
          total +
          daySlots.reduce((sum, slot) => {
            const [start, end] = slot.split("-");
            return sum + calculateDuration(start, end);
          }, 0)
        );
      },
      0
    );

    const rowData: Record<string, any> = {
      id: schedule._id,
      // Intégration d'un Avatar avec le nom de l'employé
      employee: (
        <div className="flex items-center gap-2">
          <Avatar size="sm" />
          <span>{schedule.employeeName}</span>
        </div>
      ),
      total: (
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          {formatDuration(totalMinutes)}
        </span>
      ),
      actions: (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedEmployeeId(schedule.employeeId);
              formRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            icon={<Edit size={16} />}
          >
            Éditer
          </Button>
        </div>
      ),
    };

    // Ajouter les données par jour
    DAY_KEYS.forEach((day) => {
      rowData[day] = formatScheduleTimes(schedule.scheduleData[day]);
    });

    return rowData;
  });

  return (
    <LayoutWithSidebar
      activeItem="plannings-hebdomadaires"
      pageTitle="Plannings Hebdomadaires"
    >
      <PageWrapper>
        {/* Notifications */}
        <Toast
          message={error || ""}
          type="error"
          isVisible={showErrorToast}
          onClose={closeErrorToast}
        />
        <Toast
          message={success || ""}
          type="success"
          isVisible={showSuccessToast}
          onClose={closeSuccessToast}
        />

        {/* En-tête avec fil d'ariane */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="flex-grow"></div>
        </div>

        {/* Bouton de redirection vers la page de validation des plannings générés par l'IA */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4"
        >
          <Button
            onClick={() => navigate("/validation-plannings")}
            variant="primary"
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-sm rounded-xl shadow-lg hover:brightness-110 transition-all duration-300"
            icon={<Brain size={18} />}
          >
            Valider les plannings générés par l'IA
          </Button>
        </motion.div>

        {/* Récapitulatif de la semaine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <SectionCard className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950 rounded-2xl border-none shadow-md">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <Calendar className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Semaine {weekNumber}, {year}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {getWeekDateRange(year, weekNumber)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Temps total planifié
                </span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatDuration(
                    schedules.reduce(
                      (total, schedule) => total + schedule.totalWeeklyMinutes,
                      0
                    )
                  )}
                </span>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* Titre de la page */}
        <SectionTitle
          title="Plannings Hebdomadaires"
          subtitle="Consultez et créez les plannings de travail pour la semaine"
          icon={<Calendar size={24} />}
          className="mb-8"
        />

        {/* Section de recherche avec DatePicker */}
        <SectionCard
          title="Rechercher un planning"
          accentColor="var(--accent-primary)"
          className="mb-8 rounded-2xl shadow-md"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* DatePicker pour la sélection de semaine */}
            <div className="w-full md:w-2/3">
              <DatePicker
                label="Semaine à consulter"
                selectedDate={selectedDate}
                onChange={handleDateChange}
                placeholder="JJ/MM/AAAA"
                required
                className="w-full"
              />
            </div>

            <div className="w-full md:w-1/3 flex items-end">
              <Button
                onClick={fetchSchedules}
                variant="primary"
                isLoading={loading}
                fullWidth
                icon={<Search size={18} />}
                className="rounded-xl"
              >
                Rechercher
              </Button>
            </div>
          </div>
        </SectionCard>

        {/* Tableau des plannings */}
        <motion.div
          ref={tableRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <SectionCard
            title={`Plannings validés - Semaine ${weekNumber}, ${year}`}
            className="rounded-2xl shadow-md"
          >
            {loading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : schedules.length > 0 ? (
              <div className="overflow-x-auto">
                <Table
                  columns={tableColumns}
                  data={tableData}
                  emptyState={{
                    title: "Aucun planning",
                    description:
                      "Aucun planning n'a été trouvé pour cette semaine",
                    icon: (
                      <Calendar
                        size={40}
                        className="text-gray-400 dark:text-gray-600"
                      />
                    ),
                  }}
                  className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                />
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--text-secondary)] dark:text-gray-400">
                Aucun planning validé trouvé pour cette semaine.
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Formulaire de création/modification de planning */}
        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <SectionCard
            title={
              isEditMode ? "Modifier le planning" : "Créer un nouveau planning"
            }
            accentColor={isEditMode ? "var(--warning)" : "var(--success)"}
            className="rounded-2xl shadow-md"
          >
            <form onSubmit={handleSaveSchedule}>
              <div className="mb-4">
                <Select
                  label="Employé"
                  options={employees.map((emp) => ({
                    label: emp.fullName,
                    value: emp._id,
                  }))}
                  value={selectedEmployeeId}
                  onChange={setSelectedEmployeeId}
                  placeholder="Sélectionner un employé"
                  icon={<Users size={18} />}
                />
              </div>

              {/* Grille d'horaires intégrée */}
              <div className="mb-6">
                <h3 className="font-medium text-[var(--text-primary)] mb-3">
                  Horaires
                </h3>
                <div className="space-y-6">
                  {DAY_KEYS.map((day, dayIndex) => {
                    // Calcul de la date du jour en fonction de l'année et la semaine
                    const dayDate = weekDates[day];
                    const formattedDate = format(dayDate, "dd MMM", {
                      locale: fr,
                    });

                    // Calcul du temps total pour ce jour
                    const dayTotalMinutes = scheduleData[day].reduce(
                      (total, slot) =>
                        total + calculateDuration(slot.start, slot.end),
                      0
                    );

                    return (
                      <div
                        key={day}
                        className="p-4 border border-[var(--border)] rounded-xl bg-[var(--background-secondary)] transition-all hover:shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                          <div className="flex items-center gap-2 mb-2 sm:mb-0">
                            <span className="font-medium text-[var(--text-primary)]">
                              {DAYS_OF_WEEK[dayIndex]}
                            </span>
                            <span className="text-sm text-[var(--text-secondary)]">
                              {formattedDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              {formatDuration(dayTotalMinutes)}
                            </span>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAddTimeSlot(day)}
                              icon={<Plus size={14} />}
                            >
                              Ajouter
                            </Button>
                          </div>
                        </div>

                        {/* Liste des créneaux horaires pour ce jour */}
                        <div className="space-y-2">
                          {scheduleData[day].length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)] italic">
                              Aucun créneau horaire défini
                            </p>
                          ) : (
                            scheduleData[day].map((slot, slotIndex) => (
                              <div
                                key={slotIndex}
                                className="flex flex-wrap items-center gap-2 p-2 bg-[var(--background-primary)] rounded-lg"
                              >
                                <div className="flex-1 min-w-[180px] flex items-center gap-2">
                                  <label className="text-xs text-[var(--text-secondary)]">
                                    Début
                                  </label>
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
                                    className="flex-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--input-background)] text-[var(--text-primary)] text-sm"
                                  >
                                    {TIME_OPTIONS.filter(
                                      (time) => time < slot.end
                                    ).map((time) => (
                                      <option key={time} value={time}>
                                        {time}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex-1 min-w-[180px] flex items-center gap-2">
                                  <label className="text-xs text-[var(--text-secondary)]">
                                    Fin
                                  </label>
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
                                    className="flex-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--input-background)] text-[var(--text-primary)] text-sm"
                                  >
                                    {TIME_OPTIONS.filter(
                                      (time) => time > slot.start
                                    ).map((time) => (
                                      <option key={time} value={time}>
                                        {time}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  onClick={() =>
                                    handleRemoveTimeSlot(day, slotIndex)
                                  }
                                  icon={<Trash size={16} />}
                                >
                                  Supprimer
                                </Button>

                                <div className="w-full mt-1 text-xs text-[var(--text-secondary)]">
                                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                    {formatDuration(
                                      calculateDuration(slot.start, slot.end)
                                    )}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Notes pour ce jour */}
                        <div className="mt-3">
                          <label className="text-xs text-[var(--text-secondary)]">
                            Notes pour {DAYS_OF_WEEK[dayIndex]} (optionnel)
                          </label>
                          <textarea
                            value={dailyNotes[day] || ""}
                            onChange={(e) =>
                              handleDailyNoteChange(day, e.target.value)
                            }
                            className="mt-1 w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--input-background)] text-[var(--text-primary)]"
                            placeholder={`Notes spécifiques pour ${DAYS_OF_WEEK[dayIndex]}...`}
                            rows={1}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Récapitulatif du temps total hebdomadaire */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950 rounded-xl">
                <div className="flex flex-col sm:flex-row justify-between items-center">
                  <div className="flex items-center gap-2 mb-2 sm:mb-0">
                    <Clock
                      size={20}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                    <span className="font-medium">
                      Temps total hebdomadaire:
                    </span>
                  </div>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatDuration(totalWeeklyMinutes)}
                  </span>
                </div>
              </div>

              {/* Notes générales */}
              <div className="mb-6">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Notes générales (optionnel)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] bg-[var(--background-primary)] text-[var(--text-primary)]"
                  placeholder="Informations complémentaires..."
                />
              </div>

              {/* Bouton de soumission */}
              <div className="flex justify-end">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={creatingSchedule}
                    disabled={creatingSchedule}
                    icon={
                      isEditMode ? <Check size={18} /> : <Clock size={18} />
                    }
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-2 rounded-xl shadow-md"
                  >
                    {isEditMode
                      ? "Mettre à jour le planning"
                      : "Enregistrer le planning"}
                  </Button>
                </motion.div>
              </div>
            </form>
          </SectionCard>
        </motion.div>
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default WeeklySchedulePage;
