/**
 * VacationsPage - Page de gestion des congés
 *
 * Permet aux employés de demander des congés et aux managers de les gérer.
 * Intègre les composants du design system SmartPlanning pour une expérience cohérente.
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

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
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Types pour les demandes de congés
interface VacationRequest {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
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
}

// Types pour le formulaire de création
interface VacationFormData {
  startDate: string;
  endDate: string;
  reason: string;
}

// Statut de simulation du rôle utilisateur (à remplacer par un contexte ou autre mécanisme d'auth)
type UserRole = "employee" | "manager";

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
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

// Composant principal VacationsPage
const VacationsPage: React.FC = () => {
  // Simulation du rôle utilisateur (à remplacer par une authentification réelle)
  const [userRole] = useState<UserRole>("manager");

  // État pour les demandes de congés
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>(
    []
  );

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
  });

  // État pour l'affichage du formulaire
  const [showForm, setShowForm] = useState<boolean>(false);

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/tableau-de-bord" },
    { label: "Congés" },
  ];

  // Fonction pour récupérer les demandes de congés
  const fetchVacationRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: VacationRequest[];
      }>("/api/vacations");

      setVacationRequests(response.data.data);
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

  // Charger les données au montage du composant
  useEffect(() => {
    fetchVacationRequests();
  }, [fetchVacationRequests]);

  // Gestionnaire de changement pour le formulaire
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Fonction pour soumettre une nouvelle demande de congés
  const handleSubmitVacationRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation du formulaire
    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      setError("Veuillez remplir tous les champs");
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
      await axiosInstance.post("/api/vacations", formData);

      setSuccess("Demande de congés envoyée avec succès");
      setShowSuccessToast(true);

      // Réinitialiser le formulaire
      setFormData({
        startDate: "",
        endDate: "",
        reason: "",
      });

      // Masquer le formulaire
      setShowForm(false);

      // Rafraîchir les données
      fetchVacationRequests();
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande de congés:", error);
      setError("Erreur lors de l'envoi de la demande de congés");
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
      await axiosInstance.put(`/api/vacations/${id}`, { status });

      setSuccess(
        `Demande de congés ${
          status === "approved" ? "approuvée" : "refusée"
        } avec succès`
      );
      setShowSuccessToast(true);

      // Rafraîchir les données
      fetchVacationRequests();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      setError("Erreur lors de la mise à jour du statut");
      setShowErrorToast(true);
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour fermer les notifications
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  // Fonction pour filtrer les demandes par statut
  const filterVacationRequests = (requests: VacationRequest[]) => {
    if (statusFilter === "all") {
      return requests;
    }
    return requests.filter((request) => request.status === statusFilter);
  };

  // Filtrer et trier les demandes
  const filteredRequests = filterVacationRequests(vacationRequests).sort(
    (a, b) => {
      // Trier par statut (en attente en premier)
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;

      // Puis par date de création (la plus récente en premier)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  );

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

      {/* En-tête avec fil d'ariane */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Titre de la page */}
      <SectionTitle
        title="Gestion des Congés"
        subtitle={
          userRole === "manager"
            ? "Gérez les demandes de congés de votre équipe"
            : "Visualisez et demandez vos congés"
        }
        icon={<CalendarCheck size={24} />}
        className="mb-8"
      />

      {/* Filtres et actions */}
      <SectionCard
        title="Filtres"
        className="mb-8"
        actions={
          <Button
            variant="primary"
            onClick={() => setShowForm(!showForm)}
            icon={showForm ? undefined : <Plus size={16} />}
          >
            {showForm ? "Annuler" : "Demander un congé"}
          </Button>
        }
      >
        <div className="flex flex-wrap gap-3 p-4">
          <Button
            variant={statusFilter === "all" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            Tous
          </Button>
          <Button
            variant={statusFilter === "pending" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
            icon={<Clock size={14} />}
          >
            En attente
          </Button>
          <Button
            variant={statusFilter === "approved" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setStatusFilter("approved")}
            icon={<CheckCircle2 size={14} />}
          >
            Approuvés
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setStatusFilter("rejected")}
            icon={<XCircle size={14} />}
          >
            Refusés
          </Button>
        </div>
      </SectionCard>

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
            <SectionCard title="Nouvelle demande de congé">
              <form onSubmit={handleSubmitVacationRequest} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <DatePicker
                      label="Date de début"
                      selectedDate={formData.startDate || null}
                      onChange={(date) => {
                        if (date) {
                          setFormData((prev) => ({
                            ...prev,
                            startDate: date.toISOString().split("T")[0],
                          }));
                        }
                      }}
                      minDate={new Date()}
                      required
                    />
                  </div>
                  <div>
                    <DatePicker
                      label="Date de fin"
                      selectedDate={formData.endDate || null}
                      onChange={(date) => {
                        if (date) {
                          setFormData((prev) => ({
                            ...prev,
                            endDate: date.toISOString().split("T")[0],
                          }));
                        }
                      }}
                      minDate={
                        formData.startDate
                          ? new Date(formData.startDate)
                          : new Date()
                      }
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="reason"
                    className="block text-sm font-medium text-[var(--text-primary)] mb-1"
                  >
                    Motif
                    <span className="text-[var(--error)] ml-1">*</span>
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-md border border-[var(--border)] transition bg-[var(--background-secondary)]
                      focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] placeholder-[var(--text-secondary)]"
                    placeholder="Précisez la raison de votre demande de congé..."
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                    icon={<Calendar size={16} />}
                  >
                    Envoyer la demande
                  </Button>
                </div>
              </form>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des demandes de congés */}
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
        ) : (
          <div className="overflow-x-auto">
            <Table
              columns={[
                { key: "employee", label: "Employé", className: "w-48" },
                { key: "period", label: "Période", className: "w-56" },
                { key: "status", label: "Statut", className: "w-32" },
                { key: "reason", label: "Motif" },
                ...(userRole === "manager"
                  ? [{ key: "actions", label: "Actions", className: "w-48" }]
                  : []),
              ]}
              data={filteredRequests.map((request) => ({
                employee: (
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={`${request.employeeId.firstName} ${request.employeeId.lastName}`}
                      size="sm"
                    />
                    <span className="text-[var(--text-primary)] font-medium">
                      {request.employeeId.firstName}{" "}
                      {request.employeeId.lastName}
                    </span>
                  </div>
                ),
                period: (
                  <div>
                    <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
                      <CalendarDays size={14} />
                      <span>
                        {formatDate(request.startDate)} -{" "}
                        {formatDate(request.endDate)}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {calculateDuration(request.startDate, request.endDate)}{" "}
                      jour(s)
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
                  <div className="max-w-xs text-[var(--text-primary)]">
                    {request.reason}
                  </div>
                ),
                ...(userRole === "manager"
                  ? {
                      actions:
                        request.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() =>
                                handleUpdateVacationStatus(
                                  request._id,
                                  "approved"
                                )
                              }
                              isLoading={actionLoading === request._id}
                              icon={<CheckCircle2 size={14} />}
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
                          </div>
                        ) : (
                          <div className="text-[var(--text-tertiary)] text-xs text-right">
                            {request.status === "approved"
                              ? "Approuvé"
                              : "Refusé"}{" "}
                            par{" "}
                            <span className="font-medium">
                              {request.updatedBy
                                ? `${request.updatedBy.firstName} ${request.updatedBy.lastName}`
                                : "le système"}
                            </span>
                          </div>
                        ),
                    }
                  : {}),
              }))}
              emptyState={{
                title: "Aucune demande de congé",
                description: `Aucune demande ${
                  statusFilter !== "all" ? translateStatus(statusFilter) : ""
                } trouvée.`,
                icon: <CalendarCheck size={40} />,
              }}
            />
          </div>
        )}
      </SectionCard>
    </PageWrapper>
  );
};

export default VacationsPage;
