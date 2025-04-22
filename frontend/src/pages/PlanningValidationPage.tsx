/**
 * PlanningValidationPage - Page de validation des plannings
 *
 * Permet aux managers de visualiser et valider les plannings générés pour leur équipe.
 * Intègre les composants du design system SmartPlanning pour une expérience cohérente.
 */
import axios from "axios";
import { motion } from "framer-motion";
import { Calendar, CalendarCheck, Check, ClipboardList, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Composants de layout
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import DatePicker from "../components/ui/DatePicker";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

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
  status: "draft" | "approved" | "pending" | "rejected";
  notes?: string; // Notes sur le planning
  generatedBy: string; // ID de l'IA ou du système qui a généré
  timestamp: string; // Date de génération
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

/**
 * Utilitaire pour obtenir le numéro de semaine ISO pour une date donnée
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
 */
const getCurrentISOWeek = (): number => {
  return getISOWeek(new Date());
};

/**
 * Obtient l'année actuelle
 */
const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

/**
 * Formatage du nom du mois en français
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
 */
const getStatusVariant = (status: string): string => {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "danger";
    case "draft":
      return "neutral";
    default:
      return "neutral";
  }
};

/**
 * Formatte le statut pour l'affichage
 */
const formatStatus = (status: string): string => {
  switch (status) {
    case "approved":
      return "Validé";
    case "pending":
      return "En attente";
    case "rejected":
      return "Refusé";
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
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // État pour la modal de confirmation
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    scheduleId: string;
    employeeName: string;
    action: "approve" | "reject";
  }>({
    isOpen: false,
    scheduleId: "",
    employeeName: "",
    action: "approve",
  });

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/tableau-de-bord" },
    { label: "Plannings", href: "/plannings-hebdomadaires" },
    { label: "À valider" },
  ];

  // Fonction pour récupérer les plannings générés pour la semaine/année sélectionnée
  const fetchGeneratedSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<{
        success: boolean;
        data: GeneratedSchedule[];
      }>(`/api/schedules/pending?weekNumber=${weekNumber}&year=${year}`);

      setSchedules(response.data.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des plannings:", error);
      setError("Impossible de récupérer les plannings. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, [weekNumber, year]);

  // Chargement initial des données
  useEffect(() => {
    fetchGeneratedSchedules();
  }, [fetchGeneratedSchedules]);

  // Mise à jour de la semaine et de l'année lorsque la date sélectionnée change
  useEffect(() => {
    if (selectedDate) {
      setWeekNumber(getISOWeek(selectedDate));
      setYear(selectedDate.getFullYear());
    }
  }, [selectedDate]);

  // Fonction pour valider un planning
  const handleApprove = async (scheduleId: string) => {
    setSubmitting(true);
    setError(null);

    try {
      await axios.patch(`/api/schedules/${scheduleId}/validate`, {
        status: "approved",
      });

      setSuccess("Planning validé avec succès");
      setShowSuccessToast(true);

      // Mettre à jour l'état local ou rafraîchir la liste
      fetchGeneratedSchedules();
    } catch (error) {
      console.error("Erreur lors de la validation du planning:", error);
      setError("Impossible de valider le planning. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setSubmitting(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  // Fonction pour refuser un planning
  const handleReject = async (scheduleId: string) => {
    setSubmitting(true);
    setError(null);

    try {
      await axios.patch(`/api/schedules/${scheduleId}/reject`, {
        status: "rejected",
      });

      setSuccess("Planning refusé avec succès");
      setShowSuccessToast(true);

      // Mettre à jour l'état local ou rafraîchir la liste
      fetchGeneratedSchedules();
    } catch (error) {
      console.error("Erreur lors du refus du planning:", error);
      setError("Impossible de refuser le planning. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setSubmitting(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  // Fonction pour ouvrir la modal de confirmation d'approbation
  const openApproveConfirmModal = (
    scheduleId: string,
    employeeName: string
  ) => {
    setConfirmModal({
      isOpen: true,
      scheduleId,
      employeeName,
      action: "approve",
    });
  };

  // Fonction pour ouvrir la modal de confirmation de refus
  const openRejectConfirmModal = (scheduleId: string, employeeName: string) => {
    setConfirmModal({
      isOpen: true,
      scheduleId,
      employeeName,
      action: "reject",
    });
  };

  // Fonction pour fermer la modal de confirmation
  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  // Fonction pour fermer les notifications
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
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
            status: "pending",
            notes: "Besoin de cette semaine pour mission terrain",
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
            status: "pending",
            notes: "Besoin d'un jour de repos supplémentaire si possible",
            generatedBy: "IA-123",
            timestamp: "2025-04-10T10:35:00Z",
          },
        ];

  return (
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

      {/* Modal de confirmation */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        title={
          confirmModal.action === "approve"
            ? "Confirmer la validation"
            : "Confirmer le refus"
        }
      >
        <div className="p-6">
          <p className="mb-4 text-[var(--text-primary)]">
            {confirmModal.action === "approve"
              ? `Êtes-vous sûr de vouloir valider le planning de ${confirmModal.employeeName} ?`
              : `Êtes-vous sûr de vouloir refuser le planning de ${confirmModal.employeeName} ?`}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={closeConfirmModal}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              variant={confirmModal.action === "approve" ? "primary" : "danger"}
              onClick={() =>
                confirmModal.action === "approve"
                  ? handleApprove(confirmModal.scheduleId)
                  : handleReject(confirmModal.scheduleId)
              }
              isLoading={submitting}
              icon={
                confirmModal.action === "approve" ? (
                  <Check size={16} />
                ) : (
                  <X size={16} />
                )
              }
            >
              {confirmModal.action === "approve" ? "Valider" : "Refuser"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* En-tête avec fil d'ariane */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Titre de la page */}
      <SectionTitle
        title="Plannings à valider"
        subtitle="Consultez et validez les plannings soumis par vos équipes"
        icon={<ClipboardList size={24} />}
        className="mb-8"
      />

      {/* Sélecteur de date et filtres */}
      <SectionCard
        title={`Semaine ${weekNumber} - ${year}`}
        description={getWeekDateRange(year, weekNumber)}
        className="mb-8"
      >
        <div className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="w-full md:w-72">
              <DatePicker
                label="Sélectionner une semaine"
                selectedDate={selectedDate}
                onChange={setSelectedDate}
                placeholder="JJ/MM/AAAA"
              />
            </div>
            <Button
              variant="secondary"
              icon={<Calendar size={16} />}
              onClick={() => {
                setSelectedDate(new Date());
                setWeekNumber(getCurrentISOWeek());
                setYear(getCurrentYear());
              }}
            >
              Semaine actuelle
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Contenu principal - Liste des plannings */}
      <SectionCard title="Plannings en attente de validation" className="mb-8">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : fallbackSchedules.length > 0 ? (
          <div className="p-4 overflow-x-auto">
            <Table
              columns={[
                { key: "employee", label: "Employé", className: "w-48" },
                { key: "week", label: "Semaine" },
                { key: "status", label: "Statut", className: "w-28" },
                { key: "notes", label: "Notes" },
                { key: "actions", label: "Actions", className: "w-48" },
              ]}
              data={fallbackSchedules.map((schedule) => ({
                employee: (
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={schedule.employeeName}
                      src={schedule.photoUrl}
                      size="sm"
                    />
                    <span className="font-medium">{schedule.employeeName}</span>
                  </div>
                ),
                week: (
                  <div>
                    <div className="font-medium">
                      Semaine {schedule.weekNumber}, {schedule.year}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {getWeekDateRange(schedule.year, schedule.weekNumber)}
                    </div>
                  </div>
                ),
                status: (
                  <Badge
                    variant={getStatusVariant(schedule.status)}
                    label={formatStatus(schedule.status)}
                  />
                ),
                notes: (
                  <div className="max-w-xs truncate" title={schedule.notes}>
                    {schedule.notes || "Aucune note"}
                  </div>
                ),
                actions: (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        openApproveConfirmModal(
                          schedule._id,
                          schedule.employeeName
                        )
                      }
                      icon={<Check size={16} />}
                      disabled={schedule.status !== "pending" || submitting}
                    >
                      Valider
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        openRejectConfirmModal(
                          schedule._id,
                          schedule.employeeName
                        )
                      }
                      icon={<X size={16} />}
                      disabled={schedule.status !== "pending" || submitting}
                    >
                      Refuser
                    </Button>
                  </div>
                ),
              }))}
              emptyState={{
                title: "Aucun planning à valider",
                description:
                  "Il n'y a actuellement aucun planning en attente de validation.",
                icon: <CalendarCheck size={40} />,
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarCheck
              size={48}
              className="text-[var(--text-tertiary)] mb-4"
            />
            <p className="text-lg text-[var(--text-primary)] mb-2">
              Aucun planning à valider pour cette semaine
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">
              Tous les plannings ont été traités ou aucun n'a été soumis
            </p>
          </div>
        )}
      </SectionCard>

      {/* Section détaillant les plannings validés */}
      <SectionCard title="Détails des plannings" className="mb-8">
        {fallbackSchedules.length > 0 ? (
          <div className="space-y-8 p-4">
            {fallbackSchedules.map((schedule) => (
              <motion.div
                key={schedule._id}
                className="bg-[var(--background-secondary)] rounded-lg overflow-hidden border border-[var(--border)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* En-tête du planning */}
                <div className="p-6 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center">
                    <Avatar
                      name={schedule.employeeName}
                      src={schedule.photoUrl}
                      size="md"
                      className="mr-4"
                    />
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {schedule.employeeName}
                      </h2>
                      <div className="flex items-center mt-1">
                        <Badge
                          variant={getStatusVariant(schedule.status)}
                          label={formatStatus(schedule.status)}
                        />
                        <span className="text-sm text-[var(--text-secondary)] ml-2">
                          Généré le{" "}
                          {new Date(schedule.timestamp).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grille du planning */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[var(--border)]">
                    <thead className="bg-[var(--background-tertiary)]">
                      <tr>
                        {DAYS_OF_WEEK.map((day) => (
                          <th
                            key={day}
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider"
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-[var(--background-secondary)] divide-y divide-[var(--border)]">
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
                                      className="bg-[var(--accent-secondary)] text-[var(--accent-primary)] text-sm rounded-md px-3 py-1.5 text-center"
                                    >
                                      {timeSlot}
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="text-[var(--text-tertiary)] text-center text-sm">
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

                {/* Notes du planning */}
                {schedule.notes && (
                  <div className="p-4 border-t border-[var(--border)]">
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Notes:
                    </h3>
                    <p className="text-sm text-[var(--text-primary)]">
                      {schedule.notes}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <p className="mb-2">Aucun planning disponible</p>
            <p className="text-sm">
              Sélectionnez une autre semaine ou contactez le support si
              nécessaire
            </p>
          </div>
        )}
      </SectionCard>
    </PageWrapper>
  );
};

export default PlanningValidationPage;
