/**
 * IncidentTrackingPage - Page de suivi des incidents
 *
 * Permet aux managers de visualiser et gérer les incidents signalés pour leur équipe.
 * Intègre les composants du design system SmartPlanning pour une expérience cohérente.
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Eye,
  Pencil,
  Plus,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import React, {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

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
import Card from "../components/ui/Card";
import DatePicker from "../components/ui/DatePicker";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Types pour les incidents
interface Incident {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  type: "retard" | "absence" | "oubli badge" | "litige" | "autre";
  description?: string;
  date: string;
  status: "resolved" | "pending" | "dismissed";
  reportedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

// Types pour les employés
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
}

// Types pour le formulaire d'ajout d'incident
interface IncidentFormData {
  employeeId: string;
  type: "retard" | "absence" | "oubli badge" | "litige" | "autre";
  description: string;
  date: string;
}

// Types pour l'édition des incidents
interface IncidentEditData {
  description?: string;
  status: "resolved" | "pending" | "dismissed";
}

// Variantes d'animation pour les cartes
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/**
 * Formate une date pour l'affichage
 * @param dateString Chaîne de date à formater
 * @returns Date formatée (ex: "15 avril 2023")
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
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
    case "resolved":
      return "Résolu";
    case "dismissed":
      return "Rejeté";
    default:
      return status;
  }
};

/**
 * Obtient le type de badge pour un statut
 * @param status Statut de l'incident
 * @returns Type de badge
 */
const getStatusBadgeType = (
  status: string
): "success" | "error" | "info" | "warning" => {
  switch (status) {
    case "pending":
      return "warning";
    case "resolved":
      return "success";
    case "dismissed":
      return "error";
    default:
      return "info";
  }
};

/**
 * Traduit les types d'incidents en français
 * @param type Type d'incident
 * @returns Type traduit en français
 */
const translateIncidentType = (type: string): string => {
  switch (type) {
    case "retard":
      return "Retard";
    case "absence":
      return "Absence";
    case "oubli badge":
      return "Oubli de badge";
    case "litige":
      return "Litige";
    case "autre":
      return "Autre";
    default:
      return type;
  }
};

/**
 * Obtient le type de badge pour un type d'incident
 * @param type Type d'incident
 * @returns Type de badge
 */
const getIncidentTypeBadgeType = (
  type: string
): "success" | "error" | "info" | "warning" => {
  switch (type) {
    case "retard":
      return "warning";
    case "absence":
      return "error";
    case "oubli badge":
      return "info";
    case "litige":
      return "error";
    case "autre":
      return "info";
    default:
      return "info";
  }
};

/**
 * Composant principal pour la page de suivi des incidents
 * Accessible uniquement aux managers
 */
const IncidentTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirection si l'utilisateur n'a pas les droits nécessaires
  useEffect(() => {
    const authorizedRoles = ["admin", "manager", "directeur"];
    if (!user || !authorizedRoles.includes(user.role)) {
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  // Référence pour le scroll
  const incidentTableRef = useRef<HTMLDivElement>(null);

  // États pour gérer les incidents et l'UI
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editData, setEditData] = useState<IncidentEditData>({
    description: "",
    status: "pending",
  });

  // État pour le tri des incidents
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/tableau-de-bord" },
    { label: "Incidents" },
  ];

  // État pour le formulaire d'ajout d'incident
  const [formData, setFormData] = useState<IncidentFormData>({
    employeeId: "",
    type: "retard",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Fonction pour trier les incidents
  const sortIncidents = useCallback(
    (field: string) => {
      if (sortField === field) {
        // Inverser la direction si on clique sur la même colonne
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        // Nouvelle colonne, définir comme tri par défaut
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField, sortDirection]
  );

  // Fonction pour obtenir les incidents triés
  const getSortedIncidents = useCallback(() => {
    if (!sortField) return incidents;

    return [...incidents].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      switch (sortField) {
        case "employeeId":
          const nameA =
            `${a.employeeId.lastName} ${a.employeeId.firstName}`.toLowerCase();
          const nameB =
            `${b.employeeId.lastName} ${b.employeeId.firstName}`.toLowerCase();
          return nameA.localeCompare(nameB) * direction;

        case "type":
          return a.type.localeCompare(b.type) * direction;

        case "date":
          return (
            (new Date(a.date).getTime() - new Date(b.date).getTime()) *
            direction
          );

        case "status":
          return a.status.localeCompare(b.status) * direction;

        default:
          return 0;
      }
    });
  }, [incidents, sortField, sortDirection]);

  // Fonction pour récupérer les incidents de l'équipe
  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: Incident[];
      }>("/incidents");

      // Tri des incidents par date (les plus récents en premier)
      const receivedIncidents = response.data.data;
      setIncidents(receivedIncidents);

      // Définir le tri par défaut sur la date (plus récent en premier)
      setSortField("date");
      setSortDirection("desc");

      // Scroll vers la table des incidents si des incidents sont présents
      if (receivedIncidents.length > 0) {
        setTimeout(() => {
          incidentTableRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 500);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des incidents:", error);
      setError("Impossible de récupérer les incidents. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour récupérer la liste des employés
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: Employee[];
      }>("/employees");
      setEmployees(response.data.data);

      // Définir l'employé par défaut si la liste n'est pas vide
      if (response.data.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          employeeId: response.data.data[0]._id,
        }));
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des employés:", error);
      setError(
        "Impossible de récupérer la liste des employés. Veuillez réessayer."
      );
      setShowErrorToast(true);
    }
  }, []);

  // Chargement initial des données
  useEffect(() => {
    fetchIncidents();
    fetchEmployees();
  }, [fetchIncidents, fetchEmployees]);

  // Gestionnaire pour mettre à jour le formulaire
  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fonction pour ajouter un nouvel incident
  const addIncident = async (e: FormEvent) => {
    e.preventDefault();

    // Validation du formulaire
    if (!formData.employeeId || !formData.type || !formData.date) {
      setError("Veuillez remplir tous les champs obligatoires");
      setShowErrorToast(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Pas besoin de corriger la date, utiliser directement la date sélectionnée
      await axiosInstance.post("/incidents", {
        employeeId: formData.employeeId,
        type: formData.type,
        description: formData.description.trim() || undefined,
        date: formData.date, // Utiliser directement la date sans correction
      });

      setSuccess("Incident signalé avec succès");
      setShowSuccessToast(true);

      // Réinitialiser le formulaire tout en conservant la date du jour
      setFormData({
        employeeId: employees.length > 0 ? employees[0]._id : "",
        type: "retard",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });

      // Masquer le formulaire et rafraîchir la liste des incidents
      setShowForm(false);
      fetchIncidents();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'incident:", error);
      setError("Impossible d'ajouter l'incident. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour gérer la vue des détails d'un incident
  const viewIncidentDetails = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowDetailsModal(true);
  };

  // Fonction pour fermer les notifications
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  // Données employés fictives si l'API n'est pas disponible
  const fallbackEmployees: Employee[] =
    employees.length > 0
      ? employees
      : [
          { _id: "1", firstName: "Jean", lastName: "Dupont" },
          { _id: "2", firstName: "Marie", lastName: "Martin" },
          { _id: "3", firstName: "Luc", lastName: "Dubois" },
          { _id: "4", firstName: "Sophie", lastName: "Lefèvre" },
        ];

  // Options pour le type d'incident
  const incidentTypeOptions = [
    { label: "Retard", value: "retard" },
    { label: "Absence", value: "absence" },
    { label: "Oubli de badge", value: "oubli badge" },
    { label: "Litige", value: "litige" },
    { label: "Autre", value: "autre" },
  ];

  // Options pour la liste des employés
  const employeeOptions = fallbackEmployees.map((employee) => ({
    label: `${employee.firstName} ${employee.lastName}`,
    value: employee._id,
  }));

  // Fonction pour supprimer un incident
  const deleteIncident = async (incidentId: string) => {
    // Demander confirmation avant suppression
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet incident ?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.delete(`/incidents/${incidentId}`);

      if (response.data.success) {
        // Mettre à jour la liste des incidents en retirant celui qui a été supprimé
        setIncidents((prevIncidents) =>
          prevIncidents.filter((incident) => incident._id !== incidentId)
        );

        // Fermer le modal de détails si ouvert
        if (showDetailsModal && selectedIncident?._id === incidentId) {
          setShowDetailsModal(false);
          setSelectedIncident(null);
        }

        // Afficher un message de succès
        setSuccess("Incident supprimé avec succès");
        setShowSuccessToast(true);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'incident:", error);
      setError("Impossible de supprimer l'incident. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (incident: Incident) => {
    setSelectedIncident(incident);
    setEditData({
      description: incident.description || "",
      status: incident.status,
    });
    setShowEditModal(true);
  };

  // Fonction pour gérer les modifications du formulaire d'édition
  const handleEditChange = (field: keyof IncidentEditData, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fonction pour mettre à jour un incident
  const updateIncident = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedIncident) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await axiosInstance.put(
        `/incidents/${selectedIncident._id}`,
        {
          description: editData.description?.trim() || undefined,
          status: editData.status,
        }
      );

      if (response.data.success) {
        // Mettre à jour l'incident dans la liste locale
        setIncidents((prevIncidents) =>
          prevIncidents.map((incident) =>
            incident._id === selectedIncident._id
              ? {
                  ...incident,
                  description: editData.description || incident.description,
                  status: editData.status,
                }
              : incident
          )
        );

        // Mettre à jour selectedIncident si le modal de détails est ouvert
        if (showDetailsModal) {
          setSelectedIncident({
            ...selectedIncident,
            description: editData.description || selectedIncident.description,
            status: editData.status,
          });
        }

        // Fermer le modal d'édition
        setShowEditModal(false);

        // Afficher un message de succès
        setSuccess("Incident mis à jour avec succès");
        setShowSuccessToast(true);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'incident:", error);
      setError("Impossible de mettre à jour l'incident. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Options pour le statut d'incident
  const statusOptions = [
    { label: "En attente", value: "pending" },
    { label: "Résolu", value: "resolved" },
    { label: "Rejeté", value: "dismissed" },
  ];

  // Fonction pour rendre une carte d'incident responsive pour mobile
  const renderIncidentCard = (incident: Incident) => {
    return (
      <motion.div
        key={incident._id}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 p-4 transition-all"
      >
        <div className="flex flex-col space-y-3">
          {/* Employé et type d'incident */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Avatar
                src={null}
                alt={`${incident.employeeId.firstName} ${incident.employeeId.lastName}`}
                size="sm"
              />
              <h3 className="font-bold text-gray-800 dark:text-white">
                {incident.employeeId.firstName} {incident.employeeId.lastName}
              </h3>
            </div>
            <Badge
              type={getIncidentTypeBadgeType(incident.type)}
              label={translateIncidentType(incident.type)}
            />
          </div>

          {/* Date et statut */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)] dark:text-gray-300">
              <Calendar size={14} />
              <span>{formatDate(incident.date)}</span>
            </div>
            <Badge
              type={getStatusBadgeType(incident.status)}
              label={translateStatus(incident.status)}
            />
          </div>

          {/* Description */}
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <p className="line-clamp-2">{incident.description || "—"}</p>
          </div>

          {/* Informations sur le responsable */}
          <div className="text-xs text-[var(--text-tertiary)] dark:text-gray-400 flex items-center gap-1">
            <User size={12} />
            <span>
              Signalé par: {incident.reportedBy.firstName}{" "}
              {incident.reportedBy.lastName}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewIncidentDetails(incident)}
              icon={<Eye size={16} />}
            >
              Détails
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(incident)}
              icon={<Pencil size={16} />}
            >
              Éditer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteIncident(incident._id)}
              icon={<Trash2 size={16} />}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Contenu principal à rendre
  const renderContent = () => (
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

      {/* Modal d'édition d'incident */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier l'incident"
      >
        {selectedIncident && (
          <div className="p-6 dark:bg-gray-800">
            <form onSubmit={updateIncident} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--text-primary)] dark:text-gray-200">
                  Employé concerné
                </label>
                <div className="flex items-center gap-2 mb-4">
                  <Avatar
                    src={null}
                    alt={`${selectedIncident.employeeId.firstName} ${selectedIncident.employeeId.lastName}`}
                    size="sm"
                  />
                  <span className="text-[var(--text-primary)] dark:text-gray-200">
                    {selectedIncident.employeeId.firstName}{" "}
                    {selectedIncident.employeeId.lastName}
                  </span>
                </div>

                <Select
                  label="Statut"
                  options={statusOptions}
                  value={editData.status}
                  onChange={(value) => handleEditChange("status", value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--text-primary)] dark:text-gray-200">
                  Description (optionnelle)
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) =>
                    handleEditChange("description", e.target.value)
                  }
                  placeholder="Détails supplémentaires concernant l'incident..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--background-secondary)] dark:bg-gray-700 dark:text-gray-200 placeholder-[var(--text-secondary)] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowEditModal(false)}
                  className="dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white"
                >
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal de détails d'incident */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Détails de l'incident"
      >
        {selectedIncident && (
          <div className="p-6 dark:bg-gray-800">
            <Card className="mb-6 dark:bg-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] dark:text-gray-300">
                    Employé concerné
                  </h3>
                  <div className="mt-2 flex items-center">
                    <Avatar
                      src={null}
                      alt={`${selectedIncident.employeeId.firstName} ${selectedIncident.employeeId.lastName}`}
                      size="sm"
                      className="mr-2"
                    />
                    <p className="text-[var(--text-primary)] dark:text-gray-200">
                      {selectedIncident.employeeId.firstName}{" "}
                      {selectedIncident.employeeId.lastName}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] dark:text-gray-300">
                    Type d'incident
                  </h3>
                  <div className="mt-2">
                    <Badge
                      type={getIncidentTypeBadgeType(selectedIncident.type)}
                      label={translateIncidentType(selectedIncident.type)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] dark:text-gray-300">
                    Date de l'incident
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <Calendar
                      size={16}
                      className="text-[var(--text-secondary)] dark:text-gray-300"
                    />
                    <p className="text-[var(--text-primary)] dark:text-gray-200">
                      {formatDate(selectedIncident.date)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] dark:text-gray-300">
                    Statut
                  </h3>
                  <div className="mt-2">
                    <Badge
                      type={getStatusBadgeType(selectedIncident.status)}
                      label={translateStatus(selectedIncident.status)}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="mb-6 dark:bg-gray-700">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] dark:text-gray-300 mb-2">
                Description
              </h3>
              <p className="text-[var(--text-primary)] dark:text-gray-200 whitespace-pre-wrap">
                {selectedIncident.description ||
                  "Aucune description fournie pour cet incident."}
              </p>
            </Card>

            <Card className="mb-6 dark:bg-gray-700">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] dark:text-gray-300 mb-2">
                Informations complémentaires
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] dark:text-gray-400">
                    Signalé par
                  </p>
                  <div className="mt-1 flex items-center">
                    <Avatar
                      src={null}
                      alt={`${selectedIncident.reportedBy.firstName} ${selectedIncident.reportedBy.lastName}`}
                      size="sm"
                      className="mr-2"
                    />
                    <p className="text-sm text-[var(--text-primary)] dark:text-gray-200">
                      {selectedIncident.reportedBy.firstName}{" "}
                      {selectedIncident.reportedBy.lastName}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] dark:text-gray-400">
                    Date de signalement
                  </p>
                  <p className="text-sm text-[var(--text-primary)] dark:text-gray-200 mt-1">
                    {formatDate(selectedIncident.createdAt)}
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowDetailsModal(false)}
                className="dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Fermer
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(selectedIncident);
                }}
                icon={<Pencil size={16} />}
                className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Modifier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* En-tête avec fil d'ariane */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Titre de la page */}
      <SectionTitle
        title="Suivi des incidents"
        subtitle="Consultez et gérez les incidents signalés dans votre organisation"
        icon={<Shield size={24} />}
        className="mb-8"
      />

      {/* Bouton d'ajout d'incident et formulaire */}
      <SectionCard
        title="Nouveau signalement"
        className="mb-8"
        actions={
          <Button
            variant={showForm ? "ghost" : "primary"}
            onClick={() => setShowForm(!showForm)}
            icon={showForm ? undefined : <Plus size={16} />}
          >
            {showForm ? "Annuler" : "Signaler un incident"}
          </Button>
        }
      >
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 border-t border-[var(--border)] dark:border-gray-700">
                <form onSubmit={addIncident} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employé concerné */}
                    <Select
                      label="Employé concerné"
                      options={employeeOptions}
                      value={formData.employeeId}
                      onChange={(value) =>
                        handleInputChange("employeeId", value)
                      }
                      placeholder="Sélectionner un employé"
                    />

                    {/* Type d'incident */}
                    <Select
                      label="Type d'incident"
                      options={incidentTypeOptions}
                      value={formData.type}
                      onChange={(value) => handleInputChange("type", value)}
                      placeholder="Sélectionner un type"
                    />

                    {/* Date de l'incident */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-[var(--text-primary)] dark:text-gray-200">
                        Date de l'incident
                        {/* Rendre l'astérisque visible si requis */}
                      </label>
                      <div className="dark:bg-gray-800 rounded-md">
                        <DatePicker
                          selectedDate={
                            formData.date ? new Date(formData.date) : null
                          }
                          onChange={(date) => {
                            if (date) {
                              // Gérer correctement la date pour éviter le décalage de fuseau horaire
                              // date.toISOString() génère une date UTC, ce qui peut causer un décalage
                              // On utilise directement les méthodes getFullYear, getMonth et getDate pour créer
                              // une chaîne de date au format YYYY-MM-DD en heure locale

                              const year = date.getFullYear();
                              const month = String(
                                date.getMonth() + 1
                              ).padStart(2, "0"); // +1 car getMonth est 0-indexé
                              const day = String(date.getDate()).padStart(
                                2,
                                "0"
                              );

                              // Créer la chaîne de date au format YYYY-MM-DD
                              const formattedDate = `${year}-${month}-${day}`;

                              handleInputChange("date", formattedDate);
                            }
                          }}
                          className="dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description (optionnelle) */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--text-primary)] dark:text-gray-200">
                      Description (optionnelle)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="Détails supplémentaires concernant l'incident..."
                      rows={3}
                      className="w-full px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--background-secondary)] dark:bg-gray-700 dark:text-gray-200 placeholder-[var(--text-secondary)] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={submitting}
                      icon={<AlertCircle size={16} />}
                    >
                      Enregistrer l'incident
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* Liste des incidents */}
      <div ref={incidentTableRef}>
        <SectionCard
          title={`Incidents signalés (${incidents.length})`}
          className="mb-8"
        >
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : incidents.length > 0 ? (
            <>
              {/* Version desktop (tableau) - visible uniquement sur md et plus */}
              <div className="hidden md:block p-4 overflow-x-auto">
                <Table
                  columns={[
                    {
                      key: "employee",
                      label: "Employé",
                      className: "w-40",
                      sortable: true,
                    },
                    {
                      key: "type",
                      label: "Type",
                      className: "w-28",
                      sortable: true,
                    },
                    {
                      key: "date",
                      label: "Date",
                      className: "w-32",
                      sortable: true,
                    },
                    {
                      key: "status",
                      label: "Statut",
                      className: "w-28",
                      sortable: true,
                    },
                    { key: "description", label: "Description" },
                    { key: "actions", label: "Actions", className: "w-32" },
                  ]}
                  data={getSortedIncidents().map((incident) => ({
                    employee: (
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={null}
                          alt={`${incident.employeeId.firstName} ${incident.employeeId.lastName}`}
                          size="sm"
                        />
                        <span className="font-medium dark:text-white">
                          {incident.employeeId.firstName}{" "}
                          {incident.employeeId.lastName}
                        </span>
                      </div>
                    ),
                    type: (
                      <Badge
                        type={getIncidentTypeBadgeType(incident.type)}
                        label={translateIncidentType(incident.type)}
                      />
                    ),
                    date: (
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] dark:text-gray-300">
                        <Calendar size={14} />
                        <span>{formatDate(incident.date)}</span>
                      </div>
                    ),
                    status: (
                      <Badge
                        type={getStatusBadgeType(incident.status)}
                        label={translateStatus(incident.status)}
                      />
                    ),
                    description: (
                      <div>
                        <div className="text-sm max-w-xs truncate dark:text-gray-300">
                          {incident.description || "—"}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] dark:text-gray-400 mt-1 flex items-center gap-1">
                          <User size={12} />
                          <span>
                            {incident.reportedBy.firstName}{" "}
                            {incident.reportedBy.lastName}
                          </span>
                        </div>
                      </div>
                    ),
                    employeeId: incident.employeeId,
                    actions: (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewIncidentDetails(incident)}
                          icon={<Eye size={16} />}
                        >
                          Détails
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(incident)}
                          icon={<Pencil size={16} />}
                        >
                          Éditer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteIncident(incident._id)}
                          icon={<Trash2 size={16} />}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Supprimer
                        </Button>
                      </div>
                    ),
                  }))}
                  emptyState={{
                    title: "Aucun incident",
                    description:
                      "Aucun incident n'a été signalé pour le moment",
                    icon: <Shield size={40} />,
                  }}
                />
              </div>

              {/* Version mobile/tablette (cards) - visible uniquement sur sm et moins */}
              <div className="block md:hidden p-4">
                <div className="space-y-4">
                  <AnimatePresence>
                    {getSortedIncidents().map((incident) =>
                      renderIncidentCard(incident)
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Shield size={48} className="text-[var(--text-tertiary)] mb-4" />
              <p className="text-lg text-[var(--text-primary)] dark:text-white mb-2">
                Aucun incident signalé
              </p>
              <p className="text-sm text-[var(--text-tertiary)] dark:text-gray-400">
                Utilisez le bouton "Signaler un incident" pour ajouter un
                nouveau signalement
              </p>
            </div>
          )}
        </SectionCard>
      </div>
    </PageWrapper>
  );

  return (
    <LayoutWithSidebar activeItem="incidents" pageTitle="Suivi des incidents">
      {renderContent()}
    </LayoutWithSidebar>
  );
};

export default IncidentTrackingPage;
