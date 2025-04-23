/**
 * AdminTeamViewer - Interface administrateur pour gérer les équipes d'une entreprise
 *
 * Cette page permet aux administrateurs de SmartPlanning de visualiser et gérer
 * l'ensemble des équipes associées à une entreprise spécifique.
 */
import axios from "axios";
import { Edit, Plus, Trash2, Users } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Hooks personnalisés
import {
  useCreateAdminTeam,
  useDeleteAdminTeam,
  useFetchAdminTeams,
  useUpdateAdminTeam,
} from "../../hooks/adminTeams";
import { useAuth } from "../../hooks/useAuth";

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
import Table from "../../components/ui/Table";
import Toast from "../../components/ui/Toast";

// Types
interface Team {
  _id: string;
  name: string;
  managerIds: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  companyId: string;
  createdAt: string;
}

interface CreateTeamInput {
  name: string;
  managerIds: string[];
  companyId: string;
}

interface UpdateTeamInput {
  name?: string;
  managerIds?: string[];
}

interface Manager {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Company {
  _id: string;
  name: string;
}

// Type pour le formulaire
interface TeamFormData {
  name: string;
  managerIds: string[];
}

// Type pour les erreurs du formulaire
interface TeamFormErrors {
  name?: string;
  managerIds?: string;
}

/**
 * Définition des types pour les hooks API
 */
interface TeamAPIData {
  teams?: Team[];
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
  const teams = teamsApi.teams as Team[] | undefined;
  const isLoadingTeams = teamsApi.loading as boolean;
  const teamsError = teamsApi.error;
  const refetchTeams = teamsApi.refetch;

  const createTeamApi = useCreateAdminTeam();
  const updateTeamApi = useUpdateAdminTeam();
  const deleteTeamApi = useDeleteAdminTeam();

  // États pour les données
  const [managers, setManagers] = useState<Manager[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingManagers, setIsLoadingManagers] = useState<boolean>(false);

  // États pour les modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // États pour le formulaire
  const [formData, setFormData] = useState<TeamFormData>({
    name: "",
    managerIds: [],
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

        const response = await axios.get(`/api/admin/companies/${companyId}`);
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

  // Récupérer les managers disponibles
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        if (!companyId) return;

        setIsLoadingManagers(true);
        const response = await axios.get(
          `/api/admin/users?role=manager&companyId=${companyId}`
        );
        setManagers(response.data.users || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des managers:", error);
        showToast("Impossible de charger la liste des managers", "error");
      } finally {
        setIsLoadingManagers(false);
      }
    };

    fetchManagers();
  }, [companyId]);

  // Afficher les erreurs des hooks dans des toasts
  useEffect(() => {
    if (teamsError) {
      showToast("Erreur lors du chargement des équipes", "error");
    }
  }, [teamsError]);

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

    return teams.map((team) => ({
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
            icon={<Edit size={16} />}
            onClick={() => handleOpenEditModal(team)}
            aria-label="Modifier"
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
    setFormData({
      name: "",
      managerIds: managers.length > 0 ? [managers[0]._id] : [],
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  /**
   * Ouvrir le modal d'édition d'équipe
   */
  const handleOpenEditModal = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      managerIds: team.managerIds.map((manager) => manager._id),
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  /**
   * Ouvrir le modal de suppression d'équipe
   */
  const handleOpenDeleteModal = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
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
    setFormData((prev) => ({ ...prev, managerIds: [value] }));

    if (formErrors.managerIds) {
      setFormErrors((prev) => ({ ...prev, managerIds: undefined }));
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
      companyId,
    };
    try {
      await createTeamApi.createAdminTeam(payload);
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
    };

    try {
      await updateTeamApi.updateAdminTeam(selectedTeam._id, payload);
      setIsEditModalOpen(false);
      showToast("Équipe mise à jour avec succès", "success");
      refetchTeams();
    } catch (error: any) {
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
            disabled={isLoadingTeams || isLoadingManagers}
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
                disabled={isLoadingManagers}
              >
                Ajouter une équipe
              </Button>
            </Card>
          ) : (
            <Table columns={columns} data={tableData} />
          )}
        </SectionCard>

        {/* Modal d'ajout d'équipe */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Ajouter une équipe"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateTeam();
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
              value={formData.managerIds}
              onChange={handleManagerChange}
              disabled={managers.length === 0 || isLoadingManagers}
              className="mb-4"
              isMulti
            />

            {formErrors.managerIds && (
              <p className="text-red-500 text-sm mb-4">
                {formErrors.managerIds}
              </p>
            )}

            {managers.length === 0 && !isLoadingManagers && (
              <p className="text-amber-500 mb-4">
                Aucun manager disponible. Veuillez d'abord ajouter des
                utilisateurs avec le rôle "manager".
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

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={createTeamApi.loading}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={
                  managers.length === 0 ||
                  createTeamApi.loading ||
                  isLoadingManagers
                }
                isLoading={createTeamApi.loading}
              >
                Ajouter
              </Button>
            </div>
          </form>
        </Modal>

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
              value={formData.managerIds}
              onChange={handleManagerChange}
              disabled={managers.length === 0 || isLoadingManagers}
              className="mb-4"
              isMulti
            />

            {formErrors.managerIds && (
              <p className="text-red-500 text-sm mb-4">
                {formErrors.managerIds}
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
                disabled={updateTeamApi.loading || isLoadingManagers}
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
