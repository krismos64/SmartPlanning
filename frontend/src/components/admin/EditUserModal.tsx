import { motion } from "framer-motion";
import { Building, Save, User, Users, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
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
import SelectMulti from "../ui/SelectMulti";

// Étendre l'interface User pour inclure companyId
interface ExtendedUser extends UserType {
  companyId: string;
  teamId?: string;
  teamIds?: string[]; // Pour les managers avec plusieurs équipes
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

// Interface pour les équipes
interface Team {
  _id: string;
  name: string;
  managerIds?: string[];
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
    teamId: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyLoading, setCompanyLoading] = useState<boolean>(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState<boolean>(false);

  // Chargement des entreprises
  useEffect(() => {
    const fetchCompanies = async () => {
      setCompanyLoading(true);
      try {
        const response = await axiosInstance.get("/api/admin/companies");
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

  // Chargement des équipes disponibles lorsque l'entreprise est sélectionnée
  useEffect(() => {
    const fetchTeams = async () => {
      if (!formData.companyId) return;

      setTeamsLoading(true);
      try {
        const response = await axiosInstance.get(
          `/api/admin/teams?companyId=${formData.companyId}`
        );
        const teamData = response.data.data || response.data.teams || [];
        setTeams(teamData);
      } catch (err) {
        console.error("Erreur lors du chargement des équipes:", err);
      } finally {
        setTeamsLoading(false);
      }
    };

    fetchTeams();
  }, [formData.companyId]);

  // Effet pour préremplir le formulaire quand l'utilisateur change
  useEffect(() => {
    if (user) {
      // Récupérer les équipes de l'utilisateur selon son rôle
      const getUserTeams = async () => {
        try {
          // Si l'utilisateur n'a pas de companyId, on ne peut pas récupérer ses équipes
          if (!(user as any).companyId) return { teamId: "", managedTeams: [] };

          const companyId = String((user as any).companyId);
          const userId = user._id;

          // Pour les employés: chercher le teamId
          if (user.role === "employee") {
            // Obtenir les détails de l'employé par son userId
            const response = await axiosInstance.get(
              `/api/admin/employees/withteams?companyId=${companyId}`
            );
            const employeesData = response.data.data || [];

            // Trouver l'employé correspondant à cet utilisateur
            const matchingEmployee = employeesData.find(
              (emp: any) => emp.userId && String(emp.userId) === String(userId)
            );

            if (matchingEmployee) {
              // Si l'employé a une équipe associée, utiliser la première
              if (matchingEmployee.teams && matchingEmployee.teams.length > 0) {
                return {
                  teamId: matchingEmployee.teams[0]._id,
                  managedTeams: [],
                };
              } else if (matchingEmployee.teamId) {
                return { teamId: matchingEmployee.teamId, managedTeams: [] };
              }
            }
          }
          // Pour les managers: récupérer les équipes qu'ils gèrent
          else if (user.role === "manager") {
            const teamsResponse = await axiosInstance.get(
              `/api/admin/teams?companyId=${companyId}`
            );
            const allTeams = teamsResponse.data.data || [];

            // Filtrer les équipes où l'utilisateur est manager
            const managedTeams = allTeams.filter((team: any) => {
              if (!team.managerIds || !Array.isArray(team.managerIds))
                return false;

              return team.managerIds.some((manager: any) => {
                // Si managerIds est un tableau d'objets
                if (typeof manager === "object" && manager._id) {
                  return String(manager._id) === String(userId);
                }
                // Si managerIds est un tableau de strings
                return String(manager) === String(userId);
              });
            });

            return {
              teamId: managedTeams.length > 0 ? managedTeams[0]._id : "",
              managedTeams: managedTeams,
            };
          }

          return { teamId: "", managedTeams: [] };
        } catch (err) {
          console.error("Erreur lors de la récupération des équipes:", err);
          return { teamId: "", managedTeams: [] };
        }
      };

      const initUserData = async () => {
        const { teamId, managedTeams } = await getUserTeams();

        setFormData({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          companyId: (user as any).companyId || "",
          teamId: teamId,
          teamIds:
            user.role === "manager" && managedTeams.length > 0
              ? managedTeams.map((team: any) => team._id)
              : [],
        });

        // Si c'est un manager, stocker les équipes qu'il gère
        if (user.role === "manager" && managedTeams.length > 0) {
          setTeams(managedTeams);
        }

        setPreviewUrl(user.photoUrl || null);
      };

      initUserData();
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
      // Réinitialiser le teamId si l'entreprise change
      teamId: "",
    }));

    if (formErrors.companyId) {
      setFormErrors((prev) => ({
        ...prev,
        companyId: "",
      }));
    }
  };

  /**
   * Gestion du changement d'équipe
   */
  const handleTeamChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      teamId: value,
    }));

    if (formErrors.teamId) {
      setFormErrors((prev) => ({
        ...prev,
        teamId: "",
      }));
    }
  };

  /**
   * Gestion du changement d'équipes multiples (pour les managers)
   */
  const handleTeamMultiChange = (values: string[]) => {
    setFormData((prev) => ({
      ...prev,
      teamIds: values,
      // Si une seule équipe est sélectionnée, on l'utilise aussi pour teamId pour compatibilité
      teamId: values.length === 1 ? values[0] : undefined,
    }));

    if (formErrors.teamId) {
      setFormErrors((prev) => ({
        ...prev,
        teamId: "",
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

      // Envoyer les données à l'API pour mettre à jour l'utilisateur
      await adminUserService.updateUser(user._id, updateData);

      // Gérer les associations d'équipe selon le rôle
      if (formData.teamId) {
        try {
          // Pour les employés
          if (formData.role === "employee") {
            // Chercher l'employé correspondant à cet utilisateur
            const empResponse = await axiosInstance.get(
              `/api/admin/employees/withteams?companyId=${formData.companyId}`
            );
            const employeesData = empResponse.data.data || [];
            const matchingEmployee = employeesData.find(
              (emp: any) =>
                emp.userId && String(emp.userId) === String(user._id)
            );

            if (matchingEmployee) {
              // Mettre à jour l'employé avec le nouveau teamId
              await axiosInstance.patch(
                `/api/admin/employees/${matchingEmployee._id}`,
                {
                  teamId: formData.teamId,
                }
              );

              // Si l'employé n'est pas déjà dans les employeeIds de l'équipe, l'ajouter
              const teamResponse = await axiosInstance.get(
                `/api/admin/teams/${formData.teamId}`
              );
              const teamData = teamResponse.data.data || teamResponse.data;

              if (
                teamData &&
                (!teamData.employeeIds ||
                  !teamData.employeeIds.includes(matchingEmployee._id))
              ) {
                // Ajouter l'employé à l'équipe
                await axiosInstance.patch(
                  `/api/admin/teams/${formData.teamId}/employees`,
                  {
                    employeeId: matchingEmployee._id,
                    action: "add",
                  }
                );
              }
            }
          }
          // Pour les managers, on peut ajouter une logique pour les associer comme managers d'équipes
          else if (formData.role === "manager") {
            // Utiliser teamIds pour les managers (sélection multiple)
            const teamsToAssign =
              formData.teamIds && formData.teamIds.length > 0
                ? formData.teamIds
                : formData.teamId
                ? [formData.teamId]
                : [];

            console.log(
              `🔄 Association du manager à ${teamsToAssign.length} équipes`
            );

            // Parcourir toutes les équipes sélectionnées
            for (const teamId of teamsToAssign) {
              // Si l'équipe sélectionnée est valide
              if (teamId) {
                const teamResponse = await axiosInstance.get(
                  `/api/admin/teams/${teamId}`
                );
                const teamData = teamResponse.data.data || teamResponse.data;

                // Vérifier que le manager n'est pas déjà dans la liste des managers
                if (teamData && teamData.managerIds) {
                  const isAlreadyManager = teamData.managerIds.some(
                    (managerId: any) => {
                      if (typeof managerId === "object" && managerId._id) {
                        return String(managerId._id) === String(user._id);
                      }
                      return String(managerId) === String(user._id);
                    }
                  );

                  // Si le manager n'est pas déjà dans la liste des managers, l'ajouter
                  if (!isAlreadyManager) {
                    const updatedManagerIds = [
                      ...(Array.isArray(teamData.managerIds)
                        ? teamData.managerIds
                        : []),
                    ];
                    // Si managerIds contient des objets, extraire les IDs
                    const managerIdsToSend = updatedManagerIds.map((m: any) =>
                      typeof m === "object" && m._id ? m._id : m
                    );

                    // Ajouter le manager à l'équipe
                    await axiosInstance.patch(`/api/admin/teams/${teamId}`, {
                      managerIds: [...managerIdsToSend, user._id],
                    });
                    console.log(`✅ Manager ajouté à l'équipe ${teamId}`);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("Erreur lors de la mise à jour de l'équipe:", err);
          // Continuer même en cas d'erreur d'association à l'équipe
        }
      }

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

  // Transformer les équipes en options pour le select
  const teamOptions = [
    { value: "", label: "-- Sélectionner une équipe --" },
    ...teams.map((team) => ({
      value: team._id,
      label: team.name,
    })),
  ];

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
      className="bg-white dark:bg-gray-900 text-gray-900 dark:text-indigo-300 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-visible"
    >
      <motion.div
        className={`space-y-6 ${
          companyLoading ? "opacity-70" : ""
        } max-h-[calc(90vh-6rem)] overflow-y-auto pr-2`}
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
        <Select
          options={companyOptions}
          value={formData.companyId || ""}
          onChange={handleCompanyChange}
          label="Entreprise"
          icon={
            <Building size={18} className="text-indigo-600 dark:text-white" />
          }
        />

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
        <Select
          options={roleOptions}
          value={formData.role || "employee"}
          onChange={handleRoleChange}
          label="Rôle"
          icon={<User size={18} className="text-indigo-600 dark:text-white" />}
        />

        {/* Équipe - affiché uniquement pour les employés et managers */}
        {(formData.role === "employee" || formData.role === "manager") &&
          formData.companyId && (
            <div className="relative">
              {formData.role === "manager" ? (
                <SelectMulti
                  label="Équipes gérées"
                  options={teams.map((team) => ({
                    value: team._id,
                    label: team.name,
                  }))}
                  value={formData.teamIds || []}
                  onChange={handleTeamMultiChange}
                  placeholder="Sélectionner une ou plusieurs équipes..."
                  className="text-gray-700 dark:text-white"
                />
              ) : (
                <Select
                  options={teamOptions}
                  value={formData.teamId || ""}
                  onChange={handleTeamChange}
                  label="Équipe"
                  icon={
                    <Users
                      size={18}
                      className="text-indigo-600 dark:text-white"
                    />
                  }
                />
              )}
              {formErrors.teamId && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {formErrors.teamId}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.role === "manager"
                  ? "Sélectionnez les équipes que ce manager va gérer."
                  : "Sélectionnez l'équipe à laquelle cet employé appartiendra."}
              </p>
              {teamsLoading && (
                <div className="absolute right-2 top-10">
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                </div>
              )}
            </div>
          )}

        {/* Message pour les rôles admin et directeur */}
        {(formData.role === "admin" || formData.role === "directeur") && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <Users
                size={18}
                className="text-indigo-600 dark:text-indigo-300 mr-2"
              />
              Les {formData.role === "admin" ? "administrateurs" : "directeurs"}{" "}
              ne sont pas associés à des équipes spécifiques.
            </p>
          </div>
        )}

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
