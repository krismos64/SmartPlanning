/**
 * Modal de sélection d'équipe pour la génération IA de planning
 */

import { getISOWeek } from "date-fns";
import { motion } from "framer-motion";
import { Bot, Calendar, ChevronRight, Users, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

interface Team {
  _id: string;
  name: string;
  employeeIds: string[];
}

interface AITeamSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamSelected: (
    teamId: string,
    teamName: string,
    year: number,
    weekNumber: number
  ) => void;
}

const AITeamSelectorModal: React.FC<AITeamSelectorModalProps> = ({
  isOpen,
  onClose,
  onTeamSelected,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedWeek, setSelectedWeek] = useState<number>(
    getISOWeek(new Date())
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Charger les équipes
  useEffect(() => {
    if (isOpen) {
      loadTeams();
    }
  }, [isOpen]);

  const loadTeams = async () => {
    setIsLoadingTeams(true);
    try {
      const response = await axiosInstance.get("/teams");
      if (response.data && response.data.success) {
        setTeams(response.data.data || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des équipes:", error);
      toast.error("Impossible de charger les équipes");
    } finally {
      setIsLoadingTeams(false);
    }
  };

  // Options pour les années (année actuelle +/- 1)
  const yearOptions = [
    {
      label: (selectedYear - 1).toString(),
      value: (selectedYear - 1).toString(),
    },
    { label: selectedYear.toString(), value: selectedYear.toString() },
    {
      label: (selectedYear + 1).toString(),
      value: (selectedYear + 1).toString(),
    },
  ];

  // Options pour les semaines (1-53)
  const weekOptions = Array.from({ length: 53 }, (_, i) => ({
    label: `Semaine ${i + 1}`,
    value: (i + 1).toString(),
  }));

  const handleContinue = () => {
    const selectedTeamData = teams.find((team) => team._id === selectedTeam);

    if (!selectedTeamData) {
      toast.error("Veuillez sélectionner une équipe");
      return;
    }

    if (selectedTeamData.employeeIds.length === 0) {
      toast.error("L'équipe sélectionnée ne contient aucun employé");
      return;
    }

    onTeamSelected(
      selectedTeam,
      selectedTeamData.name,
      selectedYear,
      selectedWeek
    );
  };

  const resetForm = () => {
    setSelectedTeam("");
    setSelectedYear(new Date().getFullYear());
    setSelectedWeek(getISOWeek(new Date()));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedTeamData = teams.find((team) => team._id === selectedTeam);

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Génération IA de Planning
              </h2>
              <p className="text-sm text-gray-500">
                Sélectionnez l'équipe et la période
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Introduction */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full mb-4">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Assistant IA de Planification
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Notre IA va générer un planning optimisé en tenant compte des
              préférences de vos employés et des contraintes métiers.
            </p>
          </div>

          {/* Formulaire de sélection */}
          <div className="space-y-4">
            {isLoadingTeams ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <>
                {/* Sélection d'équipe */}
                <div>
                  <Select
                    label="Équipe"
                    options={[
                      { label: "Sélectionnez une équipe", value: "" },
                      ...teams.map((team) => ({
                        label: `${team.name} (${
                          team.employeeIds.length
                        } employé${team.employeeIds.length > 1 ? "s" : ""})`,
                        value: team._id,
                      })),
                    ]}
                    value={selectedTeam}
                    onChange={(value) => setSelectedTeam(value)}
                    icon={<Users size={18} />}
                  />

                  {selectedTeamData && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
                    >
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        ✓ Équipe "{selectedTeamData.name}" sélectionnée avec{" "}
                        {selectedTeamData.employeeIds.length} employé
                        {selectedTeamData.employeeIds.length > 1 ? "s" : ""}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Sélection de période */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Année"
                    options={yearOptions}
                    value={selectedYear.toString()}
                    onChange={(value) => setSelectedYear(Number(value))}
                    icon={<Calendar size={18} />}
                  />

                  <Select
                    label="Semaine"
                    options={weekOptions}
                    value={selectedWeek.toString()}
                    onChange={(value) => setSelectedWeek(Number(value))}
                    icon={<Calendar size={18} />}
                  />
                </div>

                {/* Info période */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="inline w-4 h-4 mr-2" />
                    Planning pour la{" "}
                    <strong>
                      semaine {selectedWeek}/{selectedYear}
                    </strong>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedTeam || isLoadingTeams}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Chargement...</span>
                </div>
              ) : (
                <>
                  <span>Continuer</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AITeamSelectorModal;
