/**
 * Hook pour mettre à jour une équipe
 *
 * @module hooks/adminTeams
 */
import { useCallback, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

/**
 * Interface pour les données de mise à jour d'une équipe
 */
export interface UpdateAdminTeamInput {
  name?: string;
  managerId?: string;
}

/**
 * Interface pour la réponse de l'API
 */
interface UpdateAdminTeamResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * Interface pour les options du hook
 */
interface UseUpdateAdminTeamOptions {
  onSuccess?: () => void;
  showToast?: (message: string, type: "success" | "error") => void;
}

/**
 * Interface pour le retour du hook
 */
interface UseUpdateAdminTeamReturn {
  updateAdminTeam: (id: string, data: UpdateAdminTeamInput) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour mettre à jour une équipe existante dans le système d'administration
 *
 * @param options - Options du hook incluant les callbacks onSuccess et showToast
 * @returns Un objet contenant la fonction de mise à jour, l'état de chargement et les erreurs
 *
 * @example
 * ```tsx
 * const { updateAdminTeam, loading, error } = useUpdateAdminTeam({
 *   onSuccess: () => console.log('Équipe mise à jour'),
 *   showToast: (message, type) => console.log(`${type}: ${message}`)
 * });
 *
 * const handleUpdate = async (id) => {
 *   await updateAdminTeam(id, {
 *     name: 'Nouveau nom',
 *     managerId: '123'
 *   });
 * };
 * ```
 */
const useUpdateAdminTeam = (
  options: UseUpdateAdminTeamOptions = {}
): UseUpdateAdminTeamReturn => {
  const { onSuccess, showToast } = options;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour mettre à jour une équipe
   */
  const updateAdminTeam = useCallback(
    async (id: string, data: UpdateAdminTeamInput) => {
      if (!id) {
        const errorMessage = "L'identifiant de l'équipe est requis";
        setError(errorMessage);
        if (showToast) {
          showToast(errorMessage, "error");
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.patch<UpdateAdminTeamResponse>(
          `/api/admin/teams/${id}`,
          data
        );

        if (showToast) {
          showToast("Équipe mise à jour avec succès", "success");
        }

        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        console.error("Erreur lors de la mise à jour de l'équipe:", err);

        const errorMessage =
          err.response?.data?.message ||
          "Erreur lors de la mise à jour de l'équipe";

        setError(errorMessage);

        if (showToast) {
          showToast(errorMessage, "error");
        }
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, showToast]
  );

  return {
    updateAdminTeam,
    loading,
    error,
  };
};

export default useUpdateAdminTeam;
