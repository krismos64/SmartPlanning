import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
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

// Types pour les composants d'UI réutilisables
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

// Statut de simulation du rôle utilisateur (à remplacer par un contexte ou autre mécanisme d'auth)
type UserRole = "employee" | "manager";

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

  // Fonction pour récupérer les demandes de congés
  const fetchVacationRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<{
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
      return;
    }

    // Vérification des dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end < start) {
      setError("La date de fin doit être après la date de début");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post("/api/vacations", formData);

      setSuccess("Demande de congés envoyée avec succès");

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
      await axios.put(`/api/vacations/${id}`, { status });

      setSuccess(
        `Demande de congés ${
          status === "approved" ? "approuvée" : "refusée"
        } avec succès`
      );

      // Rafraîchir les données
      fetchVacationRequests();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      setError("Erreur lors de la mise à jour du statut");
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour fermer les notifications
  const closeNotification = () => {
    setError(null);
    setSuccess(null);
  };

  // Fonction pour filtrer les demandes par statut
  const filterVacationRequests = (requests: VacationRequest[]) => {
    if (statusFilter === "all") {
      return requests;
    }
    return requests.filter((request) => request.status === statusFilter);
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // Obtenir la couleur en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Traduire le statut en français
  const translateStatus = (status: string) => {
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <Toast message={error} type="error" onClose={closeNotification} />
        )}
        {success && (
          <Toast message={success} type="success" onClose={closeNotification} />
        )}
      </AnimatePresence>

      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Gestion des Congés
        </h1>
        <p className="text-gray-600">
          {userRole === "manager"
            ? "Gérez les demandes de congés de votre équipe"
            : "Visualisez et demandez vos congés"}
        </p>
      </motion.div>

      {/* Actions principales */}
      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === "pending"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === "approved"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Approuvés
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === "rejected"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Refusés
          </button>
        </div>

        {/* Bouton de création (pour tous les utilisateurs) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {showForm ? "Annuler" : "Demander un congé"}
        </motion.button>
      </motion.div>

      {/* Formulaire de demande de congés */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Nouvelle demande de congé
              </h2>

              <form onSubmit={handleSubmitVacationRequest}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Date de début
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Date de fin
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min={
                        formData.startDate ||
                        new Date().toISOString().split("T")[0]
                      }
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="reason"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Motif
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Précisez la raison de votre demande de congé..."
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      "Envoyer la demande"
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des demandes de congés */}
      <motion.div
        className="bg-white rounded-lg shadow-md overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">
            Demandes de congés
            {statusFilter !== "all" && ` - ${translateStatus(statusFilter)}`}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Employé
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Période
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Statut
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Motif
                  </th>
                  {userRole === "manager" && (
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <motion.tr
                    key={request._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ backgroundColor: "#f9fafb" }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.employeeId.firstName}{" "}
                        {request.employeeId.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Du {formatDate(request.startDate)} au{" "}
                        {formatDate(request.endDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.ceil(
                          (new Date(request.endDate).getTime() -
                            new Date(request.startDate).getTime()) /
                            (1000 * 60 * 60 * 24) +
                            1
                        )}{" "}
                        jour(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {translateStatus(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate md:max-w-sm">
                        {request.reason}
                      </div>
                    </td>
                    {userRole === "manager" && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {request.status === "pending" ? (
                          <div className="flex justify-end space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                handleUpdateVacationStatus(
                                  request._id,
                                  "approved"
                                )
                              }
                              className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                              disabled={actionLoading === request._id}
                            >
                              {actionLoading === request._id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                "Approuver"
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                handleUpdateVacationStatus(
                                  request._id,
                                  "rejected"
                                )
                              }
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                              disabled={actionLoading === request._id}
                            >
                              {actionLoading === request._id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                "Refuser"
                              )}
                            </motion.button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">
                            {request.status === "approved"
                              ? "Approuvé"
                              : "Refusé"}{" "}
                            par{" "}
                            {request.updatedBy
                              ? `${request.updatedBy.firstName} ${request.updatedBy.lastName}`
                              : "le système"}
                          </span>
                        )}
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-12 text-gray-500">
            Aucune demande de congé {statusFilter !== "all" && statusFilter}{" "}
            trouvée.
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VacationsPage;
