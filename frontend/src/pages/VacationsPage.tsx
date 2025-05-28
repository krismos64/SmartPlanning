/**
 * VacationsPage - Page de gestion des congés
 *
 * Permet aux employés de demander des congés et aux managers de les gérer.
 * Intègre les composants du design system SmartPlanning pour une expérience cohérente.
 */
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Plus, Search } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

// Hooks
import { useAuth } from "../hooks/useAuth";

// Composants de layout
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Toast from "../components/ui/Toast";

// Composants de vacances
import {
  VacationFormModal,
  VacationStats,
  VacationTable,
  formatDateForBackend,
  useVacationPermissions,
} from "../components/vacations";
import VacationExport from "../components/vacations/VacationExport";

// Types
import type {
  Company,
  Employee,
  Team,
  VacationFormData,
  VacationRequest,
} from "../components/vacations";

// Animations pour les transitions
const fadeInAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

const slideInAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, type: "spring", stiffness: 100 },
};

// Composant principal VacationsPage
const VacationsPage: React.FC = () => {
  // Récupération du rôle utilisateur depuis le contexte d'authentification
  const { user } = useAuth();
  const userRole = user?.role || "employee";

  // Utiliser le hook de permissions
  const permissions = useVacationPermissions(userRole);

  // État pour les demandes de congés
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>(
    []
  );

  // État pour le mode édition
  const [editingVacation, setEditingVacation] =
    useState<VacationRequest | null>(null);

  // État pour les employés accessibles
  const [accessibleEmployees, setAccessibleEmployees] = useState<Employee[]>(
    []
  );
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);

  // États pour le chargement et les notifications
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // État pour le formulaire de création
  const [formData, setFormData] = useState<VacationFormData>({
    startDate: "",
    endDate: "",
    reason: "",
    employeeId: undefined,
  });

  // État pour l'affichage du formulaire
  const [showForm, setShowForm] = useState<boolean>(false);

  // Nouveaux états pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(false);

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/tableau-de-bord" },
    { label: "Congés" },
  ];

  // Fonction pour récupérer les employés accessibles
  const fetchAccessibleEmployees = useCallback(async () => {
    if (!permissions.canSelectEmployee) return;

    setLoadingEmployees(true);
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: Employee[];
      }>("/employees/accessible");

      console.log("Employés accessibles reçus:", response.data.data);
      setAccessibleEmployees(response.data.data);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des employés accessibles:",
        error
      );
      setError("Erreur lors de la récupération des employés accessibles");
      setShowErrorToast(true);
    } finally {
      setLoadingEmployees(false);
    }
  }, [permissions.canSelectEmployee]);

  // Fonction pour récupérer les entreprises (admin uniquement)
  const fetchCompanies = useCallback(async () => {
    if (!permissions.canUseAdvancedFilters) return;

    setLoadingCompanies(true);
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: Company[];
      }>("/admin/companies");

      console.log("Entreprises reçues:", response.data.data);
      setCompanies(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des entreprises:", error);
      setError("Erreur lors de la récupération des entreprises");
      setShowErrorToast(true);
    } finally {
      setLoadingCompanies(false);
    }
  }, [permissions.canUseAdvancedFilters]);

  // Fonction pour récupérer les équipes d'une entreprise
  const fetchTeamsByCompany = useCallback(
    async (companyId: string) => {
      if (!companyId || !permissions.canUseAdvancedFilters) return;

      setLoadingTeams(true);
      try {
        const response = await axiosInstance.get<{
          success: boolean;
          data: Team[];
        }>(`/admin/teams?companyId=${companyId}`);

        console.log("Équipes reçues:", response.data.data);
        setTeams(response.data.data || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des équipes:", error);
        setError("Erreur lors de la récupération des équipes");
        setShowErrorToast(true);
      } finally {
        setLoadingTeams(false);
      }
    },
    [permissions.canUseAdvancedFilters]
  );

  // Fonction pour récupérer les équipes du directeur de son entreprise
  const fetchDirectorTeams = useCallback(async () => {
    if (userRole !== "directeur") return;

    setLoadingTeams(true);
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: Team[];
      }>("/teams");

      console.log("Équipes du directeur reçues:", response.data.data);
      setTeams(response.data.data || []);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des équipes du directeur:",
        error
      );
      setError("Erreur lors de la récupération des équipes");
      setShowErrorToast(true);
    } finally {
      setLoadingTeams(false);
    }
  }, [userRole]);

  // Gestionnaire de changement d'entreprise
  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedTeamId(""); // Réinitialiser l'équipe sélectionnée
    setTeams([]); // Vider la liste des équipes

    if (companyId) {
      fetchTeamsByCompany(companyId);
    }
  };

  // Fonction pour récupérer les demandes de congés
  const fetchVacationRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("Récupération des demandes de congés...");

    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: VacationRequest[];
      }>("/vacations");

      console.log("Demandes de congés reçues:", response.data);

      // Vérifier la structure des données reçues
      console.log("Structure des données:", response.data.data);
      console.log(
        "Nombre de demandes reçues:",
        response.data.data?.length || 0
      );

      // Analyser chaque demande pour identifier le problème
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((request, index) => {
          console.log(`Demande ${index}:`, {
            id: request._id,
            employeeId: request.employeeId,
            hasEmployeeId: !!request.employeeId,
            hasEmployeeIdId: !!(request.employeeId && request.employeeId._id),
            employeeName:
              typeof request.employeeId === "object" && request.employeeId
                ? `${request.employeeId.firstName} ${request.employeeId.lastName}`
                : "Employé non populé",
            startDate: request.startDate,
            endDate: request.endDate,
            status: request.status,
          });
        });
      }

      // CORRECTION TEMPORAIRE: Forcer les permissions à true pour tous
      // et filtrer les demandes avec des données invalides
      const requestsWithPermissions = (response.data.data || [])
        .filter((request) => {
          // Vérification de base : la demande doit exister et avoir un ID
          if (!request || !request._id) {
            console.log("Demande ignorée - pas d'ID:", request);
            return false;
          }

          // Si employeeId est null ou non populé, on garde quand même la demande
          // mais on log pour déboguer
          if (!request.employeeId) {
            console.log("Demande avec employeeId null/undefined:", request);
            // On garde la demande pour l'afficher, même si employeeId est null
            return true;
          }

          // Si employeeId est un string (pas encore populé), on garde aussi
          if (typeof request.employeeId === "string") {
            console.log("Demande avec employeeId non populé:", request);
            return true;
          }

          // Si employeeId est populé mais sans _id, on ignore
          if (
            typeof request.employeeId === "object" &&
            !request.employeeId._id
          ) {
            console.log(
              "Demande avec employeeId populé mais sans _id:",
              request
            );
            return false;
          }

          // Sinon la demande est valide
          return true;
        })
        .map((request) => {
          return {
            ...request,
            permissions: {
              canEdit: true,
              canDelete: true,
            },
          };
        });

      setVacationRequests(requestsWithPermissions);
      console.log(
        "État mis à jour avec les nouvelles demandes:",
        requestsWithPermissions
      );
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des demandes de congés:",
        error
      );
      setError("Erreur lors de la récupération des demandes de congés");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les équipes du directeur au montage si nécessaire
  useEffect(() => {
    if (userRole === "directeur") {
      fetchDirectorTeams();
    }
  }, [fetchDirectorTeams]);

  // Fonction pour approuver une demande
  const handleApproveVacation = async (id: string, comment?: string) => {
    try {
      await axiosInstance.patch(`/vacations/${id}/approve`, {
        comment,
      });
      setSuccess("Demande de congés approuvée avec succès");
      setShowSuccessToast(true);
      fetchVacationRequests();
    } catch (error: any) {
      console.error("Erreur lors de l'approbation:", error);
      setError(
        error.response?.data?.message ||
          "Erreur lors de l'approbation de la demande"
      );
      setShowErrorToast(true);
    }
  };

  // Fonction pour rejeter une demande
  const handleRejectVacation = async (id: string, comment?: string) => {
    try {
      await axiosInstance.patch(`/vacations/${id}/reject`, {
        comment,
      });
      setSuccess("Demande de congés rejetée avec succès");
      setShowSuccessToast(true);
      fetchVacationRequests();
    } catch (error: any) {
      console.error("Erreur lors du rejet:", error);
      setError(
        error.response?.data?.message || "Erreur lors du rejet de la demande"
      );
      setShowErrorToast(true);
    }
  };

  // Fonction pour supprimer une demande
  const handleDeleteVacation = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) {
      return;
    }

    setActionLoading(id);
    try {
      await axiosInstance.delete(`/vacations/${id}`);
      setSuccess("Demande de congés supprimée avec succès");
      setShowSuccessToast(true);
      fetchVacationRequests();
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      setError(
        error.response?.data?.message ||
          "Erreur lors de la suppression de la demande"
      );
      setShowErrorToast(true);
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour éditer une demande
  const handleEditVacation = (request: VacationRequest) => {
    setEditingVacation(request);
    setFormData({
      startDate: formatDateForBackend(request.startDate),
      endDate: formatDateForBackend(request.endDate),
      reason: request.reason || "",
      employeeId: request.employeeId?._id || undefined,
      status: request.status,
    });
    setShowForm(true);
  };

  // Fonction pour fermer le formulaire
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVacation(null);
    setFormData({
      startDate: "",
      endDate: "",
      reason: "",
      employeeId: undefined,
    });
  };

  // Fonction pour créer ou mettre à jour une demande
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation : seules les dates sont obligatoires, le motif est facultatif
    if (!formData.startDate || !formData.endDate) {
      setError("Veuillez remplir les dates de début et de fin");
      setShowErrorToast(true);
      return;
    }

    try {
      if (editingVacation) {
        // Mise à jour
        await axiosInstance.put(`/vacations/${editingVacation._id}`, formData);
        setSuccess("Demande de congés modifiée avec succès");
      } else {
        // Création
        await axiosInstance.post("/vacations", formData);
        setSuccess("Demande de congés créée avec succès");
      }

      setShowSuccessToast(true);
      handleCloseForm();
      fetchVacationRequests();
    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error);
      setError(
        error.response?.data?.message ||
          "Erreur lors de la soumission de la demande"
      );
      setShowErrorToast(true);
    }
  };

  // Charger les données au montage du composant et après les actions de succès
  useEffect(() => {
    fetchVacationRequests();
  }, [fetchVacationRequests, showSuccessToast]);

  // Charger les employés accessibles si l'utilisateur est manager, directeur ou admin
  useEffect(() => {
    if (permissions.canSelectEmployee) {
      fetchAccessibleEmployees();
    }
  }, [fetchAccessibleEmployees]);

  // Charger les entreprises pour admin au montage
  useEffect(() => {
    if (permissions.canUseAdvancedFilters) {
      fetchCompanies();
    }
  }, [fetchCompanies]);

  // Filtrer les demandes
  const filteredRequests = React.useMemo(() => {
    console.log("=== FILTRAGE FRONTEND ===");
    console.log("Nombre de demandes avant filtrage:", vacationRequests.length);
    console.log("SearchTerm:", searchTerm);
    console.log("UserRole:", userRole);

    let filtered = vacationRequests.filter((request) => {
      // Filtre par terme de recherche (nom de l'employé)
      if (
        searchTerm &&
        request.employeeId &&
        !`${request.employeeId?.firstName || ""} ${
          request.employeeId?.lastName || ""
        }`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        console.log(
          `Demande ${request._id} exclue par recherche: "${request.employeeId?.firstName} ${request.employeeId?.lastName}" ne contient pas "${searchTerm}"`
        );
        return false;
      }

      return true;
    });

    console.log("Nombre de demandes après filtrage:", filtered.length);
    console.log(
      "Demandes filtrées:",
      filtered.map((r) => ({
        id: r._id,
        employee:
          typeof r.employeeId === "object" && r.employeeId
            ? `${r.employeeId.firstName} ${r.employeeId.lastName}`
            : "Employé non populé",
        status: r.status,
        startDate: r.startDate,
      }))
    );

    return filtered;
  }, [vacationRequests, searchTerm]);

  return (
    <LayoutWithSidebar activeItem="congés">
      <PageWrapper>
        {/* Fil d'ariane */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Titre de la page */}
        <SectionTitle
          title="Gestion des Congés"
          subtitle={
            userRole === "employee"
              ? `Vos demandes de congés`
              : `Gérez les demandes de congés de votre équipe (Rôle: ${userRole})`
          }
          icon={<CalendarDays size={28} />}
        />

        {/* Statistiques pour les managers et plus */}
        {permissions.canViewAllRequests && (
          <VacationStats requests={vacationRequests} userRole={userRole} />
        )}

        {/* Bouton de création pour les employés */}
        {userRole === "employee" && (
          <motion.div {...slideInAnimation} transition={{ delay: 0.1 }}>
            <div className="mb-6 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
                icon={<Plus size={16} />}
              >
                Nouvelle demande de congés
              </Button>
            </div>
          </motion.div>
        )}

        {/* Section des filtres et recherche - uniquement pour managers+ */}
        {userRole !== "employee" && (
          <motion.div {...slideInAnimation} transition={{ delay: 0.1 }}>
            <SectionCard title="Recherche et actions" className="mb-6">
              <div className="flex gap-4 p-4 items-end">
                {/* Recherche par nom - uniquement pour managers+ */}
                {permissions.canViewAllRequests && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rechercher un employé
                    </label>
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Nom de l'employé..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Bouton pour créer une nouvelle demande */}
                <div className="flex gap-2">
                  {/* Export PDF pour managers+ */}
                  <VacationExport
                    requests={vacationRequests}
                    userRole={userRole}
                    teams={teams}
                    employees={accessibleEmployees}
                  />

                  <Button
                    variant="primary"
                    onClick={() => setShowForm(true)}
                    icon={<Plus size={16} />}
                  >
                    Nouvelle demande
                  </Button>
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* Liste des demandes de congés */}
        <motion.div {...slideInAnimation} transition={{ delay: 0.2 }}>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <VacationTable
              requests={filteredRequests}
              userRole={userRole}
              actionLoading={actionLoading}
              onApprove={handleApproveVacation}
              onReject={handleRejectVacation}
              onEdit={handleEditVacation}
              onDelete={handleDeleteVacation}
              onCreateNew={() => setShowForm(true)}
            />
          )}
        </motion.div>

        {/* Formulaire de création/édition */}
        <VacationFormModal
          isOpen={showForm}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          formData={formData}
          setFormData={setFormData}
          editingVacation={editingVacation}
          userRole={userRole}
          accessibleEmployees={accessibleEmployees}
          loadingEmployees={loadingEmployees}
        />

        {/* Toasts de notification */}
        <AnimatePresence>
          {showErrorToast && error && (
            <Toast
              type="error"
              message={error}
              isVisible={showErrorToast}
              onClose={() => {
                setShowErrorToast(false);
                setError(null);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccessToast && success && (
            <Toast
              type="success"
              message={success}
              isVisible={showSuccessToast}
              onClose={() => {
                setShowSuccessToast(false);
                setSuccess(null);
              }}
            />
          )}
        </AnimatePresence>
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default VacationsPage;
