/**
 * AdminPlanningPage - Page d'administration des plannings
 *
 * Permet aux administrateurs de visualiser tous les plannings
 * avec des filtres par entreprise, équipe et employé.
 */
import {
  Building,
  Calendar,
  Clock,
  Eye,
  Filter,
  Search,
  User,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

// Composants de layout
import LayoutWithSidebar from "../../components/layout/LayoutWithSidebar";
import PageWrapper from "../../components/layout/PageWrapper";
import SectionCard from "../../components/layout/SectionCard";
import SectionTitle from "../../components/layout/SectionTitle";

// Composants UI
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Table from "../../components/ui/Table";
import Toast from "../../components/ui/Toast";

// Types
interface Company {
  _id: string;
  name: string;
}

interface Team {
  _id: string;
  name: string;
  companyId: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  teamId?: string;
  companyId: string;
}

interface Schedule {
  _id: string;
  year: number;
  weekNumber: number;
  scheduleData: Record<string, string[]>;
  dailyNotes?: Record<string, string>;
  totalWeeklyMinutes: number;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  teamId?: string;
  teamName?: string;
  companyId: string;
  companyName: string;
  updatedByName?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Jours de la semaine
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
  { label: "Admin", link: "/admin" },
  { label: "Gestion des plannings", link: "/admin/plannings" },
];

const AdminPlanningPage: React.FC = () => {
  // États pour les données
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // États pour les filtres
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  // États pour l'UI
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);

  // Options pour les années
  const yearOptions = Array.from({ length: 11 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return { label: year.toString(), value: year.toString() };
  });

  // Options pour les semaines
  const weekOptions = Array.from({ length: 53 }, (_, i) => ({
    label: `Semaine ${i + 1}`,
    value: (i + 1).toString(),
  }));

  /**
   * Charger les entreprises
   */
  const fetchCompanies = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/admin/companies");
      if (response.data.success) {
        setCompanies(response.data.data || []);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des entreprises:", err);
    }
  }, []);

  /**
   * Charger les équipes selon l'entreprise sélectionnée
   */
  const fetchTeams = useCallback(async () => {
    if (!selectedCompany) {
      setTeams([]);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/admin/teams?companyId=${selectedCompany}`
      );
      if (response.data.success) {
        setTeams(response.data.data || []);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des équipes:", err);
      setTeams([]);
    }
  }, [selectedCompany]);

  /**
   * Charger les employés selon l'équipe sélectionnée
   */
  const fetchEmployees = useCallback(async () => {
    if (!selectedTeam) {
      setEmployees([]);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/admin/employees/team/${selectedTeam}`
      );
      if (response.data.success) {
        setEmployees(response.data.data || []);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des employés:", err);
      setEmployees([]);
    }
  }, [selectedTeam]);

  /**
   * Charger les plannings avec filtres
   */
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (selectedCompany) params.append("companyId", selectedCompany);
      if (selectedTeam) params.append("teamId", selectedTeam);
      if (selectedEmployee) params.append("employeeId", selectedEmployee);
      if (selectedYear) params.append("year", selectedYear);
      if (selectedWeek) params.append("weekNumber", selectedWeek);
      if (searchTerm) params.append("search", searchTerm);

      params.append("page", currentPage.toString());
      params.append("limit", "20");

      const response = await axiosInstance.get(
        `/weekly-schedules/admin/all?${params.toString()}`
      );

      if (response.data.success) {
        setSchedules(response.data.data || []);
        setPagination(
          response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 20,
          }
        );
      }
    } catch (err) {
      console.error("Erreur lors du chargement des plannings:", err);
      setError("Erreur lors du chargement des plannings");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, [
    selectedCompany,
    selectedTeam,
    selectedEmployee,
    selectedYear,
    selectedWeek,
    currentPage,
    searchTerm,
  ]);

  /**
   * Effets pour charger les données
   */
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  /**
   * Gestionnaires d'événements
   */
  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value);
    setSelectedTeam("");
    setSelectedEmployee("");
    setCurrentPage(1);
  };

  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
    setSelectedEmployee("");
    setCurrentPage(1);
  };

  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    setCurrentPage(1);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setCurrentPage(1);
  };

  const handleWeekChange = (value: string) => {
    setSelectedWeek(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsViewModalOpen(true);
  };

  const resetFilters = () => {
    setSelectedCompany("");
    setSelectedTeam("");
    setSelectedEmployee("");
    setSelectedYear(new Date().getFullYear().toString());
    setSelectedWeek("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  /**
   * Calcul du temps total hebdomadaire
   */
  const calculateTotalHours = (
    scheduleData: Record<string, string[]>
  ): string => {
    let totalMinutes = 0;

    Object.values(scheduleData).forEach((slots) => {
      slots.forEach((slot) => {
        const [start, end] = slot.split("-");
        if (start && end) {
          const [startHour, startMin] = start.split(":").map(Number);
          const [endHour, endMin] = end.split(":").map(Number);

          const startTotalMin = startHour * 60 + startMin;
          const endTotalMin = endHour * 60 + endMin;

          totalMinutes += endTotalMin - startTotalMin;
        }
      });
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return minutes > 0
      ? `${hours}h${minutes.toString().padStart(2, "0")}`
      : `${hours}h`;
  };

  /**
   * Configuration du tableau
   */
  const tableColumns = [
    { key: "employeeName", label: "Employé", className: "w-48" },
    { key: "companyName", label: "Entreprise", className: "w-40" },
    { key: "teamName", label: "Équipe", className: "w-32" },
    { key: "period", label: "Période", className: "w-32" },
    { key: "totalTime", label: "Total", className: "w-24" },
    { key: "updatedBy", label: "Mis à jour par", className: "w-40" },
    { key: "actions", label: "Actions", className: "w-32" },
  ];

  const tableData = schedules.map((schedule) => ({
    employeeName: schedule.employeeName,
    companyName: schedule.companyName,
    teamName: schedule.teamName || "Non assigné",
    period: `S${schedule.weekNumber}, ${schedule.year}`,
    totalTime: calculateTotalHours(schedule.scheduleData),
    updatedBy: schedule.updatedByName || "Inconnu",
    actions: (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleViewSchedule(schedule)}
        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        title="Voir le détail du planning"
      >
        <Eye className="h-4 w-4" />
      </Button>
    ),
  }));

  return (
    <LayoutWithSidebar
      activeItem="admin-plannings"
      pageTitle="Gestion des plannings"
    >
      <PageWrapper>
        {/* Notifications */}
        <Toast
          message={error || ""}
          type="error"
          isVisible={showErrorToast}
          onClose={() => setShowErrorToast(false)}
        />

        {/* En-tête avec fil d'ariane */}
        <div className="mb-6">
          <SectionTitle
            title="Gestion des plannings"
            subtitle="Vue d'ensemble de tous les plannings de toutes les entreprises"
            icon={<Calendar className="text-violet-500" />}
          />
          <Breadcrumb items={breadcrumbItems} className="mt-2" />
        </div>

        {/* Section des filtres */}
        <SectionCard className="mb-6">
          <div className="space-y-4">
            {/* Titre de la section filtres */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="text-gray-500" size={18} />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                Filtres de recherche
              </h3>
            </div>

            {/* Première ligne de filtres */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Entreprise"
                options={[
                  { label: "Toutes les entreprises", value: "" },
                  ...companies.map((company) => ({
                    label: company.name,
                    value: company._id,
                  })),
                ]}
                value={selectedCompany}
                onChange={handleCompanyChange}
                icon={<Building size={18} />}
                className="mb-0"
              />

              <Select
                label="Équipe"
                options={[
                  { label: "Toutes les équipes", value: "" },
                  ...teams.map((team) => ({
                    label: team.name,
                    value: team._id,
                  })),
                ]}
                value={selectedTeam}
                onChange={handleTeamChange}
                icon={<Users size={18} />}
                className="mb-0"
                disabled={!selectedCompany}
              />

              <Select
                label="Employé"
                options={[
                  { label: "Tous les employés", value: "" },
                  ...employees.map((employee) => ({
                    label: `${employee.firstName} ${employee.lastName}`,
                    value: employee._id,
                  })),
                ]}
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                icon={<User size={18} />}
                className="mb-0"
                disabled={!selectedTeam}
              />

              <InputField
                label="Recherche"
                name="search"
                placeholder="Nom, email, entreprise..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                icon={<Search size={18} />}
                className="mb-0"
              />
            </div>

            {/* Deuxième ligne de filtres */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Année"
                options={yearOptions}
                value={selectedYear}
                onChange={handleYearChange}
                icon={<Calendar size={18} />}
                className="mb-0"
              />

              <Select
                label="Semaine"
                options={[
                  { label: "Toutes les semaines", value: "" },
                  ...weekOptions,
                ]}
                value={selectedWeek}
                onChange={handleWeekChange}
                icon={<Clock size={18} />}
                className="mb-0"
              />

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section des résultats */}
        <SectionCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Plannings trouvés ({pagination.totalItems})
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : schedules.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table
                  columns={tableColumns}
                  data={tableData}
                  pagination={true}
                  rowsPerPage={20}
                  emptyState={{
                    title: "Aucun planning trouvé",
                    description: "Aucun planning ne correspond à vos critères",
                    icon: <Calendar size={40} className="text-gray-400" />,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun planning trouvé
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Aucun planning ne correspond aux critères de recherche
                sélectionnés.
              </p>
            </div>
          )}
        </SectionCard>

        {/* Modal de détail du planning */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={
            selectedSchedule
              ? `Planning de ${selectedSchedule.employeeName}`
              : "Détails du planning"
          }
          className="w-full max-w-[95vw] mx-auto"
        >
          {selectedSchedule && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedSchedule.employeeEmail}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Entreprise
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedSchedule.companyName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Équipe
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedSchedule.teamName || "Non assigné"}
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
                    Temps total
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {calculateTotalHours(selectedSchedule.scheduleData)}
                  </p>
                </div>
              </div>

              {/* Planning hebdomadaire */}
              <div>
                <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-6">
                  Planning de la semaine
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4 lg:gap-6">
                  {DAY_KEYS.map((day, index) => (
                    <div
                      key={day}
                      className="p-4 lg:p-5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[120px]"
                    >
                      <label className="text-sm lg:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 block text-center">
                        {DAYS_OF_WEEK[index]}
                      </label>
                      <div className="space-y-2">
                        {selectedSchedule.scheduleData[day]?.length > 0 ? (
                          selectedSchedule.scheduleData[day].map((slot, i) => (
                            <div
                              key={i}
                              className="text-sm lg:text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700 px-3 py-2 lg:px-4 lg:py-3 rounded-md shadow-sm border border-gray-100 dark:border-gray-600 font-medium text-center"
                            >
                              {slot}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm lg:text-base text-gray-500 dark:text-gray-400 italic text-center py-4">
                            Repos
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedSchedule.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Notes
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {selectedSchedule.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default AdminPlanningPage;
