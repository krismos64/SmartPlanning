/**
 * Nouveau composant de génération IA qui redirige vers le wizard
 * Remplace l'ancien système modal par le nouveau wizard
 */

import { useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import { useToast } from "../../hooks/useToast";

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
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Rediriger vers le nouveau wizard
      showToast('Redirection vers le nouveau Assistant IA Planning...', 'info');
      navigate('/planning-wizard');
      onClose();
    }
  }, [isOpen, navigate, onClose, showToast]);

  return null;
};

export default GenerateIAScheduleModal;