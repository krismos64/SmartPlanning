/**
 * Wrapper pour maintenir la compatibilité avec l'ancienne interface
 * TODO: À supprimer une fois WeeklySchedulePage refactorisé
 */

import { getISOWeek } from "date-fns";
import React, { useState } from "react";
import AIScheduleGeneratorModal from "../modals/AIScheduleGeneratorModal";
import AITeamSelectorModal from "../modals/AITeamSelectorModal";

interface Team {
  value: string;
  label: string;
}

interface GenerateIAScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teams: Team[];
}

const GenerateIAScheduleModal: React.FC<GenerateIAScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teams,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedWeek] = useState({
    year: new Date().getFullYear(),
    weekNumber: getISOWeek(new Date()),
  });

  const handleTeamSelected = (
    teamId: string,
    teamName: string,
    year: number,
    weekNumber: number
  ) => {
    setSelectedTeam({ id: teamId, name: teamName });
  };

  const handleScheduleGenerated = (scheduleData: any) => {
    console.log("Planning généré (wrapper):", scheduleData);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setSelectedTeam(null);
    onClose();
  };

  // Si aucune équipe sélectionnée, afficher le sélecteur
  if (isOpen && !selectedTeam) {
    return (
      <AITeamSelectorModal
        isOpen={true}
        onClose={handleClose}
        onTeamSelected={handleTeamSelected}
      />
    );
  }

  // Si équipe sélectionnée, afficher le générateur
  if (isOpen && selectedTeam) {
    return (
      <AIScheduleGeneratorModal
        isOpen={true}
        onClose={handleClose}
        teamId={selectedTeam.id}
        teamName={selectedTeam.name}
        year={selectedWeek.year}
        weekNumber={selectedWeek.weekNumber}
        onScheduleGenerated={handleScheduleGenerated}
      />
    );
  }

  return null;
};

export default GenerateIAScheduleModal;
