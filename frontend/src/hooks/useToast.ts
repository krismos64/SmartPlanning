import { useCallback, useState } from "react";

/**
 * Type pour les différentes variantes de toast
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Interface pour l'état du toast
 */
interface ToastState {
  message: string;
  visible: boolean;
  type: ToastType;
}

/**
 * Hook personnalisé pour gérer les notifications toast
 *
 * @returns Un objet contenant les fonctions et états pour gérer les toasts
 */
export const useToast = () => {
  // État initial du toast (masqué)
  const [toast, setToast] = useState<ToastState>({
    message: "",
    visible: false,
    type: "info",
  });

  /**
   * Affiche un toast avec le message et le type spécifiés
   */
  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({
      message,
      visible: true,
      type,
    });
  }, []);

  /**
   * Affiche un toast de succès
   */
  const showSuccessToast = useCallback(
    (message: string) => {
      showToast(message, "success");
    },
    [showToast]
  );

  /**
   * Affiche un toast d'erreur
   */
  const showErrorToast = useCallback(
    (message: string) => {
      showToast(message, "error");
    },
    [showToast]
  );

  /**
   * Affiche un toast d'information
   */
  const showInfoToast = useCallback(
    (message: string) => {
      showToast(message, "info");
    },
    [showToast]
  );

  /**
   * Affiche un toast d'avertissement
   */
  const showWarningToast = useCallback(
    (message: string) => {
      showToast(message, "warning");
    },
    [showToast]
  );

  /**
   * Ferme le toast
   */
  const hideToast = useCallback(() => {
    setToast((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  return {
    toast,
    showToast,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
    hideToast,
  };
};

export default useToast;
