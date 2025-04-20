/**
 * EmployeeTasksPage - Page de gestion des tâches employé
 *
 * Permet aux employés de visualiser et gérer leurs tâches assignées.
 * Intègre les composants du design system SmartPlanning pour une expérience cohérente.
 */
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Check, ClipboardList, Plus } from "lucide-react";
import React, { FormEvent, useCallback, useEffect, useState } from "react";

// Composants de layout
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import DatePicker from "../components/ui/DatePicker";
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Table from "../components/ui/Table";
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

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tâches" },
  ];

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
      await axios.patch(`/api/tasks/${taskId}`, { status: "completed" });

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

  // Gestionnaire pour mettre à jour le formulaire
  const handleInputChange = (name: string, value: string) => {
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
      setShowErrorToast(true);
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
      setShowSuccessToast(true);

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
        title="Mes Tâches"
        subtitle="Gérez et suivez l'avancement de vos tâches"
        icon={<ClipboardList size={24} />}
        className="mb-8"
      />

      {/* Formulaire d'ajout de tâche */}
      <SectionCard
        title="Nouvelle tâche"
        className="mb-8"
        actions={
          <Button
            variant={showAddForm ? "ghost" : "primary"}
            onClick={() => setShowAddForm(!showAddForm)}
            icon={showAddForm ? undefined : <Plus size={16} />}
          >
            {showAddForm ? "Annuler" : "Ajouter une tâche"}
          </Button>
        }
      >
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 border-t border-[var(--border)]">
                <form onSubmit={addNewTask} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Titre de la tâche */}
                    <InputField
                      label="Titre"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      placeholder="Titre de la tâche"
                      required
                    />

                    {/* Date d'échéance */}
                    <DatePicker
                      label="Date d'échéance (optionnelle)"
                      selectedDate={
                        formData.dueDate ? new Date(formData.dueDate) : null
                      }
                      onChange={(date) => {
                        if (date) {
                          handleInputChange(
                            "dueDate",
                            date.toISOString().split("T")[0]
                          );
                        }
                      }}
                      minDate={new Date()}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={loading}
                      icon={<Check size={16} />}
                    >
                      Ajouter
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* Liste des tâches */}
      <SectionCard
        title="Liste de tâches"
        className="mb-8"
        description={`${
          tasks.filter((task) => task.status !== "completed").length
        } tâche(s) en cours`}
      >
        {loading && !updatingTaskId ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : tasks.length > 0 ? (
          <div className="p-4 overflow-x-auto">
            <Table
              columns={[
                { key: "title", label: "Titre" },
                { key: "dueDate", label: "Échéance", className: "w-40" },
                { key: "status", label: "Statut", className: "w-32" },
                { key: "actions", label: "Actions", className: "w-40" },
              ]}
              data={tasks.map((task) => ({
                title: (
                  <div
                    className={
                      task.status === "completed"
                        ? "line-through text-[var(--text-tertiary)]"
                        : "text-[var(--text-primary)]"
                    }
                  >
                    {task.title}
                  </div>
                ),
                dueDate: (
                  <div
                    className={
                      isOverdue(task.dueDate) && task.status !== "completed"
                        ? "text-[var(--error)]"
                        : "text-[var(--text-secondary)]"
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
                    variant={getStatusVariant(task.status)}
                    label={translateStatus(task.status)}
                  />
                ),
                actions:
                  task.status !== "completed" ? (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => markAsCompleted(task._id)}
                      isLoading={updatingTaskId === task._id}
                      icon={<Check size={16} />}
                    >
                      Marquer terminée
                    </Button>
                  ) : (
                    <span className="text-[var(--text-tertiary)] text-sm italic">
                      Tâche complétée
                    </span>
                  ),
              }))}
              emptyState={{
                title: "Aucune tâche",
                description: "Commencez par ajouter une nouvelle tâche",
                icon: <ClipboardList size={40} />,
              }}
            />
          </div>
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
    </PageWrapper>
  );
};

export default EmployeeTasksPage;
