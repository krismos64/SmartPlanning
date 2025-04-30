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
import React, { useCallback, useContext, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { AuthContext } from "../context/AuthContext";

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
  { key: "email", label: "Email", sortable: true },
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

/**
 * Composant principal de la page de gestion des utilisateurs
 */
const UserManagementPage: React.FC = () => {
  // États pour les utilisateurs et la pagination
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  // Obtenir le contexte d'authentification
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.user;

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

  // Chargement des entreprises
  useEffect(() => {
    const fetchCompanies = async () => {
      setCompanyLoading(true);
      try {
        const response = await axiosInstance.get("/api/admin/companies");
        setCompanies(response.data || []);
      } catch (err) {
        console.error("Erreur lors du chargement des entreprises:", err);
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
        if (!currentUser?.companyId) {
          console.warn(
            "⚠️ Pas de companyId disponible pour charger les équipes"
          );
          return;
        }

        console.log("🔄 DÉBUT CHARGEMENT ÉQUIPES");
        const companyId = String(currentUser.companyId);
        console.log(`🏢 COMPANY ID UTILISÉ: ${companyId}`);

        // Ajout d'un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const response = await axiosInstance.get(
          `/api/admin/teams?companyId=${companyId}&_t=${timestamp}`
        );
        console.log("📥 REÇU API TEAMS:", response);

        // Détection avancée de la structure des données
        let teamsRawData = null;

        if (response.data) {
          // Log détaillé de la structure de la réponse
          console.log("📊 TYPE DE RÉPONSE TEAMS:", typeof response.data);
          console.log(
            "📊 CLÉS DE LA RÉPONSE TEAMS:",
            Object.keys(response.data)
          );

          if (typeof response.data === "object") {
            if (Array.isArray(response.data)) {
              teamsRawData = response.data;
              console.log(
                "📋 TEAMS TROUVÉES DIRECTEMENT DANS DATA (ARRAY):",
                teamsRawData.length
              );
            } else if (
              "data" in response.data &&
              Array.isArray(response.data.data)
            ) {
              teamsRawData = response.data.data;
              console.log(
                "📋 TEAMS TROUVÉES DANS DATA.DATA (ARRAY):",
                teamsRawData.length
              );
            } else if (
              "teams" in response.data &&
              Array.isArray(response.data.teams)
            ) {
              teamsRawData = response.data.teams;
              console.log(
                "📋 TEAMS TROUVÉES DANS DATA.TEAMS (ARRAY):",
                teamsRawData.length
              );
            } else {
              console.log(
                "⚠️ FORMAT DE DONNÉES TEAMS INATTENDU:",
                response.data
              );
              return;
            }
          }
        }

        if (!teamsRawData || !Array.isArray(teamsRawData)) {
          console.error("❌ DONNÉES TEAMS INVALIDES");
          return;
        }

        // S'assurer que tous les IDs sont des chaînes de caractères et créer un objet formaté
        const formattedTeams = teamsRawData
          .filter((team) => team && typeof team === "object") // Filtrer les éléments invalides
          .map((team: any) => {
            const formatted = {
              ...team,
              _id: team._id ? String(team._id) : `unknown-${Math.random()}`,
              companyId: team.companyId ? String(team.companyId) : null,
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
      }
    };

    if (currentUser?.companyId) {
      fetchTeams();
    }
  }, [currentUser?.companyId]);

  // Chargement des employés
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        console.log("🔄 DÉBUT CHARGEMENT EMPLOYÉS");

        // On s'assure d'avoir un companyId valide
        if (!currentUser?.companyId) {
          console.warn(
            "⚠️ Pas de companyId disponible pour charger les employés"
          );
          return;
        }

        const companyId = String(currentUser.companyId);
        const timestamp = new Date().getTime();

        // Approche directe avec les employés qui ont un teamId
        console.log("🔍 TENTATIVE ENDPOINT EMPLOYEES AVEC TEAMID");
        const response = await axiosInstance
          .get(
            `/api/admin/employees/withteams?companyId=${companyId}&_t=${timestamp}`
          )
          .catch(async (err) => {
            console.warn("⚠️ Endpoint withteams non disponible:", err?.message);

            // Approche alternative - créer un endpoint personnalisé pour récupérer les employés avec leurs équipes
            console.log("🔄 CRÉATION D'UN ENDPOINT PERSONNALISÉ");

            // Récupérer tous les employés
            const employeesResponse = await axiosInstance.get(
              `/api/admin/employees?companyId=${companyId}`
            );
            const allEmployees =
              employeesResponse.data.employees ||
              employeesResponse.data.data ||
              employeesResponse.data;

            if (!Array.isArray(allEmployees)) {
              throw new Error("Format de données employés invalide");
            }

            // Récupérer toutes les équipes
            const teamsResponse = await axiosInstance.get(
              `/api/admin/teams?companyId=${companyId}`
            );
            const allTeams =
              teamsResponse.data.data ||
              teamsResponse.data.teams ||
              teamsResponse.data;

            if (!Array.isArray(allTeams)) {
              throw new Error("Format de données équipes invalide");
            }

            // Associer manuellement les équipes aux employés
            const enrichedEmployees = allEmployees.map((emp) => {
              // Chercher les équipes où cet employé est référencé
              const matchingTeams = allTeams.filter((team) => {
                if (!Array.isArray(team.employeeIds)) return false;
                return team.employeeIds.some(
                  (id: string) => String(id) === String(emp._id)
                );
              });

              return {
                ...emp,
                teams: matchingTeams.map(
                  (t: { _id: string | number; name: string }) => ({
                    _id: t._id,
                    name: t.name,
                  })
                ),
              };
            });

            return { data: enrichedEmployees };
          });

        if (!response || !response.data) {
          console.error("❌ IMPOSSIBLE DE RÉCUPÉRER LES DONNÉES EMPLOYÉS");
          setError("Impossible de récupérer les employés");
          setShowErrorToast(true);
          return;
        }

        // Extraction des données employés
        let employeesRawData = null;

        if (response.data) {
          if (Array.isArray(response.data)) {
            employeesRawData = response.data;
          } else if (typeof response.data === "object") {
            // Recherche dans toutes les propriétés possibles
            if (Array.isArray(response.data.data)) {
              employeesRawData = response.data.data;
            } else if (Array.isArray(response.data.employees)) {
              employeesRawData = response.data.employees;
            } else {
              // Chercher n'importe quelle propriété contenant un tableau
              for (const key in response.data) {
                if (
                  Array.isArray(response.data[key]) &&
                  response.data[key].length > 0
                ) {
                  employeesRawData = response.data[key];
                  console.log(`🔍 TROUVÉ TABLEAU DANS PROPRIÉTÉ '${key}'`);
                  break;
                }
              }
            }
          }
        }

        if (!employeesRawData || !Array.isArray(employeesRawData)) {
          console.error("❌ DONNÉES EMPLOYEES INVALIDES");
          setError("Format de données employés invalide");
          setShowErrorToast(true);
          return;
        }

        // Formater les données avec une approche defensive
        const formattedEmployees = employeesRawData
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
                      _id: t._id,
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
            }

            return formatted;
          });

        console.log(`✅ TOTAL EMPLOYÉS TRAITÉS: ${formattedEmployees.length}`);
        setEmployees(formattedEmployees);
      } catch (err) {
        console.error("❌ ERREUR CHARGEMENT EMPLOYÉS:", err);
        setError("Erreur lors du chargement des employés");
        setShowErrorToast(true);
      }
    };

    fetchEmployees();
  }, [currentUser?.companyId]);

  /**
   * Récupération des utilisateurs depuis l'API
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminUserService.getAllUsers();
      console.log("UTILISATEURS RÉCUPÉRÉS BRUTS:", data);

      // Normaliser les IDs
      const formattedUsers = data.map((user: any) => ({
        ...user,
        _id: String(user._id),
        companyId: user.companyId ? String(user.companyId) : null,
      }));

      setUsers(formattedUsers);
      console.log("UTILISATEURS TRAITÉS:", formattedUsers);
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
    console.log("🔎 DÉBUT GÉNÉRATION TABLEAU DES UTILISATEURS");
    console.log(
      `👥 ${users.length} utilisateurs, 📚 ${teams.length} équipes, 👤 ${employees.length} employés`
    );

    // Fonction utilitaire pour obtenir les équipes d'un utilisateur
    const getUserTeams = (user: UserType): string[] => {
      const result: string[] = [];
      const userId = String(user._id);

      // Pour les administrateurs et directeurs, ne pas afficher d'équipes
      if (user.role === "admin" || user.role === "directeur") {
        return [];
      }

      // 1. Pour les managers - vérifier les équipes qu'ils gèrent
      if (user.role === "manager") {
        console.log(
          `🔍 RECHERCHE DES ÉQUIPES GÉRÉES PAR ${user.firstName} (ID: ${userId})`
        );

        // Vérification des données des équipes
        console.log(
          `📋 DONNÉES TEAMS DISPONIBLES:`,
          JSON.stringify(teams.slice(0, 2), null, 2)
        );

        // Trouver toutes les équipes où l'utilisateur est référencé comme manager
        const managerTeams = teams.filter((team) => {
          if (!team.managerIds || !Array.isArray(team.managerIds)) {
            console.log(
              `⚠️ ÉQUIPE ${team.name}: managerIds non valide`,
              team.managerIds
            );
            return false;
          }

          // Vérification détaillée des managerIds
          console.log(
            `🔍 ÉQUIPE ${team.name}: vérification des ${team.managerIds.length} managers`
          );
          console.log(
            `   Manager IDs:`,
            JSON.stringify(team.managerIds, null, 2)
          );

          const isManager = team.managerIds.some((managerId: any) => {
            // Si managerId est un objet avec _id
            if (
              typeof managerId === "object" &&
              managerId !== null &&
              managerId._id
            ) {
              const match = String(managerId._id) === userId;
              if (match)
                console.log(
                  `✅ MATCH TROUVÉ: managerId est un objet avec _id=${managerId._id}`
                );
              return match;
            }

            // Si managerId est une chaîne
            const match = String(managerId) === userId;
            if (match)
              console.log(
                `✅ MATCH TROUVÉ: managerId est une chaîne: ${managerId}`
              );
            return match;
          });

          if (isManager) {
            console.log(
              `✅ ${user.firstName} EST MANAGER DE L'ÉQUIPE: ${team.name}`
            );
          }

          return isManager;
        });

        console.log(
          `📊 TROUVÉ ${managerTeams.length} ÉQUIPES GÉRÉES PAR ${user.firstName}`
        );

        managerTeams.forEach((team) => {
          if (!result.includes(team.name)) {
            console.log(`✅ ÉQUIPE MANAGÉE AJOUTÉE: ${team.name}`);
            result.push(team.name);
          }
        });
      }

      // 2. Pour les employés - rechercher via la collection des employés
      if (user.role === "employee") {
        // Trouver les employés liés à cet utilisateur
        const matchingEmployees = employees.filter((emp) => {
          if (!emp.userId) return false;
          return String(emp.userId) === userId;
        });

        // 2.1 D'abord vérifier si l'employé a des équipes pré-associées (du backend)
        matchingEmployees.forEach((emp) => {
          if (emp.teams && Array.isArray(emp.teams) && emp.teams.length > 0) {
            emp.teams.forEach((team: any) => {
              if (team.name && !result.includes(team.name)) {
                console.log(`✅ ÉQUIPE PRÉ-ASSOCIÉE: ${team.name}`);
                result.push(team.name);
              }
            });
          }
        });

        // 2.2 Sinon, chercher via teamId
        if (result.length === 0) {
          matchingEmployees.forEach((emp) => {
            if (emp.teamId) {
              const teamId = String(emp.teamId);
              const team = teams.find((t) => String(t._id) === teamId);

              if (team) {
                console.log(`✅ ÉQUIPE TROUVÉE VIA TEAMID: ${team.name}`);
                if (!result.includes(team.name)) {
                  result.push(team.name);
                }
              }
            }
          });
        }
      }

      // 3. Dernier recours - chercher dans les employeeIds des équipes
      if (result.length === 0 && user.role === "employee") {
        console.log(
          `🔄 MÉTHODE ALTERNATIVE: Recherche dans les employeeIds des équipes`
        );

        const employeeTeams = teams.filter((team) => {
          if (!Array.isArray(team.employeeIds)) return false;

          return team.employeeIds.some((empId) => {
            // Cas 1: L'ID utilisateur est directement dans employeeIds (rare)
            if (String(empId) === userId) return true;

            // Cas 2: Chercher les employés liés à cet ID d'employé
            const matchingEmployee = employees.find(
              (emp) =>
                String(emp._id) === String(empId) &&
                String(emp.userId) === userId
            );

            return !!matchingEmployee;
          });
        });

        employeeTeams.forEach((team) => {
          if (!result.includes(team.name)) {
            console.log(`✅ ÉQUIPE TROUVÉE VIA EMPLOYEEIDS: ${team.name}`);
            result.push(team.name);
          }
        });
      }

      // Résumé des équipes trouvées
      console.log(
        `📋 ÉQUIPES FINALES POUR ${user.firstName}: ${
          result.length > 0 ? result.join(", ") : "Aucune"
        }`
      );

      return result;
    };

    // Filtre et map des utilisateurs
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

        // Récupérer les équipes de l'utilisateur
        const userTeams = getUserTeams(user);

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
          teams: (
            <span className="text-gray-700 dark:text-gray-300">
              {user.role === "admin" || user.role === "directeur" ? (
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 text-sm italic">
                    Aucune équipe
                  </span>
                </div>
              ) : userTeams.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {userTeams.map((teamName, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                    >
                      {teamName}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-red-500 text-sm">Aucune équipe</span>
                  {(user.role === "employee" || user.role === "manager") && (
                    <button
                      className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline mt-1"
                      onClick={() => handleEditUser(user)}
                    >
                      Assigner à une équipe
                    </button>
                  )}
                </div>
              )}
            </span>
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
  }, [
    users,
    filters.role,
    filters.status,
    filters.companyId,
    companies,
    teams,
    employees,
  ]);

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
      teamId: "",
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
        `/api/admin/teams?companyId=${companyId}&_t=${timestamp}`
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
        setTeams(teamsData);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des équipes:", err);
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
    if (
      formData.role === "manager" &&
      (!formData.teamIds || formData.teamIds.length === 0)
    ) {
      errors.teamId = "Sélectionnez au moins une équipe";
      isValid = false;
    }

    // Pour les employés, valider qu'une équipe est sélectionnée
    if (formData.role === "employee" && !formData.teamId) {
      errors.teamId = "L'équipe est requise";
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

      console.log("Envoi des données utilisateur:", userData);

      // Envoyer les données à l'API
      const response = await adminUserService.createUser(userData);

      if (!response || !response.user) {
        throw new Error(
          "Réponse invalide de l'API lors de la création de l'utilisateur"
        );
      }

      console.log("Utilisateur créé avec succès:", response.user);

      // Gérer l'assignation à une équipe si nécessaire
      if (
        formData.teamId &&
        formData.role === "employee" &&
        response.user &&
        response.user._id
      ) {
        try {
          // Récupérer les employés pour trouver celui correspondant à l'utilisateur créé
          const empResponse = await axiosInstance.get(
            `/api/admin/employees/withteams?companyId=${formData.companyId}`
          );
          const allEmployees = empResponse.data.data || [];

          // Trouver l'employé nouvellement créé (par son userId)
          const newEmployee = allEmployees.find(
            (emp: any) =>
              emp.userId && String(emp.userId) === String(response.user._id)
          );

          if (newEmployee) {
            // Mettre à jour l'employé avec le teamId
            await axiosInstance.patch(
              `/api/admin/employees/${newEmployee._id}`,
              {
                teamId: formData.teamId,
              }
            );

            // Ajouter l'employé à l'équipe
            await axiosInstance.patch(
              `/api/admin/teams/${formData.teamId}/employees`,
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
      } else if (
        formData.role === "manager" &&
        response.user &&
        response.user._id
      ) {
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
              `/api/admin/teams/${teamId}`
            );
            const teamData = teamResponse.data.data || teamResponse.data;

            if (teamData) {
              // Extraire les managerIds existants
              const existingManagerIds = teamData.managerIds || [];
              const managerIdsToSend = existingManagerIds.map((m: any) =>
                typeof m === "object" && m._id ? m._id : m
              );

              // Vérifier que le manager n'est pas déjà dans la liste
              if (!managerIdsToSend.includes(response.user._id)) {
                // Ajouter le nouveau manager à l'équipe
                await axiosInstance.patch(`/api/admin/teams/${teamId}`, {
                  managerIds: [...managerIdsToSend, response.user._id],
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
      const newUser = {
        ...response.user,
        // S'assurer que tous les champs requis pour l'affichage sont présents
        _id: String(response.user._id),
        companyId: response.user.companyId
          ? String(response.user.companyId)
          : formData.companyId,
        status: response.user.status || "active",
        createdAt: response.user.createdAt || new Date().toISOString(),
      };

      setUsers((prevUsers) => [...prevUsers, newUser]);
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
        err.response?.data?.message ||
        err.message ||
        "Impossible d'ajouter l'utilisateur";
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
            {formErrors.companyId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {formErrors.companyId}
              </p>
            )}

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
                      options={teams.map((team) => ({
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
                        ...teams.map((team) => ({
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
