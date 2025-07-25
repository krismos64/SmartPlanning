import axios from "axios";
import { Key } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import SEO from "../components/layout/SEO";
import { useTheme } from "../components/ThemeProvider";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import FileUpload from "../components/ui/FileUpload";
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PasswordField from "../components/ui/PasswordField";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useProfileUpdate } from "../hooks/useProfileUpdate";
import api from "../services/api";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const UserProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { showSuccessToast, showErrorToast, toast, hideToast } = useToast();
  const { isDarkMode } = useTheme();
  const { updateProfilePhoto, updateProfile } = useProfileUpdate();

  // État pour les données utilisateur modifiables
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    photoUrl: "",
  });

  // État pour suivre si le formulaire a été modifié
  const [isFormModified, setIsFormModified] = useState(false);

  // État pour le chargement de la page
  const [isLoading, setIsLoading] = useState(true);

  // État pour les données d'entreprise et d'équipes (pour l'affichage bonus)
  const [companyName, setCompanyName] = useState<string>("");
  const [teams, setTeams] = useState<string[]>([]);

  // État pour l'upload de photo
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // État pour le changement de mot de passe
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordModified, setPasswordModified] = useState(false);

  // État pour le chargement des opérations
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Injecter un style global pour forcer les inputs en mode sombre
  useEffect(() => {
    const styleId = "dark-mode-inputs-style";
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (isDarkMode) {
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = `
        /* Forcer le style des inputs en mode sombre */
        .dark input[type="text"],
        .dark input[type="email"],
        .dark input[type="password"],
        .dark input[type="tel"],
        .dark textarea {
          background-color: #1A2234 !important;
          color: white !important;
          border-color: #4a5568 !important;
          -webkit-text-fill-color: white !important;
          caret-color: white !important;
        }
        
        /* Styles spécifiques pour l'auto-remplissage WebKit (Chrome, Safari) */
        .dark input:-webkit-autofill,
        .dark input:-webkit-autofill:hover,
        .dark input:-webkit-autofill:focus,
        .dark input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #1A2234 inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: white !important;
          border-color: #4a5568 !important;
        }
      `;
    } else {
      if (styleElement) {
        styleElement.remove();
      }
    }

    return () => {
      if (document.getElementById(styleId)) {
        document.getElementById(styleId)?.remove();
      }
    };
  }, [isDarkMode]);

  // Charger les données du profil utilisateur
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);

        // Charger les informations de l'utilisateur
        const userResponse = await api.get("/users/me");
        const userData = userResponse.data.data || userResponse.data;

        // Initialiser le formulaire avec les données reçues
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          photoUrl: userData.photoUrl || "",
        });

        setPreviewUrl(userData.photoUrl || null);

        // Récupérer les informations complémentaires (entreprise, équipes)
        if (userData.companyId) {
          try {
            // Utiliser la route companies/me pour récupérer les informations de l'entreprise
            const companyResponse = await api.get(`/companies/me`);
            if (companyResponse.data.success) {
              setCompanyName(companyResponse.data.data.name || "");
            } else {
              setCompanyName(companyResponse.data.name || "");
            }
          } catch (error) {
            console.error(
              "Erreur lors de la récupération de l'entreprise:",
              error
            );
            // Si l'accès à l'API échoue, au moins afficher l'ID de l'entreprise
            setCompanyName(`ID: ${userData.companyId}`);
          }
        }

        if (userData.teamIds && userData.teamIds.length > 0) {
          try {
            // Récupérer les noms des équipes une par une
            const teamNames = [];
            for (const teamId of userData.teamIds) {
              try {
                const teamResponse = await api.get(`/teams/${teamId}`);
                // Vérifier si la réponse contient les données de l'équipe
                if (teamResponse.data && teamResponse.data.data) {
                  teamNames.push(
                    teamResponse.data.data.name ||
                      `Équipe ${teamId.substr(0, 8)}...`
                  );
                } else if (teamResponse.data && teamResponse.data.name) {
                  teamNames.push(teamResponse.data.name);
                } else {
                  teamNames.push(`Équipe ${teamId.substr(0, 8)}...`);
                }
              } catch (error) {
                console.error(
                  `Erreur lors de la récupération de l'équipe ${teamId}:`,
                  error
                );
                // En cas d'erreur, afficher l'ID de l'équipe
                teamNames.push(`Équipe ${teamId.substr(0, 8)}...`);
              }
            }
            setTeams(teamNames);
          } catch (error) {
            console.error("Erreur lors de la récupération des équipes:", error);
            // En cas d'erreur globale, afficher les IDs des équipes
            setTeams(
              userData.teamIds.map(
                (id: string) => `Équipe ${id.substr(0, 8)}...`
              )
            );
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
        showErrorToast("Erreur lors du chargement du profil utilisateur");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Gérer les changements dans le formulaire principal
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsFormModified(true);
  };

  // Gérer les changements dans le formulaire de mot de passe
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordModified(true);
  };

  // Validation du mot de passe selon normes RGPD
  const validatePasswordRGPD = (password: string): boolean => {
    // Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  // Gérer la sélection d'un fichier pour l'avatar
  const handleFileSelect = (file: File) => {
    console.log(
      "🔍 Fichier sélectionné dans UserProfilePage:",
      file.name,
      file.type,
      file.size
    );
    setSelectedFile(file);
    setIsFormModified(true);
  };

  // Enregistrer les modifications du profil
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      // Si un nouveau fichier a été sélectionné, l'uploader d'abord
      let photoUrlToSave = formData.photoUrl;

      if (selectedFile) {
        try {
          // Indiquer que l'upload de l'image est en cours
          setIsUploadingImage(true);
          showSuccessToast("Upload de l'image en cours...");

          // Vérifier que le fichier est valide avant d'essayer de l'uploader
          if (!selectedFile.type.startsWith("image/")) {
            throw new Error(
              "Le fichier sélectionné n'est pas une image valide"
            );
          }

          // Utiliser le hook updateProfilePhoto qui gère la synchronisation
          const result = await updateProfilePhoto(selectedFile);
          photoUrlToSave = result.imageUrl;

          console.log("✅ Photo mise à jour avec succès dans UserProfilePage");
        } catch (error) {
          console.error("Erreur lors de la mise à jour de la photo:", error);
          showErrorToast("Erreur lors de la mise à jour de la photo");
          setIsSaving(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      } else {
        // Si seules les données du profil ont été modifiées (sans nouvelle photo)
        try {
          await updateProfile({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            photoUrl: photoUrlToSave,
          });
          console.log("✅ Profil mis à jour avec succès dans UserProfilePage");
        } catch (error) {
          console.error("Erreur lors de la mise à jour du profil:", error);
          showErrorToast("Erreur lors de la mise à jour du profil");
          setIsSaving(false);
          return;
        }
      }

      // Mettre à jour l'état local avec les nouvelles données
      setFormData((prev) => ({
        ...prev,
        photoUrl: photoUrlToSave,
      }));

      // Toast de succès final après toutes les opérations
      if (selectedFile) {
        showSuccessToast("Photo de profil mise à jour avec succès !");
      } else {
        showSuccessToast("Profil mis à jour avec succès !");
      }

      // Réinitialiser l'état du formulaire
      setIsFormModified(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      showErrorToast(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Erreur lors de la mise à jour du profil"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Changer le mot de passe
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation complète
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      showErrorToast("Veuillez remplir tous les champs");
      return;
    }

    // Vérifier que les deux mots de passe correspondent
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showErrorToast("Les mots de passe ne correspondent pas");
      return;
    }

    // Vérifier la complexité du mot de passe
    if (!validatePasswordRGPD(passwordForm.newPassword)) {
      showErrorToast(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)"
      );
      return;
    }

    try {
      setIsChangingPassword(true);

      // Appel API pour changer le mot de passe (nouvelle route)
      await api.put("/profile/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      // Réinitialiser le formulaire
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordModified(false);

      // Afficher le message de succès
      showSuccessToast("Mot de passe mis à jour avec succès");

      // Ajouter un délai avant de masquer la section pour permettre l'affichage du toast
      setTimeout(() => {
        setShowPasswordSection(false);
      }, 300);
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);

      // Gestion des différents cas d'erreur
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          showErrorToast("Mot de passe actuel incorrect");
        } else if (error.response?.status === 400) {
          showErrorToast(
            error.response.data.message ||
              "Le nouveau mot de passe ne respecte pas les exigences de sécurité"
          );
        } else {
          showErrorToast(
            error.response?.data?.message ||
              "Erreur lors de la mise à jour du mot de passe"
          );
        }
      } else {
        showErrorToast("Erreur lors de la mise à jour du mot de passe");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Afficher un loader pendant le chargement initial
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Fonction pour obtenir la couleur du badge selon le rôle
  const getRoleBadgeType = (
    role: string
  ): "success" | "info" | "warning" | "error" => {
    switch (role) {
      case "admin":
        return "error";
      case "directeur":
        return "warning";
      case "manager":
        return "info";
      default:
        return "success";
    }
  };

  // Fonction pour traduire le rôle en français
  const getRoleLabel = (role: string): string => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "directeur":
        return "Directeur";
      case "manager":
        return "Manager";
      case "employee":
        return "Employé";
      default:
        return role;
    }
  };

  return (
    <LayoutWithSidebar activeItem="mon-profil">
      <SEO
        title="Mon profil - SmartPlanning"
        description="Gérez vos informations personnelles et paramètres de compte."
      />
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
          Mon profil
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Carte d'information */}
          <Card className="md:col-span-5 flex flex-col items-center p-6 bg-gradient-to-b from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-950/30 shadow-lg border border-indigo-100 dark:border-indigo-900">
            <div className="mb-8 mt-4 relative group">
              <Avatar
                src={previewUrl}
                size="xl"
                className="border-4 border-white dark:border-gray-700 shadow-xl hover:shadow-indigo-300/50 dark:hover:shadow-indigo-700/30 transition-all duration-300"
              />
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {user?.role && getRoleLabel(user.role)}
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-2 text-center text-gray-800 dark:text-white">
              {formData.firstName} {formData.lastName}
            </h2>

            <div className="mb-4 flex justify-center">
              <Badge
                label={getRoleLabel(user?.role || "")}
                type={getRoleBadgeType(user?.role || "")}
                className="text-sm px-3 py-1"
              />
            </div>

            <div className="w-full my-6 text-sm space-y-4">
              {/* Email avec design moderne */}
              <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <h3 className="text-indigo-600 dark:text-indigo-400 font-medium">
                    Email
                  </h3>
                </div>
                <p className="ml-4 font-medium break-all text-gray-700 dark:text-gray-300">
                  {formData.email}
                </p>
              </div>

              {/* Entreprise avec design moderne */}
              {companyName && (
                <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                    <h3 className="text-violet-600 dark:text-violet-400 font-medium">
                      Entreprise
                    </h3>
                  </div>
                  <p className="ml-4 font-medium text-gray-700 dark:text-gray-300">
                    {companyName}
                  </p>
                </div>
              )}

              {/* Équipes avec design moderne */}
              {teams.length > 0 && (
                <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <h3 className="text-blue-600 dark:text-blue-400 font-medium">
                      Équipes
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-4">
                    {teams.map((team, index) => (
                      <Badge
                        key={index}
                        label={team}
                        type="info"
                        className="text-xs px-2 py-0.5 bg-blue-600 text-white"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Formulaire de modification */}
          <div className="md:col-span-7">
            <Card className="bg-gradient-to-b from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-950/30 shadow-lg border border-indigo-100 dark:border-indigo-900 p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                Informations personnelles
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1 text-gray-700 dark:text-white">
                        Prénom <span className="text-red-500">*</span>
                      </p>
                      <div className="dark:text-white">
                        <InputField
                          label="Prénom"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          helperText="Votre prénom tel qu'il apparaîtra sur votre profil"
                          className="dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1 text-gray-700 dark:text-white">
                        Nom <span className="text-red-500">*</span>
                      </p>
                      <div className="dark:text-white">
                        <InputField
                          label="Nom"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          helperText="Votre nom de famille tel qu'il apparaîtra sur votre profil"
                          className="dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium mb-1 text-gray-700 dark:text-white">
                    Email <span className="text-red-500">*</span>
                  </p>
                  <div className="dark:text-white">
                    <InputField
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      helperText="Votre adresse email professionnelle, utilisée pour vous connecter"
                      className="dark:text-white"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Photo de profil
                  </label>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar
                        src={previewUrl}
                        size="xl"
                        className="border-2 border-indigo-200 dark:border-indigo-800"
                      />
                      {isUploadingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                          <LoadingSpinner size="sm" className="text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        onPreviewChange={setPreviewUrl}
                        acceptedTypes="image/*"
                        maxSizeMB={2}
                        buttonText={
                          isUploadingImage
                            ? "Upload en cours..."
                            : "Changer la photo"
                        }
                        label=""
                        className={`${isUploadingImage ? "opacity-70" : ""}`}
                        hideNoFileText={true}
                        buttonClassName="bg-green-500 hover:bg-green-600 text-white border-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Formats acceptés : JPG, PNG, GIF, WebP. Taille max. 2
                        Mo.
                      </p>
                    </div>
                  </div>
                </div>

                {isFormModified && (
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSaving}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      Enregistrer les modifications
                    </Button>
                  </div>
                )}
              </form>
            </Card>

            {/* Carte pour le changement de mot de passe */}
            <Card className="mt-6 bg-gradient-to-b from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-950/30 shadow-lg border border-indigo-100 dark:border-indigo-900 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                  Sécurité
                </h2>

                <Button
                  variant="ghost"
                  icon={<Key size={16} />}
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                >
                  {showPasswordSection ? "Annuler" : "Modifier le mot de passe"}
                </Button>
              </div>

              {showPasswordSection && (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1 text-gray-700 dark:text-white">
                      Mot de passe actuel{" "}
                      <span className="text-red-500">*</span>
                    </p>
                    <div className="relative">
                      <PasswordField
                        label="Mot de passe actuel"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        autoComplete="current-password"
                        helperText="Entrez votre mot de passe actuel pour confirmer votre identité"
                        className="bg-white/80 dark:bg-gray-800 border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-500 dark:focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-medium mb-1 text-gray-700 dark:text-white">
                      Nouveau mot de passe{" "}
                      <span className="text-red-500">*</span>
                    </p>
                    <div className="relative">
                      <PasswordField
                        label="Nouveau mot de passe"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        required
                        autoComplete="new-password"
                        helperText="Doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)"
                        className="bg-white/80 dark:bg-gray-800 border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-500 dark:focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-medium mb-1 text-gray-700 dark:text-white">
                      Confirmer le mot de passe{" "}
                      <span className="text-red-500">*</span>
                    </p>
                    <div className="relative">
                      <PasswordField
                        label="Confirmer le mot de passe"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        helperText="Veuillez confirmer votre nouveau mot de passe"
                        className="bg-white/80 dark:bg-gray-800 border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-500 dark:focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {passwordModified && (
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isChangingPassword}
                        disabled={isChangingPassword}
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Changer le mot de passe
                      </Button>
                    </div>
                  )}
                </form>
              )}

              {!showPasswordSection && (
                <p className="text-sm text-gray-600 dark:text-gray-400 backdrop-blur-sm p-3 rounded-lg bg-white/40 dark:bg-gray-800/40 border border-indigo-100 dark:border-indigo-900">
                  Vous pouvez modifier votre mot de passe en cliquant sur le
                  bouton ci-dessus.
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
};

export default UserProfilePage;
