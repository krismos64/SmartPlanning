/**
 * VacationsPage - Page de gestion des congés
 *
 * Permet aux employés de demander des congés et aux managers de les gérer.
 * Intègre les composants du design system SmartPlanning pour une expérience cohérente.
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  Building,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileDown,
  Plus,
  Search,
  User,
  Users,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

// Composants de layout
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import CustomDatePicker from "../components/DatePicker";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Select from "../components/ui/Select";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Interface pour les entreprises
interface Company {
  _id: string;
  name: string;
}

// Interface pour les équipes
interface Team {
  _id: string;
  name: string;
  companyId: string;
}

// Interface pour les employés accessibles
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  companyId?: string;
  teamId?: string;
}

// Types pour les demandes de congés
interface VacationRequest {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    companyId?: string;
    teamId?: string;
  };
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
  };
}

// Types pour le formulaire de création
interface VacationFormData {
  startDate: string;
  endDate: string;
  reason: string;
  employeeId?: string;
  status?: "pending" | "approved" | "rejected";
}

// Statut de simulation du rôle utilisateur (à remplacer par un contexte ou autre mécanisme d'auth)
type UserRole = "employee" | "manager" | "directeur" | "admin";

// Définir l'interface pour une colonne de tableau avec des éléments React
interface TableColumn {
  key: string;
  label: string | React.ReactNode;
  className?: string;
}

// Importer la fonction d'export PDF
import { generateVacationPdf } from "../services/generateVacationPdf";

/**
 * Calcule la durée en jours entre deux dates
 * @param startDate Date de début
 * @param endDate Date de fin
 * @returns Nombre de jours
 */
const calculateDuration = (startDate: string, endDate: string): number => {
  return (
    Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24) +
        1
    ) || 0
  );
};

/**
 * Formate la date pour l'affichage
 * @param dateString Chaîne de date à formater
 * @returns Date formatée (ex: "15 avril 2023")
 */
const formatDate = (dateString: string): string => {
  console.log(`Formatage de date - Original: ${dateString}`);

  // Extraire la partie YYYY-MM-DD de la date
  const datePart = dateString.split("T")[0];

  // Décomposer la date en année, mois, jour
  const [year, month, day] = datePart.split("-").map((n) => parseInt(n, 10));

  // Vérifier que les composants sont valides
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.error("Format de date invalide:", dateString);
    return "Date invalide";
  }

  // Créer une date à midi UTC pour éviter les problèmes de fuseau horaire
  const dateUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  console.log(`Date formatée - UTC (12:00): ${dateUTC.toISOString()}`);

  // Utiliser l'API Intl pour formater selon la locale française
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC", // Forcer l'utilisation du fuseau UTC
  }).format(dateUTC);
};

/**
 * Traduit le statut en français
 * @param status Statut en anglais
 * @returns Statut traduit en français
 */
const translateStatus = (status: string): string => {
  switch (status) {
    case "pending":
      return "En attente";
    case "approved":
      return "Approuvé";
    case "rejected":
      return "Refusé";
    default:
      return status;
  }
};

/**
 * Obtient le type de badge pour un statut
 */
const getStatusBadgeType = (
  status: string
): "success" | "error" | "info" | "warning" => {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "error";
    default:
      return "info";
  }
};

// Animations pour les transitions
const fadeInAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

const slideInAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, type: "spring", stiffness: 100 },
};

// Variantes d'animation pour les cartes mobile
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

// Utilitaire pour formater les dates au format YYYY-MM-DD
const formatDateForBackend = (dateStr: string) => {
  // Extraire les composants de la date de manière plus robuste
  let year, month, day;

  if (dateStr.includes("T")) {
    // Format ISO
    const dateOnly = dateStr.split("T")[0];
    [year, month, day] = dateOnly.split("-").map((num) => parseInt(num, 10));
  } else if (dateStr.includes("-")) {
    // Format YYYY-MM-DD simple
    [year, month, day] = dateStr.split("-").map((num) => parseInt(num, 10));
  } else {
    // Fallback au constructeur Date standard
    const date = new Date(dateStr);
    year = date.getUTCFullYear();
    month = date.getUTCMonth() + 1;
    day = date.getUTCDate();
  }

  // S'assurer que les valeurs sont valides
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.error("Erreur de format de date:", dateStr);
    // Fallback au comportement d'origine
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  }

  // Formatter la date en YYYY-MM-DD à midi UTC pour éviter les problèmes de fuseau horaire
  return `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
};

// Composant principal VacationsPage
const VacationsPage: React.FC = () => {
  // Simulation du rôle utilisateur (à remplacer par une authentification réelle)
  const [userRole] = useState<UserRole>("directeur");

  // État pour les demandes de congés
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>(
    []
  );

  // État pour le mode édition
  const [editingVacation, setEditingVacation] =
    useState<VacationRequest | null>(null);

  // État pour les employés accessibles
  const [accessibleEmployees, setAccessibleEmployees] = useState<Employee[]>(
    []
  );
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);

  // États pour le chargement et les notifications
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // État pour le filtre de statut
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  // État pour le formulaire de création
  const [formData, setFormData] = useState<VacationFormData>({
    startDate: "",
    endDate: "",
    reason: "",
    employeeId: undefined,
  });

  // État pour l'affichage du formulaire
  const [showForm, setShowForm] = useState<boolean>(false);

  // Nouveaux états pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(false);

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/tableau-de-bord" },
    { label: "Congés" },
  ];

  // Vérifier si l'utilisateur peut sélectionner un employé
  const canSelectEmployee =
    userRole === "manager" || userRole === "directeur" || userRole === "admin";

  // Vérifier si l'utilisateur peut voir les filtres avancés (admin seulement)
  const canUseAdvancedFilters = userRole === "admin";

  // Vérifier si l'utilisateur peut filtrer par équipe (directeur et admin)
  const canFilterByTeam = userRole === "admin" || userRole === "directeur";

  // Ajout des états pour le tri des demandes
  const [sortField, setSortField] = useState<
    "employee" | "period" | "status" | "createdAt"
  >("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fonction pour récupérer les employés accessibles
  const fetchAccessibleEmployees = useCallback(async () => {
    if (!canSelectEmployee) return;

    setLoadingEmployees(true);
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: Employee[];
      }>("/employees/accessible");

      console.log("Employés accessibles reçus:", response.data.data);
      setAccessibleEmployees(response.data.data);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des employés accessibles:",
        error
      );
      setError("Erreur lors de la récupération des employés accessibles");
      setShowErrorToast(true);
    } finally {
      setLoadingEmployees(false);
    }
  }, [canSelectEmployee]);

  // Fonction pour récupérer les entreprises (admin uniquement)
  const fetchCompanies = useCallback(async () => {
    if (!canUseAdvancedFilters) return;

    setLoadingCompanies(true);
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: Company[];
      }>("/admin/companies");

      console.log("Entreprises reçues:", response.data.data);
      setCompanies(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des entreprises:", error);
      setError("Erreur lors de la récupération des entreprises");
      setShowErrorToast(true);
    } finally {
      setLoadingCompanies(false);
    }
  }, [canUseAdvancedFilters]);

  // Fonction pour récupérer les équipes d'une entreprise
  const fetchTeamsByCompany = useCallback(
    async (companyId: string) => {
      if (!companyId || !canUseAdvancedFilters) return;

      setLoadingTeams(true);
      try {
        const response = await axiosInstance.get<{
          success: boolean;
          data: Team[];
        }>(`/admin/teams?companyId=${companyId}`);

        console.log("Équipes reçues:", response.data.data);
        setTeams(response.data.data || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des équipes:", error);
        setError("Erreur lors de la récupération des équipes");
        setShowErrorToast(true);
      } finally {
        setLoadingTeams(false);
      }
    },
    [canUseAdvancedFilters]
  );

  // Fonction pour récupérer les équipes du directeur de son entreprise
  const fetchDirectorTeams = useCallback(async () => {
    if (userRole !== "directeur") return;

    setLoadingTeams(true);
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: Team[];
      }>("/teams");

      console.log("Équipes du directeur reçues:", response.data.data);
      setTeams(response.data.data || []);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des équipes du directeur:",
        error
      );
      setError("Erreur lors de la récupération des équipes");
      setShowErrorToast(true);
    } finally {
      setLoadingTeams(false);
    }
  }, [userRole]);

  // Gestionnaire de changement d'entreprise
  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedTeamId(""); // Réinitialiser l'équipe sélectionnée
    setTeams([]); // Vider la liste des équipes

    if (companyId) {
      fetchTeamsByCompany(companyId);
    }
  };

  // Fonction pour récupérer les demandes de congés
  const fetchVacationRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("Récupération des demandes de congés...");

    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: VacationRequest[];
      }>("/vacations");

      console.log("Demandes de congés reçues:", response.data);

      // Analyser le format des dates dans la première demande s'il y en a
      if (response.data.data && response.data.data.length > 0) {
        analyzeDateFormat(response.data.data[0]);
      }

      // CORRECTION TEMPORAIRE: Forcer les permissions à true pour tous
      const requestsWithPermissions = response.data.data.map((request) => {
        return {
          ...request,
          permissions: {
            canEdit: true,
            canDelete: true,
          },
        };
      });

      setVacationRequests(requestsWithPermissions);
      console.log(
        "État mis à jour avec les nouvelles demandes:",
        requestsWithPermissions
      );
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des demandes de congés:",
        error
      );
      setError("Erreur lors de la récupération des demandes de congés");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les données au montage du composant et après les actions de succès
  useEffect(() => {
    fetchVacationRequests();
  }, [fetchVacationRequests, showSuccessToast]);

  // Charger les employés accessibles si l'utilisateur est manager, directeur ou admin
  useEffect(() => {
    if (showForm) {
      fetchAccessibleEmployees();
    }
  }, [fetchAccessibleEmployees, showForm]);

  // Charger les entreprises pour admin au montage
  useEffect(() => {
    if (canUseAdvancedFilters) {
      fetchCompanies();
    }
  }, [fetchCompanies]);

  // Charger les équipes selon le rôle au montage
  useEffect(() => {
    if (userRole === "directeur") {
      fetchDirectorTeams();
    } else if (userRole === "manager") {
      const fetchManagerTeams = async () => {
        try {
          setLoadingTeams(true);
          const response = await axiosInstance.get<{
            success: boolean;
            data: Team[];
          }>("/teams");

          console.log("Équipes du manager reçues:", response.data.data);
          setTeams(response.data.data || []);
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des équipes du manager:",
            error
          );
        } finally {
          setLoadingTeams(false);
        }
      };

      fetchManagerTeams();
    }
  }, [userRole, fetchDirectorTeams]);

  // Gestionnaire de changement pour le formulaire
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Fonction pour soumettre une nouvelle demande de congés ou mettre à jour une existante
  const handleSubmitVacationRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation du formulaire
    if (!formData.startDate || !formData.endDate) {
      setError("Veuillez remplir les dates de début et de fin");
      setShowErrorToast(true);
      return;
    }

    // Validation de l'employé sélectionné si l'utilisateur peut sélectionner un employé
    if (canSelectEmployee && !formData.employeeId) {
      setError("Veuillez sélectionner un employé");
      setShowErrorToast(true);
      return;
    }

    // Vérification des dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end < start) {
      setError("La date de fin doit être après la date de début");
      setShowErrorToast(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Préparer les données à envoyer
      const requestData: Partial<VacationFormData> = {
        startDate: formData.startDate
          ? formatDateForBackend(formData.startDate)
          : "",
        endDate: formData.endDate ? formatDateForBackend(formData.endDate) : "",
        reason: formData.reason,
      };

      // Si c'est un manager/directeur/admin qui crée une demande pour un employé
      if (canSelectEmployee) {
        requestData.employeeId = formData.employeeId;
        console.log(
          "Création d'une demande pour l'employé:",
          formData.employeeId
        );
      }

      // Log des données envoyées au serveur pour débogage
      console.log("Données envoyées:", requestData);

      let response;

      // Si on est en mode édition, faire un PUT, sinon faire un POST
      if (editingVacation) {
        console.log(`Mise à jour de la demande ${editingVacation._id}`);
        console.log("Données originales:", editingVacation);

        // Standardiser les dates pour éviter les problèmes de format
        const startDateStd = formData.startDate
          ? formatDateForBackend(formData.startDate)
          : formatDateForBackend(editingVacation.startDate);

        const endDateStd = formData.endDate
          ? formatDateForBackend(formData.endDate)
          : formatDateForBackend(editingVacation.endDate);

        // Créer une copie complète de la demande originale avec les dates au format simple
        const fullRequestData = {
          startDate: startDateStd,
          endDate: endDateStd,
          reason: formData.reason || "",
          status: formData.status || editingVacation.status,
          employeeId: formData.employeeId || editingVacation.employeeId._id,
        };

        // Vérification finale des formats de dates
        console.log("Format de startDate:", fullRequestData.startDate);
        console.log("Format de endDate:", fullRequestData.endDate);

        console.log("Données complètes à envoyer:", fullRequestData);

        // Stocker ces informations pour les comparaisons futures
        const originalStartDate = startDateStd;
        const originalEndDate = endDateStd;

        response = await axiosInstance.put(
          `/vacations/${editingVacation._id}`,
          fullRequestData
        );
        console.log("Réponse complète du serveur:", response);

        // Analyser plus en détail la réponse du serveur
        if (response.data && response.data.data) {
          console.log("Données renvoyées par le serveur:", response.data.data);

          // Vérifier si les dates ont été mises à jour
          const serverStartDate = response.data.data.startDate;
          const serverEndDate = response.data.data.endDate;

          console.log("Dates initiales:", {
            startDate: formData.startDate,
            endDate: formData.endDate,
          });

          console.log("Dates envoyées:", {
            startDate: fullRequestData.startDate,
            endDate: fullRequestData.endDate,
          });

          console.log("Dates reçues:", {
            startDate: serverStartDate,
            endDate: serverEndDate,
          });

          // Vérifier si les dates correspondent
          const serverStartFormated = new Date(serverStartDate)
            .toISOString()
            .split("T")[0];
          const serverEndFormated = new Date(serverEndDate)
            .toISOString()
            .split("T")[0];

          const startDateUpdated = serverStartFormated === originalStartDate;
          const endDateUpdated = serverEndFormated === originalEndDate;

          console.log("Comparaison des dates:", {
            originalStartDate,
            serverStartFormated,
            originalEndDate,
            serverEndFormated,
          });

          console.log("Les dates ont-elles été mises à jour ?", {
            startDateUpdated,
            endDateUpdated,
          });

          // Si les dates n'ont pas été mises à jour, essayer une approche plus directe
          if (!startDateUpdated || !endDateUpdated) {
            console.log("Tentative de forcer la mise à jour des dates...");

            // Créer un objet ne contenant que les dates pour simplifier la requête
            const dateOnlyData = {
              startDate: fullRequestData.startDate,
              endDate: fullRequestData.endDate,
              // On doit inclure ces champs pour que la requête soit valide
              employeeId: fullRequestData.employeeId,
              reason: fullRequestData.reason || "",
              status: fullRequestData.status,
            };

            console.log("Envoi d'une requête épurée:", dateOnlyData);

            // Exécuter immédiatement (pas de setTimeout) pour accélérer le processus
            testMultipleFormats(
              editingVacation._id,
              editingVacation,
              fullRequestData.endDate,
              dateOnlyData
            ).then((success) => {
              if (success) {
                console.log("Correction forcée réussie");
              } else {
                console.error(
                  "Échec de la correction forcée - les données peuvent ne pas être à jour"
                );
                // Forcer un rafraîchissement complet des données
                setTimeout(() => fetchVacationRequests(), 1000);
              }
            });
          }

          // Si le serveur ne renvoie pas les bonnes dates, utiliser celles que nous avons envoyées
          // Mais s'assurer que nous comparons le bon format
          const correctedUpdatedRequest = {
            ...response.data.data,
            // Il est important de préserver le format ISO pour l'état local
            // car c'est le format que le backend utilise
            startDate: startDateUpdated
              ? serverStartDate
              : new Date(originalStartDate).toISOString(),
            endDate: endDateUpdated
              ? serverEndDate
              : new Date(originalEndDate).toISOString(),
          };

          console.log(
            "Utilisation des données corrigées:",
            correctedUpdatedRequest
          );

          // Nous ne mettons plus à jour l'état local ici
          // car nous allons faire un rafraîchissement complet des données
          console.log(
            "Préparation pour le rafraîchissement complet des données..."
          );
        } else {
          console.log(
            "Pas de données reçues du serveur, rafraîchissement complet..."
          );
          // Rafraîchir toutes les données
          await fetchVacationRequests();
        }

        setSuccess("Demande de congés mise à jour avec succès");

        // Toujours rafraîchir les données après une mise à jour pour éviter tout problème de synchronisation
        console.log(
          "Rafraîchissement complet des données après mise à jour..."
        );
        await fetchVacationRequests();
      } else {
        console.log("Création d'une nouvelle demande");
        response = await axiosInstance.post("/vacations", requestData);
        console.log("Réponse complète du serveur:", response);

        // Si la réponse contient la demande créée, ajouter directement à l'état local
        if (response.data && response.data.data) {
          const newRequest = response.data.data;

          // Ajouter les permissions (temporaire)
          const newRequestWithPermissions = {
            ...newRequest,
            permissions: {
              canEdit: true,
              canDelete: true,
            },
          };

          // Ajouter à l'état local
          setVacationRequests((prev) => [newRequestWithPermissions, ...prev]);

          console.log("Nouvelle demande ajoutée à l'état local");
        } else {
          console.log(
            "Pas de données reçues du serveur, rafraîchissement complet..."
          );
          // Rafraîchir toutes les données
          await fetchVacationRequests();
        }

        setSuccess("Demande de congés envoyée avec succès");
      }

      console.log("Réponse du serveur:", response.data);
      setShowSuccessToast(true);

      // Réinitialiser le formulaire et le mode édition
      setFormData({
        startDate: "",
        endDate: "",
        reason: "",
        employeeId: undefined,
        status: undefined,
      });
      setEditingVacation(null);

      // Masquer le formulaire
      setShowForm(false);

      // Pas besoin de rafraîchir les données ici car c'est déjà fait dans les branches if/else ci-dessus
      // pour les mises à jour et pour les créations de nouvelles demandes on le fait ici
      if (!editingVacation) {
        // Rafraîchir les données seulement pour les nouvelles demandes
        await fetchVacationRequests();
      }
    } catch (error) {
      const action = editingVacation ? "la mise à jour" : "l'envoi";
      console.error(`Erreur lors de ${action} de la demande de congés:`, error);
      setError(`Erreur lors de ${action} de la demande de congés`);
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour approuver ou refuser une demande de congés
  const handleUpdateVacationStatus = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    setActionLoading(id);
    setError(null);

    try {
      console.log(
        `Envoi de la requête PUT pour la demande ${id} avec statut ${status}`
      );
      const response = await axiosInstance.put(`/vacations/${id}`, {
        status,
      });
      console.log("Réponse reçue du serveur:", response.data);

      // Pour éviter les problèmes de synchronisation, toujours rafraîchir toutes les données
      console.log(
        "Rafraîchissement complet des données après mise à jour du statut..."
      );
      await fetchVacationRequests();

      setSuccess(
        `Demande de congés ${
          status === "approved" ? "approuvée" : "refusée"
        } avec succès`
      );
      setShowSuccessToast(true);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      setError("Erreur lors de la mise à jour du statut");
      setShowErrorToast(true);

      // Rafraîchir les données en cas d'erreur pour synchroniser l'état
      await fetchVacationRequests();
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour supprimer une demande de congés
  const handleDeleteVacation = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) {
      return;
    }

    setActionLoading(id);
    setError(null);

    try {
      console.log(`Suppression de la demande de congés ${id}`);
      const response = await axiosInstance.delete(`/vacations/${id}`);
      console.log("Réponse reçue du serveur:", response.data);

      // Rafraîchir toutes les données après suppression
      console.log("Rafraîchissement complet des données après suppression...");
      await fetchVacationRequests();

      setSuccess("Demande de congés supprimée avec succès");
      setShowSuccessToast(true);
    } catch (error) {
      console.error("Erreur lors de la suppression de la demande:", error);
      setError("Erreur lors de la suppression de la demande");
      setShowErrorToast(true);

      // Rafraîchir les données en cas d'erreur
      await fetchVacationRequests();
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour éditer une demande de congés
  const handleEditVacation = (vacation: VacationRequest) => {
    console.log("Édition de la demande avec données brutes:", vacation);

    // Standardisation des dates en extrayant la partie YYYY-MM-DD
    let startDateStr = "";
    let endDateStr = "";

    if (vacation.startDate) {
      // Extraire seulement la partie YYYY-MM-DD pour éviter les problèmes de fuseau horaire
      const startParts = vacation.startDate.split("T")[0].split("-");
      if (startParts.length === 3) {
        const [year, month, day] = startParts.map((p) => parseInt(p, 10));
        // Créer une date à midi UTC
        const startDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        startDateStr = startDate.toISOString();
      } else {
        // Fallback
        startDateStr = new Date(vacation.startDate).toISOString();
      }
    }

    if (vacation.endDate) {
      // Extraire seulement la partie YYYY-MM-DD pour éviter les problèmes de fuseau horaire
      const endParts = vacation.endDate.split("T")[0].split("-");
      if (endParts.length === 3) {
        const [year, month, day] = endParts.map((p) => parseInt(p, 10));
        // Créer une date à midi UTC
        const endDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        endDateStr = endDate.toISOString();
      } else {
        // Fallback
        endDateStr = new Date(vacation.endDate).toISOString();
      }
    }

    console.log("Dates extraites et converties:", {
      originales: {
        startDate: vacation.startDate,
        endDate: vacation.endDate,
      },
      converties: {
        startDateStr,
        endDateStr,
      },
    });

    // Initialiser le formulaire avec les données de la demande
    setFormData({
      startDate: startDateStr,
      endDate: endDateStr,
      reason: vacation.reason,
      employeeId: vacation.employeeId._id,
      status: vacation.status,
    });

    // Définir la demande en cours d'édition
    setEditingVacation(vacation);

    // Afficher le formulaire
    setShowForm(true);

    // Faire défiler jusqu'au formulaire
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fonction pour fermer les notifications
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  // Fonction pour filtrer les demandes par statut, recherche et équipe/entreprise
  const filterVacationRequests = (requests: VacationRequest[]) => {
    let filtered = requests;

    // Filtrer par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    // Filtrer par recherche (nom/prénom de l'employé)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((request) => {
        const fullName = `${request.employeeId?.firstName || ""} ${
          request.employeeId?.lastName || ""
        }`.toLowerCase();
        return fullName.includes(term);
      });
    }

    // Filtrer par entreprise (admin et directeur uniquement)
    if (canUseAdvancedFilters && selectedCompanyId) {
      filtered = filtered.filter(
        (request) => request.employeeId?.companyId === selectedCompanyId
      );
    }

    // Filtrer par équipe (admin et directeur uniquement)
    if (canUseAdvancedFilters && selectedTeamId) {
      filtered = filtered.filter(
        (request) => request.employeeId?.teamId === selectedTeamId
      );
    }

    // Pour les managers : filtrer par les équipes qu'ils gèrent
    if (userRole === "manager" && selectedTeamId) {
      filtered = filtered.filter(
        (request) => request.employeeId?.teamId === selectedTeamId
      );
    }

    return filtered;
  };

  // Fonction pour trier les demandes
  const sortVacationRequests = (requests: VacationRequest[]) => {
    return [...requests].sort((a, b) => {
      let comparison = 0;

      // Tri selon le champ sélectionné
      switch (sortField) {
        case "employee":
          const employeeA = `${a.employeeId?.lastName || ""} ${
            a.employeeId?.firstName || ""
          }`.toLowerCase();
          const employeeB = `${b.employeeId?.lastName || ""} ${
            b.employeeId?.firstName || ""
          }`.toLowerCase();
          comparison = employeeA.localeCompare(employeeB);
          break;

        case "period":
          const startDateA = new Date(a.startDate).getTime();
          const startDateB = new Date(b.startDate).getTime();
          comparison = startDateA - startDateB;
          break;

        case "status":
          comparison = a.status.localeCompare(b.status);
          break;

        default: // createdAt
          const createdAtA = new Date(a.createdAt).getTime();
          const createdAtB = new Date(b.createdAt).getTime();
          comparison = createdAtA - createdAtB;
      }

      // Appliquer la direction du tri
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  // Fonction pour changer le champ de tri
  const handleSortChange = (
    field: "employee" | "period" | "status" | "createdAt"
  ) => {
    if (field === sortField) {
      // Si on clique sur le même champ, inverser la direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Sinon, changer le champ et remettre la direction à descendant
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Fonction pour obtenir l'icône de tri
  const getSortIcon = (
    field: "employee" | "period" | "status" | "createdAt"
  ) => {
    if (field !== sortField) return null;

    return sortDirection === "asc" ? "↑" : "↓";
  };

  // Modifier la ligne de filteredRequests pour inclure le tri
  const filteredRequests = sortVacationRequests(
    filterVacationRequests(vacationRequests)
  );

  // Fonction pour forcer la mise à jour de la date de fin
  const forceUpdateEndDate = async (
    id: string,
    endDate: string,
    vacation: VacationRequest
  ) => {
    try {
      console.log(
        `Tentative de mise à jour directe de la date de fin pour ${id}`
      );
      console.log(`Nouvelle date de fin: ${endDate}`);

      // Inclure tous les champs nécessaires dans la requête
      const completeData = {
        startDate: formatDateForBackend(vacation.startDate),
        endDate: formatDateForBackend(endDate),
        reason: vacation.reason,
        status: vacation.status,
        employeeId: vacation.employeeId._id,
      };

      console.log("Données complètes pour mise à jour directe:", completeData);

      const response = await axiosInstance.put(
        `/vacations/${id}`,
        completeData
      );

      console.log("Réponse à la mise à jour directe:", response.data);

      // Rafraîchir les données
      await fetchVacationRequests();

      return true;
    } catch (error: any) {
      if (error.response) {
        // Le serveur a répondu avec un statut non-2xx
        console.error(
          "Erreur lors de la mise à jour directe - Réponse du serveur:",
          {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          }
        );
      } else if (error.request) {
        // La requête a été faite mais pas de réponse reçue
        console.error(
          "Erreur lors de la mise à jour directe - Pas de réponse:",
          error.request
        );
      } else {
        // Erreur lors de la configuration de la requête
        console.error("Erreur lors de la mise à jour directe:", error.message);
      }
      return false;
    }
  };

  // Fonction pour tester plusieurs formats de date
  const testMultipleFormats = async (
    id: string,
    vacation: VacationRequest,
    newEndDate: string,
    customData?: any
  ) => {
    console.log(
      "Test de plusieurs formats de date pour trouver celui qui fonctionne"
    );

    // Standardiser les dates en format simple YYYY-MM-DD
    const standardStartDate = new Date(vacation.startDate)
      .toISOString()
      .split("T")[0];
    const standardEndDate = new Date(newEndDate).toISOString().split("T")[0];

    // Si des données personnalisées sont fournies, les utiliser directement
    if (customData) {
      console.log(
        "Utilisation des données personnalisées fournies:",
        customData
      );
      try {
        const response = await axiosInstance.put(
          `/vacations/${id}`,
          customData
        );
        console.log("Réponse avec données personnalisées:", response.data);

        // Analyser le format des dates dans la réponse
        if (response.data && response.data.data) {
          console.log("Analyse du format des dates dans la réponse:");
          analyzeDateFormat(response.data.data);
        }

        // Rafraîchir les données
        await fetchVacationRequests();
        return true;
      } catch (error: any) {
        console.error(
          "Échec avec données personnalisées:",
          error?.response?.data || error.message
        );
        // Continuer avec les autres formats si les données personnalisées échouent
      }
    }

    const formats = [
      // Format 1: YYYY-MM-DD (format simple)
      {
        name: "Simple (YYYY-MM-DD)",
        data: {
          startDate: standardStartDate,
          endDate: standardEndDate,
          reason: vacation.reason,
          status: vacation.status,
          employeeId: vacation.employeeId._id,
        },
      },
      // Format 2: ISO complet
      {
        name: "ISO complet",
        data: {
          startDate: new Date(standardStartDate).toISOString(),
          endDate: new Date(standardEndDate).toISOString(),
          reason: vacation.reason,
          status: vacation.status,
          employeeId: vacation.employeeId._id,
        },
      },
      // Format 3: Timestamp
      {
        name: "Timestamp",
        data: {
          startDate: new Date(standardStartDate).getTime(),
          endDate: new Date(standardEndDate).getTime(),
          reason: vacation.reason,
          status: vacation.status,
          employeeId: vacation.employeeId._id,
        },
      },
      // Format 4: Garder le format original du startDate et uniquement changer endDate
      {
        name: "Format original préservé",
        data: {
          startDate: standardStartDate,
          endDate: newEndDate,
          reason: vacation.reason,
          status: vacation.status,
          employeeId: vacation.employeeId._id,
        },
      },
    ];

    for (let i = 0; i < formats.length; i++) {
      const format = formats[i];
      console.log(`Essai du format ${i + 1}: ${format.name}`, format.data);

      try {
        const response = await axiosInstance.put(
          `/vacations/${id}`,
          format.data
        );
        console.log(
          `Format ${i + 1} (${format.name}) a réussi!`,
          response.data
        );

        // Analyser le format des dates dans la réponse
        if (response.data && response.data.data) {
          console.log("Analyse du format des dates dans la réponse:");
          analyzeDateFormat(response.data.data);
        }

        // Ce format a fonctionné, enregistrer pour utilisation future
        console.log(`Format à utiliser à l'avenir: ${format.name}`);

        // Rafraîchir les données
        await fetchVacationRequests();
        return true;
      } catch (error: any) {
        console.error(
          `Format ${i + 1} (${format.name}) a échoué:`,
          error?.response?.data || error.message
        );
      }
    }

    console.error("Tous les formats de date ont échoué");
    return false;
  };

  // Fonction pour analyser le format des dates dans les données
  const analyzeDateFormat = (data: any) => {
    // Chercher les champs qui contiennent potentiellement des dates
    const dateFields = ["startDate", "endDate", "createdAt", "updatedAt"];

    console.log("Analyse des formats de date dans les données reçues:");

    const formats: Record<string, string> = {};

    dateFields.forEach((field) => {
      if (data[field]) {
        const value = data[field];
        let format = "Inconnu";

        if (typeof value === "string") {
          // Analyser le format de la chaîne de date
          if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            format = "YYYY-MM-DD";
          } else if (
            value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
          ) {
            format = "ISO";
          } else if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            format = "DD/MM/YYYY";
          }
        } else if (typeof value === "number") {
          format = "Timestamp";
        } else if (value instanceof Date) {
          format = "Date object";
        }

        formats[field] = `${format} (${value})`;
      }
    });

    console.log("Formats détectés:", formats);
    return formats;
  };

  /**
   * Rendu d'une carte de demande de congé pour la version mobile/tablette
   */
  const renderVacationCard = (request: VacationRequest) => {
    return (
      <motion.div
        key={request._id}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-3 p-4 transition-all"
      >
        <div className="flex flex-col space-y-3">
          {/* Employé */}
          <div className="flex items-center gap-3">
            <Avatar
              src={null}
              alt={`${request.employeeId?.firstName || ""} ${
                request.employeeId?.lastName || ""
              }`}
              size="sm"
            />
            <span className="text-gray-800 dark:text-white font-medium">
              {request.employeeId?.firstName || "Employé"}{" "}
              {request.employeeId?.lastName || "inconnu"}
            </span>
          </div>

          {/* Statut */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Statut
            </span>
            <Badge
              label={translateStatus(request.status)}
              type={getStatusBadgeType(request.status)}
            />
          </div>

          {/* Période */}
          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Période
            </div>
            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
              <CalendarDays size={14} />
              <span>
                {request.startDate ? formatDate(request.startDate) : "N/A"} -{" "}
                {request.endDate ? formatDate(request.endDate) : "N/A"}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {request.startDate && request.endDate
                ? `${calculateDuration(
                    request.startDate,
                    request.endDate
                  )} jour(s)`
                : "Durée indéterminée"}
            </div>
          </div>

          {/* Motif */}
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Motif
            </div>
            <div className="text-gray-700 dark:text-gray-200 mt-1">
              {request.reason !== undefined &&
              request.reason !== null &&
              request.reason !== "" ? (
                request.reason
              ) : (
                <span className="text-gray-400 dark:text-gray-500 italic">
                  Non spécifié
                </span>
              )}
            </div>
          </div>

          {/* Actions - utilisent maintenant les permissions */}
          {/* Actions - Boutons d'approbation/refus (pour les demandes en attente) */}
          {request.permissions?.canEdit && request.status === "pending" && (
            <div className="flex flex-wrap justify-end gap-2 mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  handleUpdateVacationStatus(request._id, "approved")
                }
                isLoading={actionLoading === request._id}
                icon={<CheckCircle2 size={14} />}
                className="bg-green-600 hover:bg-green-700 focus:ring-green-500/40"
              >
                Approuver
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  handleUpdateVacationStatus(request._id, "rejected")
                }
                isLoading={actionLoading === request._id}
                icon={<XCircle size={14} />}
              >
                Refuser
              </Button>
            </div>
          )}

          {/* Bouton Modifier - affiché pour toutes les demandes avec permission d'édition */}
          {request.permissions?.canEdit && (
            <div className="flex justify-end mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleEditVacation(request)}
                icon={<Calendar size={14} />}
                className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
              >
                Modifier
              </Button>
            </div>
          )}

          {/* Bouton de suppression - affiché selon les permissions */}
          {request.permissions?.canDelete && (
            <div
              className={`flex justify-end mt-2 ${
                request.status === "pending" && request.permissions?.canEdit
                  ? ""
                  : "pt-3 border-t border-gray-100 dark:border-gray-700"
              }`}
            >
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteVacation(request._id)}
                isLoading={actionLoading === request._id}
                icon={<XCircle size={14} />}
              >
                Supprimer
              </Button>
            </div>
          )}

          {/* Information sur qui a approuvé/refusé */}
          {request.status !== "pending" && (
            <div className="text-gray-500 dark:text-gray-400 text-xs text-right pt-2 border-t border-gray-100 dark:border-gray-700">
              {request.status === "approved" ? "Approuvé" : "Refusé"} par{" "}
              <span className="font-medium">
                {request.updatedBy && request.updatedBy.firstName
                  ? `${request.updatedBy.firstName} ${request.updatedBy.lastName}`
                  : "le système"}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Le contenu principal de la page
  const pageContent = (
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
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between mb-6"
        {...fadeInAnimation}
      >
        <Breadcrumb items={breadcrumbItems} />
      </motion.div>

      {/* Titre de la page */}
      <motion.div {...slideInAnimation}>
        <SectionTitle
          title="Gestion des Congés"
          subtitle={
            userRole === "employee"
              ? "Visualisez et demandez vos congés"
              : "Gérez les demandes de congés de votre équipe"
          }
          icon={<CalendarCheck size={24} />}
          className="mb-8"
        />
      </motion.div>

      {/* Filtres et actions */}
      <motion.div {...slideInAnimation} transition={{ delay: 0.1 }}>
        <SectionCard
          title="Filtres"
          className="mb-8"
          actions={
            <Button
              variant="primary"
              onClick={() => {
                if (showForm) {
                  // Si on ferme le formulaire, on réinitialise tout
                  setEditingVacation(null);
                  setFormData({
                    startDate: "",
                    endDate: "",
                    reason: "",
                    employeeId: undefined,
                    status: undefined,
                  });
                }
                setShowForm(!showForm);
              }}
              icon={showForm ? undefined : <Plus size={16} />}
            >
              {showForm ? "Annuler" : "Demander un congé"}
            </Button>
          }
        >
          <div className="space-y-4 p-4">
            {/* Barre de recherche */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou prénom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  />
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Filtres avancés pour admin uniquement */}
            {canUseAdvancedFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Filtre par entreprise */}
                <div>
                  <Select
                    label="Entreprise"
                    options={[
                      { label: "Toutes les entreprises", value: "" },
                      ...companies.map((company) => ({
                        label: company.name,
                        value: company._id,
                      })),
                    ]}
                    value={selectedCompanyId}
                    onChange={handleCompanyChange}
                    placeholder="Sélectionner une entreprise..."
                    icon={<Building size={16} />}
                    disabled={loadingCompanies}
                  />
                </div>

                {/* Filtre par équipe */}
                <div>
                  <Select
                    label="Équipe"
                    options={[
                      { label: "Toutes les équipes", value: "" },
                      ...teams.map((team) => ({
                        label: team.name,
                        value: team._id,
                      })),
                    ]}
                    value={selectedTeamId}
                    onChange={setSelectedTeamId}
                    placeholder="Sélectionner une équipe..."
                    icon={<Users size={16} />}
                    disabled={loadingTeams || !selectedCompanyId}
                  />
                </div>
              </div>
            )}

            {/* Filtre par équipe pour directeur et manager */}
            {!canUseAdvancedFilters &&
              (userRole === "directeur" || userRole === "manager") &&
              teams.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Équipe"
                      options={[
                        {
                          label:
                            userRole === "manager"
                              ? "Toutes mes équipes"
                              : "Toutes les équipes",
                          value: "",
                        },
                        ...teams.map((team) => ({
                          label: team.name,
                          value: team._id,
                        })),
                      ]}
                      value={selectedTeamId}
                      onChange={setSelectedTeamId}
                      placeholder="Sélectionner une équipe..."
                      icon={<Users size={16} />}
                      disabled={loadingTeams}
                    />
                  </div>
                </div>
              )}

            {/* Filtres de statut */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant={statusFilter === "all" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className={
                  statusFilter !== "all"
                    ? "dark:bg-gray-700 dark:text-white dark:hover:bg-indigo-800/50 dark:border-gray-600"
                    : ""
                }
              >
                Tous
              </Button>
              <Button
                variant={statusFilter === "pending" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
                icon={<Clock size={14} />}
                className={
                  statusFilter !== "pending"
                    ? "dark:bg-gray-700 dark:text-white dark:hover:bg-indigo-800/50 dark:border-gray-600"
                    : ""
                }
              >
                En attente
              </Button>
              <Button
                variant={statusFilter === "approved" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setStatusFilter("approved")}
                icon={<CheckCircle2 size={14} />}
                className={
                  statusFilter !== "approved"
                    ? "dark:bg-gray-700 dark:text-white dark:hover:bg-indigo-800/50 dark:border-gray-600"
                    : ""
                }
              >
                Approuvés
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setStatusFilter("rejected")}
                icon={<XCircle size={14} />}
                className={
                  statusFilter !== "rejected"
                    ? "dark:bg-gray-700 dark:text-white dark:hover:bg-indigo-800/50 dark:border-gray-600"
                    : ""
                }
              >
                Refusés
              </Button>

              {/* Bouton d'export PDF */}
              {["manager", "directeur", "admin"].includes(userRole) &&
                filteredRequests.length > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => generateVacationPdf(filteredRequests)}
                    icon={<FileDown size={14} />}
                    className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600 ml-auto"
                  >
                    Exporter PDF
                  </Button>
                )}
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Formulaire de demande de congés */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-8"
          >
            {/* Formulaire dark mode */}
            <SectionCard
              title={
                editingVacation
                  ? "Modifier une demande de congé"
                  : "Nouvelle demande de congé"
              }
              className="dark:bg-gray-800"
            >
              <form onSubmit={handleSubmitVacationRequest} className="p-6">
                {/* Sélection de l'employé (uniquement pour manager, directeur, admin) */}
                {canSelectEmployee && (
                  <div className="mb-6">
                    <label
                      htmlFor="employeeId"
                      className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-1"
                    >
                      Employé concerné
                      <span className="text-[var(--error)] ml-1">*</span>
                    </label>
                    {loadingEmployees ? (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)] dark:text-gray-300">
                        <LoadingSpinner size="sm" />
                        <span>Chargement des employés...</span>
                      </div>
                    ) : accessibleEmployees.length === 0 ? (
                      <div className="p-3 bg-[var(--background-secondary)] dark:bg-gray-700 rounded-md text-[var(--text-secondary)] dark:text-gray-300">
                        Aucun employé accessible
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          id="employeeId"
                          name="employeeId"
                          value={formData.employeeId || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-md border border-[var(--border)] dark:border-gray-600 bg-[var(--background-secondary)] dark:bg-gray-700
                            focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] dark:text-white
                            pr-10 appearance-none"
                          required
                        >
                          <option value="" disabled>
                            Sélectionnez un employé
                          </option>
                          {accessibleEmployees.map((employee) => (
                            <option key={employee._id} value={employee._id}>
                              {employee.firstName} {employee.lastName}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] dark:text-gray-400">
                          <User size={16} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Date de début */}
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block mb-2 text-sm font-medium text-[var(--text-primary)] dark:text-white"
                    >
                      Date de début <span className="text-red-500">*</span>
                    </label>
                    <CustomDatePicker
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={(value: string) => {
                        setFormData({
                          ...formData,
                          startDate: value,
                        });
                      }}
                      placeholder="Sélectionner une date"
                      required
                      className="w-full"
                    />
                  </div>

                  {/* Date de fin */}
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block mb-2 text-sm font-medium text-[var(--text-primary)] dark:text-white"
                    >
                      Date de fin <span className="text-red-500">*</span>
                    </label>
                    <CustomDatePicker
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={(value: string) => {
                        setFormData({
                          ...formData,
                          endDate: value,
                        });
                      }}
                      placeholder="Sélectionner une date"
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="reason"
                    className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-1"
                  >
                    Motif
                    <span className="text-[var(--text-secondary)] dark:text-gray-400 ml-1">
                      (facultatif)
                    </span>
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-md border border-[var(--border)] dark:border-gray-600 transition bg-[var(--background-secondary)] dark:bg-gray-700
                      focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] placeholder-[var(--text-secondary)] dark:placeholder-gray-400 dark:text-white"
                    placeholder="Précisez la raison de votre demande de congé..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  {editingVacation && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditingVacation(null);
                        setFormData({
                          startDate: "",
                          endDate: "",
                          reason: "",
                          employeeId: undefined,
                          status: undefined,
                        });
                      }}
                      className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
                    >
                      Annuler l'édition
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                    icon={<Calendar size={16} />}
                  >
                    {editingVacation
                      ? "Modifier la demande"
                      : "Envoyer la demande"}
                  </Button>
                </div>
              </form>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des demandes de congés */}
      <motion.div {...slideInAnimation} transition={{ delay: 0.2 }}>
        <SectionCard
          title={`Demandes de congés${
            statusFilter !== "all" ? ` - ${translateStatus(statusFilter)}` : ""
          }`}
          className="mb-8"
        >
          {loading && !actionLoading ? (
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <CalendarCheck
                size={40}
                className="text-gray-400 dark:text-gray-500 mb-4"
              />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Aucune demande de congé
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune demande{" "}
                {statusFilter !== "all" ? translateStatus(statusFilter) : ""}{" "}
                trouvée.
              </p>
            </div>
          ) : (
            <>
              {/* Version desktop - visible uniquement sur md et plus */}
              {/* Amélioration dark mode */}
              <div className="hidden md:block overflow-x-auto">
                <Table
                  columns={[
                    {
                      key: "employee",
                      label: "Employé",
                      className: "w-48",
                      sortable: true,
                    },
                    {
                      key: "period",
                      label: "Période",
                      className: "w-56",
                      sortable: true,
                    },
                    {
                      key: "status",
                      label: "Statut",
                      className: "w-32",
                      sortable: true,
                    },
                    { key: "reason", label: "Motif" },
                    { key: "actions", label: "Actions", className: "w-48" },
                  ]}
                  data={filteredRequests
                    .filter((request) => request && typeof request === "object")
                    .map((request) => ({
                      employee: (
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={null}
                            alt={`${request.employeeId?.firstName || ""} ${
                              request.employeeId?.lastName || ""
                            }`}
                            size="sm"
                          />
                          <span className="text-[var(--text-primary)] dark:text-white font-medium">
                            {request.employeeId?.firstName || "Employé"}{" "}
                            {request.employeeId?.lastName || "inconnu"}
                          </span>
                        </div>
                      ),
                      period: (
                        <div>
                          <div className="flex items-center gap-1.5 text-[var(--text-primary)] dark:text-white">
                            <CalendarDays size={14} />
                            <span>
                              {request.startDate
                                ? formatDate(request.startDate)
                                : "N/A"}{" "}
                              -{" "}
                              {request.endDate
                                ? formatDate(request.endDate)
                                : "N/A"}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] dark:text-gray-400 mt-1">
                            {request.startDate && request.endDate
                              ? `${calculateDuration(
                                  request.startDate,
                                  request.endDate
                                )} jour(s)`
                              : "Durée indéterminée"}
                          </div>
                        </div>
                      ),
                      status: (
                        <Badge
                          label={translateStatus(request.status)}
                          type={getStatusBadgeType(request.status)}
                        />
                      ),
                      reason: (
                        <div className="max-w-xs text-[var(--text-primary)] dark:text-white">
                          {request.reason !== undefined &&
                          request.reason !== null &&
                          request.reason !== "" ? (
                            request.reason
                          ) : (
                            <span className="text-[var(--text-tertiary)] dark:text-gray-500 italic">
                              Non spécifié
                            </span>
                          )}
                        </div>
                      ),
                      actions: (
                        <div className="flex justify-end gap-2">
                          {/* Boutons d'approbation/refus - uniquement pour les demandes en attente */}
                          {request.permissions?.canEdit &&
                            request.status === "pending" && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateVacationStatus(
                                      request._id,
                                      "approved"
                                    )
                                  }
                                  isLoading={actionLoading === request._id}
                                  icon={<CheckCircle2 size={14} />}
                                  className="bg-green-600 hover:bg-green-700 focus:ring-green-500/40"
                                >
                                  Approuver
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateVacationStatus(
                                      request._id,
                                      "rejected"
                                    )
                                  }
                                  isLoading={actionLoading === request._id}
                                  icon={<XCircle size={14} />}
                                >
                                  Refuser
                                </Button>
                              </>
                            )}

                          {/* Bouton Modifier - affiché pour toutes les demandes avec permission d'édition */}
                          {request.permissions?.canEdit && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditVacation(request)}
                              icon={<Calendar size={14} />}
                              className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
                            >
                              Modifier
                            </Button>
                          )}

                          {request.permissions?.canDelete && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteVacation(request._id)}
                              isLoading={actionLoading === request._id}
                              icon={<XCircle size={14} />}
                            >
                              Supprimer
                            </Button>
                          )}

                          {request.status !== "pending" &&
                            !request.permissions?.canDelete && (
                              <div className="text-[var(--text-tertiary)] dark:text-gray-400 text-xs text-right">
                                {request.status === "approved"
                                  ? "Approuvé"
                                  : "Refusé"}{" "}
                                par{" "}
                                <span className="font-medium">
                                  {request.updatedBy &&
                                  request.updatedBy.firstName
                                    ? `${request.updatedBy.firstName} ${request.updatedBy.lastName}`
                                    : "le système"}
                                </span>
                              </div>
                            )}
                        </div>
                      ),
                    }))}
                  onSort={(key: string, order: "asc" | "desc" | null) => {
                    // Convertir la clé du tableau en champ de notre état
                    const fieldMap: Record<
                      string,
                      "employee" | "period" | "status" | "createdAt"
                    > = {
                      employee: "employee",
                      period: "period",
                      status: "status",
                    };

                    const field = fieldMap[key] || "createdAt";
                    setSortField(field);
                    setSortDirection(order === "asc" ? "asc" : "desc");
                  }}
                  emptyState={{
                    title: "Aucune demande de congé",
                    description: `Aucune demande ${
                      statusFilter !== "all"
                        ? translateStatus(statusFilter)
                        : ""
                    } trouvée.`,
                    icon: <CalendarCheck size={40} />,
                  }}
                />
              </div>

              {/* Responsive mobile */}
              <div className="block md:hidden">
                <div className="space-y-4 px-1 py-2">
                  <AnimatePresence>
                    {filteredRequests.map((request) =>
                      renderVacationCard(request)
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </motion.div>
    </PageWrapper>
  );

  return (
    <LayoutWithSidebar activeItem="vacations" pageTitle="Gestion des Congés">
      {pageContent}
    </LayoutWithSidebar>
  );
};

export default VacationsPage;
