import axios from "axios"; // ✅ Importer axios de base pour isCancel
import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  status: string;
  teamId?: string;
  companyId?: string;
  contractHoursPerWeek?: number;
  photoUrl?: string;
  email?: string;
}

interface ApiResponse {
  success: boolean;
  data: Employee[];
  message?: string;
}

const useEmployeesByTeam = (teamId: string) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour récupérer les employés depuis l'API
   * Utilisée à la fois pour le chargement initial et pour les rafraîchissements manuels
   */
  const fetchEmployees = useCallback(
    async (abortSignal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);

        let url = "";

        if (teamId) {
          url = `/api/employees/team/${teamId}`;
        } else {
          url = `/api/employees`; // Liste globale pour toutes les équipes du manager
        }

        const response = await axiosInstance.get<ApiResponse>(url, {
          signal: abortSignal,
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Erreur de récupération");
        }

        setEmployees(response.data.data);
      } catch (err) {
        if (axios.isCancel(err)) return; // ✅ ici correction

        const message = err instanceof Error ? err.message : "Erreur inconnue";
        console.error("Erreur dans useEmployeesByTeam:", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [teamId]
  );

  /**
   * Fonction exposée pour permettre le rafraîchissement manuel des données
   * Utilisée après ajout, mise à jour ou suppression d'un employé
   */
  const refetchEmployees = useCallback(async (): Promise<void> => {
    await fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const abortController = new AbortController();

    fetchEmployees(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    refetchEmployees,
  };
};

export default useEmployeesByTeam;
