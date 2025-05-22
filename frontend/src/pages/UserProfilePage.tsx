import axios from "axios";
import { Eye, EyeOff, Key } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import FileUpload from "../components/ui/FileUpload";
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import api, { uploadFile } from "../services/api";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
};

const UserProfilePage = () => {
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast, toast, hideToast } = useToast();

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
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordModified, setPasswordModified] = useState(false);

  // État pour le chargement des opérations
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
            // Utiliser la route admin/companies pour récupérer les informations de l'entreprise
            const companyResponse = await api.get(
              `/admin/companies/${userData.companyId}`
            );
            setCompanyName(companyResponse.data.name || "");
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

  // Gérer la sélection d'un fichier pour l'avatar
  const handleFileSelect = (file: File) => {
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

          photoUrlToSave = await uploadFile(selectedFile);

          // Indiquer que l'upload est terminé
          showSuccessToast("Image uploadée avec succès !");
        } catch (error) {
          console.error("Erreur lors de l'upload de l'image:", error);
          showErrorToast("Erreur lors de l'upload de l'image");
          setIsSaving(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Mise à jour du profil
      const response = await api.put("/users/me", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        photoUrl: photoUrlToSave,
      });

      // Mettre à jour l'état local avec les nouvelles données
      setFormData((prev) => ({
        ...prev,
        photoUrl: photoUrlToSave,
      }));

      // Réinitialiser l'état du formulaire
      setIsFormModified(false);
      setSelectedFile(null);

      showSuccessToast("Profil mis à jour avec succès");
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

    // Validation simple
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showErrorToast("Veuillez remplir tous les champs");
      return;
    }

    try {
      setIsChangingPassword(true);

      // Appel API pour changer le mot de passe
      await api.put("/users/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      // Réinitialiser le formulaire
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
      });
      setPasswordModified(false);

      showSuccessToast("Mot de passe modifié avec succès");

      // Masquer la section après succès
      setShowPasswordSection(false);
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      showErrorToast(
        axios.isAxiosError(error) && error.response?.status === 401
          ? "Mot de passe actuel incorrect"
          : "Erreur lors du changement de mot de passe"
      );
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
        Mon profil
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Carte d'information */}
        <Card className="md:col-span-5 flex flex-col items-center">
          <div className="mb-6 mt-4">
            <Avatar
              src={previewUrl}
              size="xl"
              className="border-4 border-white dark:border-gray-700 shadow-lg"
            />
          </div>

          <h2 className="text-xl font-semibold mb-2 text-center text-gray-800 dark:text-white">
            {formData.firstName} {formData.lastName}
          </h2>

          <div className="mb-4 flex justify-center">
            <Badge
              label={getRoleLabel(user?.role || "")}
              type={getRoleBadgeType(user?.role || "")}
            />
          </div>

          <div className="w-full border-t dark:border-gray-700 my-4 pt-4 text-sm">
            <p className="mb-2 flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Email:</span>
              <span className="font-medium break-all">{formData.email}</span>
            </p>

            {companyName && (
              <p className="mb-2 flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Entreprise:
                </span>
                <span className="font-medium">{companyName}</span>
              </p>
            )}

            {teams.length > 0 && (
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-400 mb-1">
                  Équipes:
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {teams.map((team, index) => (
                    <Badge
                      key={index}
                      label={team}
                      type="info"
                      className="text-xs"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Formulaire de modification */}
        <div className="md:col-span-7">
          <Card>
            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
              Informations personnelles
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1 text-gray-700 dark:text-white">
                      Prénom <span className="text-red-500">*</span>
                    </p>
                    <InputField
                      label="Prénom"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      helperText="Votre prénom tel qu'il apparaîtra sur votre profil"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1 text-gray-700 dark:text-white">
                      Nom <span className="text-red-500">*</span>
                    </p>
                    <InputField
                      label="Nom"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      helperText="Votre nom de famille tel qu'il apparaîtra sur votre profil"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium mb-1 text-gray-700 dark:text-white">
                  Email <span className="text-red-500">*</span>
                </p>
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  helperText="Votre adresse email professionnelle, utilisée pour vous connecter"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Photo de profil
                </label>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar src={previewUrl} size="lg" />
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
                      className={isUploadingImage ? "opacity-70" : ""}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formats acceptés : JPG, PNG, GIF, WebP. Taille max. 2 Mo.
                      La photo sera hébergée sur Cloudinary de façon sécurisée.
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
                  >
                    Enregistrer les modifications
                  </Button>
                </div>
              )}
            </form>
          </Card>

          {/* Carte pour le changement de mot de passe */}
          <Card className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Sécurité
              </h2>

              <Button
                variant="ghost"
                icon={<Key size={16} />}
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                {showPasswordSection ? "Annuler" : "Modifier le mot de passe"}
              </Button>
            </div>

            {showPasswordSection && (
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1 text-gray-700 dark:text-white">
                    Mot de passe actuel <span className="text-red-500">*</span>
                  </p>
                  <div className="relative">
                    <InputField
                      label="Mot de passe actuel"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      autoComplete="current-password"
                      helperText="Entrez votre mot de passe actuel pour confirmer votre identité"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      aria-label={
                        showCurrentPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium mb-1 text-gray-700 dark:text-white">
                    Nouveau mot de passe <span className="text-red-500">*</span>
                  </p>
                  <div className="relative">
                    <InputField
                      label="Nouveau mot de passe"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      required
                      autoComplete="new-password"
                      helperText="Votre nouveau mot de passe doit comporter au moins 6 caractères"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={
                        showNewPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {passwordModified && (
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isChangingPassword}
                      disabled={isChangingPassword}
                    >
                      Changer le mot de passe
                    </Button>
                  </div>
                )}
              </form>
            )}

            {!showPasswordSection && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vous pouvez modifier votre mot de passe en cliquant sur le
                bouton ci-dessus.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
