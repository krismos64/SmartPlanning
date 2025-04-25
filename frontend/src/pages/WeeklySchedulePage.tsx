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
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  Grid,
  Plus,
  Trash,
  User,
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
import api from "../services/api"; // Importer l'instance API configurée

// Composants de layout
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Avatar from "../components/ui/Avatar";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
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
  updatedAt: string;
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

// Constantes pour les noms de mois en français
const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

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
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [viewMode, setViewMode] = useState<"team" | "employee" | "global">(
    "global"
  );

  // États pour les données et le chargement
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teams, setTeams] = useState<{ _id: string; name: string }[]>([]);
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
  }, [scheduleData]);

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/tableau-de-bord" },
    { label: "Plannings", href: "/plannings-hebdomadaires" },
    { label: `Semaine ${weekNumber}` },
  ];

  // Ajout des états pour la modal de détails et la confirmation de suppression
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(
    null
  );

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
      const response = await api.get<{
        success: boolean;
        data: Schedule[];
        count: number;
      }>(`/weekly-schedules/week/${year}/${weekNumber}`);

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
      const response = await api.get<{
        success: boolean;
        data: { _id: string; firstName: string; lastName: string }[];
      }>("/employees");

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
   * Fonction pour récupérer les équipes
   */
  const fetchTeams = useCallback(async () => {
    try {
      const response = await api.get(`/teams`);
      setTeams(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des équipes:", error);
    }
  }, []);

  /**
   * Chargement initial des données au montage du composant
   */
  useEffect(() => {
    fetchSchedules();
    fetchEmployees();
    fetchTeams();
  }, [fetchSchedules, fetchEmployees, fetchTeams]);

  /**
   * Vérifie si un planning existe déjà pour l'employé sélectionné
   * et la semaine/année courante, puis charge ses données dans le formulaire si nécessaire
   */
  const checkExistingSchedule = useCallback(() => {
    if (!selectedEmployeeId) {
      setExistingScheduleId(null);
      setIsEditMode(false);
      return;
    }

    // Vérification d'un planning existant pour cet employé POUR LA SEMAINE ET L'ANNÉE SPÉCIFIQUES
    const existingSchedule = schedules.find(
      (schedule) =>
        schedule.employeeId === selectedEmployeeId &&
        schedule.weekNumber === weekNumber &&
        schedule.year === year
    );

    if (existingSchedule) {
      setExistingScheduleId(existingSchedule._id);
      setIsEditMode(true);

      // Conversion du format des créneaux horaires de l'API vers le format de l'UI
      const formattedScheduleData: Record<string, TimeSlot[]> = DAY_KEYS.reduce(
        (acc, day) => ({ ...acc, [day]: [] }),
        {}
      );

      // Remplir avec les données existantes
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
      setExistingScheduleId(null);
      setIsEditMode(false);
      resetForm();
    }
  }, [selectedEmployeeId, schedules, weekNumber, year]);

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
    // Utilisons userId ou _id selon ce qui est disponible
    const userId = user?.userId || user?._id;
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

    // Création d'un objet dailyNotes complet, avec des chaînes vides pour les notes supprimées
    // Ainsi, les notes supprimées seront explicitement mises à jour avec des chaînes vides
    const formattedDailyNotes: Record<string, string> = {};
    Object.keys(dailyNotes).forEach((day) => {
      formattedDailyNotes[day] = dailyNotes[day]?.trim() || "";
    });

    // Créer dailyDates uniquement pour les jours qui ont des créneaux
    const formattedDailyDates: Record<string, string> = {};
    Object.entries(weekDates).forEach(([day, date]) => {
      if (formattedScheduleData[day]) {
        // Convertir explicitement en chaîne de date ISO pour éviter les problèmes de sérialisation
        formattedDailyDates[day] = date.toISOString();
      }
    });

    // Pour le debug
    console.log("User courant:", {
      _id: user?._id,
      userId: user?.userId,
    });

    console.log("Notes quotidiennes formatées:", formattedDailyNotes);

    return {
      employeeId: selectedEmployeeId,
      updatedBy: userId, // L'ID de l'utilisateur qui crée/modifie le planning
      year,
      weekNumber,
      status: "approved" as const,
      notes: notes.trim() || "",
      scheduleData: formattedScheduleData,
      dailyNotes: formattedDailyNotes, // Toujours envoyer l'objet complet, même avec des chaînes vides
      dailyDates: formattedDailyDates,
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

    // Vérifier si un planning existe déjà pour cet employé sur cette semaine spécifique
    const existingScheduleForWeek = schedules.find(
      (schedule) =>
        schedule.employeeId === selectedEmployeeId &&
        schedule.weekNumber === weekNumber &&
        schedule.year === year
    );

    if (existingScheduleForWeek) {
      setError(
        `Un planning existe déjà pour cet employé sur la semaine ${weekNumber} de ${year}.`
      );
      setShowErrorToast(true);
      return;
    }

    // Préparation des données à envoyer
    const payload = preparePayload();
    console.log("Payload envoyé au backend pour création:", payload);

    if (!payload) {
      setError("Impossible de préparer les données du planning.");
      setShowErrorToast(true);
      return;
    }

    // Activation de l'indicateur de chargement
    setCreatingSchedule(true);
    setError(null);

    try {
      // Vérifier que le token est présent dans localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Votre session a expiré. Veuillez vous reconnecter.");
        setShowErrorToast(true);
        setCreatingSchedule(false);
        return;
      }

      // Requête vers l'API avec l'instance configurée et vérification des en-têtes
      await api.post("/weekly-schedules", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // S'assurer que le token est bien envoyé
        },
      });

      setSuccess(
        `Planning hebdomadaire créé avec succès pour la semaine ${weekNumber} de ${year}.`
      );
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

    // Vérifier que le planning est bien pour la semaine sélectionnée
    const existingSchedule = schedules.find(
      (s) => s._id === existingScheduleId
    );
    if (
      !existingSchedule ||
      existingSchedule.weekNumber !== weekNumber ||
      existingSchedule.year !== year
    ) {
      setError(
        `Le planning que vous essayez de modifier n'est pas pour la semaine ${weekNumber} de ${year}.`
      );
      setShowErrorToast(true);
      return;
    }

    console.log("Payload envoyé au backend pour mise à jour:", payload);
    setCreatingSchedule(true);
    setError(null);

    try {
      // Vérifier que le token est présent dans localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Votre session a expiré. Veuillez vous reconnecter.");
        setShowErrorToast(true);
        setCreatingSchedule(false);
        return;
      }

      console.log("Mise à jour du planning:", existingScheduleId);

      // Envoi de la requête de mise à jour au backend avec PUT
      await api.put(`/weekly-schedules/${existingScheduleId}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // S'assurer que le token est bien envoyé
        },
      });

      // Notification de succès
      setSuccess(
        `Planning hebdomadaire mis à jour avec succès pour la semaine ${weekNumber} de ${year}.`
      );
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
      } else if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        setError(`Problème d'authentification. Veuillez vous reconnecter.`);
      } else {
        setError(
          error.response?.data?.message ||
            `Erreur lors de la ${operation} du planning`
        );
      }
      console.error("Détails de l'erreur:", error.response?.data);
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
            onClick={() => fetchScheduleDetails(schedule._id)}
            icon={<Eye size={16} />}
            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400"
          >
            Voir
          </Button>
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => confirmDeleteSchedule(schedule._id)}
            icon={<Trash size={16} />}
            className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400"
          >
            Supprimer
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

  /**
   * Récupère les détails d'un planning spécifique
   */
  const fetchScheduleDetails = async (scheduleId: string) => {
    try {
      const response = await api.get<{
        success: boolean;
        data: Schedule;
      }>(`/weekly-schedules/${scheduleId}`);

      setCurrentSchedule(response.data.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Erreur lors de la récupération du planning:", error);
      setError("Impossible de récupérer les détails du planning");
      setShowErrorToast(true);
    }
  };

  /**
   * Gère la suppression d'un planning
   */
  const handleDeleteSchedule = async () => {
    if (!deletingScheduleId) return;

    try {
      // Vérifier que le token est présent dans localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Votre session a expiré. Veuillez vous reconnecter.");
        setShowErrorToast(true);
        return;
      }

      await api.delete(`/weekly-schedules/${deletingScheduleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Planning supprimé avec succès");
      setShowSuccessToast(true);

      // Fermer la modal de confirmation et réinitialiser l'ID
      setIsDeleteModalOpen(false);
      setDeletingScheduleId(null);

      // Recharger la liste des plannings
      fetchSchedules();
    } catch (error) {
      handleApiError(error, "suppression");
    }
  };

  /**
   * Ouvre la modal de confirmation de suppression
   */
  const confirmDeleteSchedule = (scheduleId: string) => {
    setDeletingScheduleId(scheduleId);
    setIsDeleteModalOpen(true);
  };

  // Fonctions pour la navigation dans le calendrier
  const goToPreviousWeek = () => {
    const prevWeek = new Date(selectedDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setSelectedDate(prevWeek);
    setYear(getYear(prevWeek));
    setWeekNumber(getISOWeek(prevWeek));
    fetchSchedules();
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(selectedDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setSelectedDate(nextWeek);
    setYear(getYear(nextWeek));
    setWeekNumber(getISOWeek(nextWeek));
    fetchSchedules();
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    setSelectedDate(today);
    setYear(getYear(today));
    setWeekNumber(getISOWeek(today));
    fetchSchedules();
  };

  const handleMonthChange = (increment: number) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCalendarMonth(newMonth);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setYear(getYear(date));
    setWeekNumber(getISOWeek(date));
    fetchSchedules();
  };

  const changeViewMode = (mode: "team" | "employee" | "global") => {
    setViewMode(mode);
    setSelectedTeam("");
  };

  /**
   * Génération du calendrier interactif
   */
  const renderCalendar = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      0
    );

    // Obtenir le jour de la semaine du 1er du mois (0 = Dimanche, 1 = Lundi, etc.)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Ajuster pour que Lundi = 1

    // Calculer le nombre de jours du mois précédent à afficher
    const daysFromPrevMonth = firstDayOfWeek - 1;

    // Calculer le nombre total de jours dans le mois
    const daysInMonth = lastDayOfMonth.getDate();

    // Créer un tableau de dates à afficher dans le calendrier
    const calendarDays: Date[] = [];

    // Ajouter les jours du mois précédent
    const prevMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() - 1,
      1
    );
    const daysInPrevMonth = new Date(
      prevMonth.getFullYear(),
      prevMonth.getMonth() + 1,
      0
    ).getDate();

    for (
      let i = daysInPrevMonth - daysFromPrevMonth + 1;
      i <= daysInPrevMonth;
      i++
    ) {
      calendarDays.push(
        new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i)
      );
    }

    // Ajouter les jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(
        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i)
      );
    }

    // Ajouter les jours du mois suivant pour compléter la grille (6 semaines au total)
    const remainingDays = 42 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push(
        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, i)
      );
    }

    // Organiser les jours en semaines
    const weeks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold">
            {MONTH_NAMES[calendarMonth.getMonth()]}{" "}
            {calendarMonth.getFullYear()}
          </h3>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
            <div
              key={index}
              className="text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((date, dayIndex) => {
                const isCurrentMonth =
                  date.getMonth() === calendarMonth.getMonth();
                const isToday =
                  date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
                const isSelected =
                  getISOWeek(date) === weekNumber &&
                  date.getFullYear() === year;

                // Vérifier si la date appartient à la semaine sélectionnée
                const weekStart = startOfISOWeek(selectedDate);
                const weekEnd = addDays(weekStart, 6);
                const isInSelectedWeek = date >= weekStart && date <= weekEnd;

                return (
                  <motion.div
                    key={dayIndex}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDateClick(date)}
                    className={`
                      aspect-square flex items-center justify-center rounded-lg text-sm cursor-pointer
                      transition-colors duration-200
                      ${
                        !isCurrentMonth
                          ? "text-gray-300 dark:text-gray-600"
                          : ""
                      }
                      ${
                        isCurrentMonth &&
                        !isToday &&
                        !isSelected &&
                        !isInSelectedWeek
                          ? "text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                          : ""
                      }
                      ${
                        isInSelectedWeek
                          ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200"
                          : ""
                      }
                      ${
                        isToday
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold"
                          : ""
                      }
                      ${
                        isSelected
                          ? "bg-indigo-500 dark:bg-indigo-600 text-white font-bold"
                          : ""
                      }
                    `}
                  >
                    {date.getDate()}
                  </motion.div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="flex justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            size="sm"
            variant="secondary"
            onClick={goToPreviousWeek}
            icon={<ChevronLeft size={16} />}
          >
            Sem. préc.
          </Button>
          <Button size="sm" variant="secondary" onClick={goToCurrentWeek}>
            Aujourd'hui
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={goToNextWeek}
            icon={<ChevronRight size={16} />}
            className="flex flex-row-reverse items-center gap-2"
          >
            Sem. suiv.
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Rendu du sélecteur de vue (équipe/employé/global)
   */
  const renderViewSelector = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4">
        <h3 className="text-lg font-semibold mb-3">Vue des plannings</h3>
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2 mb-3">
            <Button
              size="sm"
              variant={viewMode === "global" ? "primary" : "secondary"}
              onClick={() => changeViewMode("global")}
              icon={<Grid size={16} />}
              className={viewMode === "global" ? "bg-indigo-600" : ""}
            >
              Vue globale
            </Button>
            <Button
              size="sm"
              variant={viewMode === "team" ? "primary" : "secondary"}
              onClick={() => changeViewMode("team")}
              icon={<Users size={16} />}
              className={viewMode === "team" ? "bg-indigo-600" : ""}
            >
              Par équipe
            </Button>
            <Button
              size="sm"
              variant={viewMode === "employee" ? "primary" : "secondary"}
              onClick={() => changeViewMode("employee")}
              icon={<User size={16} />}
              className={viewMode === "employee" ? "bg-indigo-600" : ""}
            >
              Par employé
            </Button>
          </div>

          {viewMode === "team" && (
            <div className="mt-2">
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">Toutes les équipes</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

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

        {/* Grille principale avec calendrier et filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1">
            <div className="space-y-6">
              {/* Calendrier interactif */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {renderCalendar()}
              </motion.div>

              {/* Sélecteur de vue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {renderViewSelector()}
              </motion.div>
            </div>
          </div>

          {/* Tableau des plannings */}
          <motion.div
            ref={tableRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-2"
          >
            <SectionCard
              title={`Plannings validés - Semaine ${weekNumber}, ${year}`}
              className="rounded-2xl shadow-md h-full"
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
        </div>

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
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-2">
                <Calendar
                  className="text-indigo-600 dark:text-indigo-400"
                  size={18}
                />
                <span className="font-medium text-indigo-700 dark:text-indigo-300">
                  Planification pour: Semaine {weekNumber}, {year} (
                  {getWeekDateRange(year, weekNumber)})
                </span>
              </div>
            </div>

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

                    // Calcul du temps total pour ce jour avec vérification
                    const dayTotalMinutes =
                      scheduleData[day] && Array.isArray(scheduleData[day])
                        ? scheduleData[day].reduce(
                            (total, slot) =>
                              total + calculateDuration(slot.start, slot.end),
                            0
                          )
                        : 0;

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
                          {!scheduleData[day] ||
                          scheduleData[day].length === 0 ? (
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

        {/* Modal de consultation détaillée */}
        {isViewModalOpen && currentSchedule && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    Planning de {currentSchedule.employeeName}
                  </h2>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Semaine
                    </p>
                    <p className="font-medium">
                      Semaine {currentSchedule.weekNumber},{" "}
                      {currentSchedule.year}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Statut
                    </p>
                    <p className="font-medium">
                      {currentSchedule.status === "approved"
                        ? "Approuvé"
                        : "Brouillon"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Temps total hebdomadaire
                    </p>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatDuration(currentSchedule.totalWeeklyMinutes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Dernière mise à jour
                    </p>
                    <p className="font-medium">
                      {new Date(currentSchedule.updatedAt).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium mb-2">Horaires hebdomadaires</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border px-3 py-2 bg-gray-50 dark:bg-gray-700 text-left">
                            Jour
                          </th>
                          <th className="border px-3 py-2 bg-gray-50 dark:bg-gray-700 text-left">
                            Horaires
                          </th>
                          <th className="border px-3 py-2 bg-gray-50 dark:bg-gray-700 text-left">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {DAY_KEYS.map((day, index) => (
                          <tr key={day}>
                            <td className="border px-3 py-2">
                              {DAYS_OF_WEEK[index]}
                              <br />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {currentSchedule.dailyDates?.[day]
                                  ? new Date(
                                      currentSchedule.dailyDates[day]
                                    ).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "short",
                                    })
                                  : "—"}
                              </span>
                            </td>
                            <td className="border px-3 py-2">
                              {currentSchedule.scheduleData?.[day]?.length ? (
                                <div>
                                  {currentSchedule.scheduleData[day].map(
                                    (slot, slotIndex) => {
                                      const [start, end] = slot.split("-");
                                      return (
                                        <div
                                          key={slotIndex}
                                          className="mb-1 last:mb-0"
                                        >
                                          <span className="text-sm">
                                            {start} – {end}
                                          </span>
                                          <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-2">
                                            (
                                            {formatDuration(
                                              calculateDuration(start, end)
                                            )}
                                            )
                                          </span>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 italic">
                                  Repos
                                </span>
                              )}
                            </td>
                            <td className="border px-3 py-2">
                              {currentSchedule.dailyNotes?.[day] ? (
                                <p className="text-sm">
                                  {currentSchedule.dailyNotes[day]}
                                </p>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 italic">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {currentSchedule.notes && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Notes générales</h3>
                    <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      {currentSchedule.notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                    <Trash
                      size={24}
                      className="text-red-600 dark:text-red-400"
                    />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-center mb-2">
                  Confirmer la suppression
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                  Êtes-vous sûr de vouloir supprimer ce planning ? Cette action
                  est irréversible.
                </p>

                <div className="flex gap-4 justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeletingScheduleId(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteSchedule}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default WeeklySchedulePage;
