import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

/**
 * Interface définissant la structure des utilisateurs retournés
 */
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  status?: string;
}

/**
 * Type pour les rôles valides
 */
type UserRole = "manager" | "employee";

/**
 * Interface définissant la structure de retour du hook
 */
interface FetchCompanyUsersResult {
  users: User[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook personnalisé pour récupérer les utilisateurs d'une entreprise selon leur rôle
 *
 * @param companyId - L'identifiant de l'entreprise
 * @param role - Le rôle des utilisateurs à récupérer ("manager" ou "employee")
 * @returns Un objet contenant les utilisateurs, l'état de chargement, les erreurs et une fonction de rafraîchissement
 */
const useFetchCompanyUsers = (
  companyId: string,
  role: UserRole
): FetchCompanyUsersResult => {
  // États pour gérer les données, le chargement et les erreurs
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour récupérer les utilisateurs
   * Définie avec useCallback pour éviter des re-rendus inutiles
   */
  const fetchUsers = useCallback(async (): Promise<void> => {
    // Réinitialiser les états
    setLoading(true);
    setError(null);

    try {
      // Vérifier que companyId est fourni
      if (!companyId) {
        setLoading(false);
        setError("Identifiant d'entreprise manquant");
        return;
      }

      // Choisir le bon endpoint selon le rôle
      const endpoint =
        role === "employee"
          ? `/api/admin/employees?companyId=${companyId}`
          : `/api/admin/users?role=${role}&companyId=${companyId}`;

      // Effectuer la requête
      const response = await axiosInstance.get(endpoint);

      // Extraire les données selon le format de réponse
      const userData =
        role === "employee"
          ? response.data.employees || []
          : response.data.users || [];

      // Mettre à jour l'état avec les données
      setUsers(userData);
    } catch (error) {
      // Gérer les erreurs
      console.error(`Erreur lors de la récupération des ${role}s:`, error);
      setError(`Impossible de charger les ${role}s`);
    } finally {
      // Mettre fin à l'état de chargement
      setLoading(false);
    }
  }, [companyId, role]);

  // Effectuer la requête lorsque companyId ou role change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Retourner les états et la fonction de rafraîchissement
  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
};

export default useFetchCompanyUsers;
