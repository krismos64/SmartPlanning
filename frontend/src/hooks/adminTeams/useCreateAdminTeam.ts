/**
 * Hook pour créer une équipe
 *
 * @module hooks/adminTeams
 */
import { useCallback, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

/**
 * Interface pour les données de création d'une équipe
 */
export interface CreateAdminTeamInput {
  name: string;
  managerId: string;
  companyId: string;
}

/**
 * Interface pour la réponse de l'API
 */
interface CreateAdminTeamResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * Interface pour les options du hook
 */
interface UseCreateAdminTeamOptions {
  onSuccess?: () => void;
  showToast?: (message: string, type: "success" | "error") => void;
}

/**
 * Interface pour le retour du hook
 */
interface UseCreateAdminTeamReturn {
  createAdminTeam: (data: CreateAdminTeamInput) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour créer une nouvelle équipe dans le système d'administration
 *
 * @param options - Options du hook incluant les callbacks onSuccess et showToast
 * @returns Un objet contenant la fonction de création, l'état de chargement et les erreurs
 *
 * @example
 * ```tsx
 * const { createAdminTeam, loading, error } = useCreateAdminTeam({
 *   onSuccess: () => console.log('Équipe créée'),
 *   showToast: (message, type) => console.log(`${type}: ${message}`)
 * });
 *
 * const handleCreate = async () => {
 *   await createAdminTeam({
 *     name: 'Nouvelle équipe',
 *     managerId: '123',
 *     companyId: '456'
 *   });
 * };
 * ```
 */
const useCreateAdminTeam = (
  options: UseCreateAdminTeamOptions = {}
): UseCreateAdminTeamReturn => {
  const { onSuccess, showToast } = options;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour créer une équipe
   */
  const createAdminTeam = useCallback(
    async (data: CreateAdminTeamInput) => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.post<CreateAdminTeamResponse>(
          "/api/admin/teams",
          data
        );

        if (showToast) {
          showToast("Équipe créée avec succès", "success");
        }

        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        console.error("Erreur lors de la création de l'équipe:", err);

        const errorMessage =
          err.response?.data?.message ||
          "Erreur lors de la création de l'équipe";

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
    createAdminTeam,
    loading,
    error,
  };
};

export default useCreateAdminTeam;
