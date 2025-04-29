import { Building, Clock, Lock, Mail, User } from "lucide-react";
import React, { useEffect, useState } from "react";

// Composants UI
import Button from "../ui/Button";
import InputField from "../ui/InputField";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Toast from "../ui/Toast";

// Hook pour les actions sur les employés
import useEmployeeActions, {
  NewEmployeeData,
} from "../../hooks/useEmployeeActions";

/**
 * Interface pour les propriétés du composant CollaboratorFormModal
 */
interface CollaboratorFormModalProps {
  /** État d'ouverture du modal */
  isOpen: boolean;
  /** Fonction de fermeture du modal */
  onClose: () => void;
  /** Callback après ajout ou mise à jour réussie */
  onSuccess: (isEditMode: boolean) => void;
  /** Données initiales (pour modification d'un collaborateur existant) */
  initialData?: Partial<NewEmployeeData & { _id?: string }>;
  /** Options d'équipes disponibles */
  teams: { label: string; value: string }[];
  /** ID de l'entreprise */
  companyId: string;
}

/**
 * Interface pour les erreurs de formulaire
 */
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  teamId?: string;
  contractHoursPerWeek?: string;
  status?: string;
}

/**
 * Composant CollaboratorFormModal
 *
 * Modal permettant de créer ou modifier un collaborateur avec validation
 * et intégration du hook useEmployeeActions.
 */
const CollaboratorFormModal: React.FC<CollaboratorFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  teams,
  companyId,
}) => {
  // Détecter s'il s'agit d'un mode édition
  const isEditMode = !!initialData?._id;

  // État du formulaire
  const [formData, setFormData] = useState<Partial<NewEmployeeData>>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    teamId: "",
    contractHoursPerWeek: 40,
    status: "actif",
    companyId: "",
  });

  // État des erreurs de validation
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // État de chargement
  const [loading, setLoading] = useState<boolean>(false);

  // États pour les notifications
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Récupération des actions du hook
  const { addEmployee, updateEmployee } = useEmployeeActions();

  // Initialiser le formulaire avec les données existantes ou réinitialiser en mode création
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        // Mode édition: utiliser les données initiales
        setFormData({
          firstName: initialData.firstName || "",
          lastName: initialData.lastName || "",
          email: initialData.email || "",
          teamId: initialData.teamId || "",
          contractHoursPerWeek: initialData.contractHoursPerWeek || 40,
          status: initialData.status || "actif",
          companyId: companyId, // Toujours utiliser l'ID d'entreprise fourni
          // En mode édition, le mot de passe est vide par défaut
          password: "",
        });
      } else {
        // Mode création: réinitialiser le formulaire
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          teamId: "",
          contractHoursPerWeek: 40,
          status: "actif",
          companyId: companyId,
        });
      }
      // Réinitialiser les erreurs
      setFormErrors({});
    }
  }, [isOpen, initialData, isEditMode, companyId]);

  /**
   * Gère les changements dans les champs de type input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "contractHoursPerWeek" ? Number(value) : value,
    }));

    // Effacer l'erreur pour ce champ si elle existe
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  /**
   * Gère les changements pour les champs de type select
   */
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Effacer l'erreur pour ce champ si elle existe
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  /**
   * Valide le formulaire avant soumission
   * @returns true si le formulaire est valide
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Valider prénom
    if (!formData.firstName?.trim()) {
      errors.firstName = "Le prénom est requis";
      isValid = false;
    }

    // Valider nom
    if (!formData.lastName?.trim()) {
      errors.lastName = "Le nom est requis";
      isValid = false;
    }

    // Valider email
    if (!formData.email?.trim()) {
      errors.email = "L'email est requis";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format d'email invalide";
      isValid = false;
    }

    // Valider mot de passe selon le mode
    if (!isEditMode) {
      // En mode création: mot de passe obligatoire
      if (!formData.password?.trim()) {
        errors.password = "Le mot de passe est requis";
        isValid = false;
      } else if (formData.password.length < 6) {
        errors.password = "Le mot de passe doit contenir au moins 6 caractères";
        isValid = false;
      }
    } else {
      // En mode édition: mot de passe optionnel, mais validé s'il est rempli
      if (
        formData.password &&
        formData.password.trim().length > 0 &&
        formData.password.length < 6
      ) {
        errors.password = "Le mot de passe doit contenir au moins 6 caractères";
        isValid = false;
      }
    }

    // Valider équipe
    if (!formData.teamId) {
      errors.teamId = "L'équipe est requise";
      isValid = false;
    }

    // Valider heures contractuelles
    if (!formData.contractHoursPerWeek) {
      errors.contractHoursPerWeek = "Les heures contractuelles sont requises";
      isValid = false;
    } else if (
      formData.contractHoursPerWeek < 1 ||
      formData.contractHoursPerWeek > 168
    ) {
      errors.contractHoursPerWeek = "Les heures doivent être entre 1 et 168";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Copier les données du formulaire pour éviter de modifier l'état directement
      const dataToSubmit = { ...formData };

      // En mode édition, si le mot de passe est vide, le supprimer des données à envoyer
      if (
        isEditMode &&
        (!dataToSubmit.password || dataToSubmit.password.trim() === "")
      ) {
        delete dataToSubmit.password;
      }

      if (isEditMode && initialData?._id) {
        // Mode édition
        await updateEmployee(initialData._id, dataToSubmit);
        setToastMessage("Collaborateur mis à jour avec succès");
      } else {
        // Mode création
        await addEmployee(dataToSubmit as NewEmployeeData);
        setToastMessage("Collaborateur ajouté avec succès");
      }

      setShowSuccessToast(true);

      // Fermer le modal et appeler le callback de succès
      setTimeout(() => {
        onClose();
        onSuccess(isEditMode);
      }, 1500);
    } catch (error: any) {
      setToastMessage(error.message || "Une erreur est survenue");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          isEditMode ? "Modifier un collaborateur" : "Ajouter un collaborateur"
        }
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prénom */}
            <InputField
              label="Prénom"
              name="firstName"
              value={formData.firstName || ""}
              onChange={handleInputChange}
              required
              icon={<User size={18} className="text-[var(--accent-primary)]" />}
              error={formErrors.firstName}
            />

            {/* Nom */}
            <InputField
              label="Nom"
              name="lastName"
              value={formData.lastName || ""}
              onChange={handleInputChange}
              required
              icon={<User size={18} className="text-[var(--accent-primary)]" />}
              error={formErrors.lastName}
            />
          </div>

          {/* Email */}
          <InputField
            label="Email"
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={handleInputChange}
            required
            icon={<Mail size={18} className="text-[var(--accent-primary)]" />}
            error={formErrors.email}
          />

          {/* Mot de passe - adaptation selon le mode */}
          <InputField
            label={
              isEditMode ? "Nouveau mot de passe (optionnel)" : "Mot de passe"
            }
            name="password"
            type="password"
            value={formData.password || ""}
            onChange={handleInputChange}
            required={!isEditMode} // Obligatoire uniquement en mode création
            placeholder={
              isEditMode
                ? "Laisser vide pour conserver le mot de passe actuel"
                : ""
            }
            icon={<Lock size={18} className="text-[var(--accent-primary)]" />}
            error={formErrors.password}
            helperText={
              isEditMode
                ? "Minimum 6 caractères si modifié"
                : "Minimum 6 caractères"
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Équipe */}
            <div>
              <Select
                label="Équipe"
                options={teams}
                value={formData.teamId || ""}
                onChange={(value) => handleSelectChange("teamId", value)}
                icon={
                  <Building
                    size={18}
                    className="text-[var(--accent-primary)]"
                  />
                }
              />
              {formErrors.teamId && (
                <p className="mt-1 text-xs text-red-500">{formErrors.teamId}</p>
              )}
            </div>

            {/* Heures contractuelles */}
            <InputField
              label="Heures contractuelles par semaine"
              name="contractHoursPerWeek"
              type="number"
              value={formData.contractHoursPerWeek?.toString() || ""}
              onChange={handleInputChange}
              required
              icon={
                <Clock size={18} className="text-[var(--accent-primary)]" />
              }
              error={formErrors.contractHoursPerWeek}
              helperText="Entre 1 et 168 heures"
            />
          </div>

          {/* Statut */}
          <div>
            <Select
              label="Statut"
              options={[
                { label: "Actif", value: "actif" },
                { label: "Inactif", value: "inactif" },
              ]}
              value={formData.status || "actif"}
              onChange={(value) => handleSelectChange("status", value)}
            />
            {formErrors.status && (
              <p className="mt-1 text-xs text-red-500">{formErrors.status}</p>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" isLoading={loading} disabled={loading}>
              {isEditMode ? "Mettre à jour" : "Ajouter"}
            </Button>
          </div>
        </form>
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

export default CollaboratorFormModal;
