/**
 * CollaboratorManagementPage - Page de gestion des collaborateurs (multi-rôles)
 *
 * Interface dédiée permettant la gestion des équipes et collaborateurs avec accès adapté:
 * - Manager: gestion de ses équipes et leurs collaborateurs
 * - Directeur: gestion de tous les employés de son entreprise
 * - Admin: gestion de tous les utilisateurs du système
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  FileDown,
  Filter,
  Pencil,
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
import { Employee } from "../hooks/useEmployeesByTeam";

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
import FilterBar from "../components/ui/FilterBar";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Composants modaux
import CollaboratorFormModal from "../components/modals/CollaboratorFormModal";
import ManageTeamsModal from "../components/modals/ManageTeamsModal";

// Services
import { generateCollaboratorsPdf } from "../services/generateCollaboratorsPdf";

// Interface pour les équipes
interface Team {
  _id: string;
  name: string;
  managerId: string;
  companyId: string;
}

// Interface pour représenter une entreprise
interface Company {
  _id: string;
  name: string;
}

// Interface pour l'équipe populée (quand teamId est un objet)
interface PopulatedTeam {
  _id: string;
  name: string;
  managerIds: string[];
}

// Interface étendue pour l'employé (avec email)
interface EmployeeWithEmail extends Omit<Employee, "teamId"> {
  email?: string;
  role?: string;
  managerName?: string;
  teamId?: string | PopulatedTeam;
}

// Type pour les données reçues de l'API avec teamId populé
type ApiEmployeeWithPopulatedTeam = Omit<Employee, "teamId"> & {
  teamId?: PopulatedTeam;
};

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
  {
    key: "name",
    label: "Nom",
    sortable: true,
    className: "text-gray-800 dark:text-gray-200 font-medium",
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
    className: "text-gray-800 dark:text-gray-200 font-medium",
  },
  {
    key: "role",
    label: "Rôle",
    sortable: true,
    className: "text-gray-800 dark:text-gray-200 font-medium",
  },
  {
    key: "status",
    label: "Statut",
    sortable: true,
    className: "text-gray-800 dark:text-gray-200 font-medium",
  },
  {
    key: "team",
    label: "Équipe",
    sortable: true,
    className: "text-gray-800 dark:text-gray-200 font-medium",
  },
  {
    key: "contractHours",
    label: "Heures/semaine",
    sortable: true,
    className: "text-gray-800 dark:text-gray-200 font-medium",
  },
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    className: "text-gray-800 dark:text-gray-200 font-medium",
  },
];

// Type de filtres disponibles
interface FiltersState {
  role: string;
  teamId: string;
  companyId: string;
}

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

// Variantes d'animation pour les cartes mobile
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/**
 * Fonction simple pour vérifier si une chaîne est un ObjectId MongoDB valide
 * @param id Chaîne à vérifier
 * @returns true si la chaîne semble être un ObjectId valide
 */
const isValidObjectId = (id?: string): boolean => {
  if (!id) return false;
  // Un ObjectId MongoDB est une chaîne hexadécimale de 24 caractères
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Composant principal de la page de gestion des collaborateurs (multi-rôles)
 */
const CollaboratorManagementPage: React.FC = () => {
  const { user } = useAuth();

  // 🔒 États pour gérer les filtres selon le rôle de l'utilisateur
  const [filters, setFilters] = useState<FiltersState>({
    role: "",
    teamId: "",
    companyId: user?.companyId || "",
  });

  // État pour la recherche
  const [searchQuery, setSearchQuery] = useState<string>("");

  // États pour les équipes accessibles selon le rôle
  const [managerTeams, setManagerTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState<boolean>(false);

  // ✅ État pour les entreprises (uniquement pour admin)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState<boolean>(false);

  // État pour stocker tous les employés (chargés selon le rôle)
  const [allEmployees, setAllEmployees] = useState<EmployeeWithEmail[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  // États pour les notifications
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // État pour le modal de filtres
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);

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

  // Hooks pour les actions sur les employés
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

  // ✅ Vérification si l'utilisateur a accès à cette page
  const hasAccess = ["manager", "directeur", "admin"].includes(
    user?.role || ""
  );

  /**
   * 🔒 Récupération des équipes selon le rôle de l'utilisateur
   */
  const fetchTeams = useCallback(async () => {
    if (!user) return;

    // ⚠️ Vérification critique: s'assurer que l'ID utilisateur est disponible pour les managers
    if (user.role === "manager" && !user._id && !user.userId) {
      console.error("❌ ID utilisateur manquant pour manager:", user);
      showToast(
        "Erreur: ID utilisateur non disponible. Reconnectez-vous.",
        "error"
      );
      return;
    }

    setTeamsLoading(true);
    try {
      let url = "/teams";

      // 👁️ Adaptation selon le rôle
      if (user.role === "manager") {
        // Le manager ne voit que ses équipes
        const managerId = user._id || user.userId;
        console.log("Récupération des équipes pour le manager:", managerId);
      } else if (
        user.role === "directeur" &&
        user.companyId &&
        isValidObjectId(user.companyId)
      ) {
        // Le directeur voit toutes les équipes de son entreprise
        url = `/teams/company/${user.companyId}`;
        console.log(
          "Récupération des équipes pour l'entreprise:",
          user.companyId
        );
      } else if (user.role === "admin") {
        // L'admin peut voir toutes les équipes, filtrer par entreprise si nécessaire
        if (filters.companyId && isValidObjectId(filters.companyId)) {
          url = `/teams/company/${filters.companyId}`;
        } else {
          url = "/teams/all";
        }
        console.log("Récupération de toutes les équipes (admin)");
      }

      // Appel à l'API pour récupérer les équipes
      const response = await axiosInstance.get(url);
      if (response.data && response.data.success) {
        const teams = response.data.data;
        setManagerTeams(teams);
        setTeamsToDisplay(teams);
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
  }, [user, filters.companyId]);

  /**
   * ✅ Récupération des entreprises (uniquement pour admin)
   */
  const fetchCompanies = useCallback(async () => {
    if (!user || user.role !== "admin") return;

    setCompaniesLoading(true);
    try {
      const response = await axiosInstance.get("/companies");
      if (response.data && response.data.success) {
        setCompanies(response.data.data);
      } else {
        throw new Error(
          response.data?.message ||
            "Erreur lors de la récupération des entreprises"
        );
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des entreprises:", err);
      showToast("Impossible de récupérer la liste des entreprises", "error");
    } finally {
      setCompaniesLoading(false);
    }
  }, [user]);

  /**
   * 🔍 Récupération des employés selon le rôle et les filtres
   */
  const fetchEmployees = useCallback(async () => {
    if (!user) return;

    // ⚠️ Vérification critique: s'assurer que l'ID utilisateur est disponible
    if (!user._id && !user.userId) {
      console.error("❌ ID utilisateur manquant:", user);
      showToast(
        "Erreur: ID utilisateur non disponible. Reconnectez-vous.",
        "error"
      );
      return;
    }

    setEmployeesLoading(true);
    setEmployeesError(null);

    try {
      let url = "/employees";
      let params: Record<string, string> = {};

      // ✅ Construction de l'URL selon le rôle et les filtres
      if (user.role === "manager") {
        // Manager : utiliser la route générale /employees qui gère automatiquement les équipes du manager
        if (filters.teamId) {
          url = `/employees/team/${filters.teamId}`;
        } else {
          // La route /employees gère automatiquement les employés des équipes du manager
          url = "/employees";
        }
      } else if (user.role === "directeur") {
        // Directeur : tous les employés de son entreprise
        url = `/employees/company/${user.companyId}`;
        if (filters.teamId) {
          params.teamId = filters.teamId;
        }
        if (filters.role) {
          params.role = filters.role;
        }
      } else if (user.role === "admin") {
        // Admin : tous les employés avec filtres optionnels
        url = "/employees";
        if (filters.companyId) {
          params.companyId = filters.companyId;
        }
        if (filters.teamId) {
          params.teamId = filters.teamId;
        }
        if (filters.role) {
          params.role = filters.role;
        }
        params.all = "true"; // Paramètre pour récupérer tous les employés
      }

      console.log(`[fetchEmployees] Appel API: ${url}`, params);

      const response = await axiosInstance.get(url, { params });

      if (response.data && response.data.success) {
        console.log("📦 Données reçues de l'API:", response.data.data);
        console.log("📊 Nombre d'employés:", response.data.data?.length || 0);

        // Log détaillé du premier employé pour débugger
        if (response.data.data && response.data.data.length > 0) {
          console.log(
            "🔍 Structure du premier employé:",
            response.data.data[0]
          );
          console.log(
            "🔍 Clés disponibles:",
            Object.keys(response.data.data[0])
          );
        }

        setAllEmployees(response.data.data);
      } else {
        throw new Error(
          response.data?.message ||
            "Erreur lors de la récupération des employés"
        );
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des employés:", err);
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setEmployeesError(message);
      showToast(message, "error");
    } finally {
      setEmployeesLoading(false);
    }
  }, [user, filters]);

  /**
   * Fonction exposée pour permettre le rafraîchissement manuel des données
   */
  const refetchEmployees = useCallback(async (): Promise<void> => {
    await fetchEmployees();
  }, [fetchEmployees]);

  /**
   * Chargement initial des données au montage du composant
   */
  useEffect(() => {
    if (user && hasAccess) {
      fetchTeams();
      if (user.role === "admin") {
        fetchCompanies();
      }
      fetchEmployees();
    }
  }, [user, hasAccess, fetchTeams, fetchCompanies, fetchEmployees]);

  /**
   * Mise à jour des données lorsque les filtres changent
   */
  useEffect(() => {
    if (user && hasAccess) {
      fetchEmployees();
      // Si le filtre d'entreprise change pour un admin, recharger aussi les équipes
      if (user.role === "admin" && filters.companyId) {
        fetchTeams();
      }
    }
  }, [filters, user, hasAccess, fetchEmployees, fetchTeams]);

  /**
   * Transformer les employés pour l'affichage dans le tableau
   */
  const displayedEmployees = useMemo(() => {
    if (!allEmployees || !allEmployees.length) {
      return [];
    }

    console.log(
      "🚀 Transformation des employés pour l'affichage:",
      allEmployees.length
    );

    // Transformer les employés pour l'affichage
    return allEmployees.map((employee) => {
      console.log("🔄 Transformation employé:", employee);

      // Trouver l'équipe associée
      let teamName = "Non assignée";
      if (employee.teamId) {
        if (typeof employee.teamId === "object" && employee.teamId.name) {
          // Si teamId est populé avec l'objet team
          teamName = employee.teamId.name;
        } else {
          // Si teamId est juste un string, chercher dans managerTeams
          const team = managerTeams.find((t) => t._id === employee.teamId);
          if (team) {
            teamName = team.name;
          }
        }
      }

      // Mapping sécurisé des données
      const mappedEmployee = {
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: `${employee.firstName} ${employee.lastName}`,
        rawEmail: employee.email || "Email non défini",
        rawRole: employee.role || "employee",
        teamName: teamName,
        teamId: employee.teamId, // Ajouter teamId pour les filtres
        companyId: employee.companyId, // Ajouter companyId pour les filtres
        rawStatus: employee.status,
        rawContractHours: employee.contractHoursPerWeek || 35,
        managerName: employee.managerName || "Non assigné",

        // Elements JSX pour l'affichage dans le tableau
        name: (
          <span className="font-medium">
            {employee.firstName} {employee.lastName}
          </span>
        ),
        email: (
          <span className="text-sm text-gray-500">
            {employee.email || "Email non défini"}
          </span>
        ),
        role: (
          <Badge
            label={
              employee.role === "admin"
                ? "Admin"
                : employee.role === "manager"
                ? "Manager"
                : "Employé"
            }
            type={
              employee.role === "admin"
                ? "error"
                : employee.role === "manager"
                ? "info"
                : "warning"
            }
          />
        ),
        team: <span className="text-sm">{teamName}</span>,
        status: (
          <Badge
            label={employee.status === "actif" ? "Actif" : "Inactif"}
            type={employee.status === "actif" ? "success" : "warning"}
          />
        ),
        contractHours: (
          <span className="text-sm">
            {employee.contractHoursPerWeek || 35}h
          </span>
        ),
        actions: (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditCollaborator(employee)}
              title="Modifier"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDeleteEmployeeModal(employee._id)}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      };

      console.log("✅ Employé transformé:", mappedEmployee);
      return mappedEmployee;
    });
  }, [allEmployees, managerTeams]);

  // Filtrer les employés en fonction de la recherche et des filtres
  const filteredEmployees = useMemo(() => {
    return displayedEmployees.filter((employee) => {
      // Filtre de recherche (nom ou email)
      const fullName = employee.fullName.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        fullName.includes(searchQuery.toLowerCase()) ||
        employee.rawEmail.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtre par rôle
      const matchesRole =
        filters.role === "" || employee.rawRole === filters.role;

      // Filtre par équipe
      const matchesTeam =
        filters.teamId === "" ||
        (typeof employee.teamId === "string"
          ? employee.teamId === filters.teamId
          : employee.teamId?._id === filters.teamId);

      // Filtre par entreprise (pour les admins)
      const matchesCompany =
        filters.companyId === "" || employee.companyId === filters.companyId;

      return matchesSearch && matchesRole && matchesTeam && matchesCompany;
    });
  }, [displayedEmployees, searchQuery, filters]);

  /**
   * Gestion du changement des filtres
   */
  const handleFilterChange = (
    filterName: keyof FiltersState,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  /**
   * Création d'une nouvelle équipe
   */
  const createTeam = async () => {
    if (!validateTeamForm()) return;

    try {
      const response = await axiosInstance.post("/teams", teamFormData);

      if (response.data && response.data.success) {
        await fetchTeams();
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
        `/teams/${selectedTeam._id}`,
        teamFormData
      );

      if (response.data && response.data.success) {
        await fetchTeams();
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
      const response = await axiosInstance.delete(`/teams/${teamToDelete}`);

      if (response.data && response.data.success) {
        // Si l'équipe supprimée est celle qui est sélectionnée, réinitialiser la sélection
        if (teamToDelete === filters.teamId) {
          handleFilterChange("teamId", "");
        }

        await fetchTeams();
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
   * Gestion interne des erreurs de chargement
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
   * Gestion du changement de sélection d'équipe (filtre)
   */
  const handleTeamSelection = (teamId: string) => {
    handleFilterChange("teamId", teamId);
  };

  /**
   * Gestion du changement de sélection d'entreprise (filtre)
   */
  const handleCompanySelection = (companyId: string) => {
    handleFilterChange("companyId", companyId);
    // Réinitialiser le filtre d'équipe si on change d'entreprise
    handleFilterChange("teamId", "");
  };

  /**
   * Gestion du changement de sélection de rôle (filtre)
   */
  const handleRoleSelection = (role: string) => {
    handleFilterChange("role", role);
  };

  // Options d'équipes pour le select
  const teamOptions = useMemo(() => {
    return managerTeams.map((team) => ({
      value: team._id,
      label: team.name,
    }));
  }, [managerTeams]);

  // Options d'entreprises pour le select (admin uniquement)
  const companyOptions = useMemo(() => {
    return companies.map((company) => ({
      value: company._id,
      label: company.name,
    }));
  }, [companies]);

  // Options de rôles pour le select
  const roleOptions = [
    { value: "", label: "Tous les rôles" },
    { value: "employé", label: "Employé" },
    { value: "manager", label: "Manager" },
    { value: "directeur", label: "Directeur" },
  ];

  /**
   * Rendu d'une carte d'employé pour la version mobile/tablette
   */
  const renderEmployeeCard = (employee: any) => {
    return (
      <motion.div
        key={employee._id}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-3 p-4 transition-all"
      >
        <div className="flex flex-col space-y-3">
          {/* Nom et statut */}
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-800 dark:text-white text-lg">
              {employee.fullName}
            </h3>
            <Badge
              type={employee.rawStatus === "actif" ? "success" : "warning"}
              label={employee.rawStatus === "actif" ? "Actif" : "Inactif"}
            />
          </div>

          {/* Email et rôle */}
          <div className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
            <span>{employee.rawEmail}</span>
            <span className="font-medium">{employee.rawRole || "Employé"}</span>
          </div>

          {/* Équipe et manager */}
          <div className="flex justify-between items-center text-sm">
            <div className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Équipe:</span> {employee.teamName}
            </div>
            {employee.managerName && (
              <div className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Manager:</span>{" "}
                {employee.managerName}
              </div>
            )}
          </div>

          {/* Heures contractuelles */}
          <div className="text-gray-700 dark:text-gray-300 text-sm">
            <span className="font-medium">Heures:</span>{" "}
            {employee.rawContractHours}h
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              icon={
                <Pencil
                  size={16}
                  className="text-indigo-600 dark:text-indigo-400"
                />
              }
              onClick={() => handleOpenEditCollaborator(employee)}
              aria-label="Modifier ce collaborateur"
              className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={
                <Trash2 size={16} className="text-red-500 dark:text-red-400" />
              }
              onClick={() => handleOpenDeleteEmployeeModal(employee._id)}
              aria-label="Supprimer ce collaborateur"
              className="hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Configuration des filtres pour le composant FilterBar
  const filterConfig = {
    role: {
      label: "Rôle",
      value: filters.role,
      options: [
        { label: "Tous les rôles", value: "" },
        { label: "Employé", value: "employee" },
        { label: "Manager", value: "manager" },
      ],
      onChange: (value: string) => handleFilterChange("role", value),
    },
    team: {
      label: "Équipe",
      value: filters.teamId,
      options: [
        { label: "Toutes les équipes", value: "" },
        ...teamsToDisplay.map((team) => ({
          label: team.name,
          value: team._id,
        })),
      ],
      onChange: (value: string) => handleFilterChange("teamId", value),
    },
    ...(user?.role === "admin" && {
      company: {
        label: "Entreprise",
        value: filters.companyId,
        options: [
          { label: "Toutes les entreprises", value: "" },
          ...companies.map((company) => ({
            label: company.name,
            value: company._id,
          })),
        ],
        onChange: (value: string) => handleFilterChange("companyId", value),
      },
    }),
  };

  // Vérifier si l'utilisateur a accès à cette page (multi-rôles)
  if (user && !hasAccess) {
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
                Cette page est réservée aux managers, directeurs et
                administrateurs.
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
            subtitle={
              user?.role === "admin"
                ? "Gérez tous les utilisateurs du système"
                : user?.role === "directeur"
                ? "Gérez les employés et managers de votre entreprise"
                : "Gérez les équipes et les collaborateurs"
            }
            icon={
              <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            }
          />

          {/* Boutons d'actions */}
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
              className="dark:bg-gray-700 dark:text-white dark:hover:bg-indigo-800/50 dark:border-gray-600"
            >
              {user?.role === "manager"
                ? "Gérer mes équipes"
                : "Gérer les équipes"}
            </Button>
            <Button
              variant="secondary"
              icon={<Filter size={16} />}
              onClick={() => setFilterModalOpen(true)}
              className="dark:bg-gray-700 dark:text-white dark:hover:bg-indigo-800/50 dark:border-gray-600"
            >
              Filtres
            </Button>
          </div>
        </motion.div>

        {/* Barre de filtres et recherche */}
        <div className="mb-6">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Rechercher par nom ou email..."
            filters={filterConfig}
          />
        </div>

        {/* Contenu principal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <SectionCard className="dark:bg-gray-800/60 dark:border-gray-700">
            {employeesLoading ? (
              <div className="flex justify-center items-center p-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : employeesError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                <p className="text-red-600 dark:text-red-400">
                  {employeesError}
                </p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <User
                    size={48}
                    className="mx-auto text-gray-400 dark:text-gray-300 mb-4"
                  />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucun collaborateur trouvé
                  </h3>
                  <p className="text-gray-500 dark:text-gray-300 mb-4">
                    {searchQuery
                      ? "Aucun collaborateur trouvé avec ces critères de recherche."
                      : user?.role === "manager"
                      ? "Vous n'avez pas encore de collaborateurs dans vos équipes."
                      : user?.role === "directeur"
                      ? "Aucun collaborateur trouvé dans votre entreprise avec ces filtres."
                      : "Aucun collaborateur trouvé avec ces filtres."}
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
              <>
                {/* Version desktop (tableau) - visible uniquement sur md et plus */}
                <div className="hidden md:block">
                  {/* Bouton d'export PDF */}
                  {["manager", "admin", "directeur"].includes(
                    user?.role || ""
                  ) &&
                    filteredEmployees.length > 0 && (
                      <div className="mb-4 flex justify-end">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            // Créer des données pour l'export en utilisant les données brutes
                            const employeesForExport = filteredEmployees.map(
                              (employee) => ({
                                _id: employee._id,
                                firstName: employee.firstName,
                                lastName: employee.lastName,
                                email: employee.rawEmail,
                                role: employee.rawRole,
                                status: employee.rawStatus as
                                  | "actif"
                                  | "inactif",
                                teamId:
                                  typeof employee.teamId === "string"
                                    ? employee.teamId
                                    : employee.teamId?._id,
                                companyId: employee.companyId,
                                contractHoursPerWeek: employee.rawContractHours,
                                teamName: employee.teamName,
                              })
                            );

                            generateCollaboratorsPdf(employeesForExport);
                          }}
                          icon={<FileDown size={14} />}
                          className="dark:bg-gray-700 dark:text-white dark:hover:bg-indigo-800/50 dark:border-gray-600"
                        >
                          Exporter PDF
                        </Button>
                      </div>
                    )}
                  <AnimatePresence>
                    <Table
                      columns={collaboratorColumns}
                      data={filteredEmployees}
                      className="dark:bg-gray-800/60 dark:border-gray-700"
                    />
                  </AnimatePresence>
                </div>

                {/* Version mobile/tablette (cards) - visible uniquement sur sm et moins */}
                <div className="block md:hidden">
                  {/* Bouton d'export PDF pour mobile */}
                  {["manager", "admin", "directeur"].includes(
                    user?.role || ""
                  ) &&
                    filteredEmployees.length > 0 && (
                      <div className="mb-4 flex justify-end">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            // Créer des données pour l'export en utilisant les données brutes
                            const employeesForExport = filteredEmployees.map(
                              (employee) => ({
                                _id: employee._id,
                                firstName: employee.firstName,
                                lastName: employee.lastName,
                                email: employee.rawEmail,
                                role: employee.rawRole,
                                status: employee.rawStatus as
                                  | "actif"
                                  | "inactif",
                                teamId:
                                  typeof employee.teamId === "string"
                                    ? employee.teamId
                                    : employee.teamId?._id,
                                companyId: employee.companyId,
                                contractHoursPerWeek: employee.rawContractHours,
                                teamName: employee.teamName,
                              })
                            );

                            generateCollaboratorsPdf(employeesForExport);
                          }}
                          icon={<FileDown size={14} />}
                          className="dark:bg-gray-700 dark:text-white dark:hover:bg-indigo-800/50 dark:border-gray-600"
                        >
                          Exporter PDF
                        </Button>
                      </div>
                    )}
                  <div className="space-y-4 px-1 py-2">
                    <AnimatePresence>
                      {filteredEmployees.map((employee) =>
                        renderEmployeeCard(employee)
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </>
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

        {/* Modal de filtres avancés */}
        <AnimatePresence>
          {filterModalOpen && (
            <Modal
              isOpen={filterModalOpen}
              onClose={() => setFilterModalOpen(false)}
              title="Filtres avancés"
            >
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={modalVariants}
                className="space-y-4"
              >
                {/* Filtre par équipe */}
                <div>
                  <Select
                    label="Équipe"
                    options={[
                      { value: "", label: "Toutes les équipes" },
                      ...teamOptions,
                    ]}
                    value={filters.teamId}
                    onChange={handleTeamSelection}
                    disabled={teamsLoading || managerTeams.length === 0}
                    className="dark:text-white"
                  />
                </div>

                {/* Filtre par rôle (visible pour directeur et admin) */}
                {(user?.role === "directeur" || user?.role === "admin") && (
                  <div>
                    <Select
                      label="Rôle"
                      options={roleOptions}
                      value={filters.role}
                      onChange={handleRoleSelection}
                      className="dark:text-white"
                    />
                  </div>
                )}

                {/* Filtre par entreprise (uniquement pour admin) */}
                {user?.role === "admin" && (
                  <div>
                    <Select
                      label="Entreprise"
                      options={[
                        { value: "", label: "Toutes les entreprises" },
                        ...companyOptions,
                      ]}
                      value={filters.companyId}
                      onChange={handleCompanySelection}
                      disabled={companiesLoading}
                      className="dark:text-white"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      // Réinitialiser tous les filtres
                      setFilters({
                        role: "",
                        teamId: "",
                        companyId:
                          user?.role === "admin" ? "" : user?.companyId || "",
                      });
                    }}
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setFilterModalOpen(false)}
                  >
                    Appliquer
                  </Button>
                </div>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>

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

            // Vérifier si l'équipe sélectionnée existe toujours
            const selectedExists = updatedTeams.some(
              (t) => t._id === filters.teamId
            );

            if (filters.teamId !== "" && !selectedExists) {
              handleFilterChange("teamId", "");
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
