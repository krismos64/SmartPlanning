/**
 * EmployeeTasksPage - Page de gestion des tâches employé
 *
 * Permet aux employés de visualiser et gérer leurs tâches assignées.
 * Intègre la structure de layout global de l'application (LayoutWithSidebar)
 * avec header, footer, et sidebar pour une navigation cohérente.
 * Conserve la logique métier de gestion des tâches via l'API.
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  ClipboardList,
  Edit,
  FileDown,
  Plus,
  Trash2,
} from "lucide-react";
import React, { FormEvent, useCallback, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

// Composant de layout global
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";

// Composants de layout
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import DatePicker from "../components/ui/DatePicker";
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import SelectField from "../components/ui/SelectField";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Service d'export PDF
import { generateEmployeeTasksPdf } from "../services/generateEmployeeTasksPdf";

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
  dueDate: Date | null;
  status: "pending" | "inProgress" | "completed";
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

// Obtenir la variante de badge pour un statut
const getStatusVariant = (status: string): string => {
  switch (status) {
    case "pending":
      return "warning";
    case "inProgress":
      return "info";
    case "completed":
      return "success";
    default:
      return "neutral";
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

// Vérifier si une date est dépassée
const isOverdue = (dateString?: string): boolean => {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
};

// Composant principal pour la page des tâches de l'employé
const EmployeeTasksPage: React.FC = () => {
  // États pour gérer les tâches et l'UI
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // Récupération des informations de l'utilisateur connecté
  const { user } = useAuth();

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/tableau-de-bord" },
    { label: "Tâches" },
  ];

  // État pour le formulaire d'ajout de tâche
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    dueDate: null,
    status: "pending",
  });

  // État pour le formulaire d'édition
  const [editFormData, setEditFormData] = useState<TaskFormData>({
    title: "",
    dueDate: null,
    status: "pending",
  });

  // Scroll to top au chargement de la page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fonction pour récupérer les tâches de l'employé connecté
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: Task[];
      }>("/tasks/my-tasks");

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
      setShowErrorToast(true);
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
      await axiosInstance.patch(`/tasks/${taskId}`, {
        status: "completed",
      });

      setSuccess("Tâche marquée comme terminée !");
      setShowSuccessToast(true);

      // Mettre à jour la liste
      fetchTasks();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      setError("Impossible de mettre à jour la tâche. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Fonction pour supprimer une tâche
  const deleteTask = async (taskId: string) => {
    setUpdatingTaskId(taskId);
    setError(null);

    try {
      await axiosInstance.delete(`/tasks/${taskId}`);

      setSuccess("Tâche supprimée avec succès !");
      setShowSuccessToast(true);
      setShowEditModal(false);
      setEditingTask(null);

      // Mettre à jour la liste
      fetchTasks();
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche:", error);
      setError("Impossible de supprimer la tâche. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Fonction pour mettre à jour une tâche existante
  const updateTask = async (e: FormEvent) => {
    e.preventDefault();

    if (!editingTask) return;

    setUpdatingTaskId(editingTask._id);
    setError(null);

    try {
      // Préparation des données à envoyer
      const taskData = {
        title: editFormData.title.trim(),
        status: editFormData.status,
        ...(editFormData.dueDate && {
          dueDate: editFormData.dueDate.toISOString(),
        }),
      };

      await axiosInstance.patch(`/tasks/${editingTask._id}`, taskData);

      setSuccess("Tâche mise à jour avec succès !");
      setShowSuccessToast(true);
      setShowEditModal(false);
      setEditingTask(null);

      // Rafraîchir la liste des tâches
      fetchTasks();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      setError("Impossible de mettre à jour la tâche. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Gestionnaire pour mettre à jour le formulaire
  const handleInputChange = (name: string, value: string | Date | null) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gestionnaire pour mettre à jour le formulaire d'édition
  const handleEditInputChange = (name: string, value: string | Date | null) => {
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      status: task.status,
    });
    setShowEditModal(true);
  };

  // Fonction pour ajouter une nouvelle tâche
  const addNewTask = async (e: FormEvent) => {
    e.preventDefault();

    // Validation basique
    if (!formData.title.trim()) {
      setError("Le titre de la tâche est requis");
      setShowErrorToast(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Préparation des données à envoyer
      const taskData = {
        title: formData.title.trim(),
        status: formData.status,
        // N'inclure dueDate que si elle est renseignée
        ...(formData.dueDate && { dueDate: formData.dueDate.toISOString() }),
      };

      await axiosInstance.post("/tasks", taskData);

      setSuccess("Tâche ajoutée avec succès !");
      setShowSuccessToast(true);

      // Réinitialiser le formulaire
      setFormData({
        title: "",
        dueDate: null,
        status: "pending",
      });

      // Masquer le formulaire
      setShowAddForm(false);

      // Rafraîchir la liste des tâches
      fetchTasks();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la tâche:", error);
      setError("Impossible d'ajouter la tâche. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour fermer les notifications
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  // Fonction pour rendre une carte de tâche (version mobile)
  // Ajout d'une fonction pour le rendu mobile des tâches
  const renderTaskCard = (task: Task) => {
    return (
      <div
        key={task._id}
        className="p-4 mb-4 border border-[var(--border)] dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800"
      >
        <div className="flex flex-col space-y-3">
          {/* Titre de la tâche */}
          <div
            className={
              task.status === "completed"
                ? "line-through text-[var(--text-tertiary)]"
                : "text-[var(--text-primary)] dark:text-white font-medium"
            }
          >
            {task.title}
          </div>

          {/* Date d'échéance */}
          <div
            className={
              isOverdue(task.dueDate) && task.status !== "completed"
                ? "text-[var(--error)] dark:text-red-400"
                : "text-[var(--text-secondary)] dark:text-gray-300"
            }
          >
            {task.dueDate ? (
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {formatDate(task.dueDate)}
              </div>
            ) : (
              "Aucune échéance"
            )}
          </div>

          {/* Statut */}
          <div className="py-1">
            <Badge
              type={
                getStatusVariant(task.status) as
                  | "success"
                  | "error"
                  | "info"
                  | "warning"
              }
              label={translateStatus(task.status)}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {task.status !== "completed" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => markAsCompleted(task._id)}
                isLoading={updatingTaskId === task._id}
                icon={<Check size={16} />}
                className="flex-1"
              >
                Terminer
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditModal(task)}
              icon={<Edit size={16} />}
              className="flex-1 dark:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-600"
            >
              Modifier
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <LayoutWithSidebar
      activeItem="tasks"
      pageTitle="Mes Tâches | SmartPlanning"
      showHeader={true}
    >
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

      {/* Contenu centré avec PageWrapper */}
      <PageWrapper>
        {/* En-tête avec fil d'ariane */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Titre de la page */}
        <SectionTitle
          title="Mes Tâches"
          subtitle="Gérez et suivez l'avancement de vos tâches"
          icon={<ClipboardList size={24} />}
          className="mb-8"
        />

        {/* Bouton d'ajout de tâche */}
        <div className="flex justify-end mb-4">
          <Button
            variant={showAddForm ? "ghost" : "primary"}
            onClick={() => setShowAddForm(!showAddForm)}
            icon={showAddForm ? undefined : <Plus size={16} />}
          >
            {showAddForm ? "Annuler" : "Ajouter une tâche"}
          </Button>
        </div>

        {/* Formulaire d'ajout de tâche */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 overflow-hidden"
            >
              <SectionCard title="Nouvelle tâche" className="mb-4">
                <div className="p-6 border-t border-[var(--border)]">
                  <form onSubmit={addNewTask} className="space-y-6">
                    <div className="flex flex-col space-y-5">
                      {/* Titre de la tâche */}
                      <div>
                        <h3 className="text-md font-medium text-[var(--text-primary)] mb-2 dark:text-gray-200">
                          Titre de la tâche
                        </h3>
                        <InputField
                          name="title"
                          value={formData.title}
                          onChange={(e) =>
                            handleInputChange("title", e.target.value)
                          }
                          placeholder="Entrez le titre de la tâche"
                          required
                        />
                      </div>

                      {/* Date d'échéance */}
                      <div>
                        <h3 className="text-md font-medium text-[var(--text-primary)] mb-2 dark:text-gray-200">
                          Date d'échéance (optionnelle)
                        </h3>
                        <div className="relative dark:bg-gray-800 rounded-lg border border-[var(--border)] dark:border-gray-700">
                          <DatePicker
                            selectedDate={formData.dueDate}
                            onChange={(date) =>
                              handleInputChange("dueDate", date)
                            }
                            minDate={new Date()}
                            className="w-full dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Sélection du statut */}
                      <div>
                        <h3 className="text-md font-medium text-[var(--text-primary)] mb-2 dark:text-gray-200">
                          Statut
                        </h3>
                        <SelectField
                          label="Statut"
                          name="status"
                          value={formData.status}
                          onChange={(e) =>
                            handleInputChange("status", e.target.value)
                          }
                          options={[
                            { value: "pending", label: "En attente" },
                            { value: "inProgress", label: "En cours" },
                            { value: "completed", label: "Terminée" },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={loading}
                        icon={<Check size={16} />}
                        className="w-full sm:w-auto"
                      >
                        Ajouter la tâche
                      </Button>
                    </div>
                  </form>
                </div>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste des tâches */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <SectionCard title="Liste de tâches" className="mb-8">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-sm text-[var(--text-secondary)] dark:text-white">
                {tasks.filter((task) => task.status !== "completed").length}{" "}
                tâche(s) en cours
              </div>

              {/* Bouton d'export PDF - visible uniquement pour les rôles manager, directeur et admin */}
              {user &&
                ["manager", "directeur", "admin"].includes(user.role) &&
                tasks.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      generateEmployeeTasksPdf(
                        tasks.map((task) => ({
                          title: task.title,
                          dueDate: task.dueDate || "",
                          status: task.status,
                        })),
                        user ? `${user.firstName} ${user.lastName}` : undefined
                      )
                    }
                    icon={<FileDown size={14} />}
                  >
                    Exporter PDF
                  </Button>
                )}
            </div>

            {loading && !updatingTaskId ? (
              <div className="flex justify-center items-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : tasks.length > 0 ? (
              <>
                {/* Version Desktop - Table avec scroll horizontal */}
                <div className="p-4 overflow-x-auto hidden md:block">
                  {/* // Masquer sur mobile, afficher sur desktop */}
                  <Table
                    columns={[
                      { key: "title", label: "Titre" },
                      { key: "dueDate", label: "Échéance", className: "w-40" },
                      { key: "status", label: "Statut", className: "w-32" },
                      { key: "actions", label: "Actions", className: "w-56" },
                    ]}
                    data={tasks.map((task) => ({
                      title: (
                        <div
                          className={
                            task.status === "completed"
                              ? "line-through text-[var(--text-tertiary)]"
                              : "text-[var(--text-primary)] dark:text-white" // Ajustement mode dark
                          }
                        >
                          {task.title}
                        </div>
                      ),
                      dueDate: (
                        <div
                          className={
                            isOverdue(task.dueDate) &&
                            task.status !== "completed"
                              ? "text-[var(--error)]"
                              : "text-[var(--text-secondary)] dark:text-gray-100" // Ajustement mode dark
                          }
                        >
                          {task.dueDate ? (
                            <div className="flex items-center gap-2">
                              <Calendar size={16} />
                              {formatDate(task.dueDate)}
                            </div>
                          ) : (
                            "Aucune échéance"
                          )}
                        </div>
                      ),
                      status: (
                        <Badge
                          type={
                            getStatusVariant(task.status) as
                              | "success"
                              | "error"
                              | "info"
                              | "warning"
                          }
                          label={translateStatus(task.status)}
                        />
                      ),
                      actions: (
                        <div className="flex space-x-2">
                          {task.status !== "completed" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => markAsCompleted(task._id)}
                              isLoading={updatingTaskId === task._id}
                              icon={<Check size={16} />}
                            >
                              Terminer
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(task)}
                            icon={<Edit size={16} />}
                            className="dark:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-600"
                          >
                            Modifier
                          </Button>
                        </div>
                      ),
                    }))}
                    emptyState={{
                      title: "Aucune tâche",
                      description: "Commencez par ajouter une nouvelle tâche",
                      icon: <ClipboardList size={40} />,
                    }}
                  />
                </div>

                {/* Version Mobile - Cards verticales */}
                <div className="px-4 pb-4 block md:hidden">
                  {/* // Afficher sur mobile, masquer sur desktop */}
                  <div className="grid grid-cols-1 gap-4">
                    {tasks.map((task) => renderTaskCard(task))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ClipboardList
                  size={48}
                  className="text-[var(--text-tertiary)] mb-4"
                />
                <p className="text-lg text-[var(--text-primary)] mb-2">
                  Aucune tâche à afficher
                </p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Commencez par ajouter une nouvelle tâche
                </p>
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Modale d'édition de tâche */}
        {showEditModal && editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full"
            >
              <div className="p-6 border-b border-[var(--border)] dark:border-gray-700">
                <h3 className="text-lg font-medium text-[var(--text-primary)] dark:text-white">
                  Modifier la tâche
                </h3>
              </div>
              <div className="p-6">
                <form onSubmit={updateTask} className="space-y-6">
                  <div className="flex flex-col space-y-5">
                    {/* Titre de la tâche */}
                    <div>
                      <h3 className="text-md font-medium text-[var(--text-primary)] mb-2 dark:text-gray-200">
                        Titre de la tâche
                      </h3>
                      <InputField
                        name="title"
                        value={editFormData.title}
                        onChange={(e) =>
                          handleEditInputChange("title", e.target.value)
                        }
                        placeholder="Entrez le titre de la tâche"
                        required
                      />
                    </div>

                    {/* Date d'échéance */}
                    <div>
                      <h3 className="text-md font-medium text-[var(--text-primary)] mb-2 dark:text-gray-200">
                        Date d'échéance (optionnelle)
                      </h3>
                      <div className="relative dark:bg-gray-800 rounded-lg border border-[var(--border)] dark:border-gray-700">
                        <DatePicker
                          selectedDate={editFormData.dueDate}
                          onChange={(date) =>
                            handleEditInputChange("dueDate", date)
                          }
                          minDate={new Date()}
                          className="w-full dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Sélection du statut */}
                    <div>
                      <h3 className="text-md font-medium text-[var(--text-primary)] mb-2 dark:text-gray-200">
                        Statut
                      </h3>
                      <SelectField
                        label="Statut"
                        name="status"
                        value={editFormData.status}
                        onChange={(e) =>
                          handleEditInputChange("status", e.target.value)
                        }
                        options={[
                          { value: "pending", label: "En attente" },
                          { value: "inProgress", label: "En cours" },
                          { value: "completed", label: "Terminée" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => deleteTask(editingTask._id)}
                      isLoading={updatingTaskId === editingTask._id}
                      icon={<Trash2 size={16} />}
                      className="sm:order-1 order-2"
                    >
                      Supprimer
                    </Button>
                    <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0 sm:order-2 order-1">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowEditModal(false)}
                        className="dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={updatingTaskId === editingTask._id}
                        icon={<Check size={16} />}
                      >
                        Mettre à jour
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default EmployeeTasksPage;
