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
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileDown,
  Pencil,
  Plus,
  Sparkles,
  Trash,
  Trash2,
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
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useEmployeesByTeam from "../hooks/useEmployeesByTeam"; // Importer le hook pour les employés par équipe
import api from "../services/api"; // Importer l'instance API configurée

// Composants de layout
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";
import SEO from "../components/layout/SEO";

// Composants UI
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
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
  teamName?: string;
  teamId?: string;
  managerName?: string; // Added managerName property
}

// Interface pour une équipe
interface Team {
  _id: string;
  name: string;
  managerIds: { _id: string; firstName: string; lastName: string }[];
  employeeIds: { _id: string; firstName: string; lastName: string }[];
  companyId: string;
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

// Importer le service de génération de PDF et le modal
import ComingSoonAIModal from "../components/modals/ComingSoonAIModal";
import GeneratePdfModal from "../components/modals/GeneratePdfModal";
import GenerateIAScheduleModal from "../components/planning/GenerateIAScheduleModal";
import AIGenerationGuide from "../components/ui/AIGenerationGuide";
import { useAIGuide } from "../hooks/useAIGuide";
import {
  generateSchedulePDF,
  generateTeamSchedulePDF,
} from "../services/pdfGenerator";

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
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // État pour la sélection de semaine et date
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState<number>(getISOWeek(new Date()));
  // État pour stocker la date sélectionnée dans le DatePicker
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [viewMode, setViewMode] = useState<"team" | "employee">("team");

  // États pour les données et le chargement
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
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

  // Utiliser le hook useEmployeesByTeam pour récupérer les employés de l'équipe sélectionnée
  const {
    employees: teamEmployees,
    loading: loadingTeamEmployees,
    error: errorTeamEmployees,
  } = useEmployeesByTeam(selectedTeam);

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
        if (!slot || !slot.start || !slot.end) {
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

  // États pour le modal de création de planning
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // État pour la modal de génération de PDF
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);
  const [generationType, setGenerationType] = useState<
    "employee" | "team" | "all"
  >("all");

  // État pour le modal IA Coming Soon
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  // État pour la modale de génération IA
  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] =
    useState<boolean>(false);

  // Hook pour gérer l'affichage du guide IA
  const aiGuide = useAIGuide(1500); // Délai de 1.5 secondes

  // Vérification automatique de l'état d'authentification
  useEffect(() => {
    if (!user || !user._id) {
      console.warn("Utilisateur non authentifié ou ID utilisateur manquant", {
        isAuthenticated,
        user,
      });
    } else {
      console.log("État d'authentification OK", {
        userId: user._id,
        role: user.role,
      });
    }
  }, [user, isAuthenticated]);

  // Gestion des paramètres URL pour l'édition depuis la page admin
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editScheduleId = searchParams.get("edit");
    const urlYear = searchParams.get("year");
    const urlWeek = searchParams.get("week");
    const urlTeamId = searchParams.get("teamId");
    const urlEmployeeId = searchParams.get("employeeId");

    if (editScheduleId && urlYear && urlWeek) {
      // Mode édition : récupérer un planning existant
      const parsedYear = parseInt(urlYear);
      const parsedWeek = parseInt(urlWeek);

      if (parsedYear && parsedWeek) {
        setYear(parsedYear);
        setWeekNumber(parsedWeek);

        // Mettre à jour la date sélectionnée
        const startDate = new Date(parsedYear, 0, (parsedWeek - 1) * 7 + 1);
        setSelectedDate(startDate);

        // Récupérer et éditer le planning
        fetchScheduleForEdit(editScheduleId);
      }
    } else if (urlYear && urlWeek) {
      // Mode création : pré-remplir avec l'année et semaine
      const parsedYear = parseInt(urlYear);
      const parsedWeek = parseInt(urlWeek);

      if (parsedYear && parsedWeek) {
        setYear(parsedYear);
        setWeekNumber(parsedWeek);

        // Mettre à jour la date sélectionnée
        const startDate = new Date(parsedYear, 0, (parsedWeek - 1) * 7 + 1);
        setSelectedDate(startDate);
      }
    }

    // Gérer les paramètres d'équipe et d'employé pour la création
    if (urlTeamId) {
      setSelectedTeam(urlTeamId);
      setViewMode("team");
    }
    if (urlEmployeeId) {
      setSelectedEmployeeId(urlEmployeeId);
      if (!urlTeamId) {
        setViewMode("employee");
      }
    }
  }, [location.search]);

  // Fonction pour récupérer un planning spécifique à éditer
  const fetchScheduleForEdit = async (scheduleId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/weekly-schedules/${scheduleId}`);

      if (response.data.success && response.data.data) {
        const schedule = response.data.data;

        console.log("Planning récupéré pour édition:", schedule);

        // Mettre en mode édition AVANT d'appeler handleEditSchedule
        setIsEditMode(true);
        setExistingScheduleId(schedule._id);

        // Mettre en mode édition et ouvrir le modal
        handleEditSchedule(schedule);

        // Afficher un message de confirmation
        setSuccess(
          `Mode édition activé pour le planning de ${schedule.employeeName}`
        );
        setShowSuccessToast(true);
      } else {
        setError("Planning introuvable");
        setShowErrorToast(true);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du planning:", error);
      setError("Erreur lors de la récupération du planning");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

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
      // Si en mode équipe et aucune équipe sélectionnée, afficher la liste des équipes
      if (viewMode === "team" && !selectedTeam) {
        const teamsResponse = await api.get("/teams");

        if (teamsResponse.data.success) {
          // Mettre à jour l'état des équipes
          setTeams(teamsResponse.data.data || []);
          // Vider la liste des plannings car nous affichons les équipes à la place
          setSchedules([]);
        } else {
          setError("Erreur lors de la récupération des équipes");
          setShowErrorToast(true);
        }
      } else {
        // Si une équipe est sélectionnée ou si nous sommes en mode employé, récupérer les plannings
        let url = `/weekly-schedules/week/${year}/${weekNumber}`;

        // Ajouter les filtres selon le mode de vue
        if (viewMode === "team" && selectedTeam) {
          url += `?teamId=${selectedTeam}`;
        } else if (viewMode === "employee" && selectedEmployeeId) {
          url += `?employeeId=${selectedEmployeeId}`;
        }

        const response = await api.get<{
          success: boolean;
          data: Schedule[];
          count: number;
        }>(url);

        setSchedules(response.data.data);

        // Défilement vers le tableau des résultats s'il y a des données
        if (response.data.data.length > 0 && tableRef.current) {
          setTimeout(() => {
            tableRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      setError(
        "Erreur lors de la récupération des données. Veuillez réessayer."
      );
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, [year, weekNumber, viewMode, selectedTeam, selectedEmployeeId]);

  /**
   * Fonction pour récupérer la liste des employés
   */
  const fetchEmployees = useCallback(async () => {
    try {
      // Si une équipe est sélectionnée et que nous sommes en mode équipe,
      // les employés sont déjà chargés par useEmployeesByTeam
      if (viewMode === "team" && selectedTeam) {
        return;
      }

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
  }, [viewMode, selectedTeam]);

  /**
   * Fonction pour récupérer les équipes dont l'utilisateur connecté est manager
   */
  const fetchTeams = useCallback(async () => {
    try {
      const response = await api.get("/teams");

      if (response.data.success) {
        setTeams(response.data.data || []);
      } else {
        setError(
          "Erreur lors de la récupération des équipes: format de réponse invalide"
        );
        setShowErrorToast(true);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des équipes:", error);
      setError(
        "Impossible de récupérer les équipes. Veuillez réessayer ultérieurement."
      );
      setShowErrorToast(true);
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
    // Si on a déjà un planning en cours d'édition, ne pas interférer
    if (existingScheduleId && isEditMode) {
      return;
    }

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
      // Seulement réinitialiser si on n'est pas déjà en mode édition
      if (!isEditMode) {
        setExistingScheduleId(null);
        setIsEditMode(false);
        resetForm();
      }
    }
  }, [
    selectedEmployeeId,
    schedules,
    weekNumber,
    year,
    existingScheduleId,
    isEditMode,
  ]);

  /**
   * Réinitialise le formulaire avec des valeurs par défaut
   */
  const resetForm = () => {
    setScheduleData(DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {}));
    setDailyNotes(DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {}));
    setNotes("");
    // Réinitialiser les états d'édition
    setIsEditMode(false);
    setExistingScheduleId(null);
  };

  /**
   * Mise à jour des données de formulaire quand l'employé est sélectionné
   */
  useEffect(() => {
    checkExistingSchedule();
  }, [selectedEmployeeId, checkExistingSchedule]);

  /**
   * Prépare le payload pour la création ou mise à jour d'un planning hebdomadaire
   * Convertit les données du formulaire au format attendu par l'API
   */
  const preparePayload = (): Record<string, any> => {
    // Vérification de l'utilisateur et de son ID
    if (!user) {
      throw new Error(
        "Session utilisateur invalide. Veuillez vous reconnecter."
      );
    }

    if (!user._id) {
      throw new Error(
        "Information utilisateur incomplète. Veuillez vous reconnecter."
      );
    }

    // Validation des données essentielles
    if (!selectedEmployeeId) {
      throw new Error("Veuillez sélectionner un employé.");
    }

    // Vérifier qu'au moins un créneau horaire est défini
    const hasTimeSlots = Object.values(scheduleData).some(
      (slots) => slots && slots.length > 0
    );
    if (!hasTimeSlots) {
      throw new Error("Veuillez définir au moins un créneau horaire.");
    }

    // Convertir les créneaux horaires au format attendu par l'API
    const scheduleObj: Record<string, string[]> = {};
    DAY_KEYS.forEach((day) => {
      scheduleObj[day] =
        scheduleData[day]?.map((slot) => `${slot.start}-${slot.end}`) || [];
    });

    // Préparer les notes quotidiennes
    const notesObj: Record<string, string> = {};
    DAY_KEYS.forEach((day) => {
      notesObj[day] = dailyNotes[day]?.trim() || "";
    });

    // Préparer les dates des jours avec planification
    const datesObj: Record<string, string> = {};
    Object.entries(weekDates).forEach(([day, date]) => {
      if (scheduleData[day]?.length > 0) {
        datesObj[day] = date.toISOString();
      }
    });

    // Construction du payload simplifié, adapté au format attendu par le backend
    const payload = {
      employeeId: selectedEmployeeId,
      updatedBy: user._id, // Important: ID utilisateur qui fait la modification
      userId: user._id, // Alternative: essayer une autre clé
      userId_: user._id, // Autre alternative
      user_id: user._id, // Autre alternative
      year: year,
      weekNumber: weekNumber,
      status: "approved",
      notes: notes?.trim() || "",
      scheduleData: scheduleObj, // S'assurer que c'est bien un objet
      dailyNotes: notesObj,
      dailyDates: datesObj,
      totalWeeklyMinutes: totalWeeklyMinutes,
    };

    // Log pour le débogage
    console.log(
      "Payload préparé pour l'envoi:",
      JSON.stringify(payload, null, 2)
    );

    return payload;
  };

  /**
   * Envoie le planning au serveur avec l'API Fetch
   * Gère l'authentification et les erreurs HTTP
   */
  const sendScheduleWithFetch = async (
    payload: Record<string, any>
  ): Promise<boolean> => {
    // Vérifier que l'utilisateur est connecté
    if (!user) {
      throw new Error(
        "Session utilisateur invalide. Veuillez vous reconnecter."
      );
    }

    // Vérifier que l'ID utilisateur est disponible
    if (!user._id) {
      throw new Error(
        "Information utilisateur incomplète. Veuillez vous reconnecter."
      );
    }

    // Vérification supplémentaire sur la structure du payload
    if (!payload.scheduleData || typeof payload.scheduleData !== "object") {
      throw new Error("Format de données de planning invalide");
    }

    // Vérifier que updatedBy est bien défini et contient une valeur
    if (!payload.updatedBy) {
      console.error("updatedBy manquant dans le payload:", payload);
      throw new Error(
        "Erreur de validation: ID utilisateur manquant (updatedBy)"
      );
    }

    try {
      // Log pour vérifier l'URL et la méthode
      console.log("Envoi de la requête:", {
        method: isEditMode && existingScheduleId ? "PUT" : "POST",
        url:
          isEditMode && existingScheduleId
            ? `/weekly-schedules/${existingScheduleId}`
            : "/weekly-schedules",
      });

      // Définir les en-têtes manuellement pour s'assurer que tout est correct
      const headers = {
        "Content-Type": "application/json",
        // Les cookies httpOnly sont automatiquement envoyés
      };

      console.log("En-têtes utilisés:", headers);

      // Essayer avec une approche plus directe pour s'assurer que les données sont envoyées correctement
      const url = `${
        import.meta.env.VITE_API_URL || "https://smartplanning.onrender.com/api"
      }/weekly-schedules`;

      // Transformer le payload en chaîne JSON
      const jsonPayload = JSON.stringify(payload);
      console.log("Payload JSON:", jsonPayload);

      // Utiliser fetch pour plus de contrôle sur la requête
      const response = await fetch(
        isEditMode && existingScheduleId ? `${url}/${existingScheduleId}` : url,
        {
          method: isEditMode && existingScheduleId ? "PUT" : "POST",
          headers: headers,
          body: jsonPayload,
        }
      );

      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur serveur:", errorData);
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }

      // Traiter la réponse réussie
      const data = await response.json();
      console.log("Réponse reçue avec succès:", data);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi du planning:", error);

      // Gérer les différents types d'erreurs
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Une erreur inconnue est survenue");
      }
    }
  };

  /**
   * Fonction pour ouvrir le modal de création
   */
  const openCreateModal = () => {
    resetForm();
    setSelectedEmployeeId("");
    setIsEditMode(false);
    setExistingScheduleId(null);
    setIsCreateModalOpen(true);
  };

  /**
   * Fonction pour fermer le modal de création
   */
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    // Réinitialiser les états d'édition lors de la fermeture
    setIsEditMode(false);
    setExistingScheduleId(null);
    resetForm();
  };

  /**
   * Gère la soumission du formulaire de planning
   * Coordonne la préparation des données et l'envoi au serveur
   */
  const handleSaveSchedule = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Activer l'indicateur de chargement et réinitialiser les erreurs
    setCreatingSchedule(true);
    setError(null);

    try {
      // Vérification préliminaire de l'authentification
      if (!user || !user._id) {
        setError("Veuillez vous reconnecter avant de soumettre le planning");
        setShowErrorToast(true);
        return;
      }

      // Préparer le payload et envoyer les données
      const payload = preparePayload();
      await sendScheduleWithFetch(payload);

      // Gérer le succès
      setSuccess(
        `Planning hebdomadaire ${
          isEditMode ? "mis à jour" : "créé"
        } avec succès pour la semaine ${weekNumber} de ${year}.`
      );
      setShowSuccessToast(true);

      // Réinitialisation et rechargement
      if (!isEditMode) {
        // Seulement pour les nouvelles créations
        resetForm();
        setSelectedEmployeeId("");
      }
      // Fermer le modal dans tous les cas après une sauvegarde réussie
      closeCreateModal();
      fetchSchedules();
    } catch (error: unknown) {
      console.error("Erreur lors de la sauvegarde du planning:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'envoi des données"
      );
      setShowErrorToast(true);
    } finally {
      setCreatingSchedule(false);
    }
  };

  /**
   * Gestion standardisée des erreurs API
   */
  const handleApiError = (error: unknown, operation: string) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409) {
        setError(`Un planning existe déjà pour cet employé sur cette semaine`);
      } else if (error.response?.data?.message) {
        // Utiliser le message d'erreur du backend si disponible
        setError(`Erreur lors de ${operation}: ${error.response.data.message}`);
      } else {
        // Message générique basé sur le statut HTTP
        setError(
          `Erreur lors de ${operation} (${error.response?.status || "inconnu"})`
        );
      }
    } else {
      // Pour les erreurs non-Axios
      setError(`Erreur inattendue lors de ${operation}`);
      console.error("Erreur non-Axios:", error);
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
   * Ouvre la modal de génération de PDF ou génère directement le PDF
   */
  const openPdfModal = async (employeeId?: string, teamId?: string) => {
    if (employeeId) {
      // Génération automatique du PDF pour un employé spécifique
      await handleGeneratePdf("employee", undefined, employeeId);
    } else if (teamId) {
      // Génération automatique du PDF pour une équipe spécifique
      await handleGeneratePdf("team", teamId, undefined);
    } else {
      // Si aucun ID n'est fourni, c'est une génération globale - ouvrir la modal
      setGenerationType("all");

      // Log de débogage pour vérifier les valeurs à transmettre
      console.log("Ouverture du modal PDF avec les paramètres:", {
        year,
        weekNumber,
        selectedEmployeeId,
        selectedTeam,
      });

      setIsPdfModalOpen(true);
    }
  };

  /**
   * Colonnes pour le composant Table
   */
  const tableColumns = useMemo(() => {
    if (viewMode === "team" && !selectedTeam) {
      // Colonnes pour l'affichage des équipes
      return [
        { key: "name", label: "Équipe", className: "w-60" },
        { key: "employeesCount", label: "Employés", className: "w-24" },
        { key: "actions", label: "Actions", className: "w-48" },
      ];
    } else {
      // Colonnes pour l'affichage des plannings
      return [
        { key: "employee", label: "Employé", className: "w-40" },
        { key: "totalTime", label: "Total", className: "w-24" },
        { key: "actions", label: "Actions", className: "w-48" },
      ];
    }
  }, [viewMode, selectedTeam]);

  /**
   * Formatage des données pour le composant Table
   */
  const tableData = useMemo(() => {
    if (viewMode === "team" && !selectedTeam) {
      // Mode équipe sans équipe sélectionnée : afficher la liste des équipes
      return teams.map((team) => {
        const teamSchedules = schedules.filter((s) => s.teamName === team.name);
        const employeesCount = teamSchedules.length;

        return {
          name: (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
              <span className="font-medium text-gray-900 dark:text-white">
                {team.name}
              </span>
            </div>
          ),
          employeesCount: (
            <span className="text-gray-600 dark:text-gray-300">
              {employeesCount} employé{employeesCount > 1 ? "s" : ""}
            </span>
          ),
          actions: (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTeam(team._id)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </Button>
              {/* Seuls les non-employés peuvent générer des PDFs d'équipe */}
              {user?.role !== "employee" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPdfModal(undefined, team._id)}
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <FileDown className="h-4 w-4" />
                  <span className="sr-only">Générer PDF équipe</span>
                </Button>
              )}
            </div>
          ),
        };
      });
    } else {
      // Si une équipe est sélectionnée ou si nous sommes en mode employé, afficher les plannings
      const filteredSchedules =
        user?.role === "employee"
          ? schedules.filter((schedule) => {
              // Pour les employés, filtrer pour ne montrer que leurs propres plannings
              return (
                schedule.employeeId === user._id ||
                schedule.employeeName === `${user.firstName} ${user.lastName}`
              );
            })
          : schedules;

      return filteredSchedules.map((schedule) => {
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

        // Conversion en heures (arrondi à 2 décimales)
        const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

        return {
          employee: schedule.employeeName,
          totalTime: `${totalHours}h`,
          actions: (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewSchedule(schedule)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 h-8 w-8 p-0 rounded-full flex items-center justify-center"
                title="Voir les détails"
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Voir détails</span>
              </Button>

              {/* Seuls les non-employés peuvent modifier les plannings */}
              {user?.role !== "employee" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditSchedule(schedule)}
                  className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 h-8 w-8 p-0 rounded-full flex items-center justify-center"
                  title="Modifier ce planning"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Modifier</span>
                </Button>
              )}

              {/* Seuls les non-employés peuvent supprimer les plannings */}
              {user?.role !== "employee" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSchedule(schedule._id)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-8 w-8 p-0 rounded-full flex items-center justify-center"
                  title="Supprimer ce planning"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Supprimer</span>
                </Button>
              )}

              {/* Tous les utilisateurs authentifiés peuvent générer le PDF de leurs plannings */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => openPdfModal(schedule.employeeId)}
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 h-8 w-8 p-0 rounded-full flex items-center justify-center"
                title="Générer le PDF de ce planning"
              >
                <FileDown className="h-4 w-4" />
                <span className="sr-only">Télécharger PDF</span>
              </Button>
            </div>
          ),
        };
      });
    }
  }, [viewMode, selectedTeam, teams, schedules, user]);

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
  const handleDeleteSchedule = (scheduleId: string) => {
    setDeletingScheduleId(scheduleId);
    setIsDeleteModalOpen(true);
  };

  /**
   * Ouvre la modal de confirmation de suppression
   */
  const confirmDeleteSchedule = async (scheduleId: string) => {
    try {
      // Avec les cookies httpOnly, pas besoin de vérifier manuellement le token
      // L'API renverra 401 automatiquement si la session a expiré

      await api.delete(`/weekly-schedules/${scheduleId}`);

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

  const changeViewMode = (mode: "team" | "employee") => {
    setViewMode(mode);
    setSelectedTeam("");
    setSelectedEmployeeId("");

    // Recharger les employés appropriés lors du changement de mode
    if (mode === "employee") {
      fetchEmployees();
    }
  };

  // Mettre à jour les employés lorsque les employés d'équipe sont chargés
  useEffect(() => {
    if (viewMode === "team" && selectedTeam && teamEmployees.length > 0) {
      // Formater les employés de l'équipe pour le sélecteur
      const formattedTeamEmployees = teamEmployees.map((emp) => ({
        _id: emp._id,
        fullName: `${emp.firstName} ${emp.lastName}`,
      }));
      setEmployees(formattedTeamEmployees);
    }
  }, [viewMode, selectedTeam, teamEmployees]);

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
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="sr-only">Mois précédent</span>
          </button>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {MONTH_NAMES[calendarMonth.getMonth()]}{" "}
            {calendarMonth.getFullYear()}
          </h3>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition-colors"
          >
            <ChevronRight size={20} />
            <span className="sr-only">Mois suivant</span>
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
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-700"
          >
            Sem. préc.
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={goToCurrentWeek}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-700"
          >
            Aujourd'hui
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={goToNextWeek}
            icon={<ChevronRight size={16} />}
            className="flex flex-row-reverse items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-700"
          >
            Sem. suiv.
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Rendu du sélecteur de vue (équipe/employé)
   */
  const renderViewSelector = () => {
    // Pour les employés, afficher seulement un message informatif
    if (user?.role === "employee") {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Mes plannings
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Vous consultez vos plannings personnels. Vous pouvez les visualiser
            et générer des PDFs.
          </p>
        </div>
      );
    }

    // Pour les autres rôles, afficher le sélecteur complet
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Vue des plannings
        </h3>
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2 mb-3">
            <Button
              size="sm"
              variant={viewMode === "team" ? "primary" : "secondary"}
              onClick={() => changeViewMode("team")}
              icon={<Users size={16} />}
              className={
                viewMode === "team"
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-700"
                  : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600"
              }
            >
              Par équipe
            </Button>
            <Button
              size="sm"
              variant={viewMode === "employee" ? "primary" : "secondary"}
              onClick={() => changeViewMode("employee")}
              icon={<User size={16} />}
              className={
                viewMode === "employee"
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-700"
                  : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600"
              }
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

          {viewMode === "employee" && (
            <div className="mt-2">
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                <option value="">Tous les employés</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleViewSchedule = (schedule: Schedule) => {
    fetchScheduleDetails(schedule._id);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    // Sélectionner l'employé
    setSelectedEmployeeId(schedule.employeeId);

    // Activer le mode édition
    setIsEditMode(true);
    setExistingScheduleId(schedule._id);

    // Convertir le format des créneaux horaires de l'API vers le format de l'UI
    const formattedScheduleData: Record<string, TimeSlot[]> = DAY_KEYS.reduce(
      (acc, day) => ({ ...acc, [day]: [] }),
      {}
    );

    // Remplir avec les données existantes
    Object.entries(schedule.scheduleData || {}).forEach(([day, slots]) => {
      if (Array.isArray(slots)) {
        formattedScheduleData[day] = slots.map((slot) => {
          const [start, end] = slot.split("-");
          return { start, end };
        });
      }
    });

    // Charger les données du planning dans le formulaire
    setScheduleData(formattedScheduleData);
    setDailyNotes(
      schedule.dailyNotes ||
        DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {})
    );
    setNotes(schedule.notes || "");

    // Ouvrir le modal
    setIsCreateModalOpen(true);
  };

  // Mettre à jour les schedules lorsque l'équipe ou l'employé sélectionné change
  useEffect(() => {
    if (selectedTeam) {
      fetchSchedules();
    }
  }, [selectedTeam, fetchSchedules]);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchSchedules();
    }
  }, [selectedEmployeeId, fetchSchedules]);

  // Pour la sélection d'employé pour le formulaire
  useEffect(() => {
    checkExistingSchedule();
  }, [selectedEmployeeId, checkExistingSchedule]);

  /**
   * Gère la génération de PDF en fonction du type et des paramètres
   */
  const handleGeneratePdf = async (
    type: "employee" | "team" | "all",
    teamId?: string,
    employeeId?: string
  ) => {
    try {
      setPdfGenerating(true);

      if (type === "employee" && employeeId) {
        // Chercher le planning de cet employé
        const employeeSchedule = schedules.find(
          (s) => s.employeeId === employeeId
        );
        if (employeeSchedule) {
          try {
            // L'API retourne maintenant directement les informations d'équipe et de manager
            // Plus besoin d'enrichissement complexe
            generateSchedulePDF(employeeSchedule);
            setSuccess("Le PDF a été généré avec succès pour cet employé");
            setShowSuccessToast(true);
          } catch (error) {
            handleApiError(error, "génération du PDF");
          }
        } else {
          setError("Aucun planning trouvé pour cet employé");
          setShowErrorToast(true);
        }
      } else if (type === "team" && teamId) {
        // Récupérer les plannings des employés de cette équipe
        try {
          setLoading(true);
          const response = await api.get<{
            success: boolean;
            data: Schedule[];
          }>(`/weekly-schedules/week/${year}/${weekNumber}?teamId=${teamId}`);

          if (response.data.data && response.data.data.length > 0) {
            // Trouver le nom de l'équipe
            const team = teams.find((t) => t._id === teamId);
            generateTeamSchedulePDF(
              response.data.data,
              team?.name || "Équipe",
              "Smart Planning",
              false
            );
            setSuccess("Le PDF a été généré avec succès pour cette équipe");
            setShowSuccessToast(true);
          } else {
            setError("Aucun planning trouvé pour cette équipe");
            setShowErrorToast(true);
          }
        } catch (error) {
          handleApiError(error, "génération du PDF d'équipe");
        } finally {
          setLoading(false);
        }
      } else if (type === "all") {
        // Utiliser tous les plannings actuellement chargés
        if (schedules.length > 0) {
          try {
            setLoading(true);

            // Plus besoin d'enrichissement complexe car l'API retourne maintenant
            // les informations d'équipe et de manager directement
            console.log("Plannings à exporter:", schedules);

            // Trier les plannings par équipe puis par nom d'employé
            const sortedSchedules = schedules.sort((a, b) => {
              // D'abord par équipe
              const teamA = a.teamName || "ZZZ"; // "ZZZ" pour que "Non assigné" apparaisse à la fin
              const teamB = b.teamName || "ZZZ";
              const teamComparison = teamA.localeCompare(teamB);

              // Puis par nom d'employé si même équipe
              if (teamComparison === 0) {
                return a.employeeName.localeCompare(b.employeeName);
              }

              return teamComparison;
            });

            // Vérifier si des données d'équipe sont présentes
            const hasTeamData = sortedSchedules.some(
              (s) => s.teamName && s.teamName !== "Non assigné"
            );

            // Générer le PDF avec les plannings triés par équipe
            generateTeamSchedulePDF(
              sortedSchedules,
              "Tous les employés",
              "Smart Planning",
              hasTeamData
            );

            setSuccess(
              "Le PDF a été généré avec succès pour tous les plannings"
            );
            setShowSuccessToast(true);
          } catch (error) {
            console.error("Erreur lors de la génération du PDF global:", error);
            setError("Une erreur est survenue lors de la génération du PDF");
            setShowErrorToast(true);
          } finally {
            setLoading(false);
          }
        } else {
          setError("Aucun planning trouvé pour cette semaine");
          setShowErrorToast(true);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      setError("Une erreur est survenue lors de la génération du PDF");
      setShowErrorToast(true);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Pour générer des PDFs

  // Modifier le SectionCard pour adapter le titre selon le contexte
  const renderTableHeader = useMemo(() => {
    if (viewMode === "team" && !selectedTeam) {
      return `Liste des équipes disponibles`;
    } else {
      return `Plannings validés - Semaine ${weekNumber}, ${year}`;
    }
  }, [viewMode, selectedTeam, weekNumber, year]);

  return (
    <LayoutWithSidebar
      activeItem="plannings-hebdomadaires"
      pageTitle="Plannings Hebdomadaires"
    >
      <SEO
        title="Plannings Hebdomadaires"
        description="Gestion des plannings hebdomadaires pour les employés"
      />
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

        {/* Boutons d'action */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Bouton Nouveau Planning - Seulement pour les non-employés */}
          {user?.role !== "employee" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                variant="primary"
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-indigo-500 dark:to-purple-600 text-white font-semibold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                icon={<Plus size={18} />}
              >
                Nouveau Planning
              </Button>
            </motion.div>
          )}

          {/* Bouton PDF Global - Seulement pour les non-employés */}
          {user?.role !== "employee" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Button
                onClick={() => openPdfModal()} // Utiliser openPdfModal sans arguments pour la génération globale
                variant="secondary"
                className="w-full md:w-auto px-6 py-3 bg-slate-500 hover:bg-slate-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-lg transition-all duration-300"
                icon={<FileDown size={18} />}
                title="Générer le PDF de tous les plannings affichés"
              >
                Générer PDF global
              </Button>
            </motion.div>
          )}

          {/* Bouton Plannings IA - Seulement pour manager, directeur, admin */}
          {(user?.role === "manager" ||
            user?.role === "directeur" ||
            user?.role === "admin") && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button
                onClick={() => setIsAIGenerateModalOpen(true)}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 px-5 py-3 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
                Générer Planning IA
              </Button>
            </motion.div>
          )}
        </div>

        {/* Récapitulatif de la semaine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <SectionCard className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-800 dark:to-indigo-950 rounded-2xl border-none shadow-md">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <Calendar className="w-10 h-10 text-slate-600 dark:text-indigo-400" />
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
                  Plannings créés
                </span>
                <span className="text-xl font-bold text-slate-600 dark:text-indigo-400">
                  {schedules.length}
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
              title={renderTableHeader}
              className="rounded-2xl shadow-md h-full"
            >
              {loading ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              ) : viewMode === "team" && !selectedTeam ? (
                <div className="overflow-x-auto">
                  <Table
                    columns={tableColumns}
                    data={tableData}
                    emptyState={{
                      title: "Aucune équipe",
                      description: "Aucune équipe n'a été trouvée",
                      icon: (
                        <Users
                          size={40}
                          className="text-gray-400 dark:text-gray-600"
                        />
                      ),
                    }}
                    className="w-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  />
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
                    className="w-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)] dark:text-gray-400">
                  {viewMode === "team" && selectedTeam
                    ? "Aucun planning validé trouvé pour cette équipe et cette semaine."
                    : "Aucun planning validé trouvé pour cette semaine."}
                </div>
              )}
            </SectionCard>
          </motion.div>
        </div>

        {/* Modal de création/modification de planning */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          title={
            isEditMode ? "Modifier le planning" : "Créer un nouveau planning"
          }
          className="w-full max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[95%] xl:max-w-[98%] 2xl:max-w-[1800px] max-h-[90vh] bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 border border-gray-200 dark:border-indigo-500/20 backdrop-blur-xl shadow-xl"
        >
          <div className="px-8 py-6">
            <div className="mb-8 p-5 bg-slate-50 dark:bg-indigo-900/30 rounded-xl border border-slate-200 dark:border-indigo-500/30 shadow-sm dark:shadow-lg dark:shadow-indigo-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar
                    className="text-slate-600 dark:text-indigo-400"
                    size={24}
                  />
                  <span className="font-medium text-slate-700 dark:text-indigo-300 text-xl bg-gradient-to-r from-slate-600 to-gray-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Planification pour: Semaine {weekNumber}, {year} (
                    {getWeekDateRange(year, weekNumber)})
                  </span>
                </div>

                {/* Affichage du total d'heures en temps réel */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                  <Clock
                    className="text-emerald-600 dark:text-emerald-400"
                    size={20}
                  />
                  <div className="text-right">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Total semaine
                    </div>
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {Math.round((totalWeeklyMinutes / 60) * 100) / 100}h
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-6">
              <div className="mb-6">
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
                  className="[&_select]:bg-white [&_select]:dark:bg-gray-800 [&_select]:text-gray-900 [&_select]:dark:text-gray-200 [&_select]:border-gray-300 [&_select]:dark:border-gray-600"
                />
              </div>

              {/* Grille d'horaires intégrée */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-5 pb-2 border-b border-gray-300 dark:border-gray-700/50 bg-gradient-to-r from-slate-600 to-gray-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Horaires de la semaine
                </h3>

                {/* Mobile et tablette : grille classique */}
                <div className="block xl:hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          className="p-4 border border-gray-300 dark:border-indigo-500/30 rounded-xl bg-slate-50 dark:bg-gray-800/50 transition-all hover:shadow-md hover:shadow-gray-300 dark:hover:shadow-indigo-500/20 backdrop-blur-sm"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                              <span className="font-semibold text-lg text-gray-900 dark:text-white">
                                {DAYS_OF_WEEK[dayIndex]}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                {formattedDate}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-green-600 dark:text-emerald-400">
                                {formatDuration(dayTotalMinutes)}
                              </span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleAddTimeSlot(day)}
                                icon={<Plus size={14} />}
                                className="bg-slate-500 hover:bg-slate-600 dark:!bg-indigo-900/50 dark:hover:!bg-indigo-800/60 text-white dark:!text-indigo-300 border-slate-500 dark:!border-indigo-500/30 hover:border-slate-600 dark:hover:!border-indigo-400/50"
                              >
                                Ajouter
                              </Button>
                            </div>
                          </div>

                          {/* Liste des créneaux horaires pour ce jour */}
                          <div className="space-y-2">
                            {!scheduleData[day] ||
                            scheduleData[day].length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                Aucun créneau horaire défini
                              </p>
                            ) : (
                              scheduleData[day].map((slot, slotIndex) => (
                                <div
                                  key={slotIndex}
                                  className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-indigo-500/20 shadow-sm"
                                >
                                  <div className="flex flex-col md:flex-row w-full gap-2">
                                    <div className="flex flex-row items-center gap-2 flex-1">
                                      <label className="text-xs text-gray-600 dark:text-gray-300 w-10">
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
                                        className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-indigo-500/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 text-sm font-medium focus:ring-2 focus:ring-slate-500 dark:focus:ring-indigo-500 focus:border-transparent"
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

                                    <div className="flex flex-row items-center gap-2 flex-1">
                                      <label className="text-xs text-gray-600 dark:text-gray-300 w-10">
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
                                        className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-indigo-500/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 text-sm font-medium focus:ring-2 focus:ring-slate-500 dark:focus:ring-indigo-500 focus:border-transparent"
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

                                    <div className="flex items-center">
                                      <span className="text-xs font-medium text-green-600 dark:text-emerald-400 mr-2">
                                        {Math.round(
                                          (calculateDuration(
                                            slot.start,
                                            slot.end
                                          ) /
                                            60) *
                                            100
                                        ) / 100}
                                        h
                                      </span>

                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border-red-200 dark:border-red-500/30 p-2 rounded-full"
                                        onClick={() =>
                                          handleRemoveTimeSlot(day, slotIndex)
                                        }
                                        icon={<Trash size={16} />}
                                      >
                                        <span className="sr-only">
                                          Supprimer
                                        </span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Notes pour ce jour */}
                          <div className="mt-2">
                            <label className="text-xs text-gray-600 dark:text-gray-300">
                              Notes pour {DAYS_OF_WEEK[dayIndex]} (optionnel)
                            </label>
                            <textarea
                              value={dailyNotes[day] || ""}
                              onChange={(e) =>
                                handleDailyNoteChange(day, e.target.value)
                              }
                              className="w-full mt-1 px-3 py-2 rounded border border-gray-300 dark:border-indigo-500/30 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 text-sm focus:ring-2 focus:ring-slate-500 dark:focus:ring-indigo-500/50 focus:border-transparent resize-none h-20"
                              placeholder={`Notes pour ${DAYS_OF_WEEK[dayIndex]}...`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop XL+ : deux lignes */}
                <div className="hidden xl:block">
                  {/* Première ligne : Lundi, Mardi, Mercredi */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {DAY_KEYS.slice(0, 3).map((day, dayIndex) => {
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
                          className="p-4 border border-gray-300 dark:border-indigo-500/30 rounded-xl bg-slate-50 dark:bg-gray-800/50 transition-all hover:shadow-md hover:shadow-gray-300 dark:hover:shadow-indigo-500/20 backdrop-blur-sm"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                              <span className="font-semibold text-lg text-gray-900 dark:text-white">
                                {DAYS_OF_WEEK[dayIndex]}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                {formattedDate}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-green-600 dark:text-emerald-400">
                                {formatDuration(dayTotalMinutes)}
                              </span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleAddTimeSlot(day)}
                                icon={<Plus size={14} />}
                                className="bg-slate-500 hover:bg-slate-600 dark:!bg-indigo-900/50 dark:hover:!bg-indigo-800/60 text-white dark:!text-indigo-300 border-slate-500 dark:!border-indigo-500/30 hover:border-slate-600 dark:hover:!border-indigo-400/50"
                              >
                                Ajouter
                              </Button>
                            </div>
                          </div>

                          {/* Liste des créneaux horaires pour ce jour */}
                          <div className="space-y-2">
                            {!scheduleData[day] ||
                            scheduleData[day].length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                Aucun créneau horaire défini
                              </p>
                            ) : (
                              scheduleData[day].map((slot, slotIndex) => (
                                <div
                                  key={slotIndex}
                                  className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-indigo-500/20 shadow-sm"
                                >
                                  <div className="flex flex-col md:flex-row w-full gap-2">
                                    <div className="flex flex-row items-center gap-2 flex-1">
                                      <label className="text-xs text-gray-600 dark:text-gray-300 w-10">
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
                                        className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-indigo-500/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 text-sm font-medium focus:ring-2 focus:ring-slate-500 dark:focus:ring-indigo-500 focus:border-transparent"
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

                                    <div className="flex flex-row items-center gap-2 flex-1">
                                      <label className="text-xs text-gray-600 dark:text-gray-300 w-10">
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
                                        className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-indigo-500/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 text-sm font-medium focus:ring-2 focus:ring-slate-500 dark:focus:ring-indigo-500 focus:border-transparent"
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

                                    <div className="flex items-center">
                                      <span className="text-xs font-medium text-green-600 dark:text-emerald-400 mr-2">
                                        {Math.round(
                                          (calculateDuration(
                                            slot.start,
                                            slot.end
                                          ) /
                                            60) *
                                            100
                                        ) / 100}
                                        h
                                      </span>

                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border-red-200 dark:border-red-500/30 p-2 rounded-full"
                                        onClick={() =>
                                          handleRemoveTimeSlot(day, slotIndex)
                                        }
                                        icon={<Trash size={16} />}
                                      >
                                        <span className="sr-only">
                                          Supprimer
                                        </span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Notes pour ce jour */}
                          <div className="mt-2">
                            <label className="text-xs text-gray-600 dark:text-gray-300">
                              Notes pour {DAYS_OF_WEEK[dayIndex]} (optionnel)
                            </label>
                            <textarea
                              value={dailyNotes[day] || ""}
                              onChange={(e) =>
                                handleDailyNoteChange(day, e.target.value)
                              }
                              className="w-full mt-1 px-3 py-2 rounded border border-gray-300 dark:border-indigo-500/30 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 text-sm focus:ring-2 focus:ring-slate-500 dark:focus:ring-indigo-500/50 focus:border-transparent resize-none h-20"
                              placeholder={`Notes pour ${DAYS_OF_WEEK[dayIndex]}...`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Deuxième ligne : Jeudi, Vendredi, Samedi, Dimanche */}
                  <div className="grid grid-cols-4 gap-4">
                    {DAY_KEYS.slice(3, 7).map((day, dayIndex) => {
                      const actualDayIndex = dayIndex + 3; // Ajuster l'index pour les jours 4-7
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
                          className="p-4 border border-gray-300 dark:border-indigo-500/30 rounded-xl bg-slate-50 dark:bg-gray-800/50 transition-all hover:shadow-md hover:shadow-gray-300 dark:hover:shadow-indigo-500/20 backdrop-blur-sm"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                              <span className="font-semibold text-lg text-gray-900 dark:text-white">
                                {DAYS_OF_WEEK[actualDayIndex]}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                {formattedDate}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-green-600 dark:text-emerald-400">
                                {formatDuration(dayTotalMinutes)}
                              </span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleAddTimeSlot(day)}
                                icon={<Plus size={14} />}
                                className="bg-slate-500 hover:bg-slate-600 dark:!bg-indigo-900/50 dark:hover:!bg-indigo-800/60 text-white dark:!text-indigo-300 border-slate-500 dark:!border-indigo-500/30 hover:border-slate-600 dark:hover:!border-indigo-400/50"
                              >
                                Ajouter
                              </Button>
                            </div>
                          </div>

                          {/* Liste des créneaux horaires pour ce jour */}
                          <div className="space-y-2">
                            {!scheduleData[day] ||
                            scheduleData[day].length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                Aucun créneau horaire défini
                              </p>
                            ) : (
                              scheduleData[day].map((slot, slotIndex) => (
                                <div
                                  key={slotIndex}
                                  className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-indigo-500/20 shadow-sm"
                                >
                                  <div className="flex flex-col md:flex-row w-full gap-2">
                                    <div className="flex flex-row items-center gap-2 flex-1">
                                      <label className="text-xs text-gray-600 dark:text-gray-300 w-10">
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
                                        className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-indigo-500/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 text-sm font-medium focus:ring-2 focus:ring-slate-500 dark:focus:ring-indigo-500 focus:border-transparent"
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

                                    <div className="flex flex-row items-center gap-2 flex-1">
                                      <label className="text-xs text-gray-600 dark:text-gray-300 w-10">
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
                                        className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-indigo-500/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 text-sm font-medium focus:ring-2 focus:ring-slate-500 dark:focus:ring-indigo-500 focus:border-transparent"
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

                                    <div className="flex items-center">
                                      <span className="text-xs font-medium text-green-600 dark:text-emerald-400 mr-2">
                                        {Math.round(
                                          (calculateDuration(
                                            slot.start,
                                            slot.end
                                          ) /
                                            60) *
                                            100
                                        ) / 100}
                                        h
                                      </span>

                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border-red-200 dark:border-red-500/30 p-2 rounded-full"
                                        onClick={() =>
                                          handleRemoveTimeSlot(day, slotIndex)
                                        }
                                        icon={<Trash size={16} />}
                                      >
                                        <span className="sr-only">
                                          Supprimer
                                        </span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Notes pour ce jour */}
                          <div className="mt-2">
                            <label className="text-xs text-gray-600 dark:text-gray-300">
                              Notes pour {DAYS_OF_WEEK[actualDayIndex]}{" "}
                              (optionnel)
                            </label>
                            <textarea
                              value={dailyNotes[day] || ""}
                              onChange={(e) =>
                                handleDailyNoteChange(day, e.target.value)
                              }
                              className="w-full mt-1 px-3 py-2 rounded border border-gray-300 dark:border-indigo-500/30 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 text-sm focus:ring-2 focus:ring-slate-500 dark:focus:ring-indigo-500/50 focus:border-transparent resize-none h-20"
                              placeholder={`Notes pour ${DAYS_OF_WEEK[actualDayIndex]}...`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Notes générales */}
              <div className="mb-8">
                <label className="block text-gray-800 dark:text-gray-200 mb-2">
                  Notes générales (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-500/30 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-slate-500 dark:focus:ring-indigo-500/50 focus:border-transparent resize-none h-32"
                  placeholder="Ajouter des notes générales sur ce planning..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-white/90 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-300 dark:border-indigo-500/20 p-4 mt-6 shadow-lg rounded-b-lg z-10">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeCreateModal}
                  className="px-8 py-3 text-base bg-gray-500 hover:bg-gray-600 dark:bg-red-700 dark:hover:bg-red-800 text-white dark:text-white border border-gray-500 dark:border-red-700"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={creatingSchedule}
                  disabled={creatingSchedule || !selectedEmployeeId}
                  icon={isEditMode ? <Check size={20} /> : <Clock size={20} />}
                  className="px-8 py-3 text-base bg-slate-600 hover:bg-slate-700 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 text-white font-medium shadow-lg shadow-slate-600/20 dark:shadow-indigo-600/20"
                >
                  {isEditMode
                    ? "Mettre à jour le planning"
                    : "Enregistrer le planning"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Modal de consultation détaillée */}
        {isViewModalOpen && currentSchedule && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Planning de {currentSchedule.employeeName}
                  </h2>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
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
                    <span className="sr-only">Fermer la fenêtre</span>
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
                      {Math.round(
                        (currentSchedule.totalWeeklyMinutes / 60) * 100
                      ) / 100}
                      h
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
                  <h3 className="font-medium mb-2 dark:text-white">
                    Horaires hebdomadaires
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white text-left">
                            Jour
                          </th>
                          <th className="border px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white text-left">
                            Horaires
                          </th>
                          <th className="border px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white text-left">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {DAY_KEYS.map((day, index) => (
                          <tr
                            key={day}
                            className="dark:border-gray-700 dark:text-gray-200"
                          >
                            <td className="border px-3 py-2 dark:border-gray-700">
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
                            <td className="border px-3 py-2 dark:border-gray-700">
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
                                          <span className="text-sm dark:text-gray-300">
                                            {start} – {end}
                                          </span>
                                          <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-2">
                                            (
                                            {Math.round(
                                              (calculateDuration(start, end) /
                                                60) *
                                                100
                                            ) / 100}
                                            h )
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
                            <td className="border px-3 py-2 dark:border-gray-700">
                              {currentSchedule.dailyNotes?.[day] ? (
                                <p className="text-sm dark:text-gray-300">
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
                    <h3 className="font-medium mb-2 dark:text-white">
                      Notes générales
                    </h3>
                    <p className="p-3 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 rounded">
                      {currentSchedule.notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setIsViewModalOpen(false)}
                    className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingScheduleId(null);
          }}
          title="Confirmer la suppression"
        >
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer ce planning ? Cette action est
              irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingScheduleId(null);
                }}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-600 dark:border-red-800"
                onClick={() => {
                  if (deletingScheduleId) {
                    confirmDeleteSchedule(deletingScheduleId);
                  }
                }}
                disabled={!deletingScheduleId}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de génération de PDF */}
        <GeneratePdfModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          onGeneratePdf={handleGeneratePdf}
          teams={teams}
          employees={employees}
          currentEmployeeId={selectedEmployeeId}
          currentTeamId={selectedTeam}
          initialGenerationType={generationType}
          year={year}
          weekNumber={weekNumber}
        />

        {/* Modal IA Coming Soon */}
        <ComingSoonAIModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
        />

        {/* Modale de génération IA de planning */}
        <GenerateIAScheduleModal
          isOpen={isAIGenerateModalOpen}
          onClose={() => setIsAIGenerateModalOpen(false)}
          onSuccess={() => {
            setSuccess("Planning IA généré avec succès !");
            setShowSuccessToast(true);

            // Afficher le guide visuel vers les plannings IA
            aiGuide.showGuide();

            fetchSchedules();
          }}
          teams={(() => {
            if (teams.length === 0) {
              console.warn(
                "Aucune équipe disponible pour la génération IA de plannings"
              );
            }
            return teams.map((team) => ({
              value: team._id,
              label: team.name,
            }));
          })()}
        />

        {/* Guide visuel vers plannings IA */}
        <AIGenerationGuide
          isVisible={aiGuide.isVisible}
          onClose={aiGuide.hideGuide}
        />
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default WeeklySchedulePage;
