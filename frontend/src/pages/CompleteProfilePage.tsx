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

  // Checklist des éléments à compléter pour l'UX
  const checklistItems = [
    { 
      label: "Nom de l'entreprise", 
      completed: !!formData.companyName.trim(),
      required: true 
    },
    { 
      label: "Logo d'entreprise", 
      completed: !!companyLogoFile || !!companyLogoPreview,
      required: false 
    },
    { 
      label: "Photo de profil", 
      completed: !!profilePictureFile || !!profilePicturePreview,
      required: false 
    },
    { 
      label: "Téléphone professionnel", 
      completed: !!formData.phone.trim(),
      required: false 
    },
  ];

  // Vérifier si tous les éléments obligatoires sont complétés
  const requiredItemsCompleted = checklistItems
    .filter(item => item.required)
    .every(item => item.completed);

  // Compter les éléments complétés
  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;

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
        await api.put("/profile/update", {
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
          photoUrl: profilePictureUrl,
        });

        // Mettre à jour les champs supplémentaires si disponibles
        if (formData.phone || formData.bio) {
          await api.patch("/api/users/me", {
            companyId,
            phone: formData.phone || undefined,
            bio: formData.bio || undefined,
          });
        }

        // Rafraîchir les données de l'utilisateur dans le contexte
        await refreshUser();

        showSuccessToast("Profil complété avec succès !");

        // Rediriger vers la page de choix d'abonnement
        navigate("/choose-plan", { replace: true });
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

        {/* Checklist UX des éléments à compléter */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              📋 Progression de votre profil
            </h2>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {completedCount}/{totalCount} complétés
            </span>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-6">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            ></div>
          </div>

          {/* Liste des éléments à compléter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {checklistItems.map((item, index) => (
              <div 
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                  item.completed 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {/* Icône de statut */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  item.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {item.completed ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <span className={`text-sm font-medium ${
                  item.completed 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {item.label}
                  {item.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Message de statut */}
          {requiredItemsCompleted && completedCount === totalCount && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  🎉 Parfait ! Votre profil est complet et prêt à être envoyé
                </span>
              </div>
            </div>
          )}
          
          {requiredItemsCompleted && completedCount < totalCount && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  ✅ Prêt à être envoyé ! Vous pouvez ajouter les éléments optionnels pour un profil plus complet
                </span>
              </div>
            </div>
          )}
        </Card>

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

            {/* Message de validation et bouton de soumission */}
            <div className="space-y-4">
              {/* Message conditionnel basé sur la checklist */}
              {requiredItemsCompleted && completedCount === totalCount && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-semibold text-green-700 dark:text-green-300">
                      Prêt à être envoyé ✅
                    </span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Votre profil est complet avec tous les éléments renseignés !
                  </p>
                </div>
              )}

              {requiredItemsCompleted && completedCount < totalCount && (
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                      Prêt à être envoyé ✅
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Les éléments obligatoires sont complétés. Vous pouvez ajouter les éléments optionnels pour enrichir votre profil.
                  </p>
                </div>
              )}

              {!requiredItemsCompleted && (
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                      Éléments obligatoires manquants
                    </span>
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Veuillez compléter les éléments marqués d'un * avant de continuer.
                  </p>
                </div>
              )}

              {/* Bouton de soumission */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || isUploading || !requiredItemsCompleted}
                  className={`w-full sm:w-auto transition-all duration-200 ${
                    requiredItemsCompleted 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Traitement en cours...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      {requiredItemsCompleted ? (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Compléter mon profil
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                          Éléments obligatoires manquants
                        </>
                      )}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
