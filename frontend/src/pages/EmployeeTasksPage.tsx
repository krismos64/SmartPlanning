import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { FormEvent, useCallback, useEffect, useState } from "react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Toast from "../components/ui/Toast";

// Types pour les tâches
interface Task {
  _id: string;
  title: string;
  dueDate?: string;
  status: "pending" | "inProgress" | "completed";
}

// Types pour le formulaire d'ajout
interface TaskFormData {
  title: string;
  dueDate: string;
}

// Types pour les composants d'UI réutilisables
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

// Fonction utilitaire pour formater les dates
const formatDate = (dateString?: string): string => {
  if (!dateString) return "Aucune date";

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
    case "inProgress":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Traduction des status en français
const translateStatus = (status: string): string => {
  switch (status) {
    case "pending":
      return "En attente";
    case "inProgress":
      return "En cours";
    case "completed":
      return "Terminée";
    default:
      return status;
  }
};

// Composant principal pour la page des tâches de l'employé
const EmployeeTasksPage: React.FC = () => {
  // États pour gérer les tâches et l'UI
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // État pour le formulaire d'ajout de tâche
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    dueDate: "",
  });

  // Fonction pour récupérer les tâches de l'employé connecté
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<{ success: boolean; data: Task[] }>(
        "/api/tasks/my-tasks"
      );

      // Tri des tâches par date d'échéance (les tâches sans date à la fin)
      const sortedTasks = response.data.data.sort((a, b) => {
        // Si aucune des tâches n'a de date, elles sont équivalentes
        if (!a.dueDate && !b.dueDate) return 0;

        // Les tâches sans date vont à la fin
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        // Sinon, tri par date (la plus proche en premier)
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setTasks(sortedTasks);
    } catch (error) {
      console.error("Erreur lors de la récupération des tâches:", error);
      setError("Impossible de récupérer vos tâches. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial des tâches
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Fonction pour marquer une tâche comme terminée
  const markAsCompleted = async (taskId: string) => {
    setUpdatingTaskId(taskId);
    setError(null);

    try {
      await axios.patch(`/api/tasks/${taskId}`, { status: "completed" });

      setSuccess("Tâche marquée comme terminée !");

      // Mettre à jour la liste
      fetchTasks();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      setError("Impossible de mettre à jour la tâche. Veuillez réessayer.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Gestionnaire pour mettre à jour le formulaire
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fonction pour ajouter une nouvelle tâche
  const addNewTask = async (e: FormEvent) => {
    e.preventDefault();

    // Validation basique
    if (!formData.title.trim()) {
      setError("Le titre de la tâche est requis");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Préparation des données à envoyer
      const taskData = {
        title: formData.title.trim(),
        // N'inclure dueDate que si elle est renseignée
        ...(formData.dueDate && { dueDate: formData.dueDate }),
      };

      await axios.post("/api/tasks", taskData);

      setSuccess("Tâche ajoutée avec succès !");

      // Réinitialiser le formulaire
      setFormData({
        title: "",
        dueDate: "",
      });

      // Masquer le formulaire
      setShowAddForm(false);

      // Rafraîchir la liste des tâches
      fetchTasks();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la tâche:", error);
      setError("Impossible d'ajouter la tâche. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour fermer les notifications
  const closeNotification = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mes Tâches</h1>
        <p className="text-gray-600">
          Gérez et suivez l'avancement de vos tâches
        </p>
      </div>

      {/* Bouton d'ajout de tâche */}
      <div className="mb-6 flex justify-between items-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {showAddForm ? "Annuler" : "Ajouter une tâche"}
        </motion.button>

        <div className="text-sm text-gray-500">
          {tasks.filter((task) => task.status !== "completed").length} tâche(s)
          en cours
        </div>
      </div>

      {/* Formulaire d'ajout de tâche */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Nouvelle tâche
              </h2>

              <form onSubmit={addNewTask}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Titre*
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="Titre de la tâche"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="dueDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Date d'échéance (optionnelle)
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    disabled={loading}
                  >
                    {loading ? <LoadingSpinner size="sm" /> : "Ajouter"}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des tâches */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">
            Liste de tâches
          </h2>
        </div>

        {loading && !updatingTaskId ? (
          <LoadingSpinner size="lg" />
        ) : tasks.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <motion.li
                key={task._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  task.status === "completed" ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div className="flex-1">
                  <h3
                    className={`text-lg font-medium ${
                      task.status === "completed"
                        ? "line-through text-gray-500"
                        : "text-gray-800"
                    }`}
                  >
                    {task.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2 items-center text-sm text-gray-500">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {translateStatus(task.status)}
                    </span>

                    {task.dueDate && (
                      <span
                        className={`${
                          new Date(task.dueDate) < new Date() &&
                          task.status !== "completed"
                            ? "text-red-600 font-semibold"
                            : ""
                        }`}
                      >
                        Échéance : {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>

                {task.status !== "completed" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-green-100 text-green-800 hover:bg-green-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    onClick={() => markAsCompleted(task._id)}
                    disabled={updatingTaskId === task._id}
                  >
                    {updatingTaskId === task._id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      "Marquer comme terminée"
                    )}
                  </motion.button>
                )}
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">Aucune tâche à afficher</p>
            <p className="text-sm">Commencez par ajouter une nouvelle tâche</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeTasksPage;
