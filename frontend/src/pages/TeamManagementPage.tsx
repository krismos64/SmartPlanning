import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { FormEvent, useCallback, useEffect, useState } from "react";
import LoadingSpinner from "../components/ui/LoadingSpinner";

// Types pour les équipes
interface Team {
  _id: string;
  name: string;
  description?: string;
  employeeIds: TeamEmployee[];
  managerIds: string[];
  companyId: string;
  createdAt: string;
}

// Types pour les employés dans une équipe
interface TeamEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  status: "actif" | "inactif";
  tasksCount: number; // Nombre de tâches en cours (pour la simulation)
}

// Types pour les employés disponibles (sans équipe)
interface AvailableEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  status: "actif" | "inactif";
}

// Types pour le formulaire d'ajout d'employé
interface AddEmployeeFormData {
  employeeId: string;
  teamId: string;
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

// Couleurs pour les badges de statut
const getStatusColor = (status: string): string => {
  switch (status) {
    case "actif":
      return "bg-green-100 text-green-800";
    case "inactif":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Composant principal pour la page de gestion des équipes
 * Accessible uniquement aux managers
 */
const TeamManagementPage: React.FC = () => {
  // États pour gérer les équipes et l'UI
  const [teams, setTeams] = useState<Team[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<
    AvailableEmployee[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // États pour gérer les formulaires d'ajout d'employé
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [addEmployeeFormData, setAddEmployeeFormData] =
    useState<AddEmployeeFormData>({
      employeeId: "",
      teamId: "",
    });

  // Fonction pour récupérer les équipes du manager
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<{ success: boolean; data: Team[] }>(
        "/api/teams/my-teams"
      );

      setTeams(response.data.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des équipes:", error);
      setError("Impossible de récupérer les équipes. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour récupérer les employés disponibles (sans équipe)
  const fetchAvailableEmployees = useCallback(async (teamId: string) => {
    setSubmitting(true);
    try {
      const response = await axios.get<{
        success: boolean;
        data: AvailableEmployee[];
      }>(`/api/employees?teamId=null`);
      setAvailableEmployees(response.data.data);

      // Définir l'employé par défaut si la liste n'est pas vide
      if (response.data.data.length > 0) {
        setAddEmployeeFormData((prev) => ({
          ...prev,
          employeeId: response.data.data[0]._id,
          teamId: teamId,
        }));
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des employés disponibles:",
        error
      );
      setError("Impossible de récupérer les employés disponibles.");
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Chargement initial des données
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Gestionnaire pour la mise à jour du formulaire d'ajout d'employé
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddEmployeeFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fonction pour ouvrir le formulaire d'ajout d'employé
  const openAddEmployeeForm = (teamId: string) => {
    setSelectedTeamId(teamId);
    setAddEmployeeFormData((prev) => ({
      ...prev,
      teamId: teamId,
    }));
    fetchAvailableEmployees(teamId);
  };

  // Fonction pour fermer le formulaire d'ajout d'employé
  const closeAddEmployeeForm = () => {
    setSelectedTeamId(null);
  };

  // Fonction pour ajouter un employé à une équipe
  const addEmployeeToTeam = async (e: FormEvent) => {
    e.preventDefault();

    // Validation du formulaire
    if (!addEmployeeFormData.employeeId || !addEmployeeFormData.teamId) {
      setError("Veuillez sélectionner un employé.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await axios.post(
        `/api/teams/${addEmployeeFormData.teamId}/add-employee`,
        { employeeId: addEmployeeFormData.employeeId }
      );

      setSuccess("Employé ajouté à l'équipe avec succès");

      // Fermer le formulaire et rafraîchir les équipes
      closeAddEmployeeForm();
      fetchTeams();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'employé:", error);
      setError(
        "Impossible d'ajouter l'employé à l'équipe. Veuillez réessayer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour supprimer un employé d'une équipe
  const removeEmployeeFromTeam = async (teamId: string, employeeId: string) => {
    setSubmitting(true);
    setError(null);

    try {
      await axios.delete(`/api/teams/${teamId}/remove-employee/${employeeId}`);

      setSuccess("Employé retiré de l'équipe avec succès");

      // Rafraîchir les équipes
      fetchTeams();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'employé:", error);
      setError(
        "Impossible de retirer l'employé de l'équipe. Veuillez réessayer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour fermer les notifications
  const closeNotification = () => {
    setError(null);
    setSuccess(null);
  };

  // Données de secours si l'API n'est pas disponible
  const fallbackAvailableEmployees: AvailableEmployee[] =
    availableEmployees.length > 0
      ? availableEmployees
      : [
          { _id: "1", firstName: "Jean", lastName: "Dupont", status: "actif" },
          { _id: "2", firstName: "Marie", lastName: "Martin", status: "actif" },
          { _id: "3", firstName: "Luc", lastName: "Dubois", status: "inactif" },
          {
            _id: "4",
            firstName: "Sophie",
            lastName: "Lefèvre",
            status: "actif",
          },
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
          Gestion des équipes
        </h1>
        <p className="text-gray-600">Gérez les membres de vos équipes</p>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : teams.length > 0 ? (
        <div className="space-y-8">
          {teams.map((team) => (
            <div
              key={team._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {/* En-tête de l'équipe */}
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {team.name}
                  </h2>
                  {team.description && (
                    <p className="text-gray-600 mt-1">{team.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {team.employeeIds.length} membre
                    {team.employeeIds.length > 1 ? "s" : ""}
                  </p>
                </div>

                {/* Bouton pour ajouter un membre */}
                <div className="mt-4 md:mt-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openAddEmployeeForm(team._id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Ajouter un membre
                  </motion.button>
                </div>
              </div>

              {/* Formulaire d'ajout d'employé */}
              <AnimatePresence>
                {selectedTeamId === team._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-gray-50 p-6 border-b border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          Ajouter un nouveau membre
                        </h3>
                        <button
                          onClick={closeAddEmployeeForm}
                          className="text-gray-400 hover:text-gray-500 focus:outline-none"
                          aria-label="Fermer"
                        >
                          <svg
                            className="w-5 h-5"
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
                      </div>

                      <form
                        onSubmit={addEmployeeToTeam}
                        className="flex flex-col md:flex-row md:items-end gap-4"
                      >
                        <div className="flex-grow">
                          <label
                            htmlFor="employeeId"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Sélectionner un employé*
                          </label>
                          <select
                            id="employeeId"
                            name="employeeId"
                            value={addEmployeeFormData.employeeId}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={
                              submitting ||
                              fallbackAvailableEmployees.length === 0
                            }
                          >
                            {fallbackAvailableEmployees.length > 0 ? (
                              fallbackAvailableEmployees.map((employee) => (
                                <option key={employee._id} value={employee._id}>
                                  {employee.firstName} {employee.lastName} (
                                  {employee.status})
                                </option>
                              ))
                            ) : (
                              <option value="">Aucun employé disponible</option>
                            )}
                          </select>
                        </div>

                        <div>
                          <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            disabled={
                              submitting ||
                              fallbackAvailableEmployees.length === 0
                            }
                          >
                            {submitting ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              "Ajouter"
                            )}
                          </motion.button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Liste des membres de l'équipe */}
              <div className="overflow-x-auto">
                {team.employeeIds.length > 0 ? (
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
                          Statut
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tâches en cours
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {team.employeeIds.map((employee) => (
                        <motion.tr
                          key={employee._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          whileHover={{ backgroundColor: "#f9fafb" }}
                        >
                          {/* Employé */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                          </td>

                          {/* Statut */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                employee.status
                              )}`}
                            >
                              {employee.status === "actif"
                                ? "Actif"
                                : "Inactif"}
                            </span>
                          </td>

                          {/* Tâches en cours */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.tasksCount}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                removeEmployeeFromTeam(team._id, employee._id)
                              }
                              className="text-red-600 hover:text-red-800 font-medium focus:outline-none"
                              disabled={submitting}
                            >
                              Retirer
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-2">Aucun membre dans cette équipe</p>
                    <p className="text-sm">
                      Cliquez sur "Ajouter un membre" pour commencer
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-lg text-gray-500 mb-2">
            Vous ne gérez actuellement aucune équipe
          </p>
          <p className="text-sm text-gray-400">
            Contactez un administrateur pour créer une équipe
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamManagementPage;
