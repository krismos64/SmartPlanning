import React, { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import FileUpload from "../components/ui/FileUpload";
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import api, { uploadFile } from "../services/api";

/**
 * Page de complétion de profil après l'authentification OAuth Google
 */
const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, refreshUser } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();

  // États du formulaire
  const [formData, setFormData] = useState({
    companyName: "",
    phone: "",
    bio: "",
  });

  // États pour l'upload de fichiers
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(
    null
  );
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);

  // États pour le suivi des actions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Vérifier l'authentification au chargement du composant
  useEffect(() => {
    // Avec les cookies httpOnly, on vérifie l'état d'authentification via le contexte
    if (!isAuthenticated) {
      navigate("/connexion", { replace: true });
      return;
    }

    // Si l'utilisateur a déjà une entreprise, rediriger vers le dashboard
    if (user && user.companyId) {
      navigate("/tableau-de-bord", { replace: true });
    }
  }, [user, navigate, isAuthenticated]);

  // Gestionnaire de changement des champs du formulaire
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Effacer l'erreur si elle existe
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Gestionnaire pour le téléchargement du logo de l'entreprise
  const handleCompanyLogoSelect = (file: File) => {
    setCompanyLogoFile(file);

    if (formErrors.companyLogo) {
      setFormErrors((prev) => ({ ...prev, companyLogo: "" }));
    }
  };

  // Gestionnaire pour le téléchargement de la photo de profil
  const handleProfilePictureSelect = (file: File) => {
    setProfilePictureFile(file);

    if (formErrors.profilePicture) {
      setFormErrors((prev) => ({ ...prev, profilePicture: "" }));
    }
  };

  // Gestion des prévisualisations
  const handleCompanyLogoPreview = (url: string | null) => {
    setCompanyLogoPreview(url);
  };

  const handleProfilePicturePreview = (url: string | null) => {
    setProfilePicturePreview(url);
  };

  // Upload des fichiers vers le serveur
  const uploadProfilePicture = async (): Promise<string | undefined> => {
    if (!profilePictureFile) return undefined;

    try {
      setIsUploading(true);
      const photoUrl = await uploadFile(profilePictureFile);
      return photoUrl;
    } catch (err) {
      console.error("Erreur lors de l'upload de la photo de profil:", err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadCompanyLogo = async (): Promise<string | undefined> => {
    if (!companyLogoFile) return undefined;

    try {
      setIsUploading(true);
      const logoUrl = await uploadFile(companyLogoFile);
      return logoUrl;
    } catch (err) {
      console.error("Erreur lors de l'upload du logo de l'entreprise:", err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.companyName.trim()) {
      errors.companyName = "Le nom de l'entreprise est requis";
    }

    // Mettre à jour les erreurs si nécessaire
    setFormErrors(errors);

    // Retourner true si aucune erreur
    return Object.keys(errors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Valider le formulaire
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Uploader les fichiers si nécessaire
      let profilePictureUrl: string | undefined;
      let companyLogoUrl: string | undefined;

      try {
        if (profilePictureFile) {
          profilePictureUrl = await uploadProfilePicture();
        }

        if (companyLogoFile) {
          companyLogoUrl = await uploadCompanyLogo();
        }
      } catch (error) {
        showErrorToast("Erreur lors de l'upload des fichiers");
        setIsSubmitting(false);
        return;
      }

      // Créer d'abord l'entreprise
      let companyId: string | undefined;

      try {
        const companyResponse = await api.post("/api/companies", {
          name: formData.companyName,
          logo: companyLogoUrl,
        });

        if (companyResponse.data && companyResponse.data.success) {
          companyId = companyResponse.data.data._id;
        } else {
          throw new Error("Échec de la création de l'entreprise");
        }
      } catch (error) {
        console.error("Erreur lors de la création de l'entreprise:", error);
        showErrorToast("Échec de la création de l'entreprise");
        setIsSubmitting(false);
        return;
      }

      // Mettre à jour le profil utilisateur
      try {
        await api.patch("/api/users/me", {
          companyId,
          phone: formData.phone || undefined,
          bio: formData.bio || undefined,
          photoUrl: profilePictureUrl,
        });

        // Rafraîchir les données de l'utilisateur dans le contexte
        await refreshUser();

        showSuccessToast("Profil complété avec succès !");

        // Rediriger vers le tableau de bord
        navigate("/tableau-de-bord", { replace: true });
      } catch (error) {
        console.error("Erreur lors de la mise à jour du profil:", error);
        showErrorToast("Échec de la mise à jour du profil");
      }
    } catch (error) {
      console.error("Erreur lors de la complétion du profil:", error);
      showErrorToast("Une erreur est survenue, veuillez réessayer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Afficher un loader pendant le chargement des données
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" className="text-blue-600" />
      </div>
    );
  }

  // Rediriger si l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    navigate("/connexion", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Compléter votre profil
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Vous avez été connecté avec Google. Veuillez compléter les
            informations suivantes pour finaliser votre profil.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            {/* Informations de l'entreprise */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Informations de l'entreprise
              </h2>

              <div className="mb-4">
                <InputField
                  label="Nom de l'entreprise *"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Entrez le nom de votre entreprise"
                  error={formErrors.companyName}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Logo de l'entreprise (optionnel)
                </label>

                <div className="flex items-center gap-4">
                  {companyLogoPreview && (
                    <div className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-300 dark:border-gray-700">
                      <img
                        src={companyLogoPreview}
                        alt="Aperçu du logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <FileUpload
                      onFileSelect={handleCompanyLogoSelect}
                      onPreviewChange={handleCompanyLogoPreview}
                      acceptedTypes="image/*"
                      maxSizeMB={2}
                      buttonText="Choisir un logo"
                      label=""
                      hideNoFileText={false}
                      buttonClassName="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Formats acceptés : JPG, PNG, GIF. Taille max. 2 Mo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Informations personnelles
              </h2>

              <div className="mb-4">
                <InputField
                  label="Téléphone professionnel (optionnel)"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Entrez votre numéro de téléphone"
                  error={formErrors.phone}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Photo de profil (optionnelle)
                </label>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar
                      src={profilePicturePreview}
                      size="xl"
                      className="border-2 border-indigo-200 dark:border-indigo-800"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                        <LoadingSpinner size="sm" className="text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <FileUpload
                      onFileSelect={handleProfilePictureSelect}
                      onPreviewChange={handleProfilePicturePreview}
                      acceptedTypes="image/*"
                      maxSizeMB={2}
                      buttonText="Changer la photo"
                      label=""
                      hideNoFileText={true}
                      buttonClassName="bg-green-500 hover:bg-green-600 text-white border-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Formats acceptés : JPG, PNG, GIF. Taille max. 2 Mo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="bio" className="block text-sm font-medium mb-2">
                  Bio (optionnelle)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Décrivez-vous en quelques mots..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || isUploading}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Traitement en cours...
                  </span>
                ) : (
                  "Compléter mon profil"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
