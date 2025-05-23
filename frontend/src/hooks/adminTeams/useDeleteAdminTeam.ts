/**
 * Hook pour supprimer une équipe
 *
 * @module hooks/adminTeams
 */
import { useCallback, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

/**
 * Interface pour la réponse de l'API
 */
interface DeleteAdminTeamResponse {
  success: boolean;
  message: string;
}

/**
 * Interface pour les options du hook
 */
interface UseDeleteAdminTeamOptions {
  onSuccess?: () => void;
  showToast?: (message: string, type: "success" | "error") => void;
}

/**
 * Interface pour le retour du hook
 */
interface UseDeleteAdminTeamReturn {
  deleteAdminTeam: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour supprimer une équipe du système d'administration
 *
 * @param options - Options du hook incluant les callbacks onSuccess et showToast
 * @returns Un objet contenant la fonction de suppression, l'état de chargement et les erreurs
 *
 * @example
 * ```tsx
 * const { deleteAdminTeam, loading, error } = useDeleteAdminTeam({
 *   onSuccess: () => console.log('Équipe supprimée'),
 *   showToast: (message, type) => console.log(`${type}: ${message}`)
 * });
 *
 * const handleDelete = async (id) => {
 *   await deleteAdminTeam(id);
 * };
 * ```
 */
const useDeleteAdminTeam = (
  options: UseDeleteAdminTeamOptions = {}
): UseDeleteAdminTeamReturn => {
  const { onSuccess, showToast } = options;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour supprimer une équipe
   */
  const deleteAdminTeam = useCallback(
    async (id: string) => {
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
        // La suppression retourne généralement un 204 No Content
        await axiosInstance.delete<DeleteAdminTeamResponse>(
          `/admin/teams/${id}`
        );

        if (showToast) {
          showToast("Équipe supprimée avec succès", "success");
        }

        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        console.error("Erreur lors de la suppression de l'équipe:", err);

        // Cas particulier pour la suppression d'équipe avec des employés actifs
        if (err.response?.status === 400) {
          const errorMessage =
            err.response?.data?.message ||
            "Impossible de supprimer cette équipe car elle contient des employés actifs";

          setError(errorMessage);

          if (showToast) {
            showToast(errorMessage, "error");
          }
        } else {
          const errorMessage =
            err.response?.data?.message ||
            "Erreur lors de la suppression de l'équipe";

          setError(errorMessage);

          if (showToast) {
            showToast(errorMessage, "error");
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, showToast]
  );

  return {
    deleteAdminTeam,
    loading,
    error,
  };
};

export default useDeleteAdminTeam;
