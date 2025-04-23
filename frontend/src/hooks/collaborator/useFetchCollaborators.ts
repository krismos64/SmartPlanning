/**
 * Hook useFetchCollaborators
 *
 * Permet de récupérer la liste des collaborateurs depuis l'API
 * Accessible uniquement aux directeurs et managers
 */
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import {
  Collaborator,
  CollaboratorsApiResponse,
} from "../../types/Collaborator";

/**
 * Hook pour récupérer la liste des collaborateurs
 * @returns Un objet contenant les collaborateurs, l'état de chargement et les erreurs éventuelles
 */
const useFetchCollaborators = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour récupérer les collaborateurs depuis l'API
   */
  const fetchCollaborators = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Vérifier si le token d'authentification est présent
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      // Configuration des en-têtes avec le token
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Appel à l'API pour récupérer les collaborateurs
      const response = await axios.get<CollaboratorsApiResponse>(
        `${import.meta.env.VITE_API_URL || ""}/api/collaborators`,
        config
      );

      // Vérifier la réponse de l'API
      if (response.data.success) {
        setCollaborators(response.data.data);
      } else {
        throw new Error(
          response.data.message ||
            "Erreur lors de la récupération des collaborateurs"
        );
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des collaborateurs:", err);

      // Gérer différents types d'erreurs
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError("Vous n'êtes pas autorisé à accéder à cette ressource");
        } else if (err.response?.status === 403) {
          setError(
            "Accès refusé. Votre rôle ne permet pas d'effectuer cette action"
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Erreur lors de la communication avec le serveur"
          );
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur inconnue est survenue");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les collaborateurs au montage du composant
  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  return {
    collaborators,
    loading,
    error,
    refetch: fetchCollaborators,
  };
};

export default useFetchCollaborators;
