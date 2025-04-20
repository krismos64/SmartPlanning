/**
 * WeeklySchedulePage - Page de gestion des plannings hebdomadaires
 *
 * Permet de visualiser et créer des plannings hebdomadaires pour les employés.
 * Inclut la recherche par semaine/année et un formulaire de création interactif.
 */
import axios from "axios";
import { getISOWeek, getYear } from "date-fns";
import { motion } from "framer-motion";
import { Calendar, Clock, Search, Users } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

// Composants de layout
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
import Select from "../components/ui/Select";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Types pour les différentes entités
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

// Interface pour les données d'horaires par jour
interface ScheduleData {
  [day: string]: string[];
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

/**
 * Composant principal WeeklySchedulePage
 */
const WeeklySchedulePage: React.FC = () => {
  // État pour la sélection de semaine et date
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState<number>(
    // Calcul du numéro de semaine actuel
    Math.ceil(
      (new Date().getTime() -
        new Date(new Date().getFullYear(), 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    )
  );
  // État pour stocker la date sélectionnée dans le DatePicker
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // États pour les données et le chargement
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

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

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Plannings", href: "/plannings" },
    { label: `Semaine ${weekNumber}` },
  ];

  /**
   * Gestionnaire de changement de date dans le DatePicker
   * Extrait l'année et le numéro de semaine ISO à partir de la date sélectionnée
   */
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setYear(getYear(date));
    setWeekNumber(getISOWeek(date));
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
      // On ne définit pas d'erreur pour ne pas perturber l'UX principale
    }
  }, []);

  // Chargement initial des données
  useEffect(() => {
    fetchSchedules();
    fetchEmployees();
  }, [fetchSchedules, fetchEmployees]);

  /**
   * Gestionnaire de changement pour le formulaire de création
   */
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

  /**
   * Fonction pour créer un nouveau planning
   */
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      setError("Veuillez sélectionner un employé");
      setShowErrorToast(true);
      return;
    }

    // Vérifier si au moins une journée contient des horaires
    const hasScheduleData = Object.values(newScheduleData).some(
      (arr) => arr.length > 0
    );
    if (!hasScheduleData) {
      setError("Veuillez spécifier au moins un horaire");
      setShowErrorToast(true);
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
      setShowSuccessToast(true);

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
      setShowErrorToast(true);
    } finally {
      setCreatingSchedule(false);
    }
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
    { key: "notes", label: "Notes", className: "w-48" },
  ];

  /**
   * Formatage des données pour le composant Table
   * Intégration d'Avatars pour l'affichage des employés
   */
  const tableData = schedules.map((schedule) => {
    const rowData: Record<string, any> = {
      id: schedule._id,
      // Intégration d'un Avatar avec le nom de l'employé
      employee: (
        <div className="flex items-center gap-2">
          <Avatar name={schedule.employeeName} size="sm" />
          <span>{schedule.employeeName}</span>
        </div>
      ),
      notes: schedule.notes || "—",
    };

    // Ajouter les données par jour
    DAY_KEYS.forEach((day) => {
      rowData[day] = formatScheduleTimes(schedule.scheduleData[day]);
    });

    return rowData;
  });

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

      {/* En-tête avec fil d'ariane */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex-grow"></div>
      </div>

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
        className="mb-8"
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
                  icon: <Calendar size={40} />,
                }}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              Aucun planning validé trouvé pour cette semaine.
            </div>
          )}
        </SectionCard>
      </motion.div>

      {/* Formulaire de création de planning */}
      <motion.div
        ref={formRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <SectionCard
          title="Créer un nouveau planning"
          accentColor="var(--success)"
        >
          <form onSubmit={handleCreateSchedule}>
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

            <div className="mb-6">
              <h3 className="font-medium text-[var(--text-primary)] mb-3">
                Horaires
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                {DAY_KEYS.map((day, index) => (
                  <InputField
                    key={day}
                    label={DAYS_OF_WEEK[index]}
                    name={`schedule-${day}`}
                    placeholder="9h-12h, 14h-17h"
                    value={newScheduleData[day].join(", ")}
                    onChange={(e) =>
                      handleScheduleDataChange(day, e.target.value)
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Notes (optionnel)
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

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={creatingSchedule}
                icon={<Clock size={18} />}
              >
                Créer le planning
              </Button>
            </div>
          </form>
        </SectionCard>
      </motion.div>
    </PageWrapper>
  );
};

export default WeeklySchedulePage;
