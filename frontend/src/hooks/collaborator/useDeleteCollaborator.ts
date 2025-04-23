/**
 * Hook useDeleteCollaborator
 *
 * Permet de supprimer un collaborateur existant via l'API
 * Accessible uniquement aux directeurs et managers
 */
import axios from "axios";
import { useState } from "react";

interface UseDeleteCollaboratorProps {
  onSuccess?: () => void;
  showToast?: (message: string, type: "success" | "error") => void;
}

/**
 * Hook pour supprimer un collaborateur existant
 * @param props Propriétés du hook incluant les callbacks de succès et d'affichage de toast
 * @returns Un objet contenant la fonction de suppression et les états associés
 */
const useDeleteCollaborator = (props?: UseDeleteCollaboratorProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  /**
   * Fonction pour supprimer un collaborateur
   * @param id Identifiant du collaborateur à supprimer
   */
  const deleteCollaborator = async (id: string) => {
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
        },
      };

      // Appel à l'API pour supprimer le collaborateur
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL || ""}/api/collaborators/${id}`,
        config
      );

      // Vérifier la réponse de l'API (204 No Content attendu)
      if (response.status === 204) {
        setSuccess(true);

        // Afficher un toast de succès si la fonction est fournie
        if (props?.showToast) {
          props.showToast("Collaborateur supprimé avec succès", "success");
        }

        // Appeler le callback de succès si fourni
        if (props?.onSuccess) {
          props.onSuccess();
        }

        return true;
      } else {
        throw new Error("Erreur lors de la suppression du collaborateur");
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du collaborateur:", err);

      // Gérer différents types d'erreurs
      let errorMessage =
        "Une erreur est survenue lors de la suppression du collaborateur";

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
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

      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteCollaborator,
    loading,
    error,
    success,
  };
};

export default useDeleteCollaborator;
