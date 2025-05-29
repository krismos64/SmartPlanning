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

// Étendre l'interface UserType pour inclure employeeTeams
declare module "../services/api" {
  interface User {
    employeeTeams?: { _id: string; name: string }[];
  }
}

import {
  Building,
  Plus,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axiosInstance from "../api/axiosInstance";
import { AuthContext } from "../context/AuthContext";

// Composants de layout
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Avatar from "../components/ui/Avatar";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import FileUpload from "../components/ui/FileUpload";
import FilterBar from "../components/ui/FilterBar";
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import PasswordField from "../components/ui/PasswordField";
import Select from "../components/ui/Select";
import SelectMulti from "../components/ui/SelectMulti";
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
  teamId?: string;
  teamIds?: string[]; // Pour stocker plusieurs équipes pour les managers
}

// Interface pour les entreprises
interface Company {
  _id: string;
  name: string;
}

// Interface pour les équipes
interface Team {
  _id: string;
  name: string;
  managerIds: string[]; // Tableau d'IDs des managers
  employeeIds: string[]; // Tableau d'IDs des employés (EmployeeModel)
  companyId: string;
}

interface UserFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  password?: string;
  photo?: string;
  companyId?: string;
  teamId?: string;
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
  { key: "company", label: "Entreprise", sortable: true },
  { key: "role", label: "Rôle", sortable: true },
  { key: "teams", label: "Équipes", sortable: false },
  { key: "status", label: "Statut", sortable: true },
  { key: "createdAt", label: "Date de création", sortable: true },
  { key: "actions", label: "Actions", sortable: false },
];

// Éléments du fil d'ariane
const breadcrumbItems = [
  { label: "Dashboard", link: "/tableau-de-bord" },
  { label: "Utilisateurs", link: "/gestion-des-utilisateurs" },
];

// Composant pour afficher une carte utilisateur en vue mobile
const UserCard = ({ user }: { user: any }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="flex items-center mb-4">
        <div className="mr-4">
          <Avatar
            src={user.photoUrl || undefined}
            alt={`${user.firstName} ${user.lastName}`}
            size="md"
            fallback={`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}
          />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{`${user.firstName} ${user.lastName}`}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Rôle:
          </span>
          <div>{user.role}</div>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Entreprise:
          </span>
          <div>{user.company}</div>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Statut:
          </span>
          <div>{user.status}</div>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Équipes:
          </span>
          <div>{user.teams}</div>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Date de création:
          </span>
          <div className="text-sm">{user.createdAt}</div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        {user.actions}
      </div>
    </div>
  );
};

/**
 * Composant principal de la page de gestion des utilisateurs
 */
const UserManagementPage: React.FC = () => {
  // États pour les utilisateurs et la pagination
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  // Obtenir le contexte d'authentification
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.user;

  // États pour les filtres
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    companyId: "",
  });

  // État pour la recherche
  const [searchQuery, setSearchQuery] = useState<string>("");

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
    teamId: "",
    teamIds: [],
  });

  const [formErrors, setFormErrors] = useState<UserFormErrors>({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyLoading, setCompanyLoading] = useState<boolean>(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState<boolean>(false);
  const [employees, setEmployees] = useState<any[]>([]);

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

  // Récupération des utilisateurs depuis l'API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/admin/users");
      console.log("UTILISATEURS RÉCUPÉRÉS BRUTS:", response.data);

      // Extraire correctement le tableau d'utilisateurs
      let usersData;
      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        usersData = response.data.data;
      } else if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.users)
      ) {
        // Format {success: true, users: Array}
        usersData = response.data.users;
      } else if (Array.isArray(response.data)) {
        usersData = response.data;
      } else {
        console.error(
          "Format de réponse inattendu pour les utilisateurs:",
          response.data
        );
        usersData = [];
      }

      // Traitement des utilisateurs récupérés
      const processedUsers = usersData.map((user: any) => ({
        ...user,
        _id: String(user._id || user.id),
        // Assurer que les propriétés requises sont présentes
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || "employee",
        status: user.status || "actif",
        photoUrl: user.photoUrl || null,
        companyId: user.companyId ? String(user.companyId) : null,
        teamId: user.teamId ? String(user.teamId) : null,
      }));

      console.log("UTILISATEURS TRAITÉS:", processedUsers);

      // Associer directement les équipes aux utilisateurs qui sont des employés
      if (
        Array.isArray(teams) &&
        teams.length > 0 &&
        Array.isArray(employees) &&
        employees.length > 0
      ) {
        console.log("🔄 ASSOCIATION DIRECTE DES ÉQUIPES AUX UTILISATEURS");

        // Pour chaque utilisateur qui est un employé
        for (const user of processedUsers) {
          if (user.role === "employee") {
            // Chercher l'employé correspondant
            const employee = employees.find(
              (emp) =>
                emp.userId === user._id ||
                (emp.firstName === user.firstName &&
                  emp.lastName === user.lastName)
            );

            if (employee && employee.teams && employee.teams.length > 0) {
              // Copier les équipes de l'employé à l'utilisateur
              user.employeeTeams = employee.teams;
              console.log(
                `✅ ÉQUIPES COPIÉES DE L'EMPLOYÉ À L'UTILISATEUR ${
                  user.firstName
                } ${user.lastName}: ${employee.teams
                  .map((t: { name: string }) => t.name)
                  .join(", ")}`
              );
            } else {
              // Chercher directement dans les équipes
              const userTeams = teams.filter(
                (team) =>
                  team.employeeIds &&
                  Array.isArray(team.employeeIds) &&
                  team.employeeIds.some((id) => String(id) === String(user._id))
              );

              if (userTeams.length > 0) {
                user.employeeTeams = userTeams.map((team) => ({
                  _id: team._id,
                  name: team.name,
                }));
                console.log(
                  `✅ ÉQUIPES TROUVÉES DIRECTEMENT POUR L'UTILISATEUR ${
                    user.firstName
                  } ${user.lastName}: ${user.employeeTeams
                    .map((t: { name: string }) => t.name)
                    .join(", ")}`
                );
              }
            }
          }
        }
      }

      setUsers(processedUsers);
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs:", err);
      setError("Impossible de charger la liste des utilisateurs");
      setShowErrorToast(true);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [teams, employees]);

  /**
   * Chargement initial des utilisateurs
   */
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Chargement des entreprises
  useEffect(() => {
    const fetchCompanies = async () => {
      setCompanyLoading(true);
      try {
        const response = await axiosInstance.get("/admin/companies");
        console.log("Données entreprises récupérées:", response.data);

        // Extraire correctement le tableau d'entreprises
        if (
          response.data &&
          response.data.success &&
          Array.isArray(response.data.data)
        ) {
          setCompanies(response.data.data);
        } else if (Array.isArray(response.data)) {
          // Fallback si les données sont directement un tableau
          setCompanies(response.data);
        } else {
          console.error(
            "Format de réponse inattendu pour les entreprises:",
            response.data
          );
          setCompanies([]);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des entreprises:", err);
        setCompanies([]);
      } finally {
        setCompanyLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Chargement des équipes
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        console.log("🔄 DÉBUT CHARGEMENT ÉQUIPES");

        // Si l'utilisateur est admin, on peut charger toutes les équipes
        const isAdmin = currentUser?.role === "admin";

        // Pour les autres rôles, on a besoin d'un companyId
        if (!isAdmin && !currentUser?.companyId) {
          console.warn(
            "⚠️ Pas de companyId disponible pour charger les équipes"
          );
          return;
        }

        // Initialiser un tableau pour stocker toutes les équipes
        let allTeams: any[] = [];

        if (isAdmin) {
          console.log(`🏢 ADMIN - CHARGEMENT DES ÉQUIPES PAR ENTREPRISE`);

          // Pour les admins, charger les équipes par entreprise
          if (companies.length === 0) {
            try {
              // Récupérer d'abord les entreprises si ce n'est pas déjà fait
              const companiesResponse = await axiosInstance.get(
                "/admin/companies"
              );
              const companiesData =
                companiesResponse.data.data || companiesResponse.data;

              if (!Array.isArray(companiesData) || companiesData.length === 0) {
                console.log(
                  "⚠️ Aucune entreprise disponible pour récupérer les équipes"
                );
                setTeams([]);
                return;
              }
            } catch (err) {
              console.error("❌ ERREUR CHARGEMENT ENTREPRISES:", err);
              setTeams([]);
              return;
            }
          }

          // Récupérer les équipes pour chaque entreprise
          for (const company of companies) {
            try {
              console.log(
                `🔍 RÉCUPÉRATION DES ÉQUIPES POUR L'ENTREPRISE ${company.name} (${company._id})`
              );
              const timestamp = new Date().getTime();
              const response = await axiosInstance.get(
                `/admin/teams?companyId=${company._id}&_t=${timestamp}`
              );

              // Extraire les données des équipes
              const companyTeams =
                response.data.data ||
                response.data.teams ||
                response.data ||
                [];

              if (Array.isArray(companyTeams) && companyTeams.length > 0) {
                // Ajouter l'ID de l'entreprise à chaque équipe si ce n'est pas déjà fait
                const enrichedTeams = companyTeams.map((team: any) => ({
                  ...team,
                  companyId: team.companyId || company._id,
                }));

                allTeams.push(...enrichedTeams);
              }
            } catch (err) {
              console.warn(
                `⚠️ Erreur lors de la récupération des équipes pour l'entreprise ${company.name}:`,
                err
              );
              // Continuer avec les autres entreprises même en cas d'erreur
            }
          }
        } else {
          // Pour les autres rôles, utiliser le companyId de l'utilisateur connecté
          const companyId = String(currentUser?.companyId);
          console.log(
            `🏢 CHARGEMENT DES ÉQUIPES POUR L'ENTREPRISE ${companyId}`
          );

          // Ajout d'un timestamp pour éviter le cache
          const timestamp = new Date().getTime();
          const url = `/admin/teams?companyId=${companyId}&_t=${timestamp}`;

          const response = await axiosInstance.get(url);
          console.log("📥 REÇU API TEAMS:", response);

          // Détection de la structure des données
          if (
            response.data &&
            response.data.data &&
            Array.isArray(response.data.data)
          ) {
            allTeams = response.data.data;
            console.log(
              `📋 TEAMS TROUVÉES DANS DATA.DATA (ARRAY): ${allTeams.length}`
            );
          } else if (
            response.data &&
            response.data.teams &&
            Array.isArray(response.data.teams)
          ) {
            allTeams = response.data.teams;
            console.log(
              `📋 TEAMS TROUVÉES DANS DATA.TEAMS (ARRAY): ${allTeams.length}`
            );
          } else if (Array.isArray(response.data)) {
            allTeams = response.data;
            console.log(
              `📋 TEAMS TROUVÉES DIRECTEMENT DANS DATA (ARRAY): ${allTeams.length}`
            );
          } else {
            console.log("⚠️ FORMAT DE DONNÉES TEAMS INATTENDU:", response.data);
            setTeams([]);
            return;
          }
        }

        // S'assurer que tous les IDs sont des chaînes de caractères et créer un objet formaté
        const formattedTeams = allTeams
          .filter((team) => team && typeof team === "object") // Filtrer les éléments invalides
          .map((team: any) => {
            const formatted = {
              ...team,
              _id: team._id ? String(team._id) : `unknown-${Math.random()}`,
              companyId: team.companyId
                ? typeof team.companyId === "object" && team.companyId._id
                  ? String(team.companyId._id)
                  : typeof team.companyId === "string"
                  ? team.companyId
                  : null
                : null,
              // Gérer correctement managerIds comme un tableau
              managerIds: Array.isArray(team.managerIds)
                ? team.managerIds.map((id: any) => String(id))
                : team.managerId
                ? [String(team.managerId)]
                : [],
              // S'assurer que employeeIds est un tableau valide
              employeeIds: Array.isArray(team.employeeIds)
                ? team.employeeIds.map((id: any) => String(id))
                : [],
              name: team.name || "Équipe sans nom",
            };

            console.log(`👥 ÉQUIPE FORMATÉE:`, {
              _id: formatted._id,
              name: formatted.name,
              managerIds: formatted.managerIds,
              employeeIds: formatted.employeeIds,
              companyId: formatted.companyId,
            });

            return formatted;
          });

        console.log(`✅ TOTAL ÉQUIPES TRAITÉES: ${formattedTeams.length}`);

        if (formattedTeams.length > 0) {
          console.log("👁️ PREMIÈRE ÉQUIPE:", formattedTeams[0]);
        }

        setTeams(formattedTeams);
      } catch (err) {
        console.error("❌ ERREUR CHARGEMENT ÉQUIPES:", err);
        setTeams([]);
      }
    };

    // Exécuter fetchTeams seulement si l'utilisateur est admin ou s'il a un companyId
    if (currentUser?.role === "admin" || currentUser?.companyId) {
      fetchTeams();
    }
  }, [currentUser?.companyId, currentUser?.role, companies]);

  // Chargement des employés
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        console.log("🔄 DÉBUT CHARGEMENT EMPLOYÉS");

        // Si l'utilisateur est admin, on peut charger tous les employés sans filtrer par companyId
        const isAdmin = currentUser?.role === "admin";

        // Pour les autres rôles, on a besoin d'un companyId
        if (!isAdmin && !currentUser?.companyId) {
          console.warn(
            "⚠️ Pas de companyId disponible pour charger les employés"
          );
          return;
        }

        // Initialiser un tableau vide pour stocker les employés
        let employeesData: any[] = [];

        if (isAdmin) {
          // Pour les admins, récupérer d'abord les entreprises si ce n'est pas déjà fait
          if (companies.length === 0) {
            try {
              const companiesResponse = await axiosInstance.get(
                "/admin/companies"
              );
              const companiesData =
                companiesResponse.data.data || companiesResponse.data;

              // Si aucune entreprise n'est disponible, retourner un tableau vide
              if (!Array.isArray(companiesData) || companiesData.length === 0) {
                console.log(
                  "⚠️ Aucune entreprise disponible pour récupérer les employés"
                );
                setEmployees([]);
                return;
              }
            } catch (err) {
              console.error("❌ ERREUR CHARGEMENT ENTREPRISES:", err);
              setEmployees([]);
              return;
            }
          }

          // Approche pour les admins: récupérer les employés de chaque entreprise
          const allEmployees: any[] = [];

          // Récupérer les employés pour chaque entreprise
          for (const company of companies) {
            try {
              console.log(
                `🔍 RÉCUPÉRATION DES EMPLOYÉS POUR L'ENTREPRISE ${company.name} (${company._id})`
              );
              const timestamp = new Date().getTime();

              // Utiliser l'endpoint withteams pour récupérer les employés avec leurs équipes
              const response = await axiosInstance.get(
                `/admin/employees/withteams?companyId=${company._id}&_t=${timestamp}`
              );

              // Extraire les données des employés
              const companyEmployees =
                response.data.data ||
                response.data.employees ||
                response.data ||
                [];

              if (
                Array.isArray(companyEmployees) &&
                companyEmployees.length > 0
              ) {
                // Ajouter l'ID de l'entreprise à chaque employé si ce n'est pas déjà fait
                const enrichedEmployees = companyEmployees.map((emp: any) => ({
                  ...emp,
                  companyId: emp.companyId || company._id,
                }));

                allEmployees.push(...enrichedEmployees);
                console.log(
                  `✅ ${enrichedEmployees.length} employés récupérés pour ${company.name}`
                );
              }
            } catch (err) {
              console.warn(
                `⚠️ Erreur lors de la récupération des employés pour l'entreprise ${company.name}:`,
                err
              );
              // Continuer avec les autres entreprises même en cas d'erreur
            }
          }

          employeesData = allEmployees;
          console.log(`✅ TOTAL EMPLOYÉS RÉCUPÉRÉS: ${employeesData.length}`);
        } else {
          // Pour les autres rôles, utiliser le companyId de l'utilisateur connecté
          const companyId = String(currentUser?.companyId);
          const timestamp = new Date().getTime();

          try {
            // Utiliser l'endpoint withteams
            console.log(
              `🔍 TENTATIVE ENDPOINT EMPLOYEES WITHTEAMS: /admin/employees/withteams?companyId=${companyId}`
            );
            const response = await axiosInstance.get(
              `/admin/employees/withteams?companyId=${companyId}&_t=${timestamp}`
            );
            employeesData =
              response.data.data ||
              response.data.employees ||
              response.data ||
              [];
          } catch (err) {
            console.warn(
              "⚠️ Endpoint withteams non disponible:",
              (err as Error).message
            );

            try {
              // Fallback: utiliser l'endpoint employees standard
              console.log(
                `🔍 FALLBACK ENDPOINT EMPLOYEES: /admin/employees?companyId=${companyId}`
              );
              const response = await axiosInstance.get(
                `/admin/employees?companyId=${companyId}&_t=${timestamp}`
              );
              employeesData =
                response.data.data ||
                response.data.employees ||
                response.data ||
                [];
            } catch (err) {
              console.error("❌ ERREUR RÉCUPÉRATION EMPLOYÉS STANDARD:", err);
              employeesData = [];
            }
          }
        }

        if (!employeesData || !Array.isArray(employeesData)) {
          console.error("❌ DONNÉES EMPLOYEES INVALIDES");
          setEmployees([]);
          return;
        }

        // Formater les données avec une approche defensive
        const formattedEmployees = employeesData
          .filter((emp) => emp && typeof emp === "object")
          .map((emp: any) => {
            // Normaliser tous les champs importants
            const formatted = {
              _id: emp._id ? String(emp._id) : `unknown-${Math.random()}`,
              userId: emp.userId ? String(emp.userId) : null,
              teamId: emp.teamId ? String(emp.teamId) : null,
              // Stocker les équipes associées si disponibles dans la réponse
              teams: emp.teams
                ? emp.teams.map(
                    (t: { _id: string | number; name: string }) => ({
                      _id: String(t._id),
                      name: t.name,
                    })
                  )
                : [],
              firstName: emp.firstName || emp.user?.firstName || "",
              lastName: emp.lastName || emp.user?.lastName || "",
              email: emp.email || emp.user?.email || "",
              status: emp.status || "actif",
              companyId: emp.companyId
                ? String(emp.companyId)
                : currentUser?.companyId
                ? String(currentUser.companyId)
                : null,
            };

            // Log des équipes associées aux employés pour le debugging
            if (formatted.teams && formatted.teams.length > 0) {
              console.log(
                `👤 EMPLOYÉ ${formatted.firstName} ${formatted.lastName} A ${formatted.teams.length} ÉQUIPES:`,
                formatted.teams.map((t: { name: string }) => t.name).join(", ")
              );
            } else if (formatted.teamId) {
              console.log(
                `👤 EMPLOYÉ ${formatted.firstName} ${formatted.lastName} A UN TEAMID MAIS PAS D'ÉQUIPES:`,
                formatted.teamId
              );
            }

            return formatted;
          });

        console.log(`✅ TOTAL EMPLOYÉS TRAITÉS: ${formattedEmployees.length}`);

        // Associer directement les équipes aux employés avant de mettre à jour l'état
        if (Array.isArray(teams) && teams.length > 0) {
          console.log("🔄 ASSOCIATION DIRECTE DES ÉQUIPES AUX EMPLOYÉS");

          // Créer un mapping pour accélérer les recherches
          const employeeIdToTeamsMap = new Map();

          // Pour chaque équipe, indexer les employés qui y appartiennent
          teams.forEach((team) => {
            if (team.employeeIds && Array.isArray(team.employeeIds)) {
              team.employeeIds.forEach((employeeId) => {
                const empId = String(employeeId);
                if (!employeeIdToTeamsMap.has(empId)) {
                  employeeIdToTeamsMap.set(empId, []);
                }
                employeeIdToTeamsMap.get(empId).push({
                  _id: team._id,
                  name: team.name,
                });
              });
            }
          });

          // Associer les équipes à chaque employé
          for (const employee of formattedEmployees) {
            // Vérifier si l'employé a déjà des équipes
            if (employee.teams && employee.teams.length > 0) {
              continue;
            }

            // Chercher par ID d'employé
            if (employeeIdToTeamsMap.has(String(employee._id))) {
              employee.teams = employeeIdToTeamsMap.get(String(employee._id));
              console.log(
                `✅ ÉQUIPES ASSOCIÉES À ${employee.firstName} ${
                  employee.lastName
                }: ${employee.teams
                  .map((t: { name: string }) => t.name)
                  .join(", ")}`
              );
              continue;
            }

            // Chercher par teamId si disponible
            if (employee.teamId) {
              const matchingTeam = teams.find(
                (team) => team._id === employee.teamId
              );
              if (matchingTeam) {
                employee.teams = [
                  { _id: matchingTeam._id, name: matchingTeam.name },
                ];
                console.log(
                  `✅ ÉQUIPE ASSOCIÉE PAR TEAMID À ${employee.firstName} ${employee.lastName}: ${matchingTeam.name}`
                );
                continue;
              }
            }

            // Chercher par userId si disponible
            if (employee.userId) {
              // Vérifier si l'employé est référencé par son userId dans une équipe
              const matchingTeams = teams.filter(
                (team) =>
                  team.employeeIds &&
                  Array.isArray(team.employeeIds) &&
                  team.employeeIds.some(
                    (id) => String(id) === String(employee.userId)
                  )
              );

              if (matchingTeams.length > 0) {
                employee.teams = matchingTeams.map((team) => ({
                  _id: team._id,
                  name: team.name,
                }));
                console.log(
                  `✅ ÉQUIPES ASSOCIÉES PAR USERID À ${employee.firstName} ${
                    employee.lastName
                  }: ${employee.teams
                    .map((t: { name: string }) => t.name)
                    .join(", ")}`
                );
              }
            }
          }
        }

        setEmployees(formattedEmployees);
      } catch (err) {
        console.error("❌ ERREUR CHARGEMENT EMPLOYÉS:", err);
        setError("Erreur lors du chargement des employés");
        setShowErrorToast(true);
        setEmployees([]);
      }
    };

    // Fonction pour enrichir les employés avec les équipes manquantes
    const enrichEmployeesWithTeams = (employeesList: any[]) => {
      if (!Array.isArray(teams) || teams.length === 0) {
        console.log("⚠️ Pas d'équipes disponibles pour enrichir les employés");
        return;
      }

      console.log(
        `🔄 DÉBUT ENRICHISSEMENT: ${employeesList.length} employés avec ${teams.length} équipes disponibles`
      );
      console.log(
        "📊 ÉQUIPES DISPONIBLES:",
        teams.map((t) => `${t.name} (${t._id})`).join(", ")
      );

      // Créer un dictionnaire pour accélérer les recherches
      const teamsByEmployeeId = new Map();

      // Pour chaque équipe, indexer les employés qui y appartiennent
      teams.forEach((team) => {
        if (team.employeeIds && Array.isArray(team.employeeIds)) {
          team.employeeIds.forEach((employeeId) => {
            const empId = String(employeeId);
            if (!teamsByEmployeeId.has(empId)) {
              teamsByEmployeeId.set(empId, []);
            }
            teamsByEmployeeId.get(empId).push({
              _id: team._id,
              name: team.name,
            });
          });
        }
      });

      console.log(
        `🔍 INDEX CRÉÉ: ${teamsByEmployeeId.size} employés indexés avec leurs équipes`
      );

      // Afficher les IDs indexés pour le débogage
      if (teamsByEmployeeId.size > 0) {
        console.log(
          "🔑 IDs EMPLOYÉS INDEXÉS:",
          Array.from(teamsByEmployeeId.keys()).slice(0, 5).join(", ") +
            (teamsByEmployeeId.size > 5 ? "..." : "")
        );
      }

      const updatedEmployees = employeesList.map((employee) => {
        console.log(
          `🔎 TRAITEMENT DE L'EMPLOYÉ: ${employee.firstName} ${
            employee.lastName
          } (ID: ${employee._id}, UserID: ${employee.userId || "N/A"})`
        );

        // Si l'employé a déjà des équipes, dédupliquer
        if (employee.teams && employee.teams.length > 0) {
          // Dédupliquer les équipes existantes par leur _id
          const uniqueTeamsMap = new Map();
          employee.teams.forEach((team: { _id: string; name: string }) => {
            if (!uniqueTeamsMap.has(team._id)) {
              uniqueTeamsMap.set(team._id, team);
            }
          });

          // Si des doublons ont été trouvés, mettre à jour les équipes
          if (uniqueTeamsMap.size !== employee.teams.length) {
            const uniqueTeams = Array.from(uniqueTeamsMap.values());
            console.log(
              `✅ ÉQUIPES DÉDUPLIQUÉES POUR ${employee.firstName} ${
                employee.lastName
              }: ${uniqueTeams.map((t: any) => t.name).join(", ")}`
            );
            return {
              ...employee,
              teams: uniqueTeams,
            };
          }
          return employee;
        }

        // Si l'employé a un teamId mais pas d'équipes, chercher l'équipe correspondante
        if (employee.teamId) {
          const matchingTeam = teams.find(
            (team) => team._id === employee.teamId
          );
          if (matchingTeam) {
            console.log(
              `✅ ÉQUIPE TROUVÉE PAR TEAMID POUR ${employee.firstName} ${employee.lastName}: ${matchingTeam.name}`
            );
            return {
              ...employee,
              teams: [{ _id: matchingTeam._id, name: matchingTeam.name }],
            };
          }
        }

        // Chercher dans l'index par ID d'employé
        if (teamsByEmployeeId.has(String(employee._id))) {
          const employeeTeams = teamsByEmployeeId.get(String(employee._id));
          console.log(
            `✅ ÉQUIPES TROUVÉES PAR INDEX POUR ${employee.firstName} ${
              employee.lastName
            }: ${employeeTeams.map((t: { name: string }) => t.name).join(", ")}`
          );
          return {
            ...employee,
            teams: employeeTeams,
          };
        }

        // Chercher par userId si disponible
        if (employee.userId && teamsByEmployeeId.has(String(employee.userId))) {
          const employeeTeams = teamsByEmployeeId.get(String(employee.userId));
          console.log(
            `✅ ÉQUIPES TROUVÉES PAR USERID POUR ${employee.firstName} ${
              employee.lastName
            }: ${employeeTeams.map((t: { name: string }) => t.name).join(", ")}`
          );
          return {
            ...employee,
            teams: employeeTeams,
          };
        }

        // Dernière tentative: chercher dans les employeeIds des équipes
        const matchingTeams = teams.filter(
          (team) =>
            team.employeeIds &&
            Array.isArray(team.employeeIds) &&
            // Vérifier si l'employé est référencé par son _id
            (team.employeeIds.some(
              (id) => String(id) === String(employee._id)
            ) ||
              // Ou par son userId si disponible
              (employee.userId &&
                team.employeeIds.some(
                  (id) => String(id) === String(employee.userId)
                )))
        );

        if (matchingTeams.length > 0) {
          // Dédupliquer les équipes par leur _id
          const uniqueTeamsMap = new Map();
          matchingTeams.forEach(
            (team: {
              _id: string;
              name: string;
              managerIds?: string[];
              employeeIds?: string[];
            }) => {
              if (!uniqueTeamsMap.has(team._id)) {
                uniqueTeamsMap.set(team._id, {
                  _id: team._id,
                  name: team.name,
                });
              }
            }
          );

          const uniqueTeams = Array.from(uniqueTeamsMap.values());

          console.log(
            `✅ ÉQUIPES TROUVÉES PAR RECHERCHE DIRECTE POUR ${employee.firstName} ${employee.lastName}:`,
            uniqueTeams.map((t) => t.name).join(", ")
          );

          return {
            ...employee,
            teams: uniqueTeams,
          };
        }

        // Dernière tentative: chercher directement par le nom dans les équipes
        const nameBasedId = `${employee.firstName.toLowerCase()}-${employee.lastName.toLowerCase()}`;
        const nameMatchingTeams = teams.filter(
          (team) =>
            team.name &&
            team.name.toLowerCase().includes(employee.firstName.toLowerCase())
        );

        if (nameMatchingTeams.length > 0) {
          console.log(
            `✅ ÉQUIPES TROUVÉES PAR NOM POUR ${employee.firstName} ${
              employee.lastName
            }: ${nameMatchingTeams.map((t) => t.name).join(", ")}`
          );
          return {
            ...employee,
            teams: nameMatchingTeams.map((team) => ({
              _id: team._id,
              name: team.name,
            })),
          };
        }

        return employee;
      });

      // Mettre à jour l'état si des modifications ont été apportées
      const employeesWithTeams = updatedEmployees.filter(
        (emp) => emp.teams && emp.teams.length > 0
      );
      console.log(
        `📊 APRÈS ENRICHISSEMENT: ${employeesWithTeams.length}/${updatedEmployees.length} employés ont des équipes associées`
      );

      // Toujours mettre à jour l'état pour s'assurer que les équipes sont correctement associées
      console.log("✅ MISE À JOUR DE L'ÉTAT DES EMPLOYÉS");
      setEmployees(updatedEmployees);
    };

    // Exécuter fetchEmployees seulement si l'utilisateur est admin ou s'il a un companyId
    if (currentUser?.role === "admin" || currentUser?.companyId) {
      fetchEmployees();
    }
  }, [currentUser?.companyId, currentUser?.role, companies, teams]);

  // Filtrer les utilisateurs en fonction de la recherche et des filtres
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        // Filtre de recherche (nom ou email)
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const matchesSearch =
          searchQuery === "" ||
          fullName.includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase());

        // Filtre par rôle
        const matchesRole = filters.role === "" || user.role === filters.role;

        // Filtre par statut
        const matchesStatus =
          filters.status === "" || user.status === filters.status;

        // Filtre par entreprise
        const matchesCompany =
          filters.companyId === "" || user.companyId === filters.companyId;

        return matchesSearch && matchesRole && matchesStatus && matchesCompany;
      })
      .map((user) => {
        // Trouver l'entreprise correspondante
        const company = companies.find((c) => c._id === user.companyId);

        // Trouver les équipes associées à l'utilisateur
        let userTeams: { _id: string; name: string }[] = [];

        if (user.role === "employee") {
          // Pour les employés, chercher dans le tableau employees qui contient déjà les équipes
          const employee = employees.find(
            (e) =>
              e.userId === user._id ||
              (e.firstName === user.firstName && e.lastName === user.lastName)
          );

          if (employee && employee.teams && employee.teams.length > 0) {
            userTeams = employee.teams;
            console.log(
              `👤 ✅ EMPLOYÉ ${user.firstName} ${user.lastName} a ${userTeams.length} équipe(s):`,
              userTeams.map((t) => t.name).join(", ")
            );
          } else {
            console.log(
              `👤 ⚠️ EMPLOYÉ ${user.firstName} ${user.lastName} (ID: ${user._id}) n'a AUCUNE équipe trouvée`
            );
          }
        } else if (user.role === "manager") {
          // Pour les managers, chercher dans les équipes où ils sont managers
          console.log(
            `👨‍💼 RECHERCHE ÉQUIPES POUR MANAGER ${user.firstName} ${user.lastName} (ID: ${user._id})`
          );
          console.log(`📊 ÉQUIPES DISPONIBLES: ${teams.length}`);

          const teamSet = new Set<string>();
          const uniqueTeams: { _id: string; name: string }[] = [];

          teams.forEach((team) => {
            console.log(
              `🔍 ÉQUIPE ${team.name} - managerIds:`,
              team.managerIds
            );

            if (team.managerIds && Array.isArray(team.managerIds)) {
              // Vérifier si l'ID du manager est dans la liste
              const isManager = team.managerIds.some((managerId) => {
                const managerIdStr = String(managerId);
                const userIdStr = String(user._id);
                console.log(
                  `  🔸 Comparaison: ${managerIdStr} === ${userIdStr} ? ${
                    managerIdStr === userIdStr
                  }`
                );
                return managerIdStr === userIdStr;
              });

              if (isManager && !teamSet.has(team._id)) {
                teamSet.add(team._id);
                uniqueTeams.push({ _id: team._id, name: team.name });
                console.log(
                  `  ✅ MANAGER ${user.firstName} ${user.lastName} ajouté à l'équipe ${team.name}`
                );
              }
            } else {
              console.log(
                `  ⚠️ ÉQUIPE ${team.name} n'a pas de managerIds valides:`,
                team.managerIds
              );
            }
          });

          userTeams = uniqueTeams;
          console.log(
            `👨‍💼 RÉSULTAT FINAL MANAGER ${user.firstName} ${user.lastName}: ${userTeams.length} équipe(s):`,
            userTeams.map((t) => t.name).join(", ")
          );
        } else if (user.role === "directeur" || user.role === "admin") {
          // Les directeurs et admins pourraient avoir accès à toutes les équipes de leur entreprise
          console.log(
            `👔 ${user.role.toUpperCase()} ${user.firstName} ${
              user.lastName
            } - pas d'équipes spécifiques`
          );
        }

        // Formater les données pour l'affichage dans le tableau
        return {
          ...user,
          // Colonne nom avec avatar et nom complet
          name: (
            <div className="flex items-center space-x-3">
              <Avatar
                src={user.photoUrl || undefined}
                alt={`${user.firstName} ${user.lastName}`}
                size="md"
                fallback={`${user.firstName.charAt(0)}${user.lastName.charAt(
                  0
                )}`}
              />
              <div>
                <div className="font-medium">{`${user.firstName} ${user.lastName}`}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </div>
              </div>
            </div>
          ),
          // Colonne entreprise
          company: company ? (
            <div className="flex items-center">
              <Building
                size={16}
                className="mr-2 text-gray-500 dark:text-gray-400"
              />
              <span>{company.name}</span>
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">-</span>
          ),
          // Colonne équipes
          teams:
            userTeams.length > 0 ? (
              <div className="flex flex-col">
                {userTeams.map((team, index) => (
                  <span
                    key={`${user._id}-${team._id || index}`}
                    className="text-sm py-0.5"
                  >
                    {team.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            ),
          // Colonne rôle
          role: (
            <div className="flex items-center">
              {user.role === "admin" && (
                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Administrateur
                </span>
              )}
              {user.role === "directeur" && (
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Directeur
                </span>
              )}
              {user.role === "manager" && (
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Manager
                </span>
              )}
              {user.role === "employee" && (
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  Employé
                </span>
              )}
            </div>
          ),
          // Colonne statut
          status: (
            <div className="flex items-center">
              <div
                className={`w-2 h-2 mr-2 rounded-full ${
                  user.status === "active" ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span>{user.status === "active" ? "Actif" : "Inactif"}</span>
            </div>
          ),
          // Colonne date de création
          createdAt: new Date(user.createdAt).toLocaleString("fr-FR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          // Colonne actions
          actions: (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEditUser(user)}
                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                title="Modifier l'utilisateur"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button
                onClick={() => handleToggleStatus(user._id, user.status)}
                className={`p-1 ${
                  user.status === "active"
                    ? "text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                    : "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                }`}
                title={
                  user.status === "active"
                    ? "Désactiver l'utilisateur"
                    : "Activer l'utilisateur"
                }
              >
                {user.status === "active" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                    <line x1="12" y1="2" x2="12" y2="12"></line>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                )}
              </button>
              <button
                onClick={() => handleOpenDeleteModal(user._id)}
                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                title="Supprimer l'utilisateur"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ),
        };
      });
  }, [users, companies, teams, employees, searchQuery, filters]);

  // Gestion du changement des filtres
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
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
      teamId: "",
      teamIds: [], // Réinitialiser aussi les équipes multiples
    });

    if (formErrors.companyId) {
      setFormErrors({
        ...formErrors,
        companyId: "",
      });
    }

    // Charger les équipes pour cette entreprise
    if (value) {
      loadTeamsForCompany(value);
    } else {
      setTeams([]);
    }
  };

  /**
   * Charger les équipes pour une entreprise spécifique
   */
  const loadTeamsForCompany = async (companyId: string) => {
    try {
      setTeamsLoading(true);
      const timestamp = new Date().getTime();
      const response = await axiosInstance.get(
        `/admin/teams?companyId=${companyId}&_t=${timestamp}`
      );

      // Extraire les équipes de la réponse
      let teamsData = null;
      if (response.data && response.data.data) {
        teamsData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        teamsData = response.data;
      } else if (response.data && response.data.teams) {
        teamsData = response.data.teams;
      }

      if (teamsData && Array.isArray(teamsData)) {
        // S'assurer que chaque équipe a un companyId valide
        const formattedTeams = teamsData.map((team) => ({
          ...team,
          _id: String(team._id),
          companyId: team.companyId || companyId, // Utiliser le companyId passé en paramètre si non défini
          name: team.name || "Équipe sans nom",
          managerIds: Array.isArray(team.managerIds)
            ? team.managerIds.map((id: string | number) => String(id))
            : team.managerId
            ? [String(team.managerId)]
            : [],
          employeeIds: Array.isArray(team.employeeIds)
            ? team.employeeIds.map((id: string | number) => String(id))
            : [],
        }));

        console.log(
          `✅ ÉQUIPES CHARGÉES POUR L'ENTREPRISE ${companyId}:`,
          formattedTeams.length
        );
        setTeams(formattedTeams);
      } else {
        console.log(`⚠️ AUCUNE ÉQUIPE TROUVÉE POUR L'ENTREPRISE ${companyId}`);
        setTeams([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des équipes:", err);
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  /**
   * Gestion du changement d'équipe (sélection simple - pour les employés)
   */
  const handleTeamChange = (value: string) => {
    setFormData({
      ...formData,
      teamId: value,
    });

    if (formErrors.teamId) {
      setFormErrors({
        ...formErrors,
        teamId: "",
      });
    }
  };

  /**
   * Gestion du changement d'équipes multiples (pour les managers)
   */
  const handleTeamMultiChange = (values: string[]) => {
    setFormData({
      ...formData,
      teamIds: values,
      // Si une seule équipe est sélectionnée, on l'utilise aussi pour teamId pour compatibilité
      teamId: values.length === 1 ? values[0] : undefined,
    });

    if (formErrors.teamId) {
      setFormErrors({
        ...formErrors,
        teamId: "",
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

    // Pour les managers, valider qu'au moins une équipe est sélectionnée
    // mais rendre cette validation optionnelle
    if (
      formData.role === "manager" &&
      formData.teamIds &&
      formData.teamIds.length === 0 &&
      !formData.teamId
    ) {
      console.log("⚠️ Aucune équipe sélectionnée pour le manager - optionnel");
      // Ne pas bloquer la validation
    }

    // Pour les employés, rendre la sélection d'équipe optionnelle
    // car l'équipe pourra être assignée plus tard
    if (formData.role === "employee" && !formData.teamId) {
      console.log("⚠️ Aucune équipe sélectionnée pour l'employé - optionnel");
      // Ne pas bloquer la validation
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

      console.log("Envoi des données utilisateur:", userData);
      console.log(
        "Données exactes envoyées à l'API:",
        JSON.stringify(userData)
      );

      // Envoyer les données à l'API
      const response = await adminUserService.createUser(userData);
      console.log("Réponse complète de l'API:", response);

      // Vérification plus flexible de la réponse
      if (!response) {
        throw new Error("Réponse vide de l'API");
      }

      // Accepter différents formats de réponse
      const newUser = response.user || response.data || response;

      if (!newUser || !newUser._id) {
        console.error("Format de réponse inattendu:", response);
        throw new Error("Format de réponse invalide");
      }

      console.log("Utilisateur créé avec succès:", newUser);

      // Gérer l'assignation à une équipe si nécessaire
      if (
        formData.teamId &&
        formData.role === "employee" &&
        newUser &&
        newUser._id
      ) {
        try {
          // Récupérer les employés pour trouver celui correspondant à l'utilisateur créé
          const empResponse = await axiosInstance.get(
            `/admin/employees/withteams?companyId=${formData.companyId}`
          );
          const allEmployees = empResponse.data.data || [];

          // Trouver l'employé nouvellement créé (par son userId)
          const newEmployee = allEmployees.find(
            (emp: any) =>
              emp.userId && String(emp.userId) === String(newUser._id)
          );

          if (newEmployee) {
            // Mettre à jour l'employé avec le teamId
            await axiosInstance.patch(`/admin/employees/${newEmployee._id}`, {
              teamId: formData.teamId,
            });

            // Ajouter l'employé à l'équipe
            await axiosInstance.patch(
              `/admin/teams/${formData.teamId}/employees`,
              {
                employeeId: newEmployee._id,
                action: "add",
              }
            );

            console.log("Employé associé à l'équipe avec succès");
          } else {
            console.warn("Employé non trouvé après création de l'utilisateur");
          }
        } catch (err) {
          console.error("Erreur lors de l'assignation d'équipe:", err);
          // Continuer même en cas d'erreur d'assignation
        }
      } else if (formData.role === "manager" && newUser && newUser._id) {
        try {
          // Utiliser teamIds pour les managers (sélection multiple)
          const teamsToAssign =
            formData.teamIds && formData.teamIds.length > 0
              ? formData.teamIds
              : formData.teamId
              ? [formData.teamId]
              : [];

          console.log(
            `🔄 Association du manager à ${teamsToAssign.length} équipes`
          );

          // Parcourir toutes les équipes sélectionnées
          for (const teamId of teamsToAssign) {
            // Récupérer l'équipe sélectionnée
            const teamResponse = await axiosInstance.get(
              `/admin/teams/${teamId}`
            );
            const teamData = teamResponse.data.data || teamResponse.data;

            if (teamData) {
              // Extraire les managerIds existants
              const existingManagerIds = teamData.managerIds || [];
              const managerIdsToSend = existingManagerIds.map((m: any) =>
                typeof m === "object" && m._id ? m._id : m
              );

              // Vérifier que le manager n'est pas déjà dans la liste
              if (!managerIdsToSend.includes(newUser._id)) {
                // Ajouter le nouveau manager à l'équipe
                await axiosInstance.patch(`/admin/teams/${teamId}`, {
                  managerIds: [...managerIdsToSend, newUser._id],
                });
                console.log(`✅ Manager ajouté à l'équipe ${teamId}`);
              }
            }
          }
        } catch (err) {
          console.error(
            "Erreur lors de l'assignation d'équipes pour le manager:",
            err
          );
          // Continuer même en cas d'erreur d'assignation des équipes
        }
      }

      // Mettre à jour la liste des utilisateurs localement plutôt que de recharger
      const processedUser = {
        ...newUser,
        // S'assurer que tous les champs requis pour l'affichage sont présents
        _id: String(newUser._id),
        companyId: newUser.companyId
          ? String(newUser.companyId)
          : formData.companyId,
        status: newUser.status || "active",
        createdAt: newUser.createdAt || new Date().toISOString(),
      };

      setUsers((prevUsers) => [...prevUsers, processedUser]);
      console.log("Utilisateur ajouté à la liste locale");

      // Réinitialiser le formulaire et fermer le modal
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "employee",
        password: "",
        photoUrl: undefined,
        companyId: "",
        teamId: "",
        teamIds: [],
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setModalOpen(false);

      // Afficher un message de succès
      setSuccess("Utilisateur ajouté avec succès");
      setShowSuccessToast(true);

      // Actualiser la liste depuis le serveur en arrière-plan pour s'assurer que tout est synchronisé
      fetchUsers().catch((e) =>
        console.error("Erreur lors de l'actualisation de la liste:", e)
      );
    } catch (err: any) {
      console.error("Erreur lors de l'ajout de l'utilisateur:", err);
      // Message d'erreur plus détaillé si disponible
      const errorMessage =
        (err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Impossible d'ajouter l'utilisateur") +
        (err.response?.data ? ` (${JSON.stringify(err.response.data)})` : "");
      setError(errorMessage);
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
      teamId: "",
      teamIds: [],
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

  // Configuration des filtres pour le composant FilterBar
  const filterConfig = {
    role: {
      label: "Rôle",
      value: filters.role,
      options: roleOptions,
      onChange: (value: string) => handleFilterChange("role", value),
    },
    status: {
      label: "Statut",
      value: filters.status,
      options: statusOptions,
      onChange: (value: string) => handleFilterChange("status", value),
    },
    company: {
      label: "Entreprise",
      value: filters.companyId,
      options: [
        { value: "", label: "Toutes les entreprises" },
        ...companies.map((company) => ({
          value: company._id,
          label: company.name,
        })),
      ],
      onChange: (value: string) => handleFilterChange("companyId", value),
    },
  };

  // Filtrer les équipes par entreprise pour le formulaire d'ajout d'utilisateur
  const filteredTeams = useMemo(() => {
    if (!formData.companyId) return [];
    return teams.filter((team) => team.companyId === formData.companyId);
  }, [teams, formData.companyId]);

  // Détecter la vue mobile
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    // Vérifier au chargement initial
    checkMobileView();

    // Ajouter un écouteur d'événement pour les changements de taille
    window.addEventListener("resize", checkMobileView);

    // Nettoyer l'écouteur lors du démontage
    return () => {
      window.removeEventListener("resize", checkMobileView);
    };
  }, []);

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
              {formErrors.companyId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {formErrors.companyId}
                </p>
              )}
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

        {/* Barre de filtres et recherche */}
        <div className="mb-6">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Rechercher par nom ou email..."
            filters={filterConfig}
          />
        </div>

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
            ) : isMobileView ? (
              // Vue mobile en cards
              <div className="w-full">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <UserCard key={`user-card-${index}`} user={user} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users
                      size={48}
                      className="text-gray-300 dark:text-gray-600 mb-4"
                    />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      Aucun utilisateur trouvé
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      Il n'y a aucun utilisateur correspondant aux critères
                      sélectionnés.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Vue desktop en tableau
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
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-indigo-300 max-h-[90vh] overflow-visible"
        >
          <div className="space-y-4 max-h-[calc(90vh-6rem)] overflow-y-auto pr-2">
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
            <PasswordField
              label="Mot de passe (optionnel)"
              name="password"
              value={formData.password || ""}
              onChange={handleInputChange}
              error={formErrors.password}
              helperText="Laissez vide pour générer un mot de passe temporaire"
              className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />

            {/* Entreprise */}
            <Select
              label="Entreprise"
              options={[
                { value: "", label: "-- Sélectionner une entreprise --" },
                ...companies.map((company) => ({
                  value: company._id,
                  label: company.name,
                })),
              ]}
              value={formData.companyId}
              onChange={handleCompanyChange}
              icon={
                <Building
                  size={18}
                  className="text-indigo-600 dark:text-sky-300"
                />
              }
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

            {/* Équipe - affiché uniquement pour les employés et managers */}
            {(formData.role === "employee" || formData.role === "manager") &&
              formData.companyId && (
                <div className="relative">
                  {formData.role === "manager" ? (
                    <SelectMulti
                      label="Équipes gérées"
                      options={filteredTeams.map((team) => ({
                        value: team._id,
                        label: team.name,
                      }))}
                      value={formData.teamIds || []}
                      onChange={handleTeamMultiChange}
                      placeholder="Sélectionner une ou plusieurs équipes..."
                      className="text-gray-700 dark:text-sky-300"
                    />
                  ) : (
                    <Select
                      label="Équipe"
                      options={[
                        { value: "", label: "-- Sélectionner une équipe --" },
                        ...filteredTeams.map((team) => ({
                          value: team._id,
                          label: team.name,
                        })),
                      ]}
                      value={formData.teamId || ""}
                      onChange={handleTeamChange}
                      icon={
                        <Users
                          size={18}
                          className="text-indigo-600 dark:text-sky-300"
                        />
                      }
                      className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                  )}
                  {formErrors.teamId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {formErrors.teamId}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.role === "manager"
                      ? "Sélectionnez les équipes que ce manager va gérer."
                      : "Sélectionnez l'équipe à laquelle cet employé appartiendra."}
                  </p>
                  {teamsLoading && (
                    <div className="absolute right-2 top-10">
                      <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                    </div>
                  )}
                </div>
              )}

            {/* Message pour les rôles admin et directeur */}
            {(formData.role === "admin" || formData.role === "directeur") && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <Users
                    size={18}
                    className="text-indigo-600 dark:text-sky-300 mr-2"
                  />
                  Les{" "}
                  {formData.role === "admin" ? "administrateurs" : "directeurs"}{" "}
                  ne sont pas associés à des équipes spécifiques.
                </p>
              </div>
            )}

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
