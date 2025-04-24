/**
 * UserManagementPage - Page de gestion des utilisateurs
 *
 * Interface complète permettant à un administrateur de gérer les utilisateurs:
 * - Affichage de la liste des utilisateurs
 * - Filtrage par rôle, statut et entreprise
 * - Ajout de nouveaux utilisateurs
 * - Mise à jour du rôle et statut des utilisateurs existants
 */
import api, {
  adminUserService,
  uploadFile,
  User as UserType,
} from "../services/api";

import axios from "axios";
import {
  Building,
  Edit,
  Plus,
  Trash,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Composants de layout
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import FileUpload from "../components/ui/FileUpload";
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Composants admin
import EditUserModal from "../components/admin/EditUserModal";

// Types pour les formulaires
interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "directeur" | "manager" | "employee";
  password?: string;
  photoUrl?: string;
  companyId: string;
}

// Interface pour les entreprises
interface Company {
  _id: string;
  name: string;
}

interface UserFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  password?: string;
  photo?: string;
  companyId?: string;
}

// Définir les options de rôle et statut
const roleOptions = [
  { value: "", label: "Tous les rôles" },
  { value: "admin", label: "Administrateur" },
  { value: "directeur", label: "Directeur" },
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Employé" },
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
  { key: "company", label: "Entreprise", sortable: true },
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
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  // États pour les filtres
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    companyId: "",
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
    role: "employee",
    password: "",
    photoUrl: undefined,
    companyId: "",
  });

  const [formErrors, setFormErrors] = useState<UserFormErrors>({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyLoading, setCompanyLoading] = useState<boolean>(false);

  // États pour le modal de mise à jour du rôle
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserRole, setSelectedUserRole] = useState<
    "admin" | "directeur" | "manager" | "employee"
  >("employee");

  // Nouveaux états pour édition et suppression
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteUserId, setDeleteUserId] = useState<string>("");
  const [deletingUser, setDeletingUser] = useState<boolean>(false);

  // Chargement des entreprises
  useEffect(() => {
    const fetchCompanies = async () => {
      setCompanyLoading(true);
      try {
        const response = await axios.get("/api/admin/companies");
        setCompanies(response.data || []);
      } catch (err) {
        console.error("Erreur lors du chargement des entreprises:", err);
      } finally {
        setCompanyLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  /**
   * Récupération des utilisateurs depuis l'API
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminUserService.getAllUsers();
      console.log("UTILISATEURS RÉCUPÉRÉS :", data);
      setUsers(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
      setError("Impossible de récupérer la liste des utilisateurs.");
      setShowErrorToast(true);
    } finally {
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
   * Filtrage des utilisateurs avec useMemo pour l'optimisation
   */
  const filteredUsers = React.useMemo(() => {
    return users
      .filter((user) => {
        const roleMatch = !filters.role || user.role === filters.role;
        const statusMatch = !filters.status || user.status === filters.status;
        const companyMatch =
          !filters.companyId || user.companyId === filters.companyId;

        // Sécurité supplémentaire: ne pas afficher user_id dans les résultats
        if (user._id === "user_id") return false;

        return roleMatch && statusMatch && companyMatch;
      })
      .map((user) => {
        const creationDate = new Date(
          user.createdAt || Date.now()
        ).toLocaleDateString("fr-FR");
        const companyName =
          companies.find((c) => c._id === user.companyId)?.name || "-";

        return {
          id: user._id,
          name: (
            <div className="flex items-center">
              <Avatar
                src={user.photoUrl}
                alt={`${user.firstName} ${user.lastName}`}
                size="sm"
                className="mr-2"
              >
                {/* Le composant Avatar n'utilise pas de fallback prop, 
                  on laisse le composant gérer son propre fallback  */}
              </Avatar>
              <div className="ml-3">
                <p className="font-medium">{`${user.firstName} ${user.lastName}`}</p>
              </div>
            </div>
          ),
          email: user.email,
          company: companyName,
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
            <div
              className="cursor-pointer"
              onClick={() => handleToggleStatus(user._id, user.status)}
            >
              <Badge
                type={user.status === "active" ? "success" : "error"}
                label={user.status === "active" ? "Actif" : "Inactif"}
              />
            </div>
          ),
          createdAt: creationDate,
          actions: (
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditUser(user)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Éditer l'utilisateur"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenDeleteModal(user._id)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Supprimer l'utilisateur"
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ),
        };
      });
  }, [users, filters.role, filters.status, filters.companyId, companies]);

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
    if (formErrors[name as keyof UserFormErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  /**
   * Gestion du changement du rôle dans le formulaire
   */
  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      role: value as "admin" | "directeur" | "manager" | "employee",
    });

    if (formErrors.role) {
      setFormErrors({
        ...formErrors,
        role: "",
      });
    }
  };

  /**
   * Gestion du changement de l'entreprise
   */
  const handleCompanyChange = (value: string) => {
    setFormData({
      ...formData,
      companyId: value,
    });

    if (formErrors.companyId) {
      setFormErrors({
        ...formErrors,
        companyId: "",
      });
    }
  };

  /**
   * Gestion de la sélection d'un fichier photo
   */
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // Effacer l'erreur liée à la photo
    if (formErrors.photo) {
      setFormErrors({
        ...formErrors,
        photo: "",
      });
    }
  };

  /**
   * Gestion du changement de l'aperçu de la photo
   */
  const handlePreviewChange = (url: string | null) => {
    setPreviewUrl(url);
  };

  /**
   * Upload de la photo vers Cloudinary
   */
  const uploadPhoto = async (): Promise<string | undefined> => {
    if (!selectedFile) return undefined;

    try {
      setUploadLoading(true);
      const photoUrl = await uploadFile(selectedFile);
      setUploadLoading(false);
      return photoUrl;
    } catch (err) {
      console.error("Erreur lors de l'upload de la photo:", err);
      setError("Impossible d'uploader la photo");
      setShowErrorToast(true);
      setUploadLoading(false);
      throw err;
    }
  };

  /**
   * Validation du formulaire d'ajout d'utilisateur
   */
  const validateForm = (): boolean => {
    const errors: UserFormErrors = {};
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

    if (!formData.companyId) {
      errors.companyId = "L'entreprise est requise";
      isValid = false;
    }

    // Valider le mot de passe s'il est fourni
    if (formData.password && formData.password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères";
      isValid = false;
    }

    // Valider le fichier photo si sélectionné
    if (selectedFile) {
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (selectedFile.size > maxSize) {
        errors.photo = "La taille de l'image ne doit pas dépasser 2MB";
        isValid = false;
      }

      const acceptedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!acceptedTypes.includes(selectedFile.type)) {
        errors.photo =
          "Format d'image non pris en charge (JPEG, PNG, GIF, WebP uniquement)";
        isValid = false;
      }
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
      // Si une photo est sélectionnée, l'uploader d'abord
      let photoUrl: string | undefined;
      if (selectedFile) {
        try {
          photoUrl = await uploadPhoto();
        } catch (error) {
          // L'erreur d'upload est déjà gérée dans uploadPhoto()
          setLoading(false);
          return;
        }
      }

      // Créer l'utilisateur avec la photo URL si disponible
      const userData = {
        ...formData,
        photoUrl,
      };

      // Envoyer les données à l'API
      const response = await adminUserService.createUser(userData);

      // Mettre à jour la liste des utilisateurs
      setUsers([...users, response.user]);

      // Réinitialiser le formulaire et fermer le modal
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "employee",
        password: "",
        photoUrl: undefined,
        companyId: "",
      });
      setSelectedFile(null);
      setPreviewUrl(null);
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
  const handleOpenRoleModal = (
    userId: string,
    role: "admin" | "directeur" | "manager" | "employee"
  ) => {
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
      await api.put(`/admin/users/${selectedUserId}`, {
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
      await api.put(`/admin/users/${userId}`, {
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
      role: "employee",
      password: "",
      photoUrl: undefined,
      companyId: "",
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormErrors({});
  };

  /**
   * Ouverture du modal d'édition d'utilisateur
   */
  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  /**
   * Callback de succès après la mise à jour d'un utilisateur
   */
  const handleEditSuccess = () => {
    // Rafraîchir la liste des utilisateurs
    fetchUsers();

    // Afficher un message de succès
    setSuccess("Utilisateur mis à jour avec succès");
    setShowSuccessToast(true);
  };

  /**
   * Ouverture du modal de confirmation de suppression
   */
  const handleOpenDeleteModal = (userId: string) => {
    setDeleteUserId(userId);
    setDeleteModalOpen(true);
  };

  /**
   * Suppression d'un utilisateur
   */
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    setDeletingUser(true);
    try {
      await adminUserService.deleteUser(deleteUserId);

      // Mettre à jour la liste des utilisateurs localement
      setUsers(users.filter((user) => user._id !== deleteUserId));

      // Fermer le modal et afficher un message de succès
      setDeleteModalOpen(false);
      setSuccess("Utilisateur supprimé avec succès");
      setShowSuccessToast(true);
    } catch (err) {
      console.error("Erreur lors de la suppression de l'utilisateur:", err);
      setError("Impossible de supprimer l'utilisateur");
      setShowErrorToast(true);
    } finally {
      setDeletingUser(false);
      setDeleteUserId("");
    }
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
        <SectionCard
          className="relative z-50 mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm"
          overflowVisible={true}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/4">
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

            <div className="w-full md:w-1/4">
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

            <div className="w-full md:w-1/4">
              <Select
                label="Filtrer par entreprise"
                options={[
                  { value: "", label: "-- Toutes les entreprises --" },
                  ...companies.map((company) => ({
                    value: company._id,
                    label: company.name,
                  })),
                ]}
                value={filters.companyId}
                onChange={(value) => handleFilterChange("companyId", value)}
                icon={
                  <Building
                    size={18}
                    className="text-indigo-600 dark:text-white"
                  />
                }
                className="text-gray-700 dark:text-white border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 [&_label]:text-gray-700 [&_label]:dark:text-white"
              />
            </div>

            <div className="w-full md:w-1/4 flex items-end">
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
        <SectionCard className="relative z-10 mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
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
          </div>
        </SectionCard>

        {/* Modal d'ajout d'utilisateur */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title="Ajouter un utilisateur"
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-indigo-300"
        >
          <div className="space-y-4">
            {/* Photo de profil */}
            <div className="flex flex-col items-center mb-6">
              <div className="mb-4 border-2 border-indigo-600 dark:border-indigo-400 rounded-full overflow-hidden">
                <Avatar src={previewUrl} size="xl" alt="Photo de profil" />
              </div>

              <FileUpload
                label="Photo de profil (optionnelle)"
                onFileSelect={handleFileSelect}
                onPreviewChange={handlePreviewChange}
                acceptedTypes="image/jpeg,image/png,image/gif,image/webp"
                maxSizeMB={2}
                error={formErrors.photo}
                className="text-gray-700 dark:text-sky-300"
              />
            </div>

            {/* Prénom et nom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Email */}
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

            {/* Mot de passe */}
            <InputField
              label="Mot de passe (optionnel)"
              name="password"
              type="password"
              value={formData.password || ""}
              onChange={handleInputChange}
              error={formErrors.password}
              helperText="Laissez vide pour générer un mot de passe temporaire"
              className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />

            {/* Rôle */}
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

            {/* Entreprise */}
            <Select
              label="Entreprise"
              options={companies.map((company) => ({
                value: company._id,
                label: company.name,
              }))}
              value={formData.companyId}
              onChange={handleCompanyChange}
              icon={
                <User size={18} className="text-indigo-600 dark:text-sky-300" />
              }
              className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />

            {/* Actions */}
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
                isLoading={loading || uploadLoading}
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
              onChange={setSelectedUserRole as (value: string) => void}
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

        {/* Modal d'édition d'utilisateur */}
        <EditUserModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          user={selectedUser}
          onSuccess={handleEditSuccess}
        />

        {/* Modal de confirmation de suppression */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Confirmer la suppression"
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-indigo-300 rounded-2xl shadow-xl max-w-lg"
        >
          <div className="space-y-6">
            <div className="text-center p-6">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-6">
                <Trash2 size={40} className="text-red-600 dark:text-red-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-gray-500 dark:text-gray-300">
                Êtes-vous sûr de vouloir supprimer définitivement cet
                utilisateur ? Cette action est irréversible.
              </p>
            </div>

            <div className="flex justify-center space-x-4 pt-4">
              <Button
                variant="ghost"
                onClick={() => setDeleteModalOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteUser}
                isLoading={deletingUser}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
              >
                Supprimer définitivement
              </Button>
            </div>
          </div>
        </Modal>
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default UserManagementPage;
