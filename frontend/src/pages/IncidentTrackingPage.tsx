/**
 * IncidentTrackingPage - Page de suivi des incidents
 *
 * Permet aux managers de visualiser et gérer les incidents signalés pour leur équipe.
 * Intègre les composants du design system SmartPlanning pour une expérience cohérente.
 */
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Eye, Plus } from "lucide-react";
import React, { FormEvent, useCallback, useEffect, useState } from "react";

// Composants de layout
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
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

// Fonction utilitaire pour formater les dates
const formatDate = (dateString?: string): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

// Traduction des statuts en français
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

// Obtenir la variante de badge pour un statut
const getStatusVariant = (status: string): string => {
  switch (status) {
    case "pending":
      return "warning";
    case "resolved":
      return "success";
    case "dismissed":
      return "neutral";
    default:
      return "neutral";
  }
};

// Traduction des types d'incidents en français
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

// Obtenir la variante de badge pour un type d'incident
const getIncidentTypeVariant = (type: string): string => {
  switch (type) {
    case "retard":
      return "warning";
    case "absence":
      return "danger";
    case "oubli badge":
      return "info";
    case "litige":
      return "secondary";
    case "autre":
      return "neutral";
    default:
      return "neutral";
  }
};

/**
 * Composant principal pour la page de suivi des incidents
 * Accessible uniquement aux managers
 */
const IncidentTrackingPage: React.FC = () => {
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

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Incidents" },
  ];

  // État pour le formulaire d'ajout d'incident
  const [formData, setFormData] = useState<IncidentFormData>({
    employeeId: "",
    type: "retard",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Fonction pour récupérer les incidents de l'équipe
  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<{ success: boolean; data: Incident[] }>(
        "/api/incidents/team"
      );

      // Tri des incidents par date (les plus récents en premier)
      const sortedIncidents = [...response.data.data].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setIncidents(sortedIncidents);
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
      const response = await axios.get<{ success: boolean; data: Employee[] }>(
        "/api/employees"
      );
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
      // Ne pas interrompre l'expérience utilisateur pour cette erreur
      // Nous utiliserons une liste fictive si nécessaire
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
      await axios.post("/api/incidents", {
        employeeId: formData.employeeId,
        type: formData.type,
        description: formData.description.trim() || undefined,
        date: formData.date,
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

  return (
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

      {/* Modal de détails d'incident */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Détails de l'incident"
      >
        {selectedIncident && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  Employé concerné
                </h3>
                <div className="mt-2 flex items-center">
                  <Avatar
                    name={`${selectedIncident.employeeId.firstName} ${selectedIncident.employeeId.lastName}`}
                    size="sm"
                    className="mr-2"
                  />
                  <p className="text-[var(--text-primary)]">
                    {selectedIncident.employeeId.firstName}{" "}
                    {selectedIncident.employeeId.lastName}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  Type d'incident
                </h3>
                <div className="mt-2">
                  <Badge
                    variant={getIncidentTypeVariant(selectedIncident.type)}
                    label={translateIncidentType(selectedIncident.type)}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  Date de l'incident
                </h3>
                <p className="mt-2 text-[var(--text-primary)]">
                  {formatDate(selectedIncident.date)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  Statut
                </h3>
                <div className="mt-2">
                  <Badge
                    variant={getStatusVariant(selectedIncident.status)}
                    label={translateStatus(selectedIncident.status)}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  Description
                </h3>
                <p className="mt-2 text-[var(--text-primary)] whitespace-pre-wrap">
                  {selectedIncident.description || "Aucune description"}
                </p>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  Signalé par
                </h3>
                <div className="mt-2 flex items-center">
                  <Avatar
                    name={`${selectedIncident.reportedBy.firstName} ${selectedIncident.reportedBy.lastName}`}
                    size="sm"
                    className="mr-2"
                  />
                  <p className="text-[var(--text-primary)]">
                    {selectedIncident.reportedBy.firstName}{" "}
                    {selectedIncident.reportedBy.lastName}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => setShowDetailsModal(false)}
              >
                Fermer
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
        subtitle="Consultez et traitez les incidents déclarés"
        icon={<AlertTriangle size={24} />}
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
              <div className="p-6 border-t border-[var(--border)]">
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
                      required
                    />

                    {/* Type d'incident */}
                    <Select
                      label="Type d'incident"
                      options={incidentTypeOptions}
                      value={formData.type}
                      onChange={(value) => handleInputChange("type", value)}
                      placeholder="Sélectionner un type"
                      required
                    />

                    {/* Date de l'incident */}
                    <DatePicker
                      label="Date de l'incident"
                      selectedDate={
                        formData.date ? new Date(formData.date) : null
                      }
                      onChange={(date) => {
                        if (date) {
                          handleInputChange(
                            "date",
                            date.toISOString().split("T")[0]
                          );
                        }
                      }}
                      required
                    />
                  </div>

                  {/* Description (optionnelle) */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--text-primary)]">
                      Description (optionnelle)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="Détails supplémentaires concernant l'incident..."
                      rows={3}
                      className="w-full px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--background-secondary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
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
      <SectionCard
        title={`Incidents signalés (${incidents.length})`}
        className="mb-8"
      >
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : incidents.length > 0 ? (
          <div className="p-4 overflow-x-auto">
            <Table
              columns={[
                { key: "employee", label: "Employé", className: "w-40" },
                { key: "type", label: "Type", className: "w-28" },
                { key: "date", label: "Date", className: "w-32" },
                { key: "status", label: "Statut", className: "w-28" },
                { key: "description", label: "Description" },
                { key: "actions", label: "Actions", className: "w-24" },
              ]}
              data={incidents.map((incident) => ({
                employee: (
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={`${incident.employeeId.firstName} ${incident.employeeId.lastName}`}
                      size="sm"
                    />
                    <span className="font-medium">
                      {incident.employeeId.firstName}{" "}
                      {incident.employeeId.lastName}
                    </span>
                  </div>
                ),
                type: (
                  <Badge
                    variant={getIncidentTypeVariant(incident.type)}
                    label={translateIncidentType(incident.type)}
                  />
                ),
                date: (
                  <div className="text-[var(--text-secondary)]">
                    {formatDate(incident.date)}
                  </div>
                ),
                status: (
                  <Badge
                    variant={getStatusVariant(incident.status)}
                    label={translateStatus(incident.status)}
                  />
                ),
                description: (
                  <div>
                    <div className="text-sm max-w-xs truncate">
                      {incident.description || "—"}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-1">
                      Par: {incident.reportedBy.firstName}{" "}
                      {incident.reportedBy.lastName}
                    </div>
                  </div>
                ),
                actions: (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewIncidentDetails(incident)}
                    icon={<Eye size={16} />}
                  >
                    Détails
                  </Button>
                ),
              }))}
              emptyState={{
                title: "Aucun incident",
                description: "Aucun incident n'a été signalé",
                icon: <AlertTriangle size={40} />,
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle
              size={48}
              className="text-[var(--text-tertiary)] mb-4"
            />
            <p className="text-lg text-[var(--text-primary)] mb-2">
              Aucun incident signalé
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">
              Utilisez le bouton "Signaler un incident" pour ajouter un nouveau
              signalement
            </p>
          </div>
        )}
      </SectionCard>
    </PageWrapper>
  );
};

export default IncidentTrackingPage;
