import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Button from "../components/ui/Button";
import FileUpload from "../components/ui/FileUpload";
import FilterBar from "../components/ui/FilterBar";
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Toast from "../components/ui/Toast";
import { useAuth } from "../hooks/useAuth";

// Types pour les données
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  teamId?: string;
  teamName?: string;
  status: string;
  photoUrl?: string;
}

interface Team {
  _id: string;
  name: string;
  companyId: string;
}

interface CreateUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  teamId: string;
  photoUrl: string;
}

/**
 * Page de gestion des utilisateurs pour les directeurs
 *
 * Permet de visualiser, créer et gérer les employés et managers d'une entreprise
 */
const DirectorUserManagementPage: React.FC = () => {
  // État d'authentification
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // États pour les données
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(true);
  const [creatingUser, setCreatingUser] = useState<boolean>(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);

  // États pour les filtres et la recherche
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");

  // État pour le formulaire de création
  const [formData, setFormData] = useState<CreateUserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    role: "employee",
    teamId: "",
    photoUrl: "",
  });

  // État pour le formulaire d'édition
  const [editFormData, setEditFormData] = useState<CreateUserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    role: "employee",
    teamId: "",
    photoUrl: "",
  });

  // États pour les modales et notifications
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  // État pour le mot de passe temporaire généré
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<boolean>(false);

  // Vérification que l'utilisateur est un directeur
  useEffect(() => {
    if (isAuthenticated && user && user.role !== "directeur") {
      navigate("/unauthorized");
    }
  }, [isAuthenticated, user, navigate]);

  // Récupération des utilisateurs
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log("DirectorUserManagementPage: Début de fetchUsers");

      // Utiliser directement la route qui fonctionne
      const response = await axiosInstance.get("/employees/accessible");
      console.log("DirectorUserManagementPage: Réponse API:", response.data);

      if (response.data.success && response.data.data) {
        // Enrichir les données avec le nom de l'équipe si disponible
        const usersWithTeamNames = response.data.data.map((user: any) => {
          // S'assurer que tous les champs nécessaires sont présents
          const processedUser = {
            _id: user._id,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "Email non disponible",
            role: user.role || "employee",
            teamId: user.teamId?._id || user.teamId || null,
            teamName: user.teamId?.name || "Non assigné",
            status: user.status || "actif",
            photoUrl: user.photoUrl || undefined,
          };

          console.log("Utilisateur traité:", processedUser);
          return processedUser;
        });

        console.log(
          "DirectorUserManagementPage: Utilisateurs traités:",
          usersWithTeamNames
        );
        setUsers(usersWithTeamNames);
      } else {
        console.error(
          "DirectorUserManagementPage: Erreur dans la réponse API:",
          response.data
        );
        showToast("Erreur lors du chargement des utilisateurs", "error");
      }
    } catch (error: any) {
      console.error(
        "DirectorUserManagementPage: Erreur lors de la récupération des utilisateurs:",
        error
      );
      showToast("Erreur lors du chargement des utilisateurs", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupération des équipes
  const fetchTeams = useCallback(async () => {
    try {
      setLoadingTeams(true);
      const response = await axiosInstance.get("/teams");

      if (response.data.success) {
        setTeams(response.data.data);
      } else {
        showToast("Erreur lors du chargement des équipes", "error");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des équipes:", error);
      showToast("Erreur lors du chargement des équipes", "error");
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  // Chargement initial des données
  useEffect(() => {
    if (isAuthenticated && user?.role === "directeur") {
      console.log(
        "DirectorUserManagementPage: Chargement initial des données pour le directeur:",
        user
      );
      fetchUsers();
      fetchTeams();
    }
  }, [isAuthenticated, user, fetchUsers, fetchTeams]);

  // Filtrer les utilisateurs en fonction de la recherche et des filtres
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Filtre de recherche (nom ou email)
      const matchesSearch =
        searchQuery === "" ||
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtre par rôle
      const matchesRole = roleFilter === "" || user.role === roleFilter;

      // Filtre par équipe
      const matchesTeam = teamFilter === "" || user.teamId === teamFilter;

      return matchesSearch && matchesRole && matchesTeam;
    });
  }, [users, searchQuery, roleFilter, teamFilter]);

  // Gestion du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Affichage d'une notification
  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => {
    setToast({
      message,
      type,
      isVisible: true,
    });

    // Masquer automatiquement après 3 secondes
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // Effet pour vérifier si les filtres masquent des utilisateurs
  useEffect(() => {
    // Si nous avons des utilisateurs mais aucun n'est affiché à cause des filtres
    if (
      users.length > 0 &&
      filteredUsers.length === 0 &&
      (roleFilter || teamFilter || searchQuery)
    ) {
      console.log(
        "DirectorUserManagementPage: Les filtres masquent tous les utilisateurs"
      );
      showToast(
        "Des filtres actifs masquent peut-être certains utilisateurs",
        "info"
      );
    }
  }, [users, filteredUsers, roleFilter, teamFilter, searchQuery]);

  // Configuration des filtres pour le composant FilterBar
  const filterConfig = {
    role: {
      label: "Rôle",
      value: roleFilter,
      options: [
        { label: "Tous les rôles", value: "" },
        { label: "Employé", value: "employee" },
        { label: "Manager", value: "manager" },
      ],
      onChange: setRoleFilter,
    },
    team: {
      label: "Équipe",
      value: teamFilter,
      options: [
        { label: "Toutes les équipes", value: "" },
        ...teams.map((team) => ({ label: team.name, value: team._id })),
      ],
      onChange: setTeamFilter,
    },
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      showToast("Le prénom est requis", "error");
      return false;
    }

    if (!formData.lastName.trim()) {
      showToast("Le nom est requis", "error");
      return false;
    }

    if (!formData.email.trim()) {
      showToast("L'email est requis", "error");
      return false;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast("Format d'email invalide", "error");
      return false;
    }

    // Si c'est un manager, l'équipe est obligatoire
    if (formData.role === "manager" && !formData.teamId) {
      showToast("Veuillez sélectionner une équipe pour le manager", "error");
      return false;
    }

    return true;
  };

  // Création d'un utilisateur
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setCreatingUser(true);

      // Upload de l'image si une image est sélectionnée
      let photoUrl = "";
      if (selectedFile) {
        photoUrl = await uploadImage(selectedFile);
        if (!photoUrl) {
          setCreatingUser(false);
          return; // Arrêter si l'upload a échoué
        }
      }

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        ...(formData.teamId && { teamId: formData.teamId }),
        ...(photoUrl && { photoUrl }),
      };

      console.log(
        "DirectorUserManagementPage: Envoi de la requête de création:",
        payload
      );
      const response = await axiosInstance.post("/employees/create", payload);
      console.log(
        "DirectorUserManagementPage: Réponse de création:",
        response.data
      );

      if (response.data.success) {
        // Stocker le mot de passe temporaire généré
        setTempPassword(response.data.data.tempPassword);

        // Réinitialiser les filtres pour s'assurer que le nouvel utilisateur sera visible
        setRoleFilter("");
        setTeamFilter("");
        setSearchQuery("");

        // Ajouter manuellement l'utilisateur à la liste locale
        if (response.data.data.user) {
          const teamName = formData.teamId
            ? teams.find((team) => team._id === formData.teamId)?.name ||
              "Non assigné"
            : "Non assigné";

          const newUser = {
            _id: response.data.data.user._id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            role: formData.role,
            teamId: formData.teamId || undefined,
            teamName: teamName,
            status: "actif",
            photoUrl: photoUrl || undefined,
          };

          console.log(
            "DirectorUserManagementPage: Ajout manuel de l'utilisateur à la liste:",
            newUser
          );
          setUsers((prevUsers) => [...prevUsers, newUser]);
        }

        // Rafraîchir la liste des utilisateurs après un court délai
        console.log(
          "DirectorUserManagementPage: Rafraîchissement de la liste après création dans 3 secondes"
        );
        setTimeout(() => {
          fetchUsers();
        }, 3000);

        showToast(
          `${
            formData.role === "manager" ? "Manager" : "Employé"
          } créé avec succès`,
          "success"
        );

        // Réinitialiser le formulaire
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          role: "employee",
          teamId: "",
          photoUrl: "",
        });
        setSelectedFile(null);
        setImagePreview(null);
      } else {
        console.error(
          "DirectorUserManagementPage: Erreur dans la réponse de création:",
          response.data
        );
        showToast("Erreur lors de la création de l'utilisateur", "error");
      }
    } catch (error: any) {
      console.error(
        "DirectorUserManagementPage: Erreur lors de la création de l'utilisateur:",
        error
      );
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création de l'utilisateur";
      showToast(errorMessage, "error");
    } finally {
      setCreatingUser(false);
    }
  };

  // Suppression d'un utilisateur
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeletingUser(userToDelete._id);

      const response = await axiosInstance.delete(
        `/employees/${userToDelete._id}`
      );

      if (response.data.success) {
        // Rafraîchir la liste des utilisateurs
        fetchUsers();

        showToast("Utilisateur supprimé avec succès", "success");
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } else {
        showToast("Erreur lors de la suppression de l'utilisateur", "error");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      showToast("Erreur lors de la suppression de l'utilisateur", "error");
    } finally {
      setDeletingUser(null);
    }
  };

  // Initialiser le formulaire d'édition avec les données de l'utilisateur
  const initEditForm = (user: User) => {
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      teamId: user.teamId || "",
      photoUrl: user.photoUrl || "",
    });
    setUserToEdit(user);
    setEditImagePreview(user.photoUrl || null);
    setIsEditModalOpen(true);
  };

  // Mise à jour d'un utilisateur
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userToEdit) return;

    try {
      setUpdatingUser(true);

      // Upload de l'image si une nouvelle image est sélectionnée
      let photoUrl = editFormData.photoUrl;
      if (editSelectedFile) {
        photoUrl = await uploadImage(editSelectedFile);
        if (!photoUrl) {
          setUpdatingUser(false);
          return; // Arrêter si l'upload a échoué
        }
      }

      const payload = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        role: editFormData.role,
        ...(editFormData.teamId && { teamId: editFormData.teamId }),
        ...(photoUrl && { photoUrl }),
      };

      console.log(
        `DirectorUserManagementPage: Mise à jour de l'utilisateur ${userToEdit._id}:`,
        payload
      );

      const response = await axiosInstance.patch(
        `/employees/${userToEdit._id}`,
        payload
      );
      console.log(
        "DirectorUserManagementPage: Réponse de mise à jour:",
        response.data
      );

      if (response.data.success) {
        // Mettre à jour l'utilisateur dans la liste locale
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userToEdit._id
              ? {
                  ...user,
                  ...payload,
                  teamName: payload.teamId
                    ? teams.find((team) => team._id === payload.teamId)?.name ||
                      "Non assigné"
                    : "Non assigné",
                }
              : user
          )
        );

        showToast(
          `${
            editFormData.role === "manager" ? "Manager" : "Employé"
          } mis à jour avec succès`,
          "success"
        );

        // Fermer la modale
        setIsEditModalOpen(false);
        setUserToEdit(null);
        setEditSelectedFile(null);
        setEditImagePreview(null);
      } else {
        console.error(
          "DirectorUserManagementPage: Erreur dans la réponse de mise à jour:",
          response.data
        );
        showToast("Erreur lors de la mise à jour de l'utilisateur", "error");
      }
    } catch (error: any) {
      console.error(
        "DirectorUserManagementPage: Erreur lors de la mise à jour de l'utilisateur:",
        error
      );
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la mise à jour de l'utilisateur";
      showToast(errorMessage, "error");
    } finally {
      setUpdatingUser(false);
    }
  };

  // Upload d'image vers Cloudinary
  const uploadImage = async (file: File): Promise<string> => {
    if (!file) return "";

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      console.log(
        "DirectorUserManagementPage: Upload d'image vers Cloudinary",
        file.name
      );

      // Utiliser la route publique pour l'upload sans authentification
      const response = await axiosInstance.post("/upload/public", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log(
        "DirectorUserManagementPage: Réponse upload d'image:",
        response.data
      );

      if (response.data.success) {
        return response.data.imageUrl;
      } else {
        throw new Error(
          response.data.message || "Erreur lors de l'upload de l'image"
        );
      }
    } catch (error: any) {
      console.error(
        "DirectorUserManagementPage: Erreur upload d'image:",
        error
      );
      showToast(
        error.response?.data?.message || "Erreur lors de l'upload de l'image",
        "error"
      );
      return "";
    } finally {
      setUploadingImage(false);
    }
  };

  // Si l'utilisateur n'est pas authentifié ou n'est pas un directeur
  if (!isAuthenticated || (user && user.role !== "directeur")) {
    return null; // La redirection sera gérée par le useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6">Gestion des utilisateurs</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* Barre de filtres et recherche */}
        <div className="w-full">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Rechercher par nom ou email..."
            filters={filterConfig}
            className="mb-4"
          />
          {(searchQuery || roleFilter || teamFilter) && (
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("");
                  setTeamFilter("");
                }}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>

        {/* Bouton pour ouvrir le formulaire de création */}
        <div className="flex-shrink-0">
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            }
          >
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Utilisateurs de l'entreprise
          {filteredUsers.length > 0 && (
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
              ({filteredUsers.length}{" "}
              {filteredUsers.length > 1 ? "utilisateurs" : "utilisateur"})
            </span>
          )}
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Aucun utilisateur trouvé
            </p>
            {(searchQuery || roleFilter || teamFilter) && (
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Essayez de modifier vos critères de recherche ou de filtrage
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Vue tableau pour desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Nom</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rôle</th>
                    <th className="px-4 py-3">Équipe</th>
                    <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {user.photoUrl ? (
                            <img
                              src={user.photoUrl}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-8 h-8 rounded-full mr-3 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
                              <span className="text-white font-medium">
                                {user.firstName.charAt(0)}
                                {user.lastName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <span className="text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.role === "manager"
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                              : user.role === "employee"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {user.role === "employee"
                            ? "Employé"
                            : user.role === "manager"
                            ? "Manager"
                            : user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {user.teamName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => initEditForm(user)}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setUserToDelete(user);
                              setIsDeleteModalOpen(true);
                            }}
                            isLoading={deletingUser === user._id}
                            disabled={deletingUser === user._id}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vue carte pour mobile */}
            <div className="md:hidden space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
                >
                  <div className="flex items-center mb-3">
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-12 h-12 rounded-full mr-3 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
                        <span className="text-white font-medium text-lg">
                          {user.firstName.charAt(0)}
                          {user.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Rôle
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          user.role === "manager"
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                            : user.role === "employee"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {user.role === "employee"
                          ? "Employé"
                          : user.role === "manager"
                          ? "Manager"
                          : user.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Équipe
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {user.teamName}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => initEditForm(user)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setUserToDelete(user);
                        setIsDeleteModalOpen(true);
                      }}
                      isLoading={deletingUser === user._id}
                      disabled={deletingUser === user._id}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de création d'utilisateur */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setTempPassword(null);
        }}
        title="Créer un nouvel utilisateur"
        className="max-w-lg bg-white dark:bg-gray-900"
      >
        {tempPassword ? (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                Utilisateur créé avec succès
              </h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Un compte a été créé pour {formData.firstName}{" "}
                {formData.lastName}
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Mot de passe temporaire :
              </p>
              <p className="text-xl font-mono bg-white dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                {tempPassword}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Communiquez ce mot de passe à l'utilisateur. Il pourra le
                changer lors de sa première connexion.
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setTempPassword(null);
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleCreateUser}
            className="text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Prénom de l'utilisateur"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                placeholder="Entrez le prénom"
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />

              <InputField
                label="Nom de famille"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                placeholder="Entrez le nom de famille"
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            </div>

            <InputField
              label="Adresse email professionnelle"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="exemple@entreprise.com"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rôle dans l'entreprise
              </label>
              <Select
                options={[
                  { value: "employee", label: "Employé" },
                  { value: "manager", label: "Manager" },
                ]}
                value={formData.role}
                onChange={(value) => handleSelectChange("role", value)}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Équipe d'affectation
              </label>
              {loadingTeams ? (
                <div className="py-2">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <Select
                  options={teams.map((team) => ({
                    value: team._id,
                    label: team.name,
                  }))}
                  value={formData.teamId}
                  onChange={(value) => handleSelectChange("teamId", value)}
                  placeholder="Sélectionner une équipe"
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              )}
              {formData.role === "manager" && !formData.teamId && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                  Un manager doit être assigné à une équipe
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photo de profil
              </label>
              <div className="flex flex-col md:flex-row items-start gap-4">
                <div className="w-full md:w-2/3">
                  <FileUpload
                    onFileSelect={(file) => setSelectedFile(file)}
                    onPreviewChange={(preview) => setImagePreview(preview)}
                    acceptedTypes="image/*"
                    maxSizeMB={2}
                    label=""
                    buttonText="Choisir une image"
                    buttonClassName="bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  />
                </div>
                <div className="w-full md:w-1/3 flex justify-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        aria-label="Supprimer l'image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-gray-400 dark:text-gray-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Format recommandé: JPG, PNG. Taille max: 2MB
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setSelectedFile(null);
                  setImagePreview(null);
                }}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Annuler
              </Button>

              <Button
                type="submit"
                variant="primary"
                isLoading={creatingUser || uploadingImage}
                disabled={creatingUser || uploadingImage}
              >
                {uploadingImage
                  ? "Upload de l'image..."
                  : "Créer l'utilisateur"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
        className="bg-white dark:bg-gray-900"
      >
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
          <span className="font-semibold">
            {userToDelete?.firstName} {userToDelete?.lastName}
          </span>
          ? Cette action est irréversible.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
            Annuler
          </Button>

          <Button
            variant="danger"
            onClick={handleDeleteUser}
            isLoading={deletingUser !== null}
            disabled={deletingUser !== null}
          >
            Supprimer
          </Button>
        </div>
      </Modal>

      {/* Modal de mise à jour d'utilisateur */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setUserToEdit(null);
        }}
        title="Mettre à jour l'utilisateur"
        className="max-w-lg bg-white dark:bg-gray-900"
      >
        <form
          onSubmit={handleUpdateUser}
          className="text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Prénom de l'utilisateur"
              name="firstName"
              value={editFormData.firstName}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  firstName: e.target.value,
                }))
              }
              required
              placeholder="Entrez le prénom"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />

            <InputField
              label="Nom de famille"
              name="lastName"
              value={editFormData.lastName}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  lastName: e.target.value,
                }))
              }
              required
              placeholder="Entrez le nom de famille"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>

          <InputField
            label="Adresse email professionnelle"
            name="email"
            type="email"
            value={editFormData.email}
            onChange={(e) =>
              setEditFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            required
            placeholder="exemple@entreprise.com"
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rôle dans l'entreprise
            </label>
            <Select
              options={[
                { value: "employee", label: "Employé" },
                { value: "manager", label: "Manager" },
              ]}
              value={editFormData.role}
              onChange={(value) =>
                setEditFormData((prev) => ({ ...prev, role: value }))
              }
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Équipe d'affectation
            </label>
            {loadingTeams ? (
              <div className="py-2">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <Select
                options={teams.map((team) => ({
                  value: team._id,
                  label: team.name,
                }))}
                value={editFormData.teamId}
                onChange={(value) =>
                  setEditFormData((prev) => ({ ...prev, teamId: value }))
                }
                placeholder="Sélectionner une équipe"
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            )}
            {editFormData.role === "manager" && !editFormData.teamId && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                Un manager doit être assigné à une équipe
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo de profil
            </label>
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="w-full md:w-2/3">
                <FileUpload
                  onFileSelect={(file) => setEditSelectedFile(file)}
                  onPreviewChange={(preview) => setEditImagePreview(preview)}
                  acceptedTypes="image/*"
                  maxSizeMB={2}
                  label=""
                  buttonText="Choisir une image"
                  buttonClassName="bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                />
              </div>
              <div className="w-full md:w-1/3 flex justify-center">
                {editImagePreview ? (
                  <div className="relative">
                    <img
                      src={editImagePreview}
                      alt="Aperçu"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditSelectedFile(null);
                        setEditImagePreview(userToEdit?.photoUrl || null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      aria-label="Supprimer l'image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-gray-400 dark:text-gray-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Format recommandé: JPG, PNG. Taille max: 2MB
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditSelectedFile(null);
              }}
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Annuler
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={updatingUser || uploadingImage}
              disabled={updatingUser || uploadingImage}
            >
              {uploadingImage
                ? "Upload de l'image..."
                : "Mettre à jour l'utilisateur"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast pour les notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default DirectorUserManagementPage;
