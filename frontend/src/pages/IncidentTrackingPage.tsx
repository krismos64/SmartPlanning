import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { FormEvent, useCallback, useEffect, useState } from "react";
import LoadingSpinner from "../components/ui/LoadingSpinner";

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

// Types pour les composants d'UI réutilisables
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

// Composant Toast pour les notifications
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  // Fermeture automatique après 3 secondes
  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [onClose]);

  const baseClasses =
    "fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-md";
  const typeClasses =
    type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white";

  return (
    <motion.div
      className={`${baseClasses} ${typeClasses}`}
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-100 focus:outline-none"
        aria-label="Fermer"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </motion.div>
  );
};

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

// Couleurs par statut pour les badges
const getStatusColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    case "dismissed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
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

// Couleurs par type d'incident pour les badges
const getIncidentTypeColor = (type: string): string => {
  switch (type) {
    case "retard":
      return "bg-orange-100 text-orange-800";
    case "absence":
      return "bg-red-100 text-red-800";
    case "oubli badge":
      return "bg-blue-100 text-blue-800";
    case "litige":
      return "bg-purple-100 text-purple-800";
    case "autre":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
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
  const [showForm, setShowForm] = useState<boolean>(true);

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
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
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

      // Réinitialiser le formulaire tout en conservant la date du jour
      setFormData({
        employeeId: employees.length > 0 ? employees[0]._id : "",
        type: "retard",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });

      // Rafraîchir la liste des incidents
      fetchIncidents();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'incident:", error);
      setError("Impossible d'ajouter l'incident. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour fermer les notifications
  const closeNotification = () => {
    setError(null);
    setSuccess(null);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Suivi des incidents
        </h1>
        <p className="text-gray-600">Gérez les incidents RH de votre équipe</p>
      </div>

      {/* Toggle pour afficher/masquer le formulaire */}
      <div className="mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {showForm ? "Masquer le formulaire" : "Signaler un incident"}
        </motion.button>
      </div>

      {/* Formulaire d'ajout d'incident */}
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
                Signaler un nouvel incident
              </h2>

              <form onSubmit={addIncident}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Employé concerné */}
                  <div>
                    <label
                      htmlFor="employeeId"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Employé concerné*
                    </label>
                    <select
                      id="employeeId"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {fallbackEmployees.map((employee) => (
                        <option key={employee._id} value={employee._id}>
                          {employee.firstName} {employee.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type d'incident */}
                  <div>
                    <label
                      htmlFor="type"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Type d'incident*
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="retard">Retard</option>
                      <option value="absence">Absence</option>
                      <option value="oubli badge">Oubli de badge</option>
                      <option value="litige">Litige</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  {/* Date de l'incident */}
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Date de l'incident*
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Description (optionnelle) */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description (optionnelle)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Détails supplémentaires concernant l'incident..."
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      "Enregistrer l'incident"
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des incidents */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">
            Incidents signalés ({incidents.length})
          </h2>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : incidents.length > 0 ? (
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
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
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
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incidents.map((incident) => (
                  <motion.tr
                    key={incident._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ backgroundColor: "#f9fafb" }}
                  >
                    {/* Employé */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {incident.employeeId.firstName}{" "}
                        {incident.employeeId.lastName}
                      </div>
                    </td>

                    {/* Type d'incident */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getIncidentTypeColor(
                          incident.type
                        )}`}
                      >
                        {translateIncidentType(incident.type)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(incident.date)}
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          incident.status
                        )}`}
                      >
                        {translateStatus(incident.status)}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs md:max-w-sm truncate">
                        {incident.description || "—"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Signalé par: {incident.reportedBy.firstName}{" "}
                        {incident.reportedBy.lastName}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">Aucun incident signalé</p>
            <p className="text-sm">
              Utilisez le formulaire ci-dessus pour signaler un incident
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentTrackingPage;
