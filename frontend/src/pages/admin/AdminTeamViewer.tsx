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
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
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

  // Fonction pour récupérer toutes les entreprises (pour l'admin)
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);

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
          `/admin/companies/${companyId}`
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

    console.log("Teams data pour le tableau:", teams);

    return teams.map((team: TeamAPITeam) => {
      console.log(
        "Processing team:",
        team.name,
        "with managers:",
        team.managerIds
      );

      // Vérifier si le manager existe et a des données valides
      const hasValidManager =
        team.managerIds &&
        Array.isArray(team.managerIds) &&
        team.managerIds.length > 0 &&
        team.managerIds[0] &&
        team.managerIds[0].firstName &&
        team.managerIds[0].lastName;

      console.log(
        "Has valid manager:",
        hasValidManager,
        "for team:",
        team.name
      );

      // Créer le nom du manager avec une vérification robuste
      const managerName = hasValidManager
        ? `${team.managerIds[0].firstName} ${team.managerIds[0].lastName}`
        : "Non défini";

      // Créer l'email du manager avec une vérification robuste
      const managerEmail =
        hasValidManager && team.managerIds[0].email
          ? team.managerIds[0].email
          : "-";

      console.log("Manager name:", managerName, "Manager email:", managerEmail);

      return {
        _id: team._id,
        name: team.name,
        manager: managerName,
        email: managerEmail,
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
      };
    });
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

  // Récupérer toutes les entreprises pour l'admin
  useEffect(() => {
    const fetchAllCompanies = async () => {
      if (user?.role !== "admin") return;

      try {
        setLoadingCompanies(true);
        const response = await axiosInstance.get("/admin/companies");

        if (response.data && Array.isArray(response.data.data)) {
          setAllCompanies(response.data.data);
        } else if (Array.isArray(response.data)) {
          setAllCompanies(response.data);
        } else {
          console.error(
            "Format de réponse inattendu pour les entreprises:",
            response.data
          );
        }
      } catch (error) {
        console.error("Erreur lors du chargement des entreprises:", error);
        showToast("Impossible de charger la liste des entreprises", "error");
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchAllCompanies();
  }, [user?.role]);

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
        {/* En-tête futuriste de l'entreprise */}
        {company && (
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6 mb-6 shadow-2xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Effet de particules en arrière-plan */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-blue-600/20">
              <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
            </div>

            {/* Contenu de l'en-tête */}
            <div className="relative z-10 flex items-center space-x-6">
              {/* Logo de l'entreprise */}
              {company.logoUrl ? (
                <motion.div
                  className="flex-shrink-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                    <img
                      src={company.logoUrl}
                      alt={`Logo de ${company.name}`}
                      className="relative w-20 h-20 object-contain rounded-2xl bg-white/10 backdrop-blur-sm p-3 border border-white/20"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="flex-shrink-0 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <div className="text-white text-2xl font-bold">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                </motion.div>
              )}

              {/* Informations de l'entreprise */}
              <motion.div
                className="flex-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold text-white mb-2 tracking-wide">
                  {company.name}
                </h2>
                <div className="flex items-center space-x-4 text-white/80">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Équipes actives</span>
                  </div>
                  {teams && (
                    <div className="flex items-center space-x-2">
                      <Users size={16} className="text-white/60" />
                      <span className="text-sm font-medium">
                        {teams.length} équipe{teams.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Décoration géométrique */}
              <motion.div
                className="hidden lg:block"
                initial={{ rotate: 0, scale: 0 }}
                animate={{ rotate: 360, scale: 1 }}
                transition={{ delay: 0.4, duration: 1, type: "spring" }}
              >
                <div className="w-16 h-16 border-2 border-white/20 rounded-lg transform rotate-45 relative">
                  <div className="absolute inset-2 border border-white/30 rounded-md"></div>
                  <div className="absolute inset-4 bg-white/10 rounded-sm"></div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

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
            <>
              {/* Affichage desktop - Tableau */}
              <div className="hidden md:block">
                <Table columns={columns} data={tableData} />
              </div>

              {/* Affichage mobile - Cards */}
              <div className="md:hidden space-y-4">
                {teams?.map((team) => {
                  // Vérifier si le manager existe et a des données valides
                  const hasValidManager =
                    team.managerIds &&
                    Array.isArray(team.managerIds) &&
                    team.managerIds.length > 0 &&
                    team.managerIds[0] &&
                    team.managerIds[0].firstName &&
                    team.managerIds[0].lastName;

                  const managerName = hasValidManager
                    ? `${team.managerIds[0].firstName} ${team.managerIds[0].lastName}`
                    : "Non défini";

                  const managerEmail =
                    hasValidManager && team.managerIds[0].email
                      ? team.managerIds[0].email
                      : "-";

                  return (
                    <div
                      key={team._id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                    >
                      {/* En-tête de la card */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {team.name}
                          </h3>
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Users size={14} className="mr-1 flex-shrink-0" />
                              <span className="truncate">
                                Manager: {managerName}
                              </span>
                            </div>
                            {managerEmail && managerEmail !== "-" && (
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <span className="mr-1">@</span>
                                <span className="truncate">{managerEmail}</span>
                              </div>
                            )}
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Créée le{" "}
                              {new Date(team.createdAt).toLocaleDateString(
                                "fr-FR"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                            <Users
                              size={20}
                              className="text-indigo-600 dark:text-indigo-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Users size={16} />}
                          onClick={() => handleOpenDetailModal(team)}
                          className="flex-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        >
                          Détails
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => handleOpenDeleteModal(team)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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
          availableCompanies={allCompanies}
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
