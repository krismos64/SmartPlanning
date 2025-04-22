/**
 * UserManagementPage - Page de gestion des utilisateurs
 *
 * Interface complète permettant à un administrateur de gérer les utilisateurs:
 * - Affichage de la liste des utilisateurs
 * - Filtrage par rôle et statut
 * - Ajout de nouveaux utilisateurs
 * - Mise à jour du rôle et statut des utilisateurs existants
 */
import axios from "axios";
import { Plus, User, UserCheck, Users, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Composants de layout
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Types pour les utilisateurs
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "directeur" | "manager" | "employé";
  status: "active" | "inactive";
  createdAt: string;
}

// Types pour les formulaires
interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

// Définir les options de rôle et statut
const roleOptions = [
  { value: "", label: "Tous les rôles" },
  { value: "admin", label: "Administrateur" },
  { value: "directeur", label: "Directeur" },
  { value: "manager", label: "Manager" },
  { value: "employé", label: "Employé" },
];

const statusOptions = [
  { value: "", label: "Tous les statuts" },
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
];

// Définition des colonnes du tableau
const userColumns = [
  { key: "name", label: "Nom", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "role", label: "Rôle", sortable: true },
  { key: "status", label: "Statut", sortable: true },
  { key: "createdAt", label: "Date de création", sortable: true },
  { key: "actions", label: "Actions", sortable: false },
];

// Éléments du fil d'ariane
const breadcrumbItems = [
  { label: "Dashboard", link: "/tableau-de-bord" },
  { label: "Utilisateurs", link: "/gestion-des-utilisateurs" },
];

/**
 * Composant principal de la page de gestion des utilisateurs
 */
const UserManagementPage: React.FC = () => {
  // États pour les utilisateurs et la pagination
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // États pour les filtres
  const [filters, setFilters] = useState({
    role: "",
    status: "",
  });

  // États pour les notifications
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);

  // États pour le modal d'ajout d'utilisateur
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    role: "employé",
  });
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});

  // États pour le modal de mise à jour du rôle
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserRole, setSelectedUserRole] = useState<string>("");

  /**
   * Récupération des utilisateurs depuis l'API
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/users");
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
      setError("Impossible de récupérer la liste des utilisateurs.");
      setShowErrorToast(true);
      setLoading(false);
    }
  }, []);

  /**
   * Chargement initial des utilisateurs
   */
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Effet pour filtrer les utilisateurs en fonction des critères
   */
  useEffect(() => {
    if (!users.length) {
      setFilteredUsers([]);
      return;
    }

    // Filtrage des utilisateurs
    let result = [...users];

    if (filters.role) {
      result = result.filter((user) => user.role === filters.role);
    }

    if (filters.status) {
      result = result.filter((user) => user.status === filters.status);
    }

    // Format des données pour le tableau
    const formattedUsers = result.map((user) => ({
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: (
        <Badge
          type={
            user.role === "admin"
              ? "info"
              : user.role === "directeur"
              ? "info"
              : user.role === "manager"
              ? "success"
              : "warning"
          }
          label={
            user.role === "admin"
              ? "Administrateur"
              : user.role === "directeur"
              ? "Directeur"
              : user.role === "manager"
              ? "Manager"
              : "Employé"
          }
        />
      ),
      status: (
        <Badge
          type={user.status === "active" ? "success" : "error"}
          label={user.status === "active" ? "Actif" : "Inactif"}
        />
      ),
      createdAt: new Date(user.createdAt).toLocaleDateString("fr-FR"),
      actions: (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleOpenRoleModal(user._id, user.role)}
            icon={
              <UserCheck
                size={14}
                className="text-indigo-600 dark:text-indigo-300"
              />
            }
            className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-indigo-300"
          >
            Rôle
          </Button>
          <Button
            size="sm"
            variant={user.status === "active" ? "danger" : "primary"}
            onClick={() => handleToggleStatus(user._id, user.status)}
            className={
              user.status === "active"
                ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
            }
          >
            {user.status === "active" ? "Désactiver" : "Activer"}
          </Button>
        </div>
      ),
    }));

    setFilteredUsers(formattedUsers);
  }, [users, filters]);

  /**
   * Gestion du changement des filtres
   */
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value,
    }));
  };

  /**
   * Fonctions de gestion des toasts
   */
  const closeSuccessToast = () => {
    setShowSuccessToast(false);
    setTimeout(() => setSuccess(""), 300);
  };

  const closeErrorToast = () => {
    setShowErrorToast(false);
    setTimeout(() => setError(""), 300);
  };

  /**
   * Gestion du changement des champs du formulaire
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Effacer l'erreur si l'utilisateur modifie le champ
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined,
      });
    }
  };

  /**
   * Gestion du changement du rôle dans le formulaire
   */
  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      role: value,
    });
  };

  /**
   * Validation du formulaire d'ajout d'utilisateur
   */
  const validateForm = (): boolean => {
    const errors: Partial<UserFormData> = {};
    let isValid = true;

    if (!formData.firstName.trim()) {
      errors.firstName = "Le prénom est requis";
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Le nom est requis";
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Format d'email invalide";
      isValid = false;
    }

    if (!formData.role) {
      errors.role = "Le rôle est requis";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  /**
   * Ajout d'un nouvel utilisateur
   */
  const handleAddUser = async () => {
    // Validation du formulaire
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/users", formData);

      // Mettre à jour la liste des utilisateurs
      setUsers([...users, response.data]);

      // Réinitialiser le formulaire et fermer le modal
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "employé",
      });
      setModalOpen(false);

      // Afficher un message de succès
      setSuccess("Utilisateur ajouté avec succès");
      setShowSuccessToast(true);
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'utilisateur:", err);
      setError("Impossible d'ajouter l'utilisateur");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ouverture du modal de modification de rôle
   */
  const handleOpenRoleModal = (userId: string, role: string) => {
    setSelectedUserId(userId);
    setSelectedUserRole(role);
    setRoleModalOpen(true);
  };

  /**
   * Mise à jour du rôle d'un utilisateur
   */
  const handleUpdateRole = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/users/${selectedUserId}`, {
        role: selectedUserRole,
      });

      // Mettre à jour l'utilisateur dans la liste
      setUsers(
        users.map((user) =>
          user._id === selectedUserId
            ? { ...user, role: selectedUserRole as any }
            : user
        )
      );

      // Fermer le modal et afficher un message de succès
      setRoleModalOpen(false);
      setSuccess("Rôle mis à jour avec succès");
      setShowSuccessToast(true);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du rôle:", err);
      setError("Impossible de mettre à jour le rôle");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Activation/désactivation d'un utilisateur
   */
  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    setLoading(true);
    try {
      await axios.put(`/api/users/${userId}`, {
        status: newStatus,
      });

      // Mettre à jour l'utilisateur dans la liste
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, status: newStatus as any } : user
        )
      );

      // Afficher un message de succès
      setSuccess(
        `Utilisateur ${
          newStatus === "active" ? "activé" : "désactivé"
        } avec succès`
      );
      setShowSuccessToast(true);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut:", err);
      setError("Impossible de modifier le statut de l'utilisateur");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fermeture du modal d'ajout et réinitialisation du formulaire
   */
  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "employé",
    });
    setFormErrors({});
  };

  return (
    <LayoutWithSidebar
      activeItem="users"
      pageTitle="Gestion des utilisateurs – SmartPlanning"
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

        {/* En-tête avec fil d'ariane */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <Breadcrumb
            items={breadcrumbItems}
            className="text-gray-900 dark:text-white font-medium [&_a]:text-gray-900 [&_a]:dark:text-white [&_a:hover]:text-indigo-600 [&_a:hover]:dark:text-indigo-300"
          />
        </div>

        {/* Titre de la page */}
        <SectionTitle
          title="Gestion des utilisateurs"
          subtitle="Administrez les utilisateurs de la plateforme"
          icon={<Users size={24} className="text-indigo-600 dark:text-white" />}
          className="mb-8 text-gray-900 dark:text-white [&>h1]:text-gray-900 [&>h1]:dark:text-white [&>p]:text-gray-600 [&>p]:dark:text-gray-200"
        />

        {/* Section de filtres et bouton d'ajout */}
        <SectionCard className="mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Select
                label="Filtrer par rôle"
                options={roleOptions}
                value={filters.role}
                onChange={(value) => handleFilterChange("role", value)}
                icon={
                  <User size={18} className="text-indigo-600 dark:text-white" />
                }
                className="text-gray-700 dark:text-white border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 [&_label]:text-gray-700 [&_label]:dark:text-white"
              />
            </div>

            <div className="w-full md:w-1/3">
              <Select
                label="Filtrer par statut"
                options={statusOptions}
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
                icon={
                  <UserCheck
                    size={18}
                    className="text-indigo-600 dark:text-white"
                  />
                }
                className="text-gray-700 dark:text-white border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 [&_label]:text-gray-700 [&_label]:dark:text-white"
              />
            </div>

            <div className="w-full md:w-1/3 flex items-end">
              <Button
                onClick={() => setModalOpen(true)}
                variant="primary"
                icon={<Plus size={18} />}
                fullWidth
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
              >
                Ajouter un utilisateur
              </Button>
            </div>
          </div>
        </SectionCard>

        {/* Tableau des utilisateurs */}
        <SectionCard className="mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner
                size="lg"
                className="text-indigo-600 dark:text-indigo-300"
              />
            </div>
          ) : (
            <Table
              columns={userColumns}
              data={filteredUsers}
              pagination={true}
              rowsPerPage={10}
              emptyState={{
                title: "Aucun utilisateur trouvé",
                description:
                  "Il n'y a aucun utilisateur correspondant aux critères sélectionnés.",
                icon: (
                  <Users
                    size={48}
                    className="text-gray-300 dark:text-gray-600"
                  />
                ),
              }}
              className="text-gray-900 dark:text-gray-100 [&_thead]:bg-gray-100 [&_thead]:dark:bg-gray-800 [&_thead_th]:text-gray-700 [&_thead_th]:dark:text-sky-300 [&_td]:text-gray-900 [&_td]:dark:text-gray-100"
            />
          )}
        </SectionCard>

        {/* Modal d'ajout d'utilisateur */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title="Ajouter un utilisateur"
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-indigo-300"
        >
          <div className="space-y-4">
            <InputField
              label="Prénom"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              error={formErrors.firstName}
              className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />

            <InputField
              label="Nom"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              error={formErrors.lastName}
              className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />

            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              error={formErrors.email}
              className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />

            <Select
              label="Rôle"
              options={roleOptions.slice(1)} // Exclure l'option "Tous les rôles"
              value={formData.role}
              onChange={handleRoleChange}
              icon={
                <User size={18} className="text-indigo-600 dark:text-sky-300" />
              }
              className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="ghost"
                onClick={handleCloseModal}
                icon={
                  <X size={18} className="text-gray-600 dark:text-gray-300" />
                }
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleAddUser}
                icon={<Plus size={18} />}
                isLoading={loading}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de modification de rôle */}
        <Modal
          isOpen={roleModalOpen}
          onClose={() => setRoleModalOpen(false)}
          title="Modifier le rôle"
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-indigo-300"
        >
          <div className="space-y-4">
            <Select
              label="Nouveau rôle"
              options={roleOptions.slice(1)} // Exclure l'option "Tous les rôles"
              value={selectedUserRole}
              onChange={setSelectedUserRole}
              icon={
                <User size={18} className="text-indigo-600 dark:text-sky-300" />
              }
              className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setRoleModalOpen(false)}
                icon={
                  <X size={18} className="text-gray-600 dark:text-gray-300" />
                }
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateRole}
                icon={<UserCheck size={18} />}
                isLoading={loading}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
              >
                Mettre à jour
              </Button>
            </div>
          </div>
        </Modal>
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default UserManagementPage;
