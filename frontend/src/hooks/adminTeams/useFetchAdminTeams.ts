/**
 * Hook pour récupérer les équipes d'une entreprise
 *
 * @module hooks/adminTeams
 */
import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

/**
 * Interface pour une équipe récupérée via l'API admin
 */
export interface AdminTeam {
  _id: string;
  name: string;
  managerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  companyId: string;
}

/**
 * Interface pour la réponse de l'API
 */
interface AdminTeamsApiResponse {
  success: boolean;
  message: string;
  data: AdminTeam[];
}

/**
 * Interface pour le retour du hook
 */
interface UseFetchAdminTeamsReturn {
  teams: AdminTeam[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer la liste des équipes d'une entreprise
 *
 * @param companyId - L'identifiant de l'entreprise
 * @returns Un objet contenant la liste des équipes, l'état de chargement, les erreurs et une fonction pour rafraîchir les données
 *
 * @example
 * ```tsx
 * const { teams, loading, error, refetch } = useFetchAdminTeams(companyId);
 * ```
 */
const useFetchAdminTeams = (companyId: string): UseFetchAdminTeamsReturn => {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour récupérer les équipes
   */
  const fetchTeams = useCallback(async () => {
    if (!companyId) {
      setError("L'identifiant de l'entreprise est requis");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<AdminTeamsApiResponse>(
        `/api/admin/teams?companyId=${companyId}`
      );

      setTeams(response.data.data);
    } catch (err: any) {
      console.error("Erreur lors de la récupération des équipes:", err);
      setError(
        err.response?.data?.message ||
          "Erreur lors de la récupération des équipes"
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Charger les équipes au montage du composant et lorsque companyId change
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
  };
};

export default useFetchAdminTeams;
