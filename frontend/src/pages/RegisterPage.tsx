/**
 * RegisterPage - Page d'inscription utilisateur
 *
 * Permet la création d'un compte utilisateur avec validation des champs
 * et support pour l'authentification Google OAuth. Utilise les composants
 * du design system SmartPlanning pour une expérience cohérente.
 */
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useTheme } from "../components/ThemeProvider";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import PageWrapper from "../components/layout/PageWrapper";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import FileUpload from "../components/ui/FileUpload";
import FormContainer from "../components/ui/FormContainer";
import InputField from "../components/ui/InputField";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const TermsContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const TermsLabel = styled.label<{ isDarkMode?: boolean }>`
  font-size: 0.875rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  cursor: pointer;
  line-height: 1.4;

  a {
    color: #4f46e5;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledButton = styled(Button)`
  margin-top: 1rem;
  width: 100%;
`;

const Divider = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid
      ${({ isDarkMode }) => (isDarkMode ? "#2D3748" : "#E2E8F0")};
  }

  span {
    padding: 0 1rem;
    font-size: 0.875rem;
    color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  }
`;

const GoogleButton = styled.button<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#1A2234" : "#FFFFFF")};
  border: 1px solid ${({ isDarkMode }) => (isDarkMode ? "#2D3748" : "#E2E8F0")};
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ isDarkMode }) =>
      isDarkMode ? "#242f48" : "#F8F9FA"};
  }
`;

const LoginLink = styled.div<{ isDarkMode?: boolean }>`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};

  a {
    color: #4f46e5;
    text-decoration: none;
    margin-left: 0.25rem;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const HelperText = styled.p<{ isDarkMode?: boolean }>`
  font-size: 0.75rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  margin-top: 0.25rem;
`;

const AvatarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const AvatarPreviewContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AvatarUploadContainer = styled.div`
  flex: 1;
`;

const ImagePreviewWrapper = styled.div<{ isDarkMode?: boolean }>`
  position: relative;
  width: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-top: 0.5rem;
  border: 1px solid ${({ isDarkMode }) => (isDarkMode ? "#4A5568" : "#E2E8F0")};
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#1A2234" : "#F8FAFC")};
`;

const ImagePreview = styled.img`
  width: 100%;
  max-height: 200px;
  object-fit: contain;
`;

const DeleteButton = styled.button<{ isDarkMode?: boolean }>`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: ${({ isDarkMode }) =>
    isDarkMode ? "rgba(26, 32, 44, 0.8)" : "rgba(255, 255, 255, 0.8)"};
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
  border: 1px solid ${({ isDarkMode }) => (isDarkMode ? "#4A5568" : "#E2E8F0")};
  border-radius: 9999px;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ isDarkMode }) =>
      isDarkMode ? "rgba(26, 32, 44, 1)" : "rgba(255, 255, 255, 1)"};
  }
`;

const SectionTitle = styled.h3<{ isDarkMode?: boolean }>`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${({ isDarkMode }) => (isDarkMode ? "#F1F5F9" : "#1A202C")};
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

// Interface pour les erreurs du formulaire
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  companyName?: string;
  companyLogo?: string;
  profilePicture?: string;
  phone?: string;
  role?: string;
}

// Fonction d'upload d'image adaptée pour cette page
const uploadImage = async (file: File): Promise<string> => {
  try {
    // Créer un objet FormData pour envoyer le fichier
    const formData = new FormData();
    formData.append("image", file);

    // Faire la requête POST vers l'endpoint d'upload public (sans authentification)
    const response = await api.post("/upload/public", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Vérifier que la réponse contient une URL d'image
    if (response.data && response.data.success && response.data.imageUrl) {
      return response.data.imageUrl;
    } else {
      throw new Error("Format de réponse invalide du serveur d'upload");
    }
  } catch (error) {
    console.error("Erreur lors de l'upload de l'image:", error);
    throw new Error("Impossible d'uploader l'image. Veuillez réessayer.");
  }
};

const RegisterPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { toast, showErrorToast, showSuccessToast, hideToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] =
    useState(false);
  const [isUploadingCompanyLogo, setIsUploadingCompanyLogo] = useState(false);

  // État pour les fichiers sélectionnés
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);

  // États pour les URL de prévisualisation
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(
    null
  );

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    // Nouveaux champs
    companyName: "",
    companyLogo: "",
    profilePicture: "",
    phone: "",
    role: "directeur", // Champ fixe comme demandé
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  // Gestion du fichier de photo de profil
  const handleProfilePictureSelect = (file: File) => {
    setProfilePictureFile(file);

    if (errors.profilePicture) {
      setErrors((prev) => ({
        ...prev,
        profilePicture: undefined,
      }));
    }
  };

  // Gestion du fichier de logo d'entreprise
  const handleCompanyLogoSelect = (file: File) => {
    setCompanyLogoFile(file);

    if (errors.companyLogo) {
      setErrors((prev) => ({
        ...prev,
        companyLogo: undefined,
      }));
    }
  };

  // Gestion de la prévisualisation de photo de profil
  const handleProfilePicturePreview = (url: string | null) => {
    setProfilePicturePreview(url);
  };

  // Gestion de la prévisualisation de logo d'entreprise
  const handleCompanyLogoPreview = (url: string | null) => {
    setCompanyLogoPreview(url);
  };

  // Suppression de la photo de profil
  const handleDeleteProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setFormData((prev) => ({
      ...prev,
      profilePicture: "",
    }));
  };

  // Suppression du logo d'entreprise
  const handleDeleteCompanyLogo = () => {
    setCompanyLogoFile(null);
    setCompanyLogoPreview(null);
    setFormData((prev) => ({
      ...prev,
      companyLogo: "",
    }));
  };

  // Upload de la photo de profil vers Cloudinary
  const uploadProfilePicture = async (): Promise<string | undefined> => {
    if (!profilePictureFile) return undefined;

    try {
      setIsUploadingProfilePicture(true);
      const photoUrl = await uploadImage(profilePictureFile);
      setIsUploadingProfilePicture(false);
      return photoUrl;
    } catch (err) {
      console.error("Erreur lors de l'upload de la photo de profil:", err);
      showErrorToast("Impossible d'uploader la photo de profil");
      setIsUploadingProfilePicture(false);
      throw err;
    }
  };

  // Upload du logo d'entreprise vers Cloudinary
  const uploadCompanyLogo = async (): Promise<string | undefined> => {
    if (!companyLogoFile) return undefined;

    try {
      setIsUploadingCompanyLogo(true);
      const logoUrl = await uploadImage(companyLogoFile);
      setIsUploadingCompanyLogo(false);
      return logoUrl;
    } catch (err) {
      console.error("Erreur lors de l'upload du logo d'entreprise:", err);
      showErrorToast("Impossible d'uploader le logo d'entreprise");
      setIsUploadingCompanyLogo(false);
      throw err;
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Validation des champs existants
    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 8 caractères";
    } else if (
      !/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms =
        "Vous devez accepter les conditions d'utilisation";
    }

    // Validation des nouveaux champs
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Le nom de l'entreprise est requis";
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName =
        "Le nom de l'entreprise doit contenir au moins 2 caractères";
    }

    // Validation des fichiers de photo de profil et logo d'entreprise
    if (profilePictureFile) {
      const maxSize = 3 * 1024 * 1024; // 3 MB
      if (profilePictureFile.size > maxSize) {
        newErrors.profilePicture =
          "La taille de l'image ne doit pas dépasser 3 Mo";
      }

      const acceptedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!acceptedTypes.includes(profilePictureFile.type)) {
        newErrors.profilePicture =
          "Format d'image non pris en charge (JPEG, PNG, GIF, WebP uniquement)";
      }
    }

    if (companyLogoFile) {
      const maxSize = 3 * 1024 * 1024; // 3 MB
      if (companyLogoFile.size > maxSize) {
        newErrors.companyLogo = "La taille du logo ne doit pas dépasser 3 Mo";
      }

      const acceptedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!acceptedTypes.includes(companyLogoFile.type)) {
        newErrors.companyLogo =
          "Format d'image non pris en charge (JPEG, PNG, GIF, WebP uniquement)";
      }
    }

    // Validation optionnelle du numéro de téléphone (si renseigné)
    if (formData.phone.trim()) {
      // Regex pour valider les numéros de téléphone français ou internationaux
      const phoneRegex = /^(\+\d{1,3}\s?)?(\d{9,15})$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = "Format de numéro de téléphone invalide";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Uploader les images si nécessaire
      let profilePictureUrl = "";
      let companyLogoUrl = "";

      if (profilePictureFile) {
        try {
          profilePictureUrl = (await uploadProfilePicture()) || "";
        } catch (error) {
          setIsLoading(false);
          return; // Arrêt si l'upload de la photo de profil échoue
        }
      }

      if (companyLogoFile) {
        try {
          companyLogoUrl = (await uploadCompanyLogo()) || "";
        } catch (error) {
          setIsLoading(false);
          return; // Arrêt si l'upload du logo d'entreprise échoue
        }
      }

      // Préparer les données à envoyer
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        companyLogo: companyLogoUrl,
        profilePicture: profilePictureUrl,
        phone: formData.phone.trim() || undefined, // Ne pas envoyer si vide
      };

      // Envoyer les données au backend
      const response = await api.post("/auth/register", userData);

      // Sauvegarder le token dans le localStorage
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      console.log("Inscription réussie:", response.data);

      // Afficher un toast de succès
      showSuccessToast(
        "Inscription réussie ! Redirection vers le tableau de bord..."
      );

      // Naviguer vers le dashboard après inscription
      setTimeout(() => {
        navigate("/tableau-de-bord");
      }, 1500);
    } catch (error: any) {
      console.error("Registration error:", error);
      // Afficher le message d'erreur du serveur si disponible
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        showErrorToast(error.response.data.message);
      } else {
        showErrorToast(
          error?.message || "Une erreur est survenue lors de l'inscription"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // Rediriger vers l'URL d'authentification Google du backend
    const apiUrl =
      import.meta.env.VITE_API_URL || "https://smartplanning.onrender.com/api";
    window.location.href = `${apiUrl}/auth/google`;
  };

  useEffect(() => {
    const styleId = "smartplanning-darkmode-input-override";
    let styleElement = document.getElementById(
      styleId
    ) as HTMLStyleElement | null;

    if (isDarkMode) {
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = `
        /* Forcer le style des inputs en mode sombre */
        #root input[type="text"],
        #root input[type="email"],
        #root input[type="password"],
        #root input[type="tel"] {
          background-color: #1A2234 !important;
          color: #F1F5F9 !important;
          border: 1px solid #4A5568 !important;
          -webkit-text-fill-color: #F1F5F9 !important; /* Pour Safari et Chrome autofill text */
        }
        /* Styles spécifiques pour l'auto-remplissage WebKit (Chrome, Safari) */
        #root input[type="email"]:-webkit-autofill,
        #root input[type="email"]:-webkit-autofill:hover,
        #root input[type="email"]:-webkit-autofill:focus,
        #root input[type="email"]:-webkit-autofill:active,
        #root input[type="password"]:-webkit-autofill,
        #root input[type="password"]:-webkit-autofill:hover,
        #root input[type="password"]:-webkit-autofill:focus,
        #root input[type="password"]:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #1A2234 inset !important; /* Fond pour l'autofill */
          -webkit-text-fill-color: #F1F5F9 !important; /* Couleur du texte pour l'autofill */
          border: 1px solid #4A5568 !important; /* S'assurer que la bordure est aussi overridée */
        }
        #root input::placeholder {
          color: #94A3B8 !important;
          opacity: 0.7 !important;
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

  return (
    <>
      <Helmet>
        <title>Inscription - SmartPlanning</title>
        <meta
          name="description"
          content="Créez votre compte SmartPlanning pour accéder à notre solution de gestion de planning innovante."
        />
      </Helmet>

      <Header />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
        position="top-center"
        duration={5000}
      />

      <PageWrapper>
        <FormContainer
          title="Créer un compte SmartPlanning"
          description="Rejoignez-nous et découvrez une nouvelle façon de gérer vos plannings"
          wide={true}
        >
          <Form onSubmit={handleSubmit}>
            {/* Section informations personnelles */}
            <Section>
              <SectionTitle isDarkMode={isDarkMode}>
                Informations personnelles
              </SectionTitle>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <FormRow>
                  <FormGroup>
                    <InputField
                      type="text"
                      label="Prénom"
                      name="firstName"
                      placeholder="Votre prénom"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="register-field"
                      helperText="Votre prénom sera utilisé pour personnaliser l'interface"
                    />
                    {errors.firstName && (
                      <ErrorMessage>{errors.firstName}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <InputField
                      type="text"
                      label="Nom"
                      name="lastName"
                      placeholder="Votre nom"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="register-field"
                      helperText="Votre nom de famille tel qu'il apparaîtra dans l'application"
                    />
                    {errors.lastName && (
                      <ErrorMessage>{errors.lastName}</ErrorMessage>
                    )}
                  </FormGroup>
                </FormRow>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <FormRow>
                  <FormGroup>
                    <InputField
                      type="email"
                      label="Adresse email"
                      name="email"
                      placeholder="votre.email@exemple.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="register-field"
                      helperText="Votre adresse email sera utilisée pour vous connecter et pour la récupération de compte"
                    />
                    {errors.email && (
                      <ErrorMessage>{errors.email}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <InputField
                      type="tel"
                      label="Téléphone (facultatif)"
                      name="phone"
                      placeholder="Votre numéro de téléphone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="register-field"
                      helperText="Format: +33 XXXXXXXXX ou 06XXXXXXXX"
                    />
                    {errors.phone && (
                      <ErrorMessage>{errors.phone}</ErrorMessage>
                    )}
                  </FormGroup>
                </FormRow>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <AvatarContainer>
                  <label className="block text-sm font-medium mb-2">
                    Photo de profil (facultatif)
                  </label>

                  <AvatarPreviewContainer>
                    <Avatar
                      src={profilePicturePreview}
                      size="xl"
                      className="border-2 border-indigo-200 dark:border-indigo-800"
                    />

                    <AvatarUploadContainer>
                      <FileUpload
                        onFileSelect={handleProfilePictureSelect}
                        onPreviewChange={handleProfilePicturePreview}
                        acceptedTypes="image/*"
                        maxSizeMB={3}
                        buttonText={
                          isUploadingProfilePicture
                            ? "Upload en cours..."
                            : "Sélectionner une image"
                        }
                        label=""
                        hideNoFileText={false}
                      />
                      <HelperText isDarkMode={isDarkMode}>
                        Formats acceptés : JPG, PNG, GIF, WebP. Taille max. 3
                        Mo.
                      </HelperText>
                    </AvatarUploadContainer>
                  </AvatarPreviewContainer>

                  {profilePicturePreview && (
                    <div style={{ position: "relative", marginTop: "8px" }}>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteProfilePicture}
                      >
                        Supprimer l'image
                      </Button>
                    </div>
                  )}

                  {errors.profilePicture && (
                    <ErrorMessage>{errors.profilePicture}</ErrorMessage>
                  )}
                </AvatarContainer>
              </motion.div>
            </Section>

            {/* Section informations de l'entreprise */}
            <Section>
              <SectionTitle isDarkMode={isDarkMode}>
                Informations de l'entreprise
              </SectionTitle>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <FormGroup>
                  <InputField
                    type="text"
                    label="Nom de l'entreprise"
                    name="companyName"
                    placeholder="Nom de l'entreprise"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="register-field"
                    helperText="Le nom de votre entreprise tel qu'il apparaîtra dans l'application"
                  />
                  {errors.companyName && (
                    <ErrorMessage>{errors.companyName}</ErrorMessage>
                  )}
                </FormGroup>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <AvatarContainer>
                  <label className="block text-sm font-medium mb-2">
                    Logo de l'entreprise (facultatif)
                  </label>

                  {companyLogoPreview ? (
                    <ImagePreviewWrapper isDarkMode={isDarkMode}>
                      <ImagePreview
                        src={companyLogoPreview}
                        alt="Logo de l'entreprise"
                      />
                      <DeleteButton
                        isDarkMode={isDarkMode}
                        onClick={handleDeleteCompanyLogo}
                        type="button"
                      >
                        ✕
                      </DeleteButton>
                    </ImagePreviewWrapper>
                  ) : null}

                  <div style={{ marginTop: companyLogoPreview ? "1rem" : "0" }}>
                    <FileUpload
                      onFileSelect={handleCompanyLogoSelect}
                      onPreviewChange={handleCompanyLogoPreview}
                      acceptedTypes="image/*"
                      maxSizeMB={3}
                      buttonText={
                        isUploadingCompanyLogo
                          ? "Upload en cours..."
                          : "Sélectionner un logo"
                      }
                      label=""
                    />
                    <HelperText isDarkMode={isDarkMode}>
                      Formats acceptés : JPG, PNG, GIF, WebP. Taille max. 3 Mo.
                    </HelperText>
                  </div>

                  {errors.companyLogo && (
                    <ErrorMessage>{errors.companyLogo}</ErrorMessage>
                  )}
                </AvatarContainer>
              </motion.div>
            </Section>

            {/* Section mot de passe */}
            <Section>
              <SectionTitle isDarkMode={isDarkMode}>Sécurité</SectionTitle>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <FormGroup>
                  <InputField
                    type="password"
                    label="Mot de passe"
                    name="password"
                    placeholder="Minimum 8 caractères"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="register-field"
                    helperText="Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial (!@#$%^&*). Conforme au RGPD."
                  />
                  {errors.password && (
                    <ErrorMessage>{errors.password}</ErrorMessage>
                  )}
                </FormGroup>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <FormGroup>
                  <InputField
                    type="password"
                    label="Confirmer le mot de passe"
                    name="confirmPassword"
                    placeholder="Saisissez à nouveau votre mot de passe"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="register-field"
                    helperText="Confirmez votre mot de passe pour renforcer la sécurité conformément au RGPD"
                  />
                  {errors.confirmPassword && (
                    <ErrorMessage>{errors.confirmPassword}</ErrorMessage>
                  )}
                </FormGroup>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                <TermsContainer>
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    style={{ marginTop: "3px" }}
                  />
                  <TermsLabel htmlFor="acceptTerms" isDarkMode={isDarkMode}>
                    J'accepte les{" "}
                    <Link to="/mentions-legales">conditions d'utilisation</Link>{" "}
                    et la{" "}
                    <Link to="/politique-de-confidentialite">
                      politique de confidentialité
                    </Link>
                  </TermsLabel>
                </TermsContainer>
                {errors.acceptTerms && (
                  <ErrorMessage>{errors.acceptTerms}</ErrorMessage>
                )}
              </motion.div>
            </Section>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.9 }}
            >
              <StyledButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={
                  isLoading ||
                  isUploadingProfilePicture ||
                  isUploadingCompanyLogo
                }
                className="w-full"
              >
                {isLoading ||
                isUploadingProfilePicture ||
                isUploadingCompanyLogo
                  ? "Inscription en cours..."
                  : "S'inscrire"}
              </StyledButton>
            </motion.div>
          </Form>

          <Divider isDarkMode={isDarkMode}>
            <span>ou</span>
          </Divider>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.0 }}
          >
            <GoogleButton
              type="button"
              onClick={handleGoogleRegister}
              isDarkMode={isDarkMode}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
                  fill="#34A853"
                />
                <path
                  d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
                  fill="#EA4335"
                />
              </svg>
              Continuer avec Google
            </GoogleButton>
          </motion.div>

          <LoginLink isDarkMode={isDarkMode}>
            Déjà un compte ?<Link to="/connexion">Se connecter</Link>
          </LoginLink>
        </FormContainer>
      </PageWrapper>

      <Footer />
    </>
  );
};

export default RegisterPage;
