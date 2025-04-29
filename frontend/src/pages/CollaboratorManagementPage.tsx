/**
 * CollaboratorManagementPage - Page de gestion des collaborateurs (version Manager)
 *
 * Interface dédiée permettant à un manager de gérer ses équipes et leurs collaborateurs:
 * - Création/modification/suppression d'équipes
 * - Affichage des collaborateurs filtrés sur les équipes du manager connecté
 * - Création/édition/suppression de collaborateurs
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  Edit,
  Plus,
  Settings,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

// Hooks personnalisés
import { useAuth } from "../hooks/useAuth";
import useEmployeeActions, {
  NewEmployeeData,
} from "../hooks/useEmployeeActions";
import useEmployeesByTeam, { Employee } from "../hooks/useEmployeesByTeam";

// Composants de layout
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Composants modaux
import CollaboratorFormModal from "../components/modals/CollaboratorFormModal";
import ManageTeamsModal from "../components/modals/ManageTeamsModal";

// Interface pour les équipes
interface Team {
  _id: string;
  name: string;
  managerId: string;
  companyId: string;
}

// Interface étendue pour l'employé (avec email)
interface EmployeeWithEmail extends Employee {
  email?: string;
}

// Types pour les formulaires d'équipes
interface TeamFormData {
  name: string;
  companyId: string;
}

interface TeamFormErrors {
  name?: string;
}

// Définition des colonnes du tableau pour les collaborateurs
const collaboratorColumns = [
  { key: "name", label: "Nom", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "status", label: "Statut", sortable: true },
  { key: "team", label: "Équipe", sortable: true },
  { key: "contractHours", label: "Heures/semaine", sortable: true },
  { key: "actions", label: "Actions", sortable: false },
];

// Éléments du fil d'ariane
const breadcrumbItems = [
  { label: "Dashboard", link: "/tableau-de-bord" },
  { label: "Gestion des collaborateurs", link: "/collaborateurs" },
];

// Variantes d'animation
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: -20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: -20 },
};

/**
 * Composant principal de la page de gestion des collaborateurs (pour managers)
 */
const CollaboratorManagementPage: React.FC = () => {
  const { user } = useAuth();

  // ID de l'équipe sélectionnée (utilisé pour useEmployeesByTeam)
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // États pour les équipes du manager
  const [managerTeams, setManagerTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState<boolean>(false);

  // États pour les notifications
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // États pour le modal d'ajout/édition de collaborateurs
  const [collaboratorModalOpen, setCollaboratorModalOpen] =
    useState<boolean>(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Partial<
    NewEmployeeData & { _id?: string }
  > | null>(null);

  // États pour le modal de suppression de collaborateurs
  const [deleteEmployeeModalOpen, setDeleteEmployeeModalOpen] =
    useState<boolean>(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string>("");

  // États pour le modal de gestion des équipes
  const [teamModalOpen, setTeamModalOpen] = useState<boolean>(false);
  const [teamFormData, setTeamFormData] = useState<TeamFormData>({
    name: "",
    companyId: user?.companyId || "",
  });
  const [teamFormErrors, setTeamFormErrors] = useState<TeamFormErrors>({});
  const [teamsToDisplay, setTeamsToDisplay] = useState<Team[]>([]);
  const [isTeamEditMode, setIsTeamEditMode] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // États pour le modal de suppression d'équipe
  const [deleteTeamModalOpen, setDeleteTeamModalOpen] =
    useState<boolean>(false);
  const [teamToDelete, setTeamToDelete] = useState<string>("");

  // États pour le modal de gestion des équipes
  const [manageTeamsModalOpen, setManageTeamsModalOpen] =
    useState<boolean>(false);

  // Hooks pour les employés et les actions sur les employés
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
    refetchEmployees,
  } = useEmployeesByTeam(selectedTeamId);
  const { deleteEmployee } = useEmployeeActions();

  /**
   * Affiche un message toast
   */
  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccessMessage(message);
      setShowSuccessToast(true);
    } else {
      setErrorMessage(message);
      setShowErrorToast(true);
    }
  };

  /**
   * Récupération des équipes du manager connecté
   */
  const fetchManagerTeams = useCallback(async () => {
    if (!user || user.role !== "manager") return;

    setTeamsLoading(true);
    try {
      console.log("Récupération des équipes pour le manager:", user._id);

      // Appel à l'API pour récupérer les équipes du manager
      const response = await axiosInstance.get(`/api/teams`);
      if (response.data && response.data.success) {
        const teams = response.data.data;
        setManagerTeams(teams);
        setTeamsToDisplay(teams);

        // Sélectionner la première équipe seulement si aucune n'est sélectionnée
        if (selectedTeamId === undefined && teams.length > 0) {
          setSelectedTeamId(teams[0]._id);
        }
      } else {
        throw new Error(
          response.data?.message || "Erreur lors de la récupération des équipes"
        );
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des équipes:", err);
      showToast("Impossible de récupérer la liste des équipes", "error");
    } finally {
      setTeamsLoading(false);
    }
  }, [user, selectedTeamId]);

  /**
   * Chargement initial des équipes du manager
   */
  useEffect(() => {
    if (user && user.role === "manager") {
      fetchManagerTeams();
    }
  }, [fetchManagerTeams, user]);

  /**
   * Gestion des erreurs API
   */
  useEffect(() => {
    if (employeesError) showToast(employeesError, "error");

    // Nettoyage lors du démontage
    return () => {
      setShowSuccessToast(false);
      setShowErrorToast(false);
    };
  }, [employeesError]);

  /**
   * Création d'une nouvelle équipe
   */
  const createTeam = async () => {
    if (!validateTeamForm()) return;

    try {
      const response = await axiosInstance.post("/api/teams", teamFormData);

      if (response.data && response.data.success) {
        await fetchManagerTeams();
        setTeamModalOpen(false);
        resetTeamForm();
        showToast("Équipe créée avec succès", "success");
      } else {
        throw new Error(
          response.data?.message || "Erreur lors de la création de l'équipe"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'équipe:", error);
      showToast(
        error instanceof Error ? error.message : "Une erreur est survenue",
        "error"
      );
    }
  };

  /**
   * Mise à jour d'une équipe existante
   */
  const updateTeam = async () => {
    if (!validateTeamForm() || !selectedTeam) return;

    try {
      const response = await axiosInstance.patch(
        `/api/teams/${selectedTeam._id}`,
        teamFormData
      );

      if (response.data && response.data.success) {
        await fetchManagerTeams();
        setTeamModalOpen(false);
        resetTeamForm();
        showToast("Équipe mise à jour avec succès", "success");
      } else {
        throw new Error(
          response.data?.message || "Erreur lors de la mise à jour de l'équipe"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'équipe:", error);
      showToast(
        error instanceof Error ? error.message : "Une erreur est survenue",
        "error"
      );
    }
  };

  /**
   * Suppression d'une équipe
   */
  const deleteTeam = async () => {
    if (!teamToDelete) return;

    try {
      const response = await axiosInstance.delete(`/api/teams/${teamToDelete}`);

      if (response.data && response.data.success) {
        // Si l'équipe supprimée est celle qui est sélectionnée, réinitialiser la sélection
        if (teamToDelete === selectedTeamId) {
          setSelectedTeamId("");
        }

        await fetchManagerTeams();
        setDeleteTeamModalOpen(false);
        showToast("Équipe supprimée avec succès", "success");
      } else {
        throw new Error(
          response.data?.message || "Erreur lors de la suppression de l'équipe"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'équipe:", error);
      showToast(
        error instanceof Error ? error.message : "Une erreur est survenue",
        "error"
      );
    }
  };

  /**
   * Transformer les employés pour l'affichage dans le tableau
   */
  const displayedEmployees = useMemo(() => {
    if (!employees || !employees.length) {
      return [];
    }

    // Transformer les employés pour l'affichage
    return employees.map((employee) => {
      // Trouver l'équipe associée
      const team = managerTeams.find((t) => t._id === employee.teamId);

      // Considérer l'employé avec potentiellement un email
      const employeeWithEmail = employee as EmployeeWithEmail;

      return {
        _id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employeeWithEmail.email || "Email non défini",
        status: (
          <Badge
            type={employee.status === "actif" ? "success" : "warning"}
            label={employee.status === "actif" ? "Actif" : "Inactif"}
          />
        ),
        team: team ? team.name : "Non assignée",
        contractHours: employee.contractHoursPerWeek || 35,
        actions: (
          <motion.div
            className="flex space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit size={16} />}
              onClick={() =>
                handleOpenEditCollaborator(employee as EmployeeWithEmail)
              }
              aria-label="Modifier ce collaborateur"
            >
              {""}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={16} className="text-red-500" />}
              onClick={() => handleOpenDeleteEmployeeModal(employee._id)}
              aria-label="Supprimer ce collaborateur"
            >
              {""}
            </Button>
          </motion.div>
        ),
      };
    });
  }, [employees, managerTeams]);

  /**
   * Ouvrir le modal pour créer un nouveau collaborateur
   */
  const handleOpenCreateCollaborator = () => {
    setSelectedCollaborator(null);
    setCollaboratorModalOpen(true);
  };

  /**
   * Ouvrir le modal pour éditer un collaborateur existant
   */
  const handleOpenEditCollaborator = (employee: EmployeeWithEmail) => {
    setSelectedCollaborator({
      _id: employee._id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      teamId: employee.teamId,
      contractHoursPerWeek: employee.contractHoursPerWeek,
      status: employee.status as "actif" | "inactif",
      companyId: employee.companyId,
    });
    setCollaboratorModalOpen(true);
  };

  /**
   * Ouvrir le modal de suppression de collaborateur
   */
  const handleOpenDeleteEmployeeModal = (id: string) => {
    setEmployeeToDelete(id);
    setDeleteEmployeeModalOpen(true);
  };

  /**
   * Suppression d'un collaborateur
   */
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      await deleteEmployee(employeeToDelete);
      setDeleteEmployeeModalOpen(false);
      showToast("Collaborateur supprimé avec succès", "success");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la suppression",
        "error"
      );
    }
  };

  /**
   * Fermer les toasts
   */
  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  /**
   * Validation du formulaire d'équipe
   */
  const validateTeamForm = (): boolean => {
    const errors: TeamFormErrors = {};

    // Validation du nom de l'équipe
    if (!teamFormData.name.trim()) {
      errors.name = "Le nom de l'équipe est requis";
    }

    setTeamFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Réinitialisation du formulaire d'équipe
   */
  const resetTeamForm = () => {
    setTeamFormData({
      name: "",
      companyId: user?.companyId || "",
    });
    setTeamFormErrors({});
    setIsTeamEditMode(false);
    setSelectedTeam(null);
  };

  /**
   * Gestion des changements d'entrée du formulaire d'équipe
   */
  const handleTeamInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTeamFormData((prev) => ({ ...prev, [name]: value }));

    // Effacer l'erreur lorsque l'utilisateur modifie le champ
    if (teamFormErrors[name as keyof TeamFormErrors]) {
      setTeamFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Ouvrir le modal de gestion des équipes
   */
  const handleOpenTeamModal = () => {
    resetTeamForm();
    setTeamModalOpen(true);
  };

  /**
   * Ouvrir le modal d'édition d'équipe
   */
  const handleEditTeam = (team: Team) => {
    setIsTeamEditMode(true);
    setSelectedTeam(team);
    setTeamFormData({
      name: team.name,
      companyId: team.companyId,
    });
    setTeamModalOpen(true);
  };

  /**
   * Ouvrir le modal de suppression d'équipe
   */
  const handleOpenDeleteTeamModal = (teamId: string) => {
    setTeamToDelete(teamId);
    setDeleteTeamModalOpen(true);
  };

  /**
   * Soumission du formulaire d'équipe
   */
  const handleTeamFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isTeamEditMode) {
      await updateTeam();
    } else {
      await createTeam();
    }
  };

  /**
   * Gestion du changement de sélection d'équipe
   */
  const handleTeamSelection = (teamId: string) => {
    setSelectedTeamId(teamId);
  };

  // Options d'équipes pour le select (uniquement les équipes du manager)
  const teamOptions = managerTeams.map((team) => ({
    value: team._id,
    label: team.name,
  }));

  // Vérifier si l'utilisateur est bien un manager
  if (user && user.role !== "manager") {
    return (
      <LayoutWithSidebar activeItem="collaborateurs">
        <PageWrapper>
          <Breadcrumb items={breadcrumbItems} />
          <SectionCard>
            <motion.div
              className="p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Shield size={48} className="mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Accès non autorisé
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Cette page est réservée aux managers.
              </p>
            </motion.div>
          </SectionCard>
        </PageWrapper>
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar activeItem="collaborateurs">
      <PageWrapper>
        {/* Fil d'ariane */}
        <Breadcrumb items={breadcrumbItems} />

        {/* En-tête de page */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SectionTitle
            title="Gestion des collaborateurs"
            subtitle="Gérez les équipes et les collaborateurs"
            icon={
              <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            }
          />

          {/* Bouton d'ajout de collaborateur */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              icon={<UserPlus size={16} />}
              onClick={handleOpenCreateCollaborator}
              aria-label="Ajouter un nouveau collaborateur"
            >
              Ajouter un collaborateur
            </Button>
            <Button
              variant="secondary"
              icon={<Settings size={16} />}
              onClick={() => setManageTeamsModalOpen(true)}
            >
              Gérer mes équipes
            </Button>
          </div>
        </motion.div>

        {/* Sélecteur d'équipe */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Select
            label="Équipe"
            options={[
              { value: "", label: "Toutes les équipes" },
              ...teamOptions,
            ]}
            value={selectedTeamId}
            onChange={handleTeamSelection}
            disabled={teamsLoading || managerTeams.length === 0}
          />
        </motion.div>

        {/* Contenu principal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <SectionCard>
            {teamsLoading ? (
              <div className="flex justify-center items-center p-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : managerTeams.length === 0 ? (
              <Card className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucune équipe trouvée
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Vous n'avez pas encore créé d'équipes. Commencez par créer
                    une équipe pour ajouter des collaborateurs.
                  </p>
                  <Button
                    variant="primary"
                    icon={<Plus size={16} />}
                    onClick={handleOpenTeamModal}
                    aria-label="Ajouter un nouveau collaborateur"
                  >
                    Ajouter un collaborateur
                  </Button>
                </motion.div>
              </Card>
            ) : employeesLoading ? (
              <div className="flex justify-center items-center p-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : displayedEmployees.length === 0 ? (
              <Card className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <User size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucun collaborateur trouvé
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {selectedTeamId
                      ? "Cette équipe ne contient pas encore de collaborateurs."
                      : "Vous n'avez pas encore de collaborateurs dans vos équipes."}
                  </p>
                  <Button
                    variant="primary"
                    icon={<Plus size={16} />}
                    onClick={handleOpenCreateCollaborator}
                    aria-label="Ajouter un nouveau collaborateur"
                  >
                    Ajouter un collaborateur
                  </Button>
                </motion.div>
              </Card>
            ) : (
              <AnimatePresence>
                <Table
                  columns={collaboratorColumns}
                  data={displayedEmployees}
                />
              </AnimatePresence>
            )}
          </SectionCard>
        </motion.div>

        {/* Toast de succès */}
        <Toast
          type="success"
          message={successMessage}
          isVisible={showSuccessToast}
          onClose={closeSuccessToast}
        />

        {/* Toast d'erreur */}
        <Toast
          type="error"
          message={errorMessage}
          isVisible={showErrorToast}
          onClose={closeErrorToast}
        />

        {/* Modal de confirmation de suppression d'équipe */}
        <AnimatePresence>
          {deleteTeamModalOpen && (
            <Modal
              isOpen={deleteTeamModalOpen}
              onClose={() => setDeleteTeamModalOpen(false)}
              title="Confirmer la suppression"
            >
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={modalVariants}
              >
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Êtes-vous sûr de vouloir supprimer cette équipe ? Cette
                    action est irréversible. Tous les collaborateurs de cette
                    équipe seront désassociés.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteTeamModalOpen(false)}
                    disabled={teamsLoading}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="danger"
                    onClick={deleteTeam}
                    isLoading={teamsLoading}
                  >
                    Supprimer
                  </Button>
                </div>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>

        {/* Modal de confirmation de suppression de collaborateur */}
        <AnimatePresence>
          {deleteEmployeeModalOpen && (
            <Modal
              isOpen={deleteEmployeeModalOpen}
              onClose={() => setDeleteEmployeeModalOpen(false)}
              title="Confirmer la suppression"
            >
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={modalVariants}
              >
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Êtes-vous sûr de vouloir supprimer ce collaborateur ? Cette
                    action est irréversible.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteEmployeeModalOpen(false)}
                    disabled={employeesLoading}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDeleteEmployee}
                    isLoading={employeesLoading}
                  >
                    Supprimer
                  </Button>
                </div>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>

        {/* Modal de gestion des équipes */}
        <ManageTeamsModal
          isOpen={manageTeamsModalOpen}
          onClose={() => setManageTeamsModalOpen(false)}
          teams={managerTeams}
          companyId={user?.companyId || ""}
          onTeamsUpdated={(updatedTeams) => {
            setManagerTeams(updatedTeams);
            setTeamsToDisplay(updatedTeams);

            // ✅ Corrigé : respecter la sélection "Toutes les équipes" (selectedTeamId === "")
            const selectedExists = updatedTeams.some(
              (t) => t._id === selectedTeamId
            );

            if (selectedTeamId !== "" && !selectedExists) {
              setSelectedTeamId(updatedTeams[0]?._id || "");
            }
          }}
        />

        {/* Modal d'ajout/édition de collaborateur */}
        <CollaboratorFormModal
          isOpen={collaboratorModalOpen}
          onClose={() => setCollaboratorModalOpen(false)}
          onSuccess={(isEditMode) => {
            // Rafraîchir les données avant de fermer le modal
            refetchEmployees();

            // Afficher un toast dynamique selon l'opération effectuée
            if (isEditMode) {
              showToast("Collaborateur modifié avec succès", "success");
            } else {
              showToast("Collaborateur ajouté avec succès", "success");
            }

            setCollaboratorModalOpen(false);
          }}
          initialData={
            selectedCollaborator as
              | Partial<NewEmployeeData & { _id?: string }>
              | undefined
          }
          teams={teamOptions}
          companyId={user?.companyId || ""}
        />
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default CollaboratorManagementPage;
