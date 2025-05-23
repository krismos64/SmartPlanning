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

        let url = "";
        const userRole = user?.role?.toLowerCase();
        const companyId = user?.companyId;

        console.log(
          `[useEmployeesByTeam] User role: ${userRole}, companyId: ${companyId}`
        );

        // Déterminer l'URL appropriée en fonction du contexte
        if (teamId) {
          // Si on a un teamId spécifique, utiliser la route par équipe
          url = `/employees/team/${teamId}`;
          console.log(
            `[useEmployeesByTeam] Récupération des employés pour l'équipe: ${teamId}`
          );
        } else if (userRole === "directeur" && isValidObjectId(companyId)) {
          // Si directeur, utiliser la route par companyId qui est plus performante
          // Mais seulement si le companyId est valide
          url = `/employees/company/${companyId}`;
          console.log(
            `[useEmployeesByTeam] Directeur: récupération des employés pour l'entreprise: ${companyId}`
          );
        } else {
          // Pour les autres cas (admin, manager, employé), utiliser la route générique
          url = `/employees`;
          console.log(
            `[useEmployeesByTeam] Récupération des employés avec filtrage automatique par rôle: ${userRole}`
          );
        }

        console.log(`[useEmployeesByTeam] URL d'appel API: ${url}`);

        const response = await axiosInstance.get<ApiResponse>(url, {
          signal: abortSignal,
        });

        if (!response.data.success) {
          console.error(`[useEmployeesByTeam] Erreur API:`, response.data);
          throw new Error(response.data.message || "Erreur de récupération");
        }

        console.log(
          `[useEmployeesByTeam] ${response.data.data.length} employés récupérés:`,
          response.data.data.map(
            (e) => `${e.firstName} ${e.lastName} (${e._id})`
          )
        );
        setEmployees(response.data.data);
      } catch (err) {
        if (axios.isCancel(err)) return; // ✅ ici correction

        const message = err instanceof Error ? err.message : "Erreur inconnue";
        console.error("[useEmployeesByTeam] Erreur détaillée:", err);
        console.error(
          `[useEmployeesByTeam] Erreur lors de la récupération des employés:`,
          message
        );
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
