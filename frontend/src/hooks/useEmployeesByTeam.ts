import axios from "axios"; // ✅ Importer axios de base pour isCancel
import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "./useAuth";

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

/**
 * Fonction simple pour vérifier si une chaîne est un ObjectId MongoDB valide
 * @param id Chaîne à vérifier
 * @returns true si la chaîne semble être un ObjectId valide
 */
const isValidObjectId = (id?: string): boolean => {
  if (!id) return false;
  // Un ObjectId MongoDB est une chaîne hexadécimale de 24 caractères
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const useEmployeesByTeam = (teamId: string) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Récupérer l'utilisateur authentifié pour connaître son rôle

  /**
   * Fonction pour récupérer les employés depuis l'API
   * Utilisée à la fois pour le chargement initial et pour les rafraîchissements manuels
   */
  const fetchEmployees = useCallback(
    async (abortSignal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);

        let url = `/employees`;

        if (teamId && teamId !== "all") {
          url = `/employees/team/${teamId}`;
        }

        const response = await axiosInstance.get<ApiResponse>(url, {
          signal: abortSignal,
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Erreur de récupération");
        }

        setEmployees(response.data.data || []);
      } catch (err) {
        if (axios.isCancel(err)) return;

        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [teamId, user]
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
