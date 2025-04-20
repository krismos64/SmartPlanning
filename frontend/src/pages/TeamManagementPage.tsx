/**
 * TeamManagementPage - Page de gestion des équipes
 *
 * Permet aux managers de visualiser et gérer les membres de leurs équipes.
 * Intègre les composants du design system SmartPlanning pour une expérience cohérente.
 */
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CalendarDays,
  Plus,
  Shield,
  Trash,
  UserPlus,
  Users,
} from "lucide-react";
import type { FormEvent } from "react";
import React, { useCallback, useEffect, useState } from "react";

// Composants de layout
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Importation du composant de planification d'événements
import TeamEventPlanner, {
  TeamEvent,
} from "../components/team/TeamEventPlanner";
import TeamEventsCalendar from "../components/team/TeamEventsCalendar";

// Types pour les équipes
interface Team {
  _id: string;
  name: string;
  description?: string;
  employeeIds: TeamEmployee[];
  managerIds: string[];
  companyId: string;
  createdAt: string;
  events?: TeamEvent[]; // Ajout des événements d'équipe
}

// Types pour les employés dans une équipe
interface TeamEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  status: "actif" | "inactif";
  tasksCount: number; // Nombre de tâches en cours
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

/**
 * Fonction utilitaire pour formater les dates
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
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // État pour gérer quel équipe affiche son planificateur d'événements
  const [showEventPlanner, setShowEventPlanner] = useState<string | null>(null);

  // États pour gérer les formulaires d'ajout d'employé
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [addEmployeeFormData, setAddEmployeeFormData] =
    useState<AddEmployeeFormData>({
      employeeId: "",
      teamId: "",
    });

  // État pour la modal de confirmation de suppression
  const [removeConfirmation, setRemoveConfirmation] = useState<{
    isOpen: boolean;
    teamId: string;
    employeeId: string;
    employeeName: string;
  }>({
    isOpen: false,
    teamId: "",
    employeeId: "",
    employeeName: "",
  });

  // État pour afficher les événements
  const [showEvents, setShowEvents] = useState<{ [key: string]: boolean }>({});

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Équipes" },
  ];

  /**
   * Fonction pour récupérer les équipes du manager
   */
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<{ success: boolean; data: Team[] }>(
        "/api/teams/my-teams"
      );

      // Ajouter des événements fictifs pour la démonstration
      const teamsWithEvents = response.data.data.map((team) => {
        // Si nous sommes en développement ou si les données API n'ont pas d'événements
        if (
          process.env.NODE_ENV === "development" ||
          !team.events ||
          team.events.length === 0
        ) {
          // Dates pour les événements fictifs
          const today = new Date();
          const tomorrow = new Date();
          tomorrow.setDate(today.getDate() + 1);
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);

          // Événements fictifs
          return {
            ...team,
            events: [
              {
                id: `event-${team._id}-1`,
                teamId: team._id,
                title: "Réunion d'équipe hebdomadaire",
                description:
                  "Passage en revue des projets en cours et planification",
                startDate: today,
                endDate: new Date(today.getTime() + 60 * 60 * 1000), // +1h
                location: "Salle de conférence A",
                eventType: "meeting",
              },
              {
                id: `event-${team._id}-2`,
                teamId: team._id,
                title: "Formation sur les nouvelles fonctionnalités",
                description:
                  "Présentation des nouvelles fonctionnalités du système",
                startDate: tomorrow,
                endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // +2h
                location: "Salle de formation B",
                eventType: "training",
              },
              {
                id: `event-${team._id}-3`,
                teamId: team._id,
                title: "Team Building - Escape Game",
                description: "Activité d'équipe pour renforcer la cohésion",
                startDate: nextWeek,
                endDate: new Date(nextWeek.getTime() + 3 * 60 * 60 * 1000), // +3h
                location: "Escape Game Center",
                eventType: "teambuilding",
              },
            ],
          };
        }
        return team;
      });

      setTeams(teamsWithEvents);
    } catch (error) {
      console.error("Erreur lors de la récupération des équipes:", error);
      setError("Impossible de récupérer les équipes. Veuillez réessayer.");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fonction pour récupérer les employés disponibles (sans équipe)
   */
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
      setShowErrorToast(true);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Chargement initial des données
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  /**
   * Gestionnaire pour la mise à jour du formulaire d'ajout d'employé
   */
  const handleEmployeeChange = (value: string) => {
    setAddEmployeeFormData((prev) => ({
      ...prev,
      employeeId: value,
    }));
  };

  /**
   * Fonction pour ouvrir le formulaire d'ajout d'employé
   */
  const openAddEmployeeForm = (teamId: string) => {
    setSelectedTeamId(teamId);
    setAddEmployeeFormData((prev) => ({
      ...prev,
      teamId: teamId,
    }));
    fetchAvailableEmployees(teamId);
  };

  /**
   * Fonction pour fermer le formulaire d'ajout d'employé
   */
  const closeAddEmployeeForm = () => {
    setSelectedTeamId(null);
  };

  /**
   * Fonction pour ajouter un employé à une équipe
   */
  const addEmployeeToTeam = async (e: FormEvent) => {
    e.preventDefault();

    // Validation du formulaire
    if (!addEmployeeFormData.employeeId || !addEmployeeFormData.teamId) {
      setError("Veuillez sélectionner un employé.");
      setShowErrorToast(true);
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
      setShowSuccessToast(true);

      // Fermer le formulaire et rafraîchir les équipes
      closeAddEmployeeForm();
      fetchTeams();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'employé:", error);
      setError(
        "Impossible d'ajouter l'employé à l'équipe. Veuillez réessayer."
      );
      setShowErrorToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Fonction pour ouvrir la confirmation de suppression
   */
  const confirmRemoveEmployee = (
    teamId: string,
    employeeId: string,
    firstName: string,
    lastName: string
  ) => {
    setRemoveConfirmation({
      isOpen: true,
      teamId,
      employeeId,
      employeeName: `${firstName} ${lastName}`,
    });
  };

  /**
   * Fonction pour fermer la confirmation de suppression
   */
  const cancelRemoveEmployee = () => {
    setRemoveConfirmation({
      isOpen: false,
      teamId: "",
      employeeId: "",
      employeeName: "",
    });
  };

  /**
   * Fonction pour supprimer un employé d'une équipe
   */
  const removeEmployeeFromTeam = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await axios.delete(
        `/api/teams/${removeConfirmation.teamId}/remove-employee/${removeConfirmation.employeeId}`
      );

      setSuccess("Employé retiré de l'équipe avec succès");
      setShowSuccessToast(true);

      // Fermer la modal et rafraîchir les équipes
      cancelRemoveEmployee();
      fetchTeams();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'employé:", error);
      setError(
        "Impossible de retirer l'employé de l'équipe. Veuillez réessayer."
      );
      setShowErrorToast(true);
      // Fermer la modal malgré l'erreur
      cancelRemoveEmployee();
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Fonction pour fermer les notifications
   */
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
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

  /**
   * Préparation des options pour le Select d'employés
   */
  const employeeOptions = fallbackAvailableEmployees.map((employee) => ({
    label: `${employee.firstName} ${employee.lastName} (${employee.status})`,
    value: employee._id,
  }));

  /**
   * Fonction pour gérer la création d'un événement d'équipe
   */
  const handleEventCreated = (teamId: string, event: TeamEvent) => {
    setTeams((prevTeams) =>
      prevTeams.map((team) => {
        if (team._id === teamId) {
          const updatedEvents = team.events ? [...team.events, event] : [event];
          return { ...team, events: updatedEvents };
        }
        return team;
      })
    );

    setSuccess("Événement d'équipe créé avec succès");
    setShowSuccessToast(true);
    setShowEventPlanner(null); // Fermer le planificateur après création
  };

  /**
   * Fonction pour basculer l'affichage du planificateur d'événements
   */
  const toggleEventPlanner = (teamId: string) => {
    setShowEventPlanner((current) => (current === teamId ? null : teamId));
  };

  /**
   * Fonction pour basculer l'affichage des événements
   */
  const toggleEventsCalendar = (teamId: string) => {
    setShowEvents((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
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

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={removeConfirmation.isOpen}
        onClose={cancelRemoveEmployee}
        title="Confirmer la suppression"
      >
        <div className="p-6">
          <p className="mb-4 text-[var(--text-primary)]">
            Êtes-vous sûr de vouloir retirer{" "}
            <span className="font-semibold">
              {removeConfirmation.employeeName}
            </span>{" "}
            de cette équipe ?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={cancelRemoveEmployee}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={removeEmployeeFromTeam}
              isLoading={submitting}
              icon={<Trash size={16} />}
            >
              Retirer
            </Button>
          </div>
        </div>
      </Modal>

      {/* En-tête avec fil d'ariane */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Titre de la page */}
      <SectionTitle
        title="Gestion des équipes"
        subtitle="Gérez les membres de vos équipes"
        icon={<Users size={24} />}
        className="mb-8"
      />

      {/* Contenu principal */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : teams.length > 0 ? (
        <div className="space-y-8">
          {teams.map((team) => (
            <SectionCard
              key={team._id}
              title={team.name}
              description={team.description}
              actions={
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => toggleEventPlanner(team._id)}
                    icon={<CalendarClock size={16} />}
                  >
                    {showEventPlanner === team._id
                      ? "Annuler l'événement"
                      : "Planifier un événement"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => toggleEventsCalendar(team._id)}
                    icon={<CalendarDays size={16} />}
                  >
                    {showEvents[team._id]
                      ? "Masquer les événements"
                      : "Voir les événements"}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => openAddEmployeeForm(team._id)}
                    icon={<UserPlus size={16} />}
                    disabled={submitting}
                  >
                    Ajouter un membre
                  </Button>
                </div>
              }
            >
              {/* Planificateur d'événements d'équipe */}
              <AnimatePresence>
                {showEventPlanner === team._id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6"
                  >
                    <TeamEventPlanner
                      teamId={team._id}
                      teamName={team.name}
                      onEventCreated={(event) =>
                        handleEventCreated(team._id, event)
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Formulaire d'ajout d'employé */}
              <AnimatePresence>
                {selectedTeamId === team._id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6"
                  >
                    <Card
                      title="Ajouter un nouveau membre"
                      className="bg-[var(--background-tertiary)] border-[var(--border)]"
                    >
                      <form
                        onSubmit={addEmployeeToTeam}
                        className="flex flex-col md:flex-row md:items-end gap-4"
                      >
                        <div className="flex-grow">
                          <Select
                            label="Sélectionner un employé"
                            options={employeeOptions}
                            value={addEmployeeFormData.employeeId}
                            onChange={handleEmployeeChange}
                            disabled={
                              submitting ||
                              fallbackAvailableEmployees.length === 0
                            }
                            placeholder="Choisir un employé..."
                            icon={<Users size={16} />}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={closeAddEmployeeForm}
                            disabled={submitting}
                          >
                            Annuler
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            isLoading={submitting}
                            disabled={fallbackAvailableEmployees.length === 0}
                            icon={<Plus size={16} />}
                          >
                            Ajouter
                          </Button>
                        </div>
                      </form>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Liste des membres de l'équipe */}
              {team.employeeIds.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table
                    columns={[
                      { key: "employee", label: "Employé", className: "w-40" },
                      { key: "status", label: "Statut" },
                      { key: "tasks", label: "Tâches en cours" },
                      { key: "actions", label: "Actions", className: "w-24" },
                    ]}
                    data={team.employeeIds.map((employee) => ({
                      employee: (
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={`${employee.firstName} ${employee.lastName}`}
                            size="sm"
                          />
                          <span>
                            {employee.firstName} {employee.lastName}
                          </span>
                        </div>
                      ),
                      status: (
                        <Badge
                          variant={
                            employee.status === "actif" ? "success" : "neutral"
                          }
                          label={
                            employee.status === "actif" ? "Actif" : "Inactif"
                          }
                        />
                      ),
                      tasks: employee.tasksCount,
                      actions: (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            confirmRemoveEmployee(
                              team._id,
                              employee._id,
                              employee.firstName,
                              employee.lastName
                            )
                          }
                          icon={
                            <Trash size={16} className="text-[var(--error)]" />
                          }
                          className="text-[var(--error)] hover:bg-[var(--error-light)]"
                          disabled={submitting}
                        >
                          Retirer
                        </Button>
                      ),
                    }))}
                    emptyState={{
                      title: "Aucun membre",
                      description: "Aucun membre dans cette équipe",
                      icon: <Users size={40} />,
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  <p className="mb-2">Aucun membre dans cette équipe</p>
                  <p className="text-sm">
                    Cliquez sur "Ajouter un membre" pour commencer
                  </p>
                </div>
              )}

              {/* Affichage des événements */}
              <AnimatePresence>
                {showEvents[team._id] && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6"
                  >
                    <TeamEventsCalendar
                      events={team.events || []}
                      teamName={team.name}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </SectionCard>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center justify-center">
            <Shield size={48} className="text-[var(--text-tertiary)] mb-4" />
            <p className="text-lg text-[var(--text-primary)] mb-2">
              Vous ne gérez actuellement aucune équipe
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">
              Contactez un administrateur pour créer une équipe
            </p>
          </div>
        </Card>
      )}
    </PageWrapper>
  );
};

export default TeamManagementPage;
