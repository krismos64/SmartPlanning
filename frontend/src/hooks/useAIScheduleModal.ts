/**
 * Hook personnalisé pour gérer l'état du modal de génération IA de planning
 */

import { getISOWeek } from "date-fns";
import { useCallback, useState } from "react";

interface UseAIScheduleModalProps {
  onScheduleGenerated?: (scheduleData: any) => void;
}

interface SelectedTeam {
  id: string;
  name: string;
}

interface SelectedWeek {
  year: number;
  weekNumber: number;
}

export const useAIScheduleModal = ({
  onScheduleGenerated,
}: UseAIScheduleModalProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<SelectedTeam | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek>({
    year: new Date().getFullYear(),
    weekNumber: getISOWeek(new Date()),
  });

  const openModal = useCallback(
    (
      teamId?: string,
      teamName?: string,
      year?: number,
      weekNumber?: number
    ) => {
      console.log("Debug - openModal appelé avec:", {
        teamId,
        teamName,
        year,
        weekNumber,
      });

      // S'assurer que toutes les valeurs sont présentes
      if (!teamId || !teamName || !year || !weekNumber) {
        console.error("Debug - openModal: paramètres manquants", {
          teamId,
          teamName,
          year,
          weekNumber,
        });
        return;
      }

      // Mettre à jour les états de manière synchrone
      const newTeam: SelectedTeam = { id: teamId, name: teamName };
      const newWeek: SelectedWeek = { year, weekNumber };

      setSelectedTeam(newTeam);
      setSelectedWeek(newWeek);
      setIsOpen(true);

      console.log("Debug - États mis à jour:", {
        selectedTeam: newTeam,
        selectedWeek: newWeek,
        isOpen: true,
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    console.log("Debug - closeModal appelé");
    setIsOpen(false);
  }, []);

  const resetModal = useCallback(() => {
    console.log("Debug - resetModal appelé");
    setIsOpen(false);
    setSelectedTeam(null);
  }, []);

  const handleScheduleGenerated = useCallback(
    (scheduleData: any) => {
      console.log("Debug - handleScheduleGenerated appelé avec:", scheduleData);
      onScheduleGenerated?.(scheduleData);
      closeModal();
    },
    [onScheduleGenerated, closeModal]
  );

  return {
    isOpen,
    selectedTeam,
    selectedWeek,
    openModal,
    closeModal,
    resetModal,
    handleScheduleGenerated,
    setSelectedWeek,
  };
};
