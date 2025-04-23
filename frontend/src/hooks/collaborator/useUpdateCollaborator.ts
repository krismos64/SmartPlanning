/**
 * Hook useUpdateCollaborator
 *
 * Permet de mettre à jour un collaborateur existant via l'API
 * Accessible uniquement aux directeurs et managers
 */
import axios from "axios";
import { useState } from "react";
import {
  CollaboratorApiResponse,
  UpdateCollaboratorInput,
} from "../../types/Collaborator";

interface UseUpdateCollaboratorProps {
  onSuccess?: () => void;
  showToast?: (message: string, type: "success" | "error") => void;
}

/**
 * Hook pour mettre à jour un collaborateur existant
 * @param props Propriétés du hook incluant les callbacks de succès et d'affichage de toast
 * @returns Un objet contenant la fonction de mise à jour et les états associés
 */
const useUpdateCollaborator = (props?: UseUpdateCollaboratorProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  /**
   * Fonction pour mettre à jour un collaborateur
   * @param id Identifiant du collaborateur à mettre à jour
   * @param data Données de mise à jour du collaborateur
   */
  const updateCollaborator = async (
    id: string,
    data: UpdateCollaboratorInput
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

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
          "Content-Type": "application/json",
        },
      };

      // Appel à l'API pour mettre à jour le collaborateur
      const response = await axios.patch<CollaboratorApiResponse>(
        `${import.meta.env.VITE_API_URL || ""}/api/collaborators/${id}`,
        data,
        config
      );

      // Vérifier la réponse de l'API
      if (response.data.success) {
        setSuccess(true);

        // Afficher un toast de succès si la fonction est fournie
        if (props?.showToast) {
          props.showToast("Collaborateur mis à jour avec succès", "success");
        }

        // Appeler le callback de succès si fourni
        if (props?.onSuccess) {
          props.onSuccess();
        }

        return response.data.data;
      } else {
        throw new Error(
          response.data.message ||
            "Erreur lors de la mise à jour du collaborateur"
        );
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour du collaborateur:", err);

      // Gérer différents types d'erreurs
      let errorMessage =
        "Une erreur est survenue lors de la mise à jour du collaborateur";

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400) {
          errorMessage = err.response.data.message || "Données invalides";
        } else if (err.response?.status === 401) {
          errorMessage = "Vous n'êtes pas autorisé à accéder à cette ressource";
        } else if (err.response?.status === 403) {
          errorMessage =
            "Accès refusé. Votre rôle ne permet pas d'effectuer cette action";
        } else if (err.response?.status === 404) {
          errorMessage = "Collaborateur non trouvé";
        } else {
          errorMessage =
            err.response?.data?.message ||
            "Erreur lors de la communication avec le serveur";
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Afficher un toast d'erreur si la fonction est fournie
      if (props?.showToast) {
        props.showToast(errorMessage, "error");
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateCollaborator,
    loading,
    error,
    success,
  };
};

export default useUpdateCollaborator;
