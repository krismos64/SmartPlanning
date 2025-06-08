import { useCallback, useState } from "react";

interface UseAIGuideReturn {
  isVisible: boolean;
  showGuide: () => void;
  hideGuide: () => void;
  toggleGuide: () => void;
}

/**
 * Hook personnalisé pour gérer l'affichage du guide IA
 * Utilise un délai pour afficher le guide après la génération d'un planning
 */
export const useAIGuide = (delay: number = 1500): UseAIGuideReturn => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const showGuide = useCallback(() => {
    // Délai avant d'afficher le guide pour laisser le temps au toast de succès de s'afficher
    setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  const hideGuide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const toggleGuide = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  return {
    isVisible,
    showGuide,
    hideGuide,
    toggleGuide,
  };
};

export default useAIGuide;
