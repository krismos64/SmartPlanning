/**
 * CollaboratorManagementPage - Page de gestion des collaborateurs
 *
 * Interface dédiée permettant aux directeurs et managers de gérer les collaborateurs de leur entreprise:
 * - Directeur: peut gérer les managers et employés de son entreprise
 * - Manager: peut gérer uniquement les employés de son équipe
 */
import { Edit, Plus, Trash2, User, Users } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Hooks personnalisés
import {
  useCreateCollaborator,
  useDeleteCollaborator,
  useFetchCollaborators,
  useUpdateCollaborator,
} from "../hooks/collaborator";
import { useAuth } from "../hooks/useAuth";

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
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Types pour les collaborateurs
import {
  Collaborator,
  CreateCollaboratorInput,
  UpdateCollaboratorInput,
} from "../types/Collaborator";

// Interface pour les équipes
interface Team {
  _id: string;
  name: string;
  managerId: string;
  companyId: string;
}

// Types pour les formulaires
interface CollaboratorFormData extends CreateCollaboratorInput {
  companyId: string;
}

interface CollaboratorFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  password?: string;
  teamId?: string;
  contractHoursPerWeek?: string;
}

// Définir les options de rôle selon le rôle de l'utilisateur connecté
const getAvailableRoles = (currentUserRole: string) => {
  if (currentUserRole === "directeur") {
    return [
      { value: "manager", label: "Manager" },
      { value: "employee", label: "Employé" },
    ];
  } else if (currentUserRole === "manager") {
    return [{ value: "employee", label: "Employé" }];
  }
  return [];
};

// Définition des colonnes du tableau
const collaboratorColumns = [
  { key: "name", label: "Nom", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "role", label: "Rôle", sortable: true },
  { key: "team", label: "Équipe", sortable: true },
  { key: "createdAt", label: "Date de création", sortable: true },
  { key: "actions", label: "Actions", sortable: false },
];

// Éléments du fil d'ariane
const breadcrumbItems = [
  { label: "Dashboard", link: "/tableau-de-bord" },
  { label: "Gestion des collaborateurs", link: "/collaborateurs" },
];

/**
 * Composant principal de la page de gestion des collaborateurs
 */
const CollaboratorManagementPage: React.FC = () => {
  const { user } = useAuth();

  // États pour les équipes
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState<boolean>(false);

  // États pour les notifications
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // États pour le modal d'ajout/édition
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [formData, setFormData] = useState<CollaboratorFormData>({
    firstName: "",
    lastName: "",
    email: "",
    role: "employee",
    password: "",
    teamId: undefined,
    contractHoursPerWeek: undefined,
    companyId: user?.companyId || "",
  });
  const [formErrors, setFormErrors] = useState<CollaboratorFormErrors>({});

  // États pour le modal de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [collaboratorToDelete, setCollaboratorToDelete] = useState<string>("");

  // États pour l'édition
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<Collaborator | null>(null);

  // Hooks API pour les collaborateurs
  const {
    collaborators,
    loading: fetchLoading,
    error: fetchError,
    refetch,
  } = useFetchCollaborators();

  const {
    createCollaborator,
    loading: createLoading,
    error: createError,
  } = useCreateCollaborator({
    onSuccess: () => {
      setModalOpen(false);
      refetch();
      showToast("Collaborateur ajouté avec succès", "success");
    },
    showToast: (message, type) => showToast(message, type),
  });

  const {
    updateCollaborator,
    loading: updateLoading,
    error: updateError,
  } = useUpdateCollaborator({
    onSuccess: () => {
      setModalOpen(false);
      refetch();
      showToast("Collaborateur mis à jour avec succès", "success");
    },
    showToast: (message, type) => showToast(message, type),
  });

  const {
    deleteCollaborator,
    loading: deleteLoading,
    error: deleteError,
  } = useDeleteCollaborator({
    onSuccess: () => {
      setDeleteModalOpen(false);
      refetch();
      showToast("Collaborateur supprimé avec succès", "success");
    },
    showToast: (message, type) => showToast(message, type),
  });

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
   * Récupération simulée des équipes
   */
  const fetchTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      // Simulation d'appel API - À remplacer par un vrai appel API
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Générer des données fictives d'équipes
      const mockTeams: Team[] = [
        {
          _id: "team1",
          name: "Équipe Développement",
          managerId: "1",
          companyId: user?.companyId || "",
        },
        {
          _id: "team2",
          name: "Équipe Marketing",
          managerId: "2",
          companyId: user?.companyId || "",
        },
      ];

      setTeams(mockTeams);
    } catch (err) {
      console.error("Erreur lors de la récupération des équipes:", err);
      showToast("Impossible de récupérer la liste des équipes", "error");
    } finally {
      setTeamsLoading(false);
    }
  }, [user]);

  /**
   * Chargement initial des équipes
   */
  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [fetchTeams, user]);

  /**
   * Affiche les erreurs des hooks API dans le toast
   */
  useEffect(() => {
    if (fetchError) {
      showToast(fetchError, "error");
    }
  }, [fetchError]);

  useEffect(() => {
    if (createError) {
      showToast(createError, "error");
    }
  }, [createError]);

  useEffect(() => {
    if (updateError) {
      showToast(updateError, "error");
    }
  }, [updateError]);

  useEffect(() => {
    if (deleteError) {
      showToast(deleteError, "error");
    }
  }, [deleteError]);

  /**
   * Filtrer les collaborateurs pour l'affichage dans le tableau
   */
  const filteredCollaborators = useMemo(() => {
    if (!collaborators || !collaborators.length) {
      return [];
    }

    return collaborators.map((collaborator) => {
      // Trouver l'équipe associée au collaborateur
      const team = teams.find((t) => t._id === collaborator.teamId);

      return {
        _id: collaborator._id,
        name: `${collaborator.firstName} ${collaborator.lastName}`,
        email: collaborator.email,
        role: (
          <Badge
            type={collaborator.role === "manager" ? "info" : "success"}
            label={collaborator.role}
          />
        ),
        team: team ? team.name : "Non assignée",
        createdAt: new Date(collaborator.createdAt).toLocaleDateString("fr-FR"),
        actions: (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit size={16} />}
              onClick={() => handleEditCollaborator(collaborator)}
              aria-label="Modifier"
            >
              {""}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={16} className="text-red-500" />}
              onClick={() => handleOpenDeleteModal(collaborator._id)}
              aria-label="Supprimer"
            >
              {""}
            </Button>
          </div>
        ),
      };
    });
  }, [collaborators, teams]);

  /**
   * Gestion des changements d'entrée du formulaire
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Effacer l'erreur lorsque l'utilisateur modifie le champ
    if (formErrors[name as keyof CollaboratorFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Gestion du changement de rôle
   */
  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value as "manager" | "employee",
    }));

    if (formErrors.role) {
      setFormErrors((prev) => ({ ...prev, role: undefined }));
    }
  };

  /**
   * Gestion du changement d'équipe
   */
  const handleTeamChange = (value: string) => {
    setFormData((prev) => ({ ...prev, teamId: value }));

    if (formErrors.teamId) {
      setFormErrors((prev) => ({ ...prev, teamId: undefined }));
    }
  };

  /**
   * Gestion du changement d'heures contractuelles
   */
  const handleContractHoursChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    setFormData((prev) => ({ ...prev, contractHoursPerWeek: value }));

    if (formErrors.contractHoursPerWeek) {
      setFormErrors((prev) => ({ ...prev, contractHoursPerWeek: undefined }));
    }
  };

  /**
   * Validation du formulaire
   */
  const validateForm = (): boolean => {
    const errors: CollaboratorFormErrors = {};

    // Validation du prénom
    if (!formData.firstName.trim()) {
      errors.firstName = "Le prénom est requis";
    }

    // Validation du nom
    if (!formData.lastName.trim()) {
      errors.lastName = "Le nom est requis";
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Veuillez entrer un email valide";
    }

    // Validation du mot de passe (uniquement lors de la création)
    if (!isEditMode && !formData.password?.trim()) {
      errors.password = "Le mot de passe est requis";
    } else if (
      !isEditMode &&
      formData.password &&
      formData.password.length < 6
    ) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    // Validation du rôle
    if (!formData.role) {
      errors.role = "Le rôle est requis";
    }

    // Si l'utilisateur est manager, le teamId est obligatoire pour les employés
    if (
      user?.role === "manager" &&
      formData.role === "employee" &&
      !formData.teamId
    ) {
      errors.teamId = "L'équipe est requise";
    }

    // Validation des heures contractuelles
    if (formData.contractHoursPerWeek !== undefined) {
      if (
        formData.contractHoursPerWeek < 0 ||
        formData.contractHoursPerWeek > 168
      ) {
        errors.contractHoursPerWeek =
          "Les heures doivent être comprises entre 0 et 168";
      }
    }

    // Mise à jour des erreurs et vérification si le formulaire est valide
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Ouvrir le modal d'ajout
   */
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedCollaborator(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: user?.role === "directeur" ? "manager" : "employee",
      password: "",
      teamId: user?.role === "manager" ? user._id : undefined,
      contractHoursPerWeek: 35,
      companyId: user?.companyId || "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  /**
   * Ouvrir le modal d'édition
   */
  const handleEditCollaborator = (collaborator: Collaborator) => {
    setIsEditMode(true);
    setSelectedCollaborator(collaborator);

    // Préparer les données du formulaire pour l'édition
    setFormData({
      firstName: collaborator.firstName,
      lastName: collaborator.lastName,
      email: collaborator.email,
      role: collaborator.role,
      password: "", // Vide car facultatif lors de la mise à jour
      teamId: collaborator.teamId,
      contractHoursPerWeek: collaborator.employee?.contractHoursPerWeek,
      companyId: collaborator.companyId,
    });

    setFormErrors({});
    setModalOpen(true);
  };

  /**
   * Soumission du formulaire d'ajout/édition
   */
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Préparer les données à envoyer
    const payload: CreateCollaboratorInput | UpdateCollaboratorInput = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role: formData.role,
      teamId: formData.teamId,
      contractHoursPerWeek: formData.contractHoursPerWeek,
    };

    // Ajouter le mot de passe uniquement lors de la création ou s'il est fourni lors de la mise à jour
    if (!isEditMode || (isEditMode && formData.password)) {
      (payload as CreateCollaboratorInput).password = formData.password!;
    }

    if (isEditMode && selectedCollaborator) {
      // Mise à jour d'un collaborateur existant
      await updateCollaborator(
        selectedCollaborator._id,
        payload as UpdateCollaboratorInput
      );
    } else {
      // Création d'un nouveau collaborateur
      await createCollaborator(payload as CreateCollaboratorInput);
    }
  };

  /**
   * Ouvrir le modal de suppression
   */
  const handleOpenDeleteModal = (id: string) => {
    setCollaboratorToDelete(id);
    setDeleteModalOpen(true);
  };

  /**
   * Suppression d'un collaborateur
   */
  const handleDeleteCollaborator = async () => {
    if (!collaboratorToDelete) return;
    await deleteCollaborator(collaboratorToDelete);
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
   * Rendu conditionnel du titre du modal selon le mode (ajout ou édition)
   */
  const renderModalTitle = () => {
    if (isEditMode) {
      return "Modifier un collaborateur";
    }
    return "Ajouter un nouveau collaborateur";
  };

  // Options de rôle disponibles selon le rôle de l'utilisateur connecté
  const roleOptions = getAvailableRoles(user?.role || "");

  // Options d'équipes pour le select
  const teamOptions = teams.map((team) => ({
    value: team._id,
    label: team.name,
  }));

  return (
    <LayoutWithSidebar activeItem="collaborateurs">
      <PageWrapper>
        {/* Fil d'ariane */}
        <Breadcrumb items={breadcrumbItems} />

        {/* En-tête de page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <SectionTitle
            title="Gestion des collaborateurs"
            subtitle="Gérez les collaborateurs de votre organisation"
            icon={
              <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            }
          />

          {/* Bouton d'ajout de collaborateur */}
          {(user?.role === "directeur" || user?.role === "manager") && (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleOpenAddModal}
            >
              Ajouter un collaborateur
            </Button>
          )}
        </div>

        {/* Contenu principal */}
        <SectionCard>
          {fetchLoading ? (
            <div className="flex justify-center items-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredCollaborators.length === 0 ? (
            <Card className="p-8 text-center">
              <User size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun collaborateur trouvé
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Vous n'avez pas encore de collaborateurs dans votre
                organisation.
              </p>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenAddModal}
              >
                Ajouter un collaborateur
              </Button>
            </Card>
          ) : (
            <Table columns={collaboratorColumns} data={filteredCollaborators} />
          )}
        </SectionCard>

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

        {/* Modal d'ajout/édition de collaborateur */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={renderModalTitle()}
        >
          <form onSubmit={handleSubmitForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                error={formErrors.firstName}
                required
              />
              <InputField
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                error={formErrors.lastName}
                required
              />
            </div>

            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={formErrors.email}
              required
            />

            {!isEditMode ? (
              <InputField
                label="Mot de passe"
                name="password"
                type="password"
                value={formData.password || ""}
                onChange={handleInputChange}
                error={formErrors.password}
                required
              />
            ) : (
              <InputField
                label="Nouveau mot de passe (laisser vide pour ne pas modifier)"
                name="password"
                type="password"
                value={formData.password || ""}
                onChange={handleInputChange}
                error={formErrors.password}
              />
            )}

            <Select
              label="Rôle"
              options={roleOptions}
              value={formData.role}
              onChange={handleRoleChange}
              className="mb-4"
            />

            {/* Afficher le sélecteur d'équipe uniquement si l'utilisateur est un directeur 
                ou si c'est un manager qui crée un employé */}
            {(user?.role === "directeur" ||
              (user?.role === "manager" && formData.role === "employee")) && (
              <Select
                label="Équipe"
                options={teamOptions}
                value={formData.teamId || ""}
                onChange={handleTeamChange}
                className="mb-4"
              />
            )}

            <InputField
              label="Heures contractuelles par semaine"
              name="contractHoursPerWeek"
              type="number"
              value={formData.contractHoursPerWeek?.toString() || ""}
              onChange={handleContractHoursChange}
              error={formErrors.contractHoursPerWeek}
            />

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={createLoading || updateLoading}
              >
                {isEditMode ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal de confirmation de suppression */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Confirmer la suppression"
        >
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Êtes-vous sûr de vouloir supprimer ce collaborateur ? Cette action
              est irréversible.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteCollaborator}
              isLoading={deleteLoading}
            >
              Supprimer
            </Button>
          </div>
        </Modal>
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default CollaboratorManagementPage;
