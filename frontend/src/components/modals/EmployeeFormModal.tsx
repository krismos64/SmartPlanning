import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

// Composants UI
import Button from "../ui/Button";
import FileUpload from "../ui/FileUpload";
import InputField from "../ui/InputField";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Toast from "../ui/Toast";

/**
 * Interface pour les propriétés du composant EmployeeFormModal
 */
interface EmployeeFormModalProps {
  /** État d'ouverture du modal */
  isOpen: boolean;
  /** Fonction de fermeture du modal */
  onClose: () => void;
  /** Callback après ajout ou mise à jour réussie */
  onSuccess: (tempPassword?: string) => void;
  /** Données initiales (pour modification d'un employé existant) */
  initialData?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    teamId?: string;
    photoUrl?: string;
  };
  /** Options d'équipes disponibles */
  teams: { label: string; value: string }[];
  /** ID de l'entreprise */
  companyId: string;
  /** Rôle de l'utilisateur connecté pour déterminer les actions autorisées */
  userRole: string;
}

/**
 * Interface pour les données du formulaire
 */
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  teamId: string;
  photoUrl: string;
}

/**
 * Composant EmployeeFormModal
 *
 * Modal unifié permettant de créer ou modifier un employé avec:
 * - Upload de photo de profil
 * - Génération automatique de mot de passe
 * - Validation selon le rôle de l'utilisateur connecté
 */
const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  teams,
  companyId,
  userRole,
}) => {
  // Détecter s'il s'agit d'un mode édition
  const isEditMode = !!initialData?._id;

  // État du formulaire
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    role: "employee",
    teamId: "",
    photoUrl: "",
  });

  // États pour l'upload d'image
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // États pour les notifications et le chargement
  const [loading, setLoading] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // État pour le mot de passe temporaire généré
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Initialiser le formulaire avec les données existantes ou réinitialiser en mode création
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        // Mode édition: utiliser les données initiales
        setFormData({
          firstName: initialData.firstName || "",
          lastName: initialData.lastName || "",
          email: initialData.email || "",
          role: initialData.role || "employee",
          teamId: initialData.teamId || "",
          photoUrl: initialData.photoUrl || "",
        });
        setImagePreview(initialData.photoUrl || null);
      } else {
        // Mode création: réinitialiser le formulaire
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          role: "employee",
          teamId: "",
          photoUrl: "",
        });
        setImagePreview(null);
      }
      // Réinitialiser les autres états
      setSelectedFile(null);
      setTempPassword(null);
    }
  }, [isOpen, initialData, isEditMode]);

  /**
   * Gère les changements dans les champs de type input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Gère les changements pour les champs de type select
   */
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Valide le formulaire avant soumission
   */
  const validateForm = (): boolean => {
    if (!formData.firstName?.trim()) {
      setToastMessage("Le prénom est requis");
      setShowErrorToast(true);
      return false;
    }

    if (!formData.lastName?.trim()) {
      setToastMessage("Le nom est requis");
      setShowErrorToast(true);
      return false;
    }

    if (!formData.email?.trim()) {
      setToastMessage("L'email est requis");
      setShowErrorToast(true);
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setToastMessage("Format d'email invalide");
      setShowErrorToast(true);
      return false;
    }

    if (!formData.teamId) {
      setToastMessage("L'équipe est requise");
      setShowErrorToast(true);
      return false;
    }

    // Validation selon le rôle de l'utilisateur
    if (userRole === "manager" && formData.role !== "employee") {
      setToastMessage("Les managers ne peuvent créer que des employés");
      setShowErrorToast(true);
      return false;
    }

    return true;
  };

  /**
   * Upload d'image vers Cloudinary
   */
  const uploadImage = async (file: File): Promise<string> => {
    if (!file) return "";

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axiosInstance.post("/upload/public", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        return response.data.imageUrl;
      } else {
        throw new Error(
          response.data.message || "Erreur lors de l'upload de l'image"
        );
      }
    } catch (error: any) {
      setToastMessage(
        error.response?.data?.message || "Erreur lors de l'upload de l'image"
      );
      setShowErrorToast(true);
      return "";
    } finally {
      setUploadingImage(false);
    }
  };

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Upload de l'image si une image est sélectionnée
      let photoUrl = formData.photoUrl;
      if (selectedFile) {
        photoUrl = await uploadImage(selectedFile);
        if (!photoUrl) {
          setLoading(false);
          return; // Arrêter si l'upload a échoué
        }
      }

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        ...(formData.teamId && { teamId: formData.teamId }),
        ...(photoUrl && { photoUrl }),
      };

      if (isEditMode && initialData?._id) {
        // Mode édition
        await axiosInstance.patch(`/employees/${initialData._id}`, payload);
        setToastMessage("Employé mis à jour avec succès");
        setShowSuccessToast(true);
      } else {
        // Mode création - utiliser la route /create qui génère automatiquement le mot de passe
        const response = await axiosInstance.post("/employees/create", payload);

        if (response.data.success && response.data.data.tempPassword) {
          setTempPassword(response.data.data.tempPassword);
        }

        setToastMessage("Employé créé avec succès");
        setShowSuccessToast(true);
      }

      // Fermer le modal et appeler le callback de succès après un délai
      setTimeout(() => {
        onClose();
        onSuccess(tempPassword || undefined);
      }, 1500);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Une erreur est survenue";
      setToastMessage(errorMessage);
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Options de rôles selon le rôle de l'utilisateur connecté
  const getRoleOptions = () => {
    if (userRole === "directeur") {
      return [
        { value: "employee", label: "Employé" },
        { value: "manager", label: "Manager" },
      ];
    } else {
      return [{ value: "employee", label: "Employé" }];
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          tempPassword
            ? "Employé créé avec succès"
            : isEditMode
            ? "Modifier un employé"
            : "Ajouter un employé"
        }
        className="max-w-lg"
      >
        {tempPassword ? (
          // Affichage du mot de passe temporaire généré
          <div className="text-center py-6">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Employé créé avec succès !
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Le mot de passe temporaire a été généré automatiquement :
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Mot de passe temporaire :
                </p>
                <code className="text-lg font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded border text-gray-900 dark:text-white">
                  {tempPassword}
                </code>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Veuillez communiquer ce mot de passe à l'employé. Il devra le
                changer lors de sa première connexion.
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  onClose();
                  setTempPassword(null);
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          // Formulaire de création/édition
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Prénom de l'employé"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                placeholder="Entrez le prénom"
              />

              <InputField
                label="Nom de famille"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                placeholder="Entrez le nom de famille"
              />
            </div>

            <InputField
              label="Adresse email professionnelle"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="exemple@entreprise.com"
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rôle dans l'entreprise
              </label>
              <Select
                options={getRoleOptions()}
                value={formData.role}
                onChange={(value) => handleSelectChange("role", value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Équipe d'affectation
              </label>
              <Select
                options={teams}
                value={formData.teamId}
                onChange={(value) => handleSelectChange("teamId", value)}
                placeholder="Sélectionner une équipe"
              />
              {formData.role === "manager" && !formData.teamId && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                  Un manager doit être assigné à une équipe
                </p>
              )}
            </div>

            {/* Section upload de photo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photo de profil
              </label>
              <div className="flex flex-col md:flex-row items-start gap-4">
                <div className="w-full md:w-2/3">
                  <FileUpload
                    onFileSelect={(file) => setSelectedFile(file)}
                    onPreviewChange={(preview) => setImagePreview(preview)}
                    acceptedTypes="image/*"
                    maxSizeMB={2}
                    label=""
                    buttonText="Choisir une image"
                  />
                </div>
                <div className="w-full md:w-1/3 flex justify-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        aria-label="Supprimer l'image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-gray-400 dark:text-gray-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Format recommandé: JPG, PNG. Taille max: 2MB
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  onClose();
                  setSelectedFile(null);
                  setImagePreview(null);
                }}
              >
                Annuler
              </Button>

              <Button
                type="submit"
                variant="primary"
                isLoading={loading || uploadingImage}
                disabled={loading || uploadingImage}
              >
                {uploadingImage
                  ? "Upload de l'image..."
                  : isEditMode
                  ? "Mettre à jour"
                  : "Créer l'employé"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Notifications Toast */}
      <Toast
        type="success"
        message={toastMessage}
        isVisible={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
      />
      <Toast
        type="error"
        message={toastMessage}
        isVisible={showErrorToast}
        onClose={() => setShowErrorToast(false)}
      />
    </>
  );
};

export default EmployeeFormModal;
