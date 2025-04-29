import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Edit, Plus, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

// Composants UI
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Toast from "../../components/ui/Toast";

// Types d'équipe
export interface Team {
  _id: string;
  name: string;
  managerId: string;
  companyId: string;
}

// Props du composant
interface ManageTeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onTeamsUpdated: (newTeams: Team[]) => void;
  companyId: string;
}

// États de l'équipe en cours d'édition
interface EditingTeam {
  id: string;
  name: string;
}

// Variantes d'animation pour le modal
const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

// Variantes d'animation pour le fond
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Variantes d'animation pour les items de liste
const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
  exit: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.2,
    },
  },
};

// Variantes d'animation pour les éléments qui apparaissent
const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/**
 * Composant ManageTeamsModal
 *
 * Modal permettant à un manager de gérer ses équipes (CRUD)
 */
const ManageTeamsModal: React.FC<ManageTeamsModalProps> = ({
  isOpen,
  onClose,
  teams,
  onTeamsUpdated,
  companyId,
}) => {
  // États
  const [loading, setLoading] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>("");
  const [editingTeam, setEditingTeam] = useState<EditingTeam | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  // Notifications Toast
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Réinitialiser les états quand le modal s'ouvre/se ferme
  useEffect(() => {
    if (isOpen) {
      // Réinitialiser les états
      setNewTeamName("");
      setEditingTeam(null);
      setTeamToDelete(null);
      setShowConfirmDelete(false);
    }
  }, [isOpen]);

  /**
   * Affiche un toast de succès
   */
  const showSuccess = (message: string) => {
    setToastMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  /**
   * Affiche un toast d'erreur
   */
  const showError = (message: string) => {
    setToastMessage(message);
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 4000);
  };

  /**
   * Crée une nouvelle équipe
   */
  const createTeam = async () => {
    if (!newTeamName.trim()) {
      showError("Le nom de l'équipe ne peut pas être vide");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/teams", {
        name: newTeamName,
        companyId,
      });

      if (response.data.success) {
        // Mettre à jour la liste des équipes avec la nouvelle équipe
        const updatedTeams = [...teams, response.data.data];
        onTeamsUpdated(updatedTeams);
        setNewTeamName("");
        showSuccess("Équipe créée avec succès");
      } else {
        throw new Error(
          response.data.message || "Erreur lors de la création de l'équipe"
        );
      }
    } catch (error) {
      console.error("Erreur création équipe:", error);
      showError("Impossible de créer l'équipe");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour le nom d'une équipe
   */
  const updateTeam = async () => {
    if (!editingTeam || !editingTeam.name.trim()) {
      showError("Le nom de l'équipe ne peut pas être vide");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.patch(
        `/api/teams/${editingTeam.id}`,
        {
          name: editingTeam.name,
        }
      );

      if (response.data.success) {
        // Mettre à jour la liste des équipes avec l'équipe modifiée
        const updatedTeams = teams.map((team) =>
          team._id === editingTeam.id
            ? { ...team, name: editingTeam.name }
            : team
        );

        onTeamsUpdated(updatedTeams);
        setEditingTeam(null);
        showSuccess("Équipe mise à jour avec succès");
      } else {
        throw new Error(
          response.data.message || "Erreur lors de la mise à jour de l'équipe"
        );
      }
    } catch (error) {
      console.error("Erreur mise à jour équipe:", error);
      showError("Impossible de mettre à jour l'équipe");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprime une équipe
   */
  const deleteTeam = async () => {
    if (!teamToDelete) return;

    setLoading(true);
    try {
      const response = await axiosInstance.delete(`/api/teams/${teamToDelete}`);

      if (response.data.success) {
        // Mettre à jour la liste des équipes en retirant l'équipe supprimée
        const updatedTeams = teams.filter((team) => team._id !== teamToDelete);
        onTeamsUpdated(updatedTeams);
        setShowConfirmDelete(false);
        setTeamToDelete(null);
        showSuccess("Équipe supprimée avec succès");
      } else {
        throw new Error(
          response.data.message || "Erreur lors de la suppression de l'équipe"
        );
      }
    } catch (error) {
      console.error("Erreur suppression équipe:", error);
      showError("Impossible de supprimer l'équipe");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère le changement dans le champ d'ajout d'équipe
   */
  const handleNewTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTeamName(e.target.value);
  };

  /**
   * Gère le changement dans le champ d'édition d'équipe
   */
  const handleEditTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingTeam) {
      setEditingTeam({
        ...editingTeam,
        name: e.target.value,
      });
    }
  };

  /**
   * Commence l'édition d'une équipe
   */
  const startEditing = (team: Team) => {
    setEditingTeam({
      id: team._id,
      name: team.name,
    });
  };

  /**
   * Annule l'édition d'une équipe
   */
  const cancelEditing = () => {
    setEditingTeam(null);
  };

  /**
   * Commence la suppression d'une équipe
   */
  const startDeleting = (teamId: string) => {
    setTeamToDelete(teamId);
    setShowConfirmDelete(true);
  };

  /**
   * Annule la suppression d'une équipe
   */
  const cancelDeleting = () => {
    setTeamToDelete(null);
    setShowConfirmDelete(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            {/* Overlay avec animation */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={overlayVariants}
              onClick={onClose}
            />

            {/* Modal principal avec animation */}
            <motion.div
              className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
            >
              {/* En-tête */}
              <header className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Gestion des équipes
                  </h2>
                  <button
                    className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    onClick={onClose}
                  >
                    <X size={20} />
                  </button>
                </div>
              </header>

              {/* Corps du modal */}
              <div className="p-6">
                {/* Formulaire d'ajout d'équipe */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Ajouter une équipe
                  </h3>
                  <div className="flex space-x-2">
                    <div className="flex-grow">
                      <InputField
                        name="newTeamName"
                        placeholder="Nom de la nouvelle équipe"
                        value={newTeamName}
                        onChange={handleNewTeamChange}
                        disabled={loading}
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      icon={<Plus size={16} />}
                      onClick={createTeam}
                      disabled={loading || !newTeamName.trim()}
                      isLoading={loading && !editingTeam && !teamToDelete}
                    >
                      Créer
                    </Button>
                  </div>
                </div>

                {/* Séparateur */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                {/* Liste des équipes */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Mes équipes
                  </h3>

                  {/* Affichage conditionnel selon le nombre d'équipes */}
                  {teams.length === 0 ? (
                    <motion.div
                      className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      variants={fadeInVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <p className="text-gray-600 dark:text-gray-400">
                        Vous n'avez pas encore d'équipes.
                      </p>
                    </motion.div>
                  ) : (
                    <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      <AnimatePresence>
                        {teams.map((team, index) => (
                          <motion.li
                            key={team._id}
                            className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            custom={index}
                            variants={listItemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                          >
                            {/* Mode édition ou affichage */}
                            {editingTeam?.id === team._id ? (
                              <div className="flex-grow flex items-center space-x-2">
                                <InputField
                                  name="editTeamName"
                                  value={editingTeam.name}
                                  onChange={handleEditTeamChange}
                                  disabled={loading}
                                />
                                <div className="flex space-x-1">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    icon={<Check size={16} />}
                                    onClick={updateTeam}
                                    disabled={
                                      loading || !editingTeam.name.trim()
                                    }
                                    isLoading={
                                      loading && editingTeam?.id === team._id
                                    }
                                  >
                                    {""}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<X size={16} />}
                                    onClick={cancelEditing}
                                    disabled={loading}
                                  >
                                    {""}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className="flex-grow font-medium text-gray-900 dark:text-white">
                                  {team.name}
                                </span>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={
                                      <Edit
                                        size={16}
                                        className="text-indigo-600 dark:text-indigo-400"
                                      />
                                    }
                                    onClick={() => startEditing(team)}
                                    disabled={loading}
                                    className="hover:bg-gray-200 dark:hover:bg-gray-700"
                                  >
                                    {""}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={
                                      <Trash2
                                        size={16}
                                        className="text-red-500 dark:text-red-400"
                                      />
                                    }
                                    onClick={() => startDeleting(team._id)}
                                    disabled={loading}
                                    className="hover:bg-gray-200 dark:hover:bg-gray-700"
                                  >
                                    {""}
                                  </Button>
                                </div>
                              </>
                            )}
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}
                </div>
              </div>

              {/* Afficher la confirmation de suppression si nécessaire */}
              <AnimatePresence>
                {showConfirmDelete && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-sm w-full border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-center text-amber-500 mb-4">
                        <AlertTriangle size={48} />
                      </div>
                      <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
                        Supprimer cette équipe ?
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                        Cette action est irréversible et les collaborateurs de
                        cette équipe seront désassociés.
                      </p>
                      <div className="flex space-x-3 justify-center">
                        <Button
                          variant="ghost"
                          onClick={cancelDeleting}
                          disabled={loading}
                          className="hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          Annuler
                        </Button>
                        <Button
                          variant="danger"
                          onClick={deleteTeam}
                          isLoading={loading && !!teamToDelete}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Indicateur de chargement global */}
              {loading &&
                !editingTeam &&
                !teamToDelete &&
                !showConfirmDelete && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
                    <LoadingSpinner size="lg" />
                  </div>
                )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toasts de notification */}
      <Toast
        type="success"
        message={toastMessage}
        isVisible={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
      />
      <Toast
        type="error"
        message={toastMessage}
        isVisible={showErrorToast}
        onClose={() => setShowErrorToast(false)}
      />
    </>
  );
};

export default ManageTeamsModal;
