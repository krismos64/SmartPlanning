/**
 * AdminTeamViewer - Interface administrateur pour gérer les équipes d'une entreprise
 *
 * Cette page permet aux administrateurs de SmartPlanning de visualiser et gérer
 * l'ensemble des équipes associées à une entreprise spécifique.
 */
import { motion } from "framer-motion";
import { Plus, Trash2, Users } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

// Hooks personnalisés
import {
  useCreateAdminTeam,
  useDeleteAdminTeam,
  useFetchAdminTeams,
  useUpdateAdminTeam,
} from "../../hooks/adminTeams";
import { useAuth } from "../../hooks/useAuth";
import useFetchCompanyUsers from "../../hooks/useFetchCompanyUsers";

// Composants de layout
import LayoutWithSidebar from "../../components/layout/LayoutWithSidebar";
import PageWrapper from "../../components/layout/PageWrapper";
import SectionCard from "../../components/layout/SectionCard";
import SectionTitle from "../../components/layout/SectionTitle";

// Composants UI
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import InputField from "../../components/ui/InputField";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import SelectMulti from "../../components/ui/SelectMulti";
import Table from "../../components/ui/Table";
import Toast from "../../components/ui/Toast";

// Composant pour la création d'équipe
import CreateTeamModal from "../../components/admin/teams/CreateTeamModal";
// Composant pour les détails d'une équipe
import TeamDetailPanel from "../../components/admin/teams/TeamDetailPanel";

// Types
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  status: string;
}

interface Manager {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Team {
  _id: string;
  name: string;
  managerIds: Manager[];
  employeeIds: Employee[];
  companyId: string;
  createdAt: string;
}

interface TeamAPITeam {
  _id: string;
  name: string;
  managerIds: Manager[];
  employeeIds?: string[] | Employee[];
  companyId: string;
  createdAt: string;
}

interface CreateTeamInput {
  name: string;
  managerIds: string[];
  employeeIds: string[];
  companyId: string;
}

interface UpdateTeamInput {
  name?: string;
  managerIds?: string[];
  employeeIds?: string[];
}

interface Company {
  _id: string;
  name: string;
}

// Type pour le formulaire
interface TeamFormData {
  name: string;
  managerIds: string[];
  employeeIds: string[];
}

// Type pour les erreurs du formulaire
interface TeamFormErrors {
  name?: string;
  managerIds?: string;
  employeeIds?: string;
}

/**
 * Définition des types pour les hooks API
 */
interface TeamAPIData {
  teams?: TeamAPITeam[];
  error?: any;
  loading?: boolean;
  refetch?: () => void;
}

/**
 * Composant principal pour la visualisation et gestion des équipes d'une entreprise
 */
const AdminTeamViewer: React.FC = () => {
  const { id: companyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hooks API
  const teamsApi = useFetchAdminTeams(companyId || "") as any;
  const teams = teamsApi.teams as TeamAPITeam[] | undefined;
  const isLoadingTeams = teamsApi.loading as boolean;
  const teamsError = teamsApi.error;
  const refetchTeams = teamsApi.refetch;

  const createTeamApi = useCreateAdminTeam();
  const updateTeamApi = useUpdateAdminTeam();
  const deleteTeamApi = useDeleteAdminTeam();

  // Utilisation du hook pour récupérer les managers
  const {
    users: managers,
    loading: isLoadingManagers,
    error: managersError,
  } = useFetchCompanyUsers(companyId || "", "manager");

  // Utilisation du hook pour récupérer les employés
  const {
    users: employees,
    loading: isLoadingEmployees,
    error: employeesError,
  } = useFetchCompanyUsers(companyId || "", "employee");

  // États pour les données
  const [company, setCompany] = useState<Company | null>(null);

  // États pour les modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamAPITeam | null>(null);

  // États pour le formulaire
  const [formData, setFormData] = useState<TeamFormData>({
    name: "",
    managerIds: [],
    employeeIds: [],
  });
  const [formErrors, setFormErrors] = useState<TeamFormErrors>({});

  // États pour les notifications
  const [successToast, setSuccessToast] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });
  const [errorToast, setErrorToast] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });

  // Nouvel état pour le modal de détails
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Vérification de sécurité - rediriger si pas admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/tableau-de-bord");
    }
  }, [user, navigate]);

  // Récupérer les données de l'entreprise
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        if (!companyId) return;

        const response = await axiosInstance.get(
          `/api/admin/companies/${companyId}`
        );
        setCompany(response.data.data);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'entreprise:", error);
        showToast(
          "Impossible de charger les informations de l'entreprise",
          "error"
        );
      }
    };

    fetchCompany();
  }, [companyId]);

  // Afficher les erreurs des hooks dans des toasts
  useEffect(() => {
    if (teamsError) {
      showToast("Erreur lors du chargement des équipes", "error");
    }
  }, [teamsError]);

  useEffect(() => {
    if (managersError) {
      showToast("Erreur lors du chargement des managers", "error");
    }
  }, [managersError]);

  useEffect(() => {
    if (employeesError) {
      showToast("Erreur lors du chargement des employés", "error");
    }
  }, [employeesError]);

  useEffect(() => {
    if (createTeamApi.error) {
      showToast("Erreur lors de la création de l'équipe", "error");
    }
  }, [createTeamApi.error]);

  useEffect(() => {
    if (updateTeamApi.error) {
      showToast("Erreur lors de la mise à jour de l'équipe", "error");
    }
  }, [updateTeamApi.error]);

  useEffect(() => {
    if (deleteTeamApi.error) {
      showToast("Erreur lors de la suppression de l'équipe", "error");
    }
  }, [deleteTeamApi.error]);

  /**
   * Préparer les données pour le tableau des équipes
   */
  const tableData = useMemo(() => {
    if (!teams) return [];

    return teams.map((team: TeamAPITeam) => ({
      _id: team._id,
      name: team.name,
      manager: team.managerIds?.[0]
        ? `${team.managerIds[0].firstName} ${team.managerIds[0].lastName}`
        : "Non défini",
      email: team.managerIds?.[0]?.email || "-",

      createdAt: new Date(team.createdAt).toLocaleDateString(),
      actions: (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Users size={16} />}
            onClick={() => handleOpenDetailModal(team)}
            aria-label="Voir détails"
            children=""
          />

          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={16} className="text-red-500" />}
            onClick={() => handleOpenDeleteModal(team)}
            aria-label="Supprimer"
            children=""
          />
        </div>
      ),
    }));
  }, [teams]);

  /**
   * Définition des colonnes du tableau
   */
  const columns = [
    { key: "name", label: "Nom de l'équipe", sortable: true },
    { key: "manager", label: "Manager", sortable: true },
    { key: "email", label: "Email du manager", sortable: true },
    { key: "createdAt", label: "Date de création", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

  /**
   * Ouvrir le modal d'ajout d'équipe
   */
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  /**
   * Ouvrir le modal d'édition d'équipe
   */
  const handleOpenEditModal = (team: TeamAPITeam) => {
    setSelectedTeam(team);

    // Extraire les IDs des employés si disponibles
    const employeeIds = team.employeeIds
      ? Array.isArray(team.employeeIds)
        ? typeof team.employeeIds[0] === "string"
          ? (team.employeeIds as string[])
          : (team.employeeIds as any[]).map((e) => e._id)
        : []
      : [];

    setFormData({
      name: team.name,
      managerIds: team.managerIds.map((manager) => manager._id),
      employeeIds: employeeIds, // Initialiser les employeeIds
    });

    setFormErrors({});
    setIsEditModalOpen(true);
  };

  /**
   * Ouvrir le modal de suppression d'équipe
   */
  const handleOpenDeleteModal = (team: TeamAPITeam) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  /**
   * Ouvrir le modal de détails d'équipe
   */
  const handleOpenDetailModal = (team: TeamAPITeam) => {
    setSelectedTeam(team);
    setIsDetailModalOpen(true);
  };

  /**
   * Gestion des changements dans le formulaire
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Effacer l'erreur associée
    if (formErrors[name as keyof TeamFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Gestion du changement de manager
   */
  const handleManagerChange = (value: string) => {
    // Pour compatibilité avec l'ancien Select
    setFormData((prev) => ({ ...prev, managerIds: [value] }));

    if (formErrors.managerIds) {
      setFormErrors((prev) => ({ ...prev, managerIds: undefined }));
    }
  };

  /**
   * Gestion du changement d'employés
   */
  const handleEmployeeChange = (values: string[]) => {
    setFormData((prev) => ({ ...prev, employeeIds: values }));

    // Effacer l'erreur associée
    if (formErrors.employeeIds) {
      setFormErrors((prev) => ({ ...prev, employeeIds: undefined }));
    }
  };

  /**
   * Validation du formulaire
   */
  const validateForm = (): boolean => {
    const errors: TeamFormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Le nom de l'équipe est requis";
    }

    if (formData.managerIds.length === 0) {
      errors.managerIds = "Veuillez sélectionner au moins un manager";
    }

    if (formData.employeeIds.length === 0) {
      errors.employeeIds = "Veuillez sélectionner au moins un employé";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Créer une nouvelle équipe
   */
  const handleCreateTeam = async () => {
    if (!validateForm() || !companyId) return;

    const payload: CreateTeamInput = {
      name: formData.name,
      managerIds: formData.managerIds,
      employeeIds: [], // Cette fonction n'est plus utilisée avec le nouveau modal
      companyId,
    };
    try {
      await createTeamApi.createAdminTeam(payload as any); // Type casting temporaire
      setIsAddModalOpen(false);
      showToast("Équipe créée avec succès", "success");
      refetchTeams();
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          "Erreur lors de la création de l'équipe",
        "error"
      );
    }
  };

  /**
   * Mettre à jour une équipe existante
   */
  const handleUpdateTeam = async () => {
    if (!validateForm() || !selectedTeam) return;

    const payload: UpdateTeamInput = {
      name: formData.name,
      managerIds: formData.managerIds,
      employeeIds: formData.employeeIds,
    };

    console.log("Payload envoyé à l'API :", payload); // 👈 Ajout ici

    try {
      await updateTeamApi.updateAdminTeam(selectedTeam._id, payload);
      setIsEditModalOpen(false);
      showToast("Équipe mise à jour avec succès", "success");
      refetchTeams();
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'équipe:", error); // 👈 Log plus précis
      showToast(
        error.response?.data?.message ||
          "Erreur lors de la mise à jour de l'équipe",
        "error"
      );
    }
  };

  /**
   * Supprimer une équipe
   */
  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    try {
      await deleteTeamApi.deleteAdminTeam(selectedTeam._id);
      setIsDeleteModalOpen(false);
      showToast("Équipe supprimée avec succès", "success");
      refetchTeams();
    } catch (error: any) {
      setIsDeleteModalOpen(false);
      showToast(
        error.response?.data?.message ||
          "Erreur lors de la suppression de l'équipe",
        "error"
      );
    }
  };

  /**
   * Gérer la modification depuis le panneau de détails
   */
  const handleEditFromDetails = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => {
      if (selectedTeam) {
        handleOpenEditModal(selectedTeam);
      }
    }, 200);
  };

  /**
   * Afficher un toast
   */
  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccessToast({ visible: true, message });
    } else {
      setErrorToast({ visible: true, message });
    }
  };

  /**
   * Fermer les toasts
   */
  const closeSuccessToast = () => {
    setSuccessToast({ visible: false, message: "" });
  };

  const closeErrorToast = () => {
    setErrorToast({ visible: false, message: "" });
  };

  // Éléments du fil d'ariane
  const breadcrumbItems = [
    { label: "Admin", link: "/admin" },
    { label: "Entreprises", link: "/admin/entreprises" },
    {
      label: company?.name || "Entreprise",
      link: `/admin/entreprises/${companyId}`,
    },
    { label: "Équipes", link: `/admin/entreprises/${companyId}/equipes` },
  ];

  return (
    <LayoutWithSidebar activeItem="admin">
      <PageWrapper>
        {/* Fil d'ariane */}
        <Breadcrumb items={breadcrumbItems} />

        {/* En-tête de page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <SectionTitle
            title="Gestion des équipes"
            subtitle={`Gérez les équipes de l'entreprise ${
              company?.name || ""
            }`}
            icon={
              <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            }
          />

          {/* Bouton d'ajout d'équipe */}
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={handleOpenAddModal}
            disabled={isLoadingTeams || isLoadingManagers || isLoadingEmployees}
          >
            Ajouter une équipe
          </Button>
        </div>

        {/* Contenu principal */}
        <SectionCard>
          {isLoadingTeams ? (
            <div className="flex justify-center items-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : teamsError ? (
            <div className="text-center p-8 text-red-500">
              <p>Erreur lors du chargement des équipes</p>
            </div>
          ) : tableData.length === 0 ? (
            <Card className="p-8 text-center">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune équipe trouvée
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Cette entreprise n'a pas encore d'équipes.
              </p>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenAddModal}
                disabled={isLoadingManagers || isLoadingEmployees}
              >
                Ajouter une équipe
              </Button>
            </Card>
          ) : (
            <Table columns={columns} data={tableData} />
          )}
        </SectionCard>

        {/* Modal de création d'équipe futuriste et animé */}
        <CreateTeamModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onTeamCreated={refetchTeams}
          companyId={companyId || ""}
          availableManagers={managers.map((manager) => ({
            _id: manager._id,
            name: `${manager.firstName} ${manager.lastName}`,
          }))}
          availableEmployees={employees.map((employee) => ({
            _id: employee._id,
            name: `${employee.firstName} ${employee.lastName}`,
          }))}
        />

        {/* Modal d'édition d'équipe */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier une équipe"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateTeam();
            }}
          >
            <InputField
              label="Nom de l'équipe"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={formErrors.name}
              required
              className="mb-4"
            />

            <Select
              label="Managers"
              options={managers.map((manager) => ({
                value: manager._id,
                label: `${manager.firstName} ${manager.lastName} (${manager.email})`,
              }))}
              value={formData.managerIds[0] || ""}
              onChange={handleManagerChange}
              disabled={managers.length === 0 || isLoadingManagers}
              className="mb-4"
            />

            {formErrors.managerIds && (
              <p className="text-red-500 text-sm mb-4">
                {formErrors.managerIds}
              </p>
            )}

            {/* Nouveau champ de sélection multiple des employés */}
            <SelectMulti
              label="Employés"
              options={employees.map((employee) => ({
                value: employee._id,
                label: `${employee.firstName} ${employee.lastName} ${
                  employee.email ? `(${employee.email})` : ""
                }`,
              }))}
              value={formData.employeeIds}
              onChange={handleEmployeeChange}
              disabled={employees.length === 0 || isLoadingEmployees}
              className="mb-4"
              required
            />

            {formErrors.employeeIds && (
              <p className="text-red-500 text-sm mb-4">
                {formErrors.employeeIds}
              </p>
            )}

            {isLoadingManagers && (
              <div className="flex justify-center mb-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-gray-500">
                  Chargement des managers...
                </span>
              </div>
            )}

            {isLoadingEmployees && (
              <div className="flex justify-center mb-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-gray-500">
                  Chargement des employés...
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                disabled={updateTeamApi.loading}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={
                  updateTeamApi.loading ||
                  isLoadingManagers ||
                  isLoadingEmployees
                }
                isLoading={updateTeamApi.loading}
              >
                Enregistrer
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal de suppression d'équipe */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirmer la suppression"
        >
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Êtes-vous sûr de vouloir supprimer l'équipe{" "}
              <strong>{selectedTeam?.name}</strong> ? Cette action est
              irréversible.
            </p>
            <p className="text-amber-500">
              Si l'équipe contient des employés actifs, la suppression sera
              refusée.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteTeamApi.loading}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteTeam}
              disabled={deleteTeamApi.loading}
              isLoading={deleteTeamApi.loading}
            >
              Supprimer
            </Button>
          </div>
        </Modal>

        {/* Modal de détails d'équipe */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title=""
          className="max-w-4xl"
        >
          {selectedTeam && (
            <motion.div
              className="p-4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TeamDetailPanel
                team={selectedTeam as any}
                onEditClick={handleEditFromDetails}
              />
            </motion.div>
          )}
        </Modal>

        {/* Toast de succès */}
        <Toast
          type="success"
          message={successToast.message}
          isVisible={successToast.visible}
          onClose={closeSuccessToast}
        />

        {/* Toast d'erreur */}
        <Toast
          type="error"
          message={errorToast.message}
          isVisible={errorToast.visible}
          onClose={closeErrorToast}
        />
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default AdminTeamViewer;
