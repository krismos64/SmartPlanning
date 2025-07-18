/**
 * ManagerPlanningValidationPage - Page de validation des plannings générés par l'IA
 *
 * Permet aux managers, directeurs et admins de consulter, modifier, valider ou refuser
 * les plannings générés automatiquement par l'IA avec le statut "draft".
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Edit3,
  Save,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

// Imports pour date-fns
import {
  addWeeks,
  endOfWeek,
  format,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { fr } from "date-fns/locale";

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
import Toast from "../components/ui/Toast";

// Hooks
import { useAuth } from "../hooks/useAuth";

// Composants IA - Redirection vers le nouveau wizard
import { useToast } from "../hooks/useToast";

// Types et interfaces
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
}

interface ScheduleData {
  [day: string]: {
    start?: string;
    end?: string;
    pause?: string;
    slots?: string[]; // Format: ["09:00-12:00", "14:00-17:00"]
  };
}

interface GeneratedSchedule {
  _id: string;
  employeeId: string;
  employee: Employee;
  scheduleData: ScheduleData;
  status: "draft" | "approved" | "rejected";
  weekNumber: number;
  year: number;
  timestamp: string;
  generatedBy: string;
  validatedBy?: string;
  teamId: string;
  teamName: string;
  constraints: string[];
  notes?: string;
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

const breadcrumbItems = [
  { label: "Dashboard", href: "/tableau-de-bord" },
  { label: "Plannings IA", href: "/validation-plannings" },
];

/**
 * Calculer les dates de début et fin de semaine à partir du numéro de semaine
 */
const getWeekDates = (year: number, weekNumber: number) => {
  try {
    // Validation des paramètres
    if (
      !year ||
      !weekNumber ||
      year < 2020 ||
      year > 2030 ||
      weekNumber < 1 ||
      weekNumber > 53
    ) {
      console.warn("Données de semaine invalides:", { year, weekNumber });
      // Fallback sur la semaine actuelle
      const now = new Date();
      return {
        monday: startOfWeek(now, { weekStartsOn: 1 }),
        sunday: endOfWeek(now, { weekStartsOn: 1 }),
      };
    }

    // Début de l'année
    const yearStart = startOfYear(new Date(year, 0, 1));

    // Calculer la semaine demandée (weekNumber - 1 car addWeeks compte depuis 0)
    const targetWeek = addWeeks(yearStart, weekNumber - 1);

    // Obtenir le début (lundi) et la fin (dimanche) de cette semaine
    const monday = startOfWeek(targetWeek, { weekStartsOn: 1 }); // 1 = lundi
    const sunday = endOfWeek(targetWeek, { weekStartsOn: 1 });

    return { monday, sunday };
  } catch (error) {
    console.error("Erreur calcul semaine:", error);
    // Fallback sur la semaine actuelle
    const now = new Date();
    return {
      monday: startOfWeek(now, { weekStartsOn: 1 }),
      sunday: endOfWeek(now, { weekStartsOn: 1 }),
    };
  }
};

/**
 * Composant principal ManagerPlanningValidationPage
 */
const ManagerPlanningValidationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  console.log('🏁 [VALIDATION PAGE] Composant chargé - User:', user);

  // Vérification des autorisations
  useEffect(() => {
    if (!user) return;

    if (!["manager", "directeur", "admin"].includes(user.role)) {
      console.warn("Accès non autorisé - redirection vers /unauthorized");
      navigate("/unauthorized");
      return;
    }
  }, [user, navigate]);

  // États principaux
  const [generatedSchedules, setGeneratedSchedules] = useState<
    GeneratedSchedule[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // États pour l'édition
  const [editingStates, setEditingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [editedSchedules, setEditedSchedules] = useState<
    Record<string, ScheduleData>
  >({});

  // États pour les modales
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "validate" | "reject";
    scheduleId: string;
    employeeName: string;
  }>({
    isOpen: false,
    type: "validate",
    scheduleId: "",
    employeeName: "",
  });

  // Navigation vers le nouveau wizard IA (hooks obsolètes supprimés)

  // Fonctions obsolètes supprimées - redirection vers le wizard

  const handleOpenAISelector = () => {
    console.log("Debug - Redirection vers le wizard IA");
    showToast('Redirection vers le nouveau Assistant IA Planning...', 'info');
    navigate('/planning-wizard');
  };

  // Fonction obsolète supprimée - redirection vers le wizard

  /**
   * Récupérer tous les plannings générés par l'IA avec le statut "draft"
   */
  const fetchGeneratedSchedules = useCallback(async () => {
    if (!user?._id) {
      console.log('❌ [VALIDATION PAGE] User non défini, arrêt de la requête');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Construction des paramètres selon le rôle
      const params: any = { status: "draft" };
      if (user.role === "manager") {
        params.managerId = user._id;
      }
      // Le backend filtre automatiquement selon req.user.companyId pour les directeurs
      // Pas besoin d'envoyer companyId en paramètre
      
      console.log('🔎 [VALIDATION PAGE] Paramètres API:', params);
      console.log('🔎 [VALIDATION PAGE] User companyId:', user.companyId);
      console.log('🔎 [VALIDATION PAGE] User role:', user.role);
      console.log('🔎 [VALIDATION PAGE] User _id:', user._id);
      console.log('🔎 [VALIDATION PAGE] URL complète:', `/ai/generated-schedules?${new URLSearchParams(params).toString()}`);

      // Test de l'authentification avant l'appel principal
      try {
        const authTest = await axiosInstance.get("/auth/me");
        console.log('✅ [VALIDATION PAGE] Test d\'authentification réussi:', authTest.data);
      } catch (authErr: any) {
        console.error('❌ [VALIDATION PAGE] Échec du test d\'authentification:', authErr);
        console.error('❌ [VALIDATION PAGE] Status:', authErr.response?.status);
        console.error('❌ [VALIDATION PAGE] Message:', authErr.response?.data?.message);
        
        // Si l'authentification échoue, afficher une erreur appropriée
        if (authErr.response?.status === 401) {
          setError("Session expirée. Veuillez vous reconnecter.");
          setShowErrorToast(true);
          return;
        }
      }

      // Appel à l'API pour récupérer les plannings IA en draft
      console.log('🚀 [VALIDATION PAGE] Début de l\'appel API...');
      const response = await axiosInstance.get("/ai/generated-schedules", { params });

      console.log('📊 [VALIDATION PAGE] Réponse complète:', response.data);
      console.log('📊 [VALIDATION PAGE] Status de la réponse:', response.status);
      console.log('📊 [VALIDATION PAGE] Headers de la réponse:', response.headers);

      if (response.data.success) {
        const schedules = response.data.data || [];
        console.log('📊 [VALIDATION PAGE] Plannings récupérés:', schedules.length);
        console.log('📊 [VALIDATION PAGE] Premier planning:', schedules[0]);
        console.log('📊 [VALIDATION PAGE] Tous les plannings:', schedules);
        setGeneratedSchedules(schedules);

        // Initialiser les états d'édition
        const initialEditingStates: Record<string, boolean> = {};
        const initialEditedSchedules: Record<string, ScheduleData> = {};

        schedules.forEach((schedule: GeneratedSchedule) => {
          initialEditingStates[schedule._id] = false;
          initialEditedSchedules[schedule._id] = { ...schedule.scheduleData };
        });

        setEditingStates(initialEditingStates);
        setEditedSchedules(initialEditedSchedules);
      } else {
        console.log('❌ [VALIDATION PAGE] Erreur dans la réponse:', response.data);
        setError("Erreur lors de la récupération des plannings");
        setShowErrorToast(true);
      }
    } catch (err: any) {
      console.error("💥 [VALIDATION PAGE] Erreur lors de la récupération des plannings IA:", err);
      console.error("💥 [VALIDATION PAGE] Status:", err.response?.status);
      console.error("💥 [VALIDATION PAGE] Data:", err.response?.data);
      console.error("💥 [VALIDATION PAGE] Headers:", err.response?.headers);
      console.error("💥 [VALIDATION PAGE] Config:", err.config);
      
      const errorMessage = err.response?.data?.message || "Erreur lors de la récupération des plannings";
      console.error("💥 [VALIDATION PAGE] Message d'erreur final:", errorMessage);
      
      setError(errorMessage);
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Charger les plannings au montage du composant
  useEffect(() => {
    console.log('🎯 [VALIDATION PAGE] useEffect - Début du chargement des plannings');
    console.log('🎯 [VALIDATION PAGE] useEffect - User:', user);
    fetchGeneratedSchedules();
  }, [fetchGeneratedSchedules]);

  /**
   * Activer/désactiver le mode édition pour un planning
   */
  const handleToggleEdit = (scheduleId: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [scheduleId]: !prev[scheduleId],
    }));
  };

  /**
   * Gérer les modifications des créneaux horaires
   */
  const handleScheduleEdit = (
    scheduleId: string,
    day: string,
    field: "start" | "end" | "pause",
    value: string
  ) => {
    setEditedSchedules((prev) => ({
      ...prev,
      [scheduleId]: {
        ...prev[scheduleId],
        [day]: {
          ...prev[scheduleId][day],
          [field]: value,
        },
      },
    }));
  };

  /**
   * Sauvegarder les modifications d'un planning
   */
  const handleSaveEdit = async (scheduleId: string) => {
    try {
      setLoading(true);

      const response = await axiosInstance.patch(
        `/ai/generated-schedules/${scheduleId}`,
        {
          scheduleData: editedSchedules[scheduleId],
        }
      );

      if (response.data.success) {
        setSuccess("Planning modifié avec succès !");
        setShowSuccessToast(true);

        // Désactiver le mode édition
        setEditingStates((prev) => ({
          ...prev,
          [scheduleId]: false,
        }));

        // Recharger les plannings
        fetchGeneratedSchedules();
      } else {
        setError("Erreur lors de la sauvegarde");
        setShowErrorToast(true);
      }
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde:", err);
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ouvrir la modale de confirmation
   */
  const openConfirmModal = (
    type: "validate" | "reject",
    scheduleId: string,
    employeeName: string
  ) => {
    setConfirmModal({
      isOpen: true,
      type,
      scheduleId,
      employeeName,
    });
  };

  /**
   * Fermer la modale de confirmation
   */
  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      type: "validate",
      scheduleId: "",
      employeeName: "",
    });
  };

  /**
   * Valider un planning (statut → "approved")
   */
  const handleValidateSchedule = async () => {
    if (!confirmModal.scheduleId) return;

    try {
      setLoading(true);

      const response = await axiosInstance.patch(
        `/ai/generated-schedules/${confirmModal.scheduleId}/validate`,
        {
          validatedBy: user?._id,
        }
      );

      if (response.data.success) {
        setSuccess(`Planning validé pour ${confirmModal.employeeName} !`);
        setShowSuccessToast(true);
        closeConfirmModal();
        fetchGeneratedSchedules();
      } else {
        setError("Erreur lors de la validation");
        setShowErrorToast(true);
      }
    } catch (err: any) {
      console.error("Erreur lors de la validation:", err);
      setError(err.response?.data?.message || "Erreur lors de la validation");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refuser un planning (statut → "rejected")
   */
  const handleRejectSchedule = async () => {
    if (!confirmModal.scheduleId) return;

    try {
      setLoading(true);

      const response = await axiosInstance.patch(
        `/ai/generated-schedules/${confirmModal.scheduleId}/reject`,
        {
          validatedBy: user?._id,
        }
      );

      if (response.data.success) {
        setSuccess(`Planning refusé pour ${confirmModal.employeeName}`);
        setShowSuccessToast(true);
        closeConfirmModal();
        fetchGeneratedSchedules();
      } else {
        setError("Erreur lors du refus");
        setShowErrorToast(true);
      }
    } catch (err: any) {
      console.error("Erreur lors du refus:", err);
      setError(err.response?.data?.message || "Erreur lors du refus");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formater l'affichage des créneaux horaires
   */
  const formatTimeSlots = (dayData: any): string => {
    if (!dayData) return "Repos";

    if (dayData.slots && Array.isArray(dayData.slots)) {
      return dayData.slots.join(", ");
    }

    if (dayData.start && dayData.end) {
      const pause = dayData.pause ? ` (pause: ${dayData.pause})` : "";
      return `${dayData.start}-${dayData.end}${pause}`;
    }

    return "Repos";
  };

  /**
   * Rendre un champ d'horaire éditable
   */
  const renderEditableTimeField = (
    scheduleId: string,
    day: string,
    field: "start" | "end" | "pause",
    value: string,
    placeholder: string
  ) => (
    <input
      type="time"
      value={value || ""}
      onChange={(e) =>
        handleScheduleEdit(scheduleId, day, field, e.target.value)
      }
      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
      placeholder={placeholder}
    />
  );

  return (
    <LayoutWithSidebar
      activeItem="plannings-ai"
      pageTitle="Validation Plannings IA"
    >
      <SEO
        title="Validation des Plannings IA"
        description="Validation et gestion des plannings générés automatiquement par l'intelligence artificielle"
      />

      <PageWrapper>
        {/* Notifications Toast */}
        <Toast
          message={error || ""}
          type="error"
          isVisible={showErrorToast}
          onClose={() => setShowErrorToast(false)}
        />
        <Toast
          message={success || ""}
          type="success"
          isVisible={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
        />

        {/* En-tête de page */}
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4"
          >
            <SectionTitle
              title="Validation des Plannings IA"
              subtitle="Validez, modifiez ou refusez les plannings générés automatiquement par l'intelligence artificielle"
              icon={<Sparkles className="text-violet-500" size={28} />}
            />
          </motion.div>
        </div>

        {/* Contenu principal */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (() => {
          console.log('🔍 [VALIDATION PAGE] Rendu - Nombre de plannings:', generatedSchedules.length);
          console.log('🔍 [VALIDATION PAGE] Rendu - Loading:', loading);
          console.log('🔍 [VALIDATION PAGE] Rendu - Premier planning:', generatedSchedules[0]);
          return generatedSchedules.length > 0;
        })() ? (
          <div className="space-y-6">
            <AnimatePresence>
              {generatedSchedules.map((schedule, index) => {
                const isEditing = editingStates[schedule._id];
                const editedData =
                  editedSchedules[schedule._id] || schedule.scheduleData;

                // Utiliser l'index comme clé de secours si _id est vide
                const uniqueKey = schedule._id || `schedule-${index}`;

                return (
                  <motion.div
                    key={uniqueKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <SectionCard className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      {/* En-tête de la carte */}
                      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                            {/* Avatar de l'employé */}
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0">
                              {schedule.employee.firstName.charAt(0)}
                              {schedule.employee.lastName.charAt(0)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                                {schedule.employee.firstName}{" "}
                                {schedule.employee.lastName}
                              </h3>

                              {/* Informations détaillées de planification */}
                              <div className="mt-2 space-y-2">
                                {/* Ligne 1: Semaine et période */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1 text-violet-500" />
                                    <span className="font-medium">
                                      Semaine {schedule.weekNumber || "?"}
                                    </span>
                                    <span className="mx-1">•</span>
                                    <span>{schedule.year || "?"}</span>
                                  </span>
                                  <span className="flex items-center">
                                    <Users className="w-4 h-4 mr-1 text-indigo-500" />
                                    <span
                                      className="truncate max-w-[120px]"
                                      title={schedule.teamName}
                                    >
                                      {schedule.teamName}
                                    </span>
                                  </span>
                                </div>

                                {/* Ligne 2: Dates précises et timestamp */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-500">
                                  {schedule.weekNumber && schedule.year ? (
                                    <span className="flex items-center">
                                      <span className="font-medium">Du</span>
                                      <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                                        {(() => {
                                          const { monday } = getWeekDates(
                                            schedule.year,
                                            schedule.weekNumber
                                          );
                                          return format(monday, "dd MMM", {
                                            locale: fr,
                                          });
                                        })()}
                                      </span>
                                      <span className="mx-1">au</span>
                                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                                        {(() => {
                                          const { sunday } = getWeekDates(
                                            schedule.year,
                                            schedule.weekNumber
                                          );
                                          return format(sunday, "dd MMM", {
                                            locale: fr,
                                          });
                                        })()}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">
                                      Dates non disponibles
                                    </span>
                                  )}
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    <span>
                                      Généré le{" "}
                                      {(() => {
                                        try {
                                          const timestamp = new Date(
                                            schedule.timestamp
                                          );
                                          if (isNaN(timestamp.getTime())) {
                                            return "Date invalide";
                                          }
                                          return format(
                                            timestamp,
                                            "dd MMM, HH:mm",
                                            { locale: fr }
                                          );
                                        } catch (error) {
                                          console.error(
                                            "Erreur format timestamp:",
                                            error
                                          );
                                          return "Date invalide";
                                        }
                                      })()}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Boutons d'action */}
                          <div className="flex items-center gap-2 self-start lg:self-center">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleSaveEdit(schedule._id)}
                                  disabled={loading}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white whitespace-nowrap"
                                  icon={<Save className="w-4 h-4" />}
                                >
                                  <span className="hidden sm:inline">
                                    Sauvegarder
                                  </span>
                                  <span className="sm:hidden">Save</span>
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleToggleEdit(schedule._id)}
                                  disabled={loading}
                                  className="whitespace-nowrap"
                                >
                                  Annuler
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleToggleEdit(schedule._id)}
                                  disabled={loading}
                                  icon={<Edit3 className="w-4 h-4" />}
                                  className="whitespace-nowrap"
                                >
                                  <span className="hidden sm:inline">
                                    Éditer
                                  </span>
                                  <span className="sm:hidden">Edit</span>
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() =>
                                    openConfirmModal(
                                      "validate",
                                      schedule._id,
                                      `${schedule.employee.firstName} ${schedule.employee.lastName}`
                                    )
                                  }
                                  disabled={loading}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white whitespace-nowrap"
                                  icon={<Check className="w-4 h-4" />}
                                >
                                  <span className="hidden sm:inline">
                                    Valider
                                  </span>
                                  <span className="sm:hidden">OK</span>
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() =>
                                    openConfirmModal(
                                      "reject",
                                      schedule._id,
                                      `${schedule.employee.firstName} ${schedule.employee.lastName}`
                                    )
                                  }
                                  disabled={loading}
                                  icon={<X className="w-4 h-4" />}
                                  className="whitespace-nowrap"
                                >
                                  <span className="hidden sm:inline">
                                    Refuser
                                  </span>
                                  <span className="sm:hidden">Non</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Planning hebdomadaire */}
                      <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-medium text-gray-900 dark:text-white">
                            Planning de la semaine
                          </h4>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {(() => {
                              // Calcul du nombre total d'heures planifiées
                              let totalHours = 0;
                              Object.values(editedData).forEach(
                                (dayData: any) => {
                                  if (
                                    dayData.slots &&
                                    Array.isArray(dayData.slots)
                                  ) {
                                    dayData.slots.forEach((slot: string) => {
                                      const [start, end] = slot.split("-");
                                      if (start && end) {
                                        const [startH, startM] = start
                                          .split(":")
                                          .map(Number);
                                        const [endH, endM] = end
                                          .split(":")
                                          .map(Number);
                                        const duration =
                                          endH * 60 +
                                          endM -
                                          (startH * 60 + startM);
                                        totalHours += duration / 60;
                                      }
                                    });
                                  }
                                }
                              );
                              return `${
                                Math.round(totalHours * 10) / 10
                              }h total`;
                            })()}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4">
                          {DAY_KEYS.map((day, dayIndex) => {
                            const dayData = editedData[day] || {};
                            // Clé unique combinant l'ID du planning et le jour
                            const dayKey = `${uniqueKey}-${day}`;

                            return (
                              <div
                                key={dayKey}
                                className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[120px] flex flex-col"
                              >
                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                                  {DAYS_OF_WEEK[dayIndex]}
                                </h5>

                                <div className="flex-1 flex items-center justify-center">
                                  {isEditing ? (
                                    <div className="space-y-2 w-full">
                                      <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                                          Début
                                        </label>
                                        {renderEditableTimeField(
                                          schedule._id,
                                          day,
                                          "start",
                                          dayData.start || "",
                                          "09:00"
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                                          Fin
                                        </label>
                                        {renderEditableTimeField(
                                          schedule._id,
                                          day,
                                          "end",
                                          dayData.end || "",
                                          "17:00"
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                                          Pause
                                        </label>
                                        {renderEditableTimeField(
                                          schedule._id,
                                          day,
                                          "pause",
                                          dayData.pause || "",
                                          "12:00"
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center w-full">
                                      <div
                                        className={`${
                                          formatTimeSlots(dayData) === "Repos"
                                            ? "text-gray-400 dark:text-gray-500 italic"
                                            : "text-gray-900 dark:text-gray-100 font-medium"
                                        }`}
                                      >
                                        {formatTimeSlots(dayData)}
                                      </div>
                                      {dayData.slots &&
                                        dayData.slots.length > 0 && (
                                          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                            {(() => {
                                              let dayTotal = 0;
                                              dayData.slots.forEach(
                                                (slot: string) => {
                                                  const [start, end] =
                                                    slot.split("-");
                                                  if (start && end) {
                                                    const [startH, startM] =
                                                      start
                                                        .split(":")
                                                        .map(Number);
                                                    const [endH, endM] = end
                                                      .split(":")
                                                      .map(Number);
                                                    const duration =
                                                      endH * 60 +
                                                      endM -
                                                      (startH * 60 + startM);
                                                    dayTotal += duration / 60;
                                                  }
                                                }
                                              );
                                              return `${
                                                Math.round(dayTotal * 10) / 10
                                              }h`;
                                            })()}
                                          </div>
                                        )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Contraintes et notes */}
                        {schedule.constraints.length > 0 && (
                          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Contraintes appliquées
                            </h5>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                              {schedule.constraints.map((constraint, idx) => (
                                <li key={idx} className="flex items-start">
                                  <ChevronRight className="w-3 h-3 mr-1 mt-0.5" />
                                  {constraint}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {schedule.notes && (
                          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Notes:
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {schedule.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          // État vide stylé
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SectionCard className="text-center py-16">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-violet-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Aucun planning IA à valider
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Il n'y a actuellement aucun planning généré par l'IA en
                  attente de validation. Les nouveaux plannings générés
                  apparaîtront ici automatiquement.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleOpenAISelector}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 flex items-center gap-2"
                    icon={<Bot className="h-4 w-4" />}
                  >
                    Générer Planning IA
                  </Button>
                  <Button
                    variant="primary"
                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    onClick={() => navigate("/plannings-hebdomadaires")}
                    icon={<Calendar className="w-4 h-4" />}
                  >
                    Aller aux plannings
                  </Button>
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* Modale de confirmation */}
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          title={`Confirmer ${
            confirmModal.type === "validate" ? "la validation" : "le refus"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              {confirmModal.type === "validate" ? (
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mr-4">
                  <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-4">
                  <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {confirmModal.type === "validate" ? "Valider" : "Refuser"} le
                  planning
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {confirmModal.employeeName}
                </p>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {confirmModal.type === "validate"
                ? "Êtes-vous sûr de vouloir valider ce planning ? Il sera publié et visible par l'employé."
                : "Êtes-vous sûr de vouloir refuser ce planning ? L'employé devra en créer un nouveau."}
            </p>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={closeConfirmModal}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                variant={
                  confirmModal.type === "validate" ? "primary" : "danger"
                }
                onClick={
                  confirmModal.type === "validate"
                    ? handleValidateSchedule
                    : handleRejectSchedule
                }
                disabled={loading}
                isLoading={loading}
                className={
                  confirmModal.type === "validate"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }
              >
                {confirmModal.type === "validate" ? "Valider" : "Refuser"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Anciens modals IA supprimés - redirection vers le wizard */}
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default ManagerPlanningValidationPage;
