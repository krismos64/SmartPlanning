/**
 * Composant modal obsolète - remplacé par PlanningWizard
 * Maintenu pour compatibilité, redirige vers le nouveau wizard
 */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";

interface AITeamSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamSelected: (teamId: string, teamName: string, year: number, weekNumber: number) => void;
}

const AITeamSelectorModal: React.FC<AITeamSelectorModalProps> = ({
  isOpen,
  onClose,
  onTeamSelected,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      showToast('Redirection vers le nouveau Assistant IA Planning...', 'info');
      navigate('/planning-wizard');
      onClose();
    }
  }, [isOpen, navigate, onClose, showToast]);

  return null;
};

export default AITeamSelectorModal;