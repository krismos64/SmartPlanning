/**
 * ManagerPlanningValidationPage - Page de validation des plannings générés par l'IA
 *
 * Interface permettant à un manager ou directeur de visualiser et valider
 * les plannings générés automatiquement pour les employés de son équipe.
 */
import axios from "axios";
import { motion } from "framer-motion";
import { Calendar, Check, Users, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

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
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Toast from "../components/ui/Toast";

// Hooks
import { useAuth } from "../hooks/useAuth";

// Types pour les données
interface Team {
  _id: string;
  name: string;
  managerIds: string[];
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

interface ScheduleData {
  [day: string]: string[]; // ex: "monday": ["09:00-12:00", "14:00-17:00"]
}

interface GeneratedSchedule {
  _id: string;
  employeeId: string;
  employee: Employee;
  scheduleData: ScheduleData;
  status: "draft" | "approved" | "rejected";
  week: number;
  year: number;
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

// Éléments du fil d'ariane
const breadcrumbItems = [
  { label: "Dashboard", link: "/tableau-de-bord" },
  { label: "Validation des plannings", link: "/validation-plannings" },
];

/**
 * Composant principal pour la page de validation des plannings
 */
const ManagerPlanningValidationPage: React.FC = () => {
  // Récupération des infos utilisateur
  const { user } = useAuth();
  const currentUserId = user?._id;

  // États pour les filtres et sélections
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<number>(
    Math.ceil(
      (new Date().getTime() -
        new Date(new Date().getFullYear(), 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    )
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // États pour les données
  const [teams, setTeams] = useState<Team[]>([]);
  const [generatedSchedules, setGeneratedSchedules] = useState<
    GeneratedSchedule[]
  >([]);
  const [scheduleEdits, setScheduleEdits] = useState<
    Record<string, ScheduleData>
  >({});

  // États pour la gestion UI
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [currentSchedule, setCurrentSchedule] = useState<string | null>(null);

  /**
   * Charger les équipes dont l'utilisateur est manager
   */
  const fetchTeams = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/teams?managerId=${currentUserId}`);
      const result = Array.isArray(response.data)
        ? response.data
        : response.data?.teams || [];
      setTeams(result);
    } catch (err) {
      console.error("Erreur lors du chargement des équipes:", err);
      setError("Impossible de charger les équipes");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  /**
   * Charger les plannings générés pour l'équipe et la semaine sélectionnée
   */
  const fetchSchedules = useCallback(async () => {
    if (!selectedTeamId || !currentUserId) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `/api/generated-schedules?managerId=${currentUserId}&teamId=${selectedTeamId}&week=${selectedWeek}&year=${selectedYear}`
      );

      const schedules = response.data || [];
      setGeneratedSchedules(schedules);

      // Initialiser les modifications de plannings
      const initialEdits: Record<string, ScheduleData> = {};
      schedules.forEach((schedule: GeneratedSchedule) => {
        initialEdits[schedule._id] = { ...schedule.scheduleData };
      });
      setScheduleEdits(initialEdits);
    } catch (err) {
      console.error("Erreur lors du chargement des plannings:", err);
      setError("Impossible de charger les plannings générés");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, selectedTeamId, selectedWeek, selectedYear]);

  /**
   * Effet pour charger les équipes au chargement de la page
   */
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  /**
   * Effet pour charger les plannings générés quand l'équipe ou la semaine change
   */
  useEffect(() => {
    if (selectedTeamId) {
      fetchSchedules();
    }
  }, [selectedTeamId, fetchSchedules]);

  /**
   * Gérer le changement de semaine avec le DatePicker
   */
  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);

    // Calculer la semaine de l'année
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor(
      (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    setSelectedWeek(weekNum);
    setSelectedYear(date.getFullYear());
  };

  /**
   * Gérer les modifications des créneaux horaires
   */
  const handleEditSlot = (scheduleId: string, day: string, value: string) => {
    // Split par virgule et nettoyage des heures
    const hours = value
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);

    setScheduleEdits((prev) => ({
      ...prev,
      [scheduleId]: {
        ...prev[scheduleId],
        [day]: hours,
      },
    }));
  };

  /**
   * Valider un planning
   */
  const handleValidatePlanning = async (scheduleId: string) => {
    try {
      setLoading(true);

      // Valider le format des horaires
      const scheduleData = scheduleEdits[scheduleId];
      const isValid = validateScheduleTimes(scheduleData);

      if (!isValid) {
        setError(
          "Certains créneaux horaires sont invalides (format: HH:MM-HH:MM)"
        );
        setShowErrorToast(true);
        return;
      }

      // Récupérer les infos du planning à valider
      const schedule = generatedSchedules.find((s) => s._id === scheduleId);
      if (!schedule) {
        setError("Planning introuvable");
        setShowErrorToast(true);
        return;
      }

      // 1. Créer un planning validé dans weeklySchedules
      await axios.post("/api/weekly-schedules", {
        employeeId: schedule.employeeId,
        year: selectedYear,
        weekNumber: selectedWeek,
        scheduleData: scheduleEdits[scheduleId],
        status: "approved",
      });

      // 2. Supprimer le planning généré
      await axios.delete(`/api/generated-schedules/${scheduleId}`);

      // 3. Mettre à jour l'UI
      setSuccess(
        `Planning validé et publié pour ${schedule.employee.firstName} ${schedule.employee.lastName}`
      );
      setShowSuccessToast(true);

      // Rafraîchir les plannings
      fetchSchedules();
    } catch (err: any) {
      console.error("Erreur lors de la validation du planning:", err);

      if (err.response && err.response.status === 409) {
        setError("Un planning existe déjà pour cet employé sur cette semaine");
      } else {
        setError("Erreur lors de la validation du planning");
      }
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ouvrir la modale de rejet
   */
  const handleOpenRejectModal = (scheduleId: string) => {
    setCurrentSchedule(scheduleId);
    setRejectModalOpen(true);
  };

  /**
   * Rejeter un planning
   */
  const handleRejectPlanning = async () => {
    if (!currentSchedule) return;

    try {
      setLoading(true);

      // Mettre à jour le statut du planning généré
      await axios.put(`/api/generated-schedules/${currentSchedule}`, {
        action: "update",
        status: "rejected",
      });

      // Fermer la modale
      setRejectModalOpen(false);
      setCurrentSchedule(null);

      // Afficher la confirmation
      setSuccess("Planning rejeté avec succès");
      setShowSuccessToast(true);

      // Rafraîchir les plannings
      fetchSchedules();
    } catch (err) {
      console.error("Erreur lors du rejet du planning:", err);
      setError("Erreur lors du rejet du planning");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Valider le format des créneaux horaires
   */
  const validateScheduleTimes = (scheduleData: ScheduleData): boolean => {
    const timeRegex =
      /^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

    for (const day in scheduleData) {
      for (const timeSlot of scheduleData[day]) {
        // Vérifier le format HH:MM-HH:MM
        if (!timeRegex.test(timeSlot)) return false;

        // Vérifier que l'heure de fin est supérieure à l'heure de début
        const [start, end] = timeSlot.split("-");
        if (start >= end) return false;
      }
    }

    return true;
  };

  /**
   * Gestionnaires pour les notifications
   */
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  return (
    <LayoutWithSidebar
      activeItem="validation-plannings"
      pageTitle="Validation des plannings"
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

        {/* En-tête de page avec fil d'ariane */}
        <div className="mb-6">
          <SectionTitle
            title="Validation des plannings générés par l'IA"
            icon={<Calendar className="text-violet-500" />}
          />
          <Breadcrumb items={breadcrumbItems} className="mt-2" />
        </div>

        {/* Section de filtres */}
        <SectionCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Équipe"
              options={teams.map((team) => ({
                label: team.name,
                value: team._id,
              }))}
              value={selectedTeamId}
              onChange={setSelectedTeamId}
              placeholder="Sélectionner une équipe"
              icon={<Users size={18} />}
              className="mb-0"
            />
            <DatePicker
              label="Semaine"
              selectedDate={selectedDate}
              onChange={handleDateChange}
              placeholder="Sélectionner une semaine"
              className="mb-0"
            />

            <div className="flex items-end">
              <span className="text-gray-700 dark:text-gray-300 ml-2">
                Semaine {selectedWeek}, {selectedYear}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Section principale - Plannings à valider */}
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : selectedTeamId ? (
          generatedSchedules.length > 0 ? (
            <div className="space-y-6">
              {generatedSchedules.map((schedule) => (
                <motion.div
                  key={schedule._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectionCard
                    title={`${schedule.employee.firstName} ${schedule.employee.lastName}`}
                  >
                    <div className="flex items-center mb-3">
                      <Avatar
                        src={schedule.employee.photoUrl}
                        alt={`${schedule.employee.firstName} ${schedule.employee.lastName}`}
                        size="sm"
                        className="mr-3"
                      />
                      <span>
                        {schedule.employee.firstName}{" "}
                        {schedule.employee.lastName}
                      </span>
                    </div>
                    actions=
                    {
                      <div className="flex space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleValidatePlanning(schedule._id)}
                          disabled={loading}
                          className="flex items-center"
                        >
                          <Check size={16} className="mr-1" /> Valider et
                          publier
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenRejectModal(schedule._id)}
                          disabled={loading}
                          className="flex items-center"
                        >
                          <X size={16} className="mr-1" /> Rejeter
                        </Button>
                      </div>
                    }
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
                      {DAY_KEYS.map((day, index) => (
                        <InputField
                          key={day}
                          label={DAYS_OF_WEEK[index]}
                          name={`schedule-${schedule._id}-${day}`}
                          placeholder="09:00-12:00, 14:00-17:00"
                          value={
                            scheduleEdits[schedule._id]?.[day]?.join(", ") || ""
                          }
                          onChange={(e) =>
                            handleEditSlot(schedule._id, day, e.target.value)
                          }
                        />
                      ))}
                    </div>
                  </SectionCard>
                </motion.div>
              ))}
            </div>
          ) : (
            <SectionCard>
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Aucun planning à valider
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Il n'y a pas de plannings générés par l'IA en attente de
                  validation pour cette équipe et cette semaine.
                </p>
              </div>
            </SectionCard>
          )
        ) : (
          <SectionCard>
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Sélectionnez une équipe
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Veuillez sélectionner une équipe pour afficher les plannings à
                valider.
              </p>
            </div>
          </SectionCard>
        )}

        {/* Modale de confirmation pour le rejet */}
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Confirmer le rejet du planning"
        >
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Êtes-vous sûr de vouloir rejeter ce planning généré par l'IA ?
            </p>
            <p className="text-amber-500">
              Un planning rejeté devra être regénéré ou créé manuellement.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => setRejectModalOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectPlanning}
              isLoading={loading}
            >
              Rejeter
            </Button>
          </div>
        </Modal>
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default ManagerPlanningValidationPage;
