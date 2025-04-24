import axios from "axios";
import { motion } from "framer-motion";
import { Building, Save, User, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  adminUserService,
  uploadFile,
  User as UserType,
} from "../../services/api";

// Composants UI
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import FileUpload from "../ui/FileUpload";
import InputField from "../ui/InputField";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

// Étendre l'interface User pour inclure companyId
interface ExtendedUser extends UserType {
  companyId: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onSuccess: () => void;
}

// Options pour le champ de rôle
const roleOptions = [
  { value: "admin", label: "Administrateur" },
  { value: "directeur", label: "Directeur" },
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Employé" },
];

// Interface pour les entreprises
interface Company {
  _id: string;
  name: string;
}

/**
 * Modal de modification des informations d'un utilisateur
 */
const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  // États pour le formulaire et le chargement
  const [formData, setFormData] = useState<Partial<ExtendedUser>>({
    firstName: "",
    lastName: "",
    email: "",
    role: "employee",
    companyId: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyLoading, setCompanyLoading] = useState<boolean>(false);

  // Chargement des entreprises
  useEffect(() => {
    const fetchCompanies = async () => {
      setCompanyLoading(true);
      try {
        const response = await axios.get("/api/admin/companies");
        setCompanies(response.data || []);
      } catch (err) {
        console.error("Erreur lors du chargement des entreprises:", err);
      } finally {
        setCompanyLoading(false);
      }
    };

    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);

  // Effet pour préremplir le formulaire quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyId: (user as any).companyId || "",
      });
      setPreviewUrl(user.photoUrl || null);
    }
  }, [user]);

  /**
   * Gestion du changement des champs du formulaire
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Effacer l'erreur si l'utilisateur modifie le champ
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /**
   * Gestion du changement du rôle dans le formulaire
   */
  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value as UserType["role"],
    }));

    if (formErrors.role) {
      setFormErrors((prev) => ({
        ...prev,
        role: "",
      }));
    }
  };

  /**
   * Gestion du changement de l'entreprise
   */
  const handleCompanyChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      companyId: value,
    }));

    if (formErrors.companyId) {
      setFormErrors((prev) => ({
        ...prev,
        companyId: "",
      }));
    }
  };

  /**
   * Gestion de la sélection d'un fichier photo
   */
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // Effacer l'erreur liée à la photo
    if (formErrors.photo) {
      setFormErrors((prev) => ({
        ...prev,
        photo: "",
      }));
    }
  };

  /**
   * Gestion du changement de l'aperçu de la photo
   */
  const handlePreviewChange = (url: string | null) => {
    setPreviewUrl(url);
  };

  /**
   * Upload de la photo vers Cloudinary
   */
  const uploadPhoto = async (): Promise<string | undefined> => {
    if (!selectedFile) return undefined;

    try {
      setUploadLoading(true);
      const photoUrl = await uploadFile(selectedFile);
      setUploadLoading(false);
      return photoUrl;
    } catch (err) {
      setUploadLoading(false);
      throw err;
    }
  };

  /**
   * Validation du formulaire
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!formData.firstName?.trim()) {
      errors.firstName = "Le prénom est requis";
      isValid = false;
    }

    if (!formData.lastName?.trim()) {
      errors.lastName = "Le nom est requis";
      isValid = false;
    }

    if (!formData.email?.trim()) {
      errors.email = "L'email est requis";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Format d'email invalide";
      isValid = false;
    }

    if (!formData.role) {
      errors.role = "Le rôle est requis";
      isValid = false;
    }

    if (!formData.companyId) {
      errors.companyId = "L'entreprise est requise";
      isValid = false;
    }

    // Valider le fichier photo si sélectionné
    if (selectedFile) {
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (selectedFile.size > maxSize) {
        errors.photo = "La taille de l'image ne doit pas dépasser 2MB";
        isValid = false;
      }

      const acceptedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!acceptedTypes.includes(selectedFile.type)) {
        errors.photo =
          "Format d'image non pris en charge (JPEG, PNG, GIF, WebP uniquement)";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  /**
   * Soumission du formulaire de modification
   */
  const handleSubmit = async () => {
    if (!user?._id) return;

    // Validation du formulaire
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Si une nouvelle photo est sélectionnée, l'uploader d'abord
      let photoUrl: string | undefined;
      if (selectedFile) {
        try {
          photoUrl = await uploadPhoto();
        } catch (error) {
          setLoading(false);
          throw error;
        }
      }

      // Créer l'objet de données à mettre à jour
      const updateData: Partial<ExtendedUser> = {
        ...formData,
      };

      // N'inclure photoUrl que si une nouvelle photo a été uploadée
      // ou si on a explicitement cliqué sur un bouton pour supprimer la photo
      if (
        photoUrl !== undefined ||
        (selectedFile === null && previewUrl === null)
      ) {
        updateData.photoUrl = photoUrl;
      }

      // Envoyer les données à l'API
      await adminUserService.updateUser(user._id, updateData);

      // Fermer la modale et déclencher le callback de succès
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Transformer les entreprises en options pour le select
  const companyOptions = companies.map((company) => ({
    value: company._id,
    label: company.name,
  }));

  // Animation de la modale avec Framer Motion
  const modalAnimation = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier l'utilisateur"
      className="bg-white dark:bg-gray-900 text-gray-900 dark:text-indigo-300 rounded-2xl shadow-xl max-w-2xl w-full"
    >
      <motion.div
        className="space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto py-2"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalAnimation}
      >
        {/* Photo de profil */}
        <div className="flex flex-col items-center mb-6">
          <Avatar
            src={previewUrl}
            size="xl"
            className="mb-4 border-2 border-indigo-600 dark:border-indigo-400 shadow-lg"
          />

          <FileUpload
            label="Photo de profil"
            onFileSelect={handleFileSelect}
            onPreviewChange={handlePreviewChange}
            acceptedTypes="image/jpeg,image/png,image/gif,image/webp"
            maxSizeMB={2}
            error={formErrors.photo}
            className="text-gray-700 dark:text-sky-300"
          />
        </div>

        {/* Prénom et nom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Prénom"
            name="firstName"
            value={formData.firstName || ""}
            onChange={handleInputChange}
            required
            error={formErrors.firstName}
            className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            icon={
              <User size={18} className="text-indigo-600 dark:text-sky-300" />
            }
          />

          <InputField
            label="Nom"
            name="lastName"
            value={formData.lastName || ""}
            onChange={handleInputChange}
            required
            error={formErrors.lastName}
            className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            icon={
              <User size={18} className="text-indigo-600 dark:text-sky-300" />
            }
          />
        </div>

        {/* Entreprise */}
        <div className="relative">
          <Select
            label="Entreprise"
            options={companyOptions}
            value={formData.companyId || ""}
            onChange={handleCompanyChange}
            icon={
              <Building
                size={18}
                className="text-indigo-600 dark:text-sky-300"
              />
            }
            className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
          {formErrors.companyId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {formErrors.companyId}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Sélectionnez l'entreprise à laquelle appartient l'utilisateur.
          </p>
          {companyLoading && (
            <div className="absolute right-2 top-10">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Email */}
        <InputField
          label="Email"
          name="email"
          type="email"
          value={formData.email || ""}
          onChange={handleInputChange}
          required
          error={formErrors.email}
          className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        />

        {/* Rôle */}
        <div className="relative">
          <Select
            label="Rôle"
            options={roleOptions}
            value={formData.role || "employee"}
            onChange={handleRoleChange}
            icon={
              <User size={18} className="text-indigo-600 dark:text-sky-300" />
            }
            className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
          {formErrors.role && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {formErrors.role}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            icon={<X size={18} className="text-gray-600 dark:text-gray-300" />}
            className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            icon={<Save size={18} />}
            isLoading={loading || uploadLoading}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
          >
            Enregistrer
          </Button>
        </div>
      </motion.div>
    </Modal>
  );
};

export default EditUserModal;
