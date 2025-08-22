/**
 * RegisterPage - Page d'inscription utilisateur futuriste
 *
 * Design moderne avec animations, particules et effets visuels avancés
 * Responsive et accessible, optimisé pour l'expérience utilisateur
 */
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { useTheme } from "../components/ThemeProvider";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import SEO from "../components/layout/SEO";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import FileUpload from "../components/ui/FileUpload";
import InputField from "../components/ui/InputField";
import PasswordField from "../components/ui/PasswordField";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";

// Animations
const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(1deg); }
  66% { transform: translateY(5px) rotate(-1deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

// Container principal avec design split-screen
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(79, 70, 229, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
  position: relative;
  overflow-x: hidden;
  padding-top: 6rem;
`;

// Particules animées
const ParticlesBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
`;

const Particle = styled.div<{ $delay: number; $duration: number; $size: number }>`
  position: absolute;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  background: linear-gradient(45deg, #4f46e5, #8b5cf6);
  border-radius: 50%;
  animation: ${float} ${({ $duration }) => $duration}s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
  opacity: 0.7;
`;

// Conteneur principal du formulaire
const FormContainer = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    min-height: calc(100vh - 6rem);
  }
`;

// Section gauche - Informations
const InfoSection = styled.div`
  position: relative;
  padding: 3rem;
  text-align: center;
  
  @media (min-width: 1024px) {
    text-align: left;
  }
`;

const InfoTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #4f46e5, #8b5cf6, #06b6d4);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${gradientShift} 6s ease infinite;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const InfoSubtitle = styled.p`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const FeaturesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
`;

const FeatureItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.background === '#0a0a0a' 
    ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)'};
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme.colors.background === '#0a0a0a' 
    ? 'rgba(79, 70, 229, 0.3)' 
    : 'rgba(79, 70, 229, 0.2)'};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background === '#0a0a0a' 
      ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(99, 102, 241, 0.25) 100%)'
      : 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(99, 102, 241, 0.12) 100%)'};
    border-color: ${({ theme }) => theme.colors.background === '#0a0a0a' 
      ? 'rgba(79, 70, 229, 0.5)' 
      : 'rgba(79, 70, 229, 0.3)'};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(79, 70, 229, 0.2);
  }
`;

const FeatureIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  animation: ${pulse} 3s ease-in-out infinite;
`;

const FeatureText = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

// Section droite - Formulaire
const FormSection = styled.div`
  position: relative;
`;

const FormPanel = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background === '#0a0a0a' 
    ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(79, 70, 229, 0.08) 100%)'
    : 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(99, 102, 241, 0.05) 50%, rgba(79, 70, 229, 0.03) 100%)'};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.background === '#0a0a0a' 
    ? 'rgba(79, 70, 229, 0.3)' 
    : 'rgba(79, 70, 229, 0.2)'};
  border-radius: 24px;
  padding: 3rem;
  box-shadow: ${({ theme }) => theme.colors.background === '#0a0a0a'
    ? '0 25px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(79, 70, 229, 0.1)'
    : '0 25px 50px rgba(79, 70, 229, 0.1), 0 0 0 1px rgba(79, 70, 229, 0.05)'};
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4f46e5, #8b5cf6, #06b6d4);
    background-size: 300% 100%;
    animation: ${gradientShift} 3s ease infinite;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.colors.background === '#0a0a0a'
      ? '0 35px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(79, 70, 229, 0.2)'
      : '0 35px 60px rgba(79, 70, 229, 0.15), 0 0 0 1px rgba(79, 70, 229, 0.1)'};
    background: ${({ theme }) => theme.colors.background === '#0a0a0a' 
      ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(99, 102, 241, 0.15) 50%, rgba(79, 70, 229, 0.12) 100%)'
      : 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(79, 70, 229, 0.06) 100%)'};
  }
`;

const FormTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const FormSubtitle = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 2rem;
  font-size: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 2rem 0 1.5rem 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.background === '#0a0a0a' 
      ? "linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.5), transparent)"
      : "linear-gradient(90deg, transparent, rgba(100, 116, 139, 0.3), transparent)"};
  }
`;

const SectionTitle = styled.span`
  padding: 0 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TermsContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const TermsLabel = styled.label`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  line-height: 1.5;

  a {
    color: #4f46e5;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledButton = styled(Button)`
  margin-top: 1.5rem;
  width: 100%;
  height: 56px;
  font-size: 1.1rem;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const LoginLink = styled.div`
  margin-top: 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};

  a {
    color: #4f46e5;
    text-decoration: none;
    margin-left: 0.25rem;
    font-weight: 600;

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

const HelperText = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
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

const ImagePreviewWrapper = styled.div`
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.background === '#0a0a0a' ? "#4A5568" : "#E2E8F0"};
  background-color: ${({ theme }) => theme.colors.background === '#0a0a0a' ? "#1A2234" : "#F8FAFC"};
`;

const ImagePreview = styled.img`
  width: 100%;
  max-height: 200px;
  object-fit: contain;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: ${({ theme }) => theme.colors.background === '#0a0a0a' ? "rgba(26, 32, 44, 0.9)" : "rgba(255, 255, 255, 0.9)"};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.background === '#0a0a0a' ? "#4A5568" : "#E2E8F0"};
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background === '#0a0a0a' ? "rgba(26, 32, 44, 1)" : "rgba(255, 255, 255, 1)"};
    transform: scale(1.1);
  }
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
  companyAddress?: string;
  companyPostalCode?: string;
  companyCity?: string;
  companySize?: string;
  companyLogo?: string;
  profilePicture?: string;
  phone?: string;
  role?: string;
}

// Fonction d'upload d'image
const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post("/upload/public", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

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
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] = useState(false);
  const [isUploadingCompanyLogo, setIsUploadingCompanyLogo] = useState(false);

  // État pour les fichiers sélectionnés
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);

  // États pour les URL de prévisualisation
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    companyName: "",
    companyAddress: "",
    companyPostalCode: "",
    companyCity: "",
    companySize: "",
    companyLogo: "",
    profilePicture: "",
    phone: "",
    role: "directeur",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Génération des particules
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 4,
    size: 4 + Math.random() * 8,
    left: Math.random() * 100,
    top: Math.random() * 100,
  }));

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

  const handleProfilePictureSelect = (file: File) => {
    setProfilePictureFile(file);
    if (errors.profilePicture) {
      setErrors((prev) => ({ ...prev, profilePicture: undefined }));
    }
  };

  const handleCompanyLogoSelect = (file: File) => {
    setCompanyLogoFile(file);
    if (errors.companyLogo) {
      setErrors((prev) => ({ ...prev, companyLogo: undefined }));
    }
  };

  const handleProfilePicturePreview = (url: string | null) => {
    setProfilePicturePreview(url);
  };

  const handleCompanyLogoPreview = (url: string | null) => {
    setCompanyLogoPreview(url);
  };

  const handleDeleteProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setFormData((prev) => ({ ...prev, profilePicture: "" }));
  };

  const handleDeleteCompanyLogo = () => {
    setCompanyLogoFile(null);
    setCompanyLogoPreview(null);
    setFormData((prev) => ({ ...prev, companyLogo: "" }));
  };

  const uploadProfilePicture = async (): Promise<string | undefined> => {
    if (!profilePictureFile) return undefined;

    try {
      setIsUploadingProfilePicture(true);
      const photoUrl = await uploadImage(profilePictureFile);
      setIsUploadingProfilePicture(false);
      return photoUrl;
    } catch (err) {
      console.error("Erreur lors de l'upload de la photo de profil:", err);
      showErrorToast("Upload photo ignoré - vous pourrez l'ajouter après inscription");
      setIsUploadingProfilePicture(false);
      return undefined; // Continuer l'inscription sans photo
    }
  };

  const uploadCompanyLogo = async (): Promise<string | undefined> => {
    if (!companyLogoFile) return undefined;

    try {
      setIsUploadingCompanyLogo(true);
      const logoUrl = await uploadImage(companyLogoFile);
      setIsUploadingCompanyLogo(false);
      return logoUrl;
    } catch (err) {
      console.error("Erreur lors de l'upload du logo d'entreprise:", err);
      showErrorToast("Upload logo ignoré - vous pourrez l'ajouter après inscription");
      setIsUploadingCompanyLogo(false);
      return undefined; // Continuer l'inscription sans logo
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

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
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(formData.password)) {
      newErrors.password = "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Vous devez accepter les conditions d'utilisation";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Le nom de l'entreprise est requis";
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = "Le nom de l'entreprise doit contenir au moins 2 caractères";
    }
    
    if (!formData.companyAddress.trim()) {
      newErrors.companyAddress = "L'adresse de l'entreprise est requise";
    } else if (formData.companyAddress.trim().length < 5) {
      newErrors.companyAddress = "L'adresse doit contenir au moins 5 caractères";
    }
    
    if (!formData.companyPostalCode.trim()) {
      newErrors.companyPostalCode = "Le code postal est requis";
    } else if (!/^\d{5}$/.test(formData.companyPostalCode.trim())) {
      newErrors.companyPostalCode = "Le code postal doit contenir 5 chiffres";
    }
    
    if (!formData.companyCity.trim()) {
      newErrors.companyCity = "La ville est requise";
    } else if (formData.companyCity.trim().length < 2) {
      newErrors.companyCity = "La ville doit contenir au moins 2 caractères";
    }
    
    if (!formData.companySize) {
      newErrors.companySize = "La taille de l'entreprise est requise";
    }

    if (profilePictureFile) {
      const maxSize = 3 * 1024 * 1024; // 3 MB
      if (profilePictureFile.size > maxSize) {
        newErrors.profilePicture = "La taille de l'image ne doit pas dépasser 3 Mo";
      }

      const acceptedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!acceptedTypes.includes(profilePictureFile.type)) {
        newErrors.profilePicture = "Format d'image non pris en charge (JPEG, PNG, GIF, WebP uniquement)";
      }
    }

    if (companyLogoFile) {
      const maxSize = 3 * 1024 * 1024; // 3 MB
      if (companyLogoFile.size > maxSize) {
        newErrors.companyLogo = "La taille du logo ne doit pas dépasser 3 Mo";
      }

      const acceptedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!acceptedTypes.includes(companyLogoFile.type)) {
        newErrors.companyLogo = "Format d'image non pris en charge (JPEG, PNG, GIF, WebP uniquement)";
      }
    }

    if (formData.phone.trim()) {
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
      let profilePictureUrl = "";
      let companyLogoUrl = "";

      if (profilePictureFile) {
        try {
          profilePictureUrl = (await uploadProfilePicture()) || "";
        } catch (error) {
          setIsLoading(false);
          return;
        }
      }

      if (companyLogoFile) {
        try {
          companyLogoUrl = (await uploadCompanyLogo()) || "";
        } catch (error) {
          setIsLoading(false);
          return;
        }
      }

      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        companyAddress: `${formData.companyAddress}, ${formData.companyPostalCode} ${formData.companyCity}`.trim(),
        companyPostalCode: formData.companyPostalCode,
        companyCity: formData.companyCity,
        companySize: parseInt(formData.companySize),
        acceptTerms: formData.acceptTerms,
        companyLogo: companyLogoUrl,
        profilePicture: profilePictureUrl,
        phone: formData.phone.trim() || undefined,
      };

      const response = await api.post("/auth/register", userData);

      console.log("Inscription réussie:", response.data);

      showSuccessToast("Inscription réussie ! Redirection vers le choix d'abonnement...");

      setTimeout(() => {
        navigate("/choose-plan");
      }, 1500);
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.response && error.response.data && error.response.data.message) {
        showErrorToast(error.response.data.message);
      } else {
        showErrorToast(error?.message || "Une erreur est survenue lors de l'inscription");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const styleId = "smartplanning-register-input-override";
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      /* Styles unifiés pour TOUS les inputs */
      .register-page input[type="text"],
      .register-page input[type="email"],
      .register-page input[type="password"],
      .register-page input[type="tel"] {
        background-color: ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
        color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        border: 2px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.8)'} !important;
        border-radius: 12px !important;
        padding: 12px 16px !important;
        font-size: 16px !important;
        font-weight: 500 !important;
        -webkit-text-fill-color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        caret-color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        backdrop-filter: blur(8px) !important;
      }
      
      .register-page input[type="text"]:focus,
      .register-page input[type="email"]:focus,
      .register-page input[type="password"]:focus,
      .register-page input[type="tel"]:focus {
        border-color: ${isDarkMode ? '#6366f1' : '#4f46e5'} !important;
        box-shadow: 0 0 0 4px ${isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.15)'} !important;
        background-color: ${isDarkMode ? 'rgba(15, 23, 42, 1)' : 'rgba(255, 255, 255, 1)'} !important;
        color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        -webkit-text-fill-color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        outline: none !important;
        transform: translateY(-1px) !important;
      }
      
      .register-page input[type="text"]:hover,
      .register-page input[type="email"]:hover,
      .register-page input[type="password"]:hover,
      .register-page input[type="tel"]:hover {
        border-color: ${isDarkMode ? 'rgba(99, 102, 241, 0.6)' : 'rgba(79, 70, 229, 0.4)'} !important;
        background-color: ${isDarkMode ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)'} !important;
        color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        transform: translateY(-1px) !important;
      }
      
      /* Styles spécifiques pour l'auto-remplissage WebKit */
      .register-page input[type="email"]:-webkit-autofill,
      .register-page input[type="email"]:-webkit-autofill:hover,
      .register-page input[type="email"]:-webkit-autofill:focus,
      .register-page input[type="email"]:-webkit-autofill:active,
      .register-page input[type="password"]:-webkit-autofill,
      .register-page input[type="password"]:-webkit-autofill:hover,
      .register-page input[type="password"]:-webkit-autofill:focus,
      .register-page input[type="password"]:-webkit-autofill:active,
      .register-page input[type="text"]:-webkit-autofill,
      .register-page input[type="text"]:-webkit-autofill:hover,
      .register-page input[type="text"]:-webkit-autofill:focus,
      .register-page input[type="text"]:-webkit-autofill:active,
      .register-page input[type="tel"]:-webkit-autofill,
      .register-page input[type="tel"]:-webkit-autofill:hover,
      .register-page input[type="tel"]:-webkit-autofill:focus,
      .register-page input[type="tel"]:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'} inset !important;
        -webkit-text-fill-color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        border: 2px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.8)'} !important;
      }
      
      .register-page input::placeholder {
        color: ${isDarkMode ? 'rgba(148, 163, 184, 0.8)' : 'rgba(107, 114, 128, 0.8)'} !important;
        opacity: 1 !important;
        font-weight: 400 !important;
      }
      
      /* Labels et textes */
      .register-page label {
        color: ${isDarkMode ? '#F8FAFC' : '#1E293B'} !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        margin-bottom: 8px !important;
        display: block !important;
      }
      
      /* Checkbox styling amélioré */
      .register-page input[type="checkbox"] {
        width: 20px !important;
        height: 20px !important;
        accent-color: #4f46e5 !important;
        border: 2px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.8)'} !important;
        border-radius: 4px !important;
        background-color: ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
        cursor: pointer !important;
      }
      
      /* Button styling pour cohérence */
      .register-page button[type="submit"] {
        background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%) !important;
        border: none !important;
        border-radius: 12px !important;
        color: #FFFFFF !important;
        font-weight: 600 !important;
        font-size: 16px !important;
        padding: 14px 24px !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        backdrop-filter: blur(8px) !important;
        box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3) !important;
      }
      
      .register-page button[type="submit"]:hover:not(:disabled) {
        transform: translateY(-2px) !important;
        box-shadow: 0 12px 35px rgba(79, 70, 229, 0.4) !important;
        background: linear-gradient(135deg, #5b52e8 0%, #6d70f4 50%, #9561f9 100%) !important;
      }
      
      .register-page button[type="submit"]:disabled {
        opacity: 0.7 !important;
        cursor: not-allowed !important;
        transform: none !important;
      }
      
      /* Autres boutons */
      .register-page button:not([type="submit"]) {
        background-color: ${isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.3)'} !important;
        color: ${isDarkMode ? '#F8FAFC' : '#1E293B'} !important;
        border: 1px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.5)'} !important;
        border-radius: 8px !important;
        font-weight: 500 !important;
        transition: all 0.3s ease !important;
      }
      
      .register-page button:not([type="submit"]):hover {
        background-color: ${isDarkMode ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.5)'} !important;
        transform: translateY(-1px) !important;
      }
      
      /* File upload button */
      .register-page input[type="file"] + button,
      .register-page .file-upload-button {
        background: linear-gradient(135deg, ${isDarkMode ? 'rgba(71, 85, 105, 0.4)' : 'rgba(79, 70, 229, 0.1)'} 0%, ${isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.08)'} 100%) !important;
        border: 2px solid ${isDarkMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(79, 70, 229, 0.2)'} !important;
        color: ${isDarkMode ? '#F8FAFC' : '#4f46e5'} !important;
        border-radius: 10px !important;
        font-weight: 500 !important;
        transition: all 0.3s ease !important;
      }
      
      /* Texte "Aucun fichier sélectionné" et autres textes du FileUpload */
      .register-page .file-upload-container,
      .register-page .file-upload-text,
      .register-page .no-file-selected,
      .register-page .file-upload-wrapper p,
      .register-page .file-upload-wrapper span {
        color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
      }
      
      /* Textes d'aide et helper text */
      .register-page .helper-text,
      .register-page small,
      .register-page .text-sm {
        color: ${isDarkMode ? 'rgba(248, 250, 252, 0.8)' : 'rgba(107, 114, 128, 0.8)'} !important;
      }
      
      /* Force la cohérence pour TOUS les inputs */
      .register-page input[type="text"],
      .register-page input[type="email"],
      .register-page input[type="password"],
      .register-page input[type="tel"] {
        background-color: ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
        color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        border: 2px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.8)'} !important;
        -webkit-text-fill-color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        caret-color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
      }
      
      /* États focus identiques pour TOUS les inputs */
      .register-page input[type="text"]:focus,
      .register-page input[type="email"]:focus,
      .register-page input[type="password"]:focus,
      .register-page input[type="tel"]:focus {
        background-color: ${isDarkMode ? 'rgba(15, 23, 42, 1)' : 'rgba(255, 255, 255, 1)'} !important;
        color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        -webkit-text-fill-color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
      }
      
      /* États hover identiques pour TOUS les inputs */
      .register-page input[type="text"]:hover,
      .register-page input[type="email"]:hover,
      .register-page input[type="password"]:hover,
      .register-page input[type="tel"]:hover {
        background-color: ${isDarkMode ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)'} !important;
        color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
      }
      
      /* Styles pour le sélecteur de taille d'entreprise */
      .register-page .company-size-select {
        background-color: ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
        color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        border: 2px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.8)'} !important;
        font-family: inherit !important;
        font-weight: 500 !important;
        font-size: 14px !important;
      }
      
      .register-page .company-size-select:focus {
        background-color: ${isDarkMode ? 'rgba(15, 23, 42, 1)' : 'rgba(255, 255, 255, 1)'} !important;
        color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        border-color: ${isDarkMode ? 'rgba(99, 102, 241, 0.8)' : 'rgba(79, 70, 229, 0.8)'} !important;
        outline: none !important;
      }
      
      .register-page .company-size-select:hover {
        background-color: ${isDarkMode ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)'} !important;
        border-color: ${isDarkMode ? 'rgba(99, 102, 241, 0.6)' : 'rgba(79, 70, 229, 0.6)'} !important;
      }
      
      .register-page .company-size-select option {
        background-color: ${isDarkMode ? '#0f172a' : '#ffffff'} !important;
        color: ${isDarkMode ? '#FFFFFF' : '#1E293B'} !important;
        font-family: inherit !important;
        font-weight: 500 !important;
      }
      
      /* Label pour le sélecteur de taille */
      .register-page .company-size-label {
        color: ${isDarkMode ? '#F8FAFC' : '#374151'} !important;
        font-family: inherit !important;
        font-weight: 500 !important;
      }
      
      .register-page .company-size-label .text-red-500 {
        color: #ef4444 !important;
      }
    `;
    
    return () => {
      if (document.getElementById(styleId)) {
        document.getElementById(styleId)?.remove();
      }
    };
  }, [isDarkMode]);

  return (
    <>
      <SEO
        title="Inscription - SmartPlanning"
        description="Créez votre compte SmartPlanning pour accéder à notre solution de gestion de planning innovante."
      />
      
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href="https://smartplanning.fr/" />

      <Header />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
        position="top-center"
        duration={5000}
      />

      <PageContainer className="register-page">
        {/* Particules animées */}
        <ParticlesBackground>
          {particles.map((particle) => (
            <Particle
              key={particle.id}
              $delay={particle.delay}
              $duration={particle.duration}
              $size={particle.size}
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
            />
          ))}
        </ParticlesBackground>

        <FormContainer>
          {/* Section informations - gauche */}
          <InfoSection>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <InfoTitle>
                Rejoignez l'avenir de la planification
              </InfoTitle>
              <InfoSubtitle>
                Créez votre compte et découvrez une nouvelle façon de gérer vos équipes avec l'intelligence artificielle.
              </InfoSubtitle>

              <FeaturesList>
                <FeatureItem
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <FeatureIcon>🚀</FeatureIcon>
                  <FeatureText>
                    IA avancée pour une planification optimale
                  </FeatureText>
                </FeatureItem>

                <FeatureItem
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <FeatureIcon>⚡</FeatureIcon>
                  <FeatureText>
                    Interface moderne et intuitive
                  </FeatureText>
                </FeatureItem>

                <FeatureItem
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <FeatureIcon>🔒</FeatureIcon>
                  <FeatureText>
                    Sécurité et conformité RGPD garanties
                  </FeatureText>
                </FeatureItem>

                <FeatureItem
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <FeatureIcon>📊</FeatureIcon>
                  <FeatureText>
                    Analytics en temps réel de vos équipes
                  </FeatureText>
                </FeatureItem>
              </FeaturesList>
            </motion.div>
          </InfoSection>

          {/* Section formulaire - droite */}
          <FormSection>
            <FormPanel
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <FormTitle>Créer un compte</FormTitle>
              <FormSubtitle>
                Commencez votre transformation numérique dès aujourd'hui
              </FormSubtitle>

              <Form onSubmit={handleSubmit}>
                {/* Informations personnelles */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
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
                      />
                      {errors.firstName && <ErrorMessage>{errors.firstName}</ErrorMessage>}
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
                      />
                      {errors.lastName && <ErrorMessage>{errors.lastName}</ErrorMessage>}
                    </FormGroup>
                  </FormRow>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
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
                      />
                      {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
                    </FormGroup>

                    <FormGroup>
                      <InputField
                        type="tel"
                        label="Téléphone (facultatif)"
                        name="phone"
                        placeholder="Votre numéro"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                      {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
                    </FormGroup>
                  </FormRow>
                </motion.div>

                {/* Photo de profil */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
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
                            isUploadingProfilePicture ? "Upload en cours..." : "Sélectionner une image"
                          }
                          label=""
                          hideNoFileText={false}
                        />
                        <HelperText>
                          Formats acceptés : JPG, PNG, GIF, WebP. Taille max. 3 Mo.
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

                    {errors.profilePicture && <ErrorMessage>{errors.profilePicture}</ErrorMessage>}
                  </AvatarContainer>
                </motion.div>

                {/* Informations entreprise */}
                <SectionDivider>
                  <SectionTitle>Entreprise</SectionTitle>
                </SectionDivider>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
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
                    />
                    {errors.companyName && <ErrorMessage>{errors.companyName}</ErrorMessage>}
                  </FormGroup>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                >
                  <FormGroup>
                    <InputField
                      type="text"
                      label="Adresse de l'entreprise"
                      name="companyAddress"
                      placeholder="123 Rue de l'Innovation"
                      value={formData.companyAddress}
                      onChange={handleChange}
                      required
                    />
                    {errors.companyAddress && <ErrorMessage>{errors.companyAddress}</ErrorMessage>}
                  </FormGroup>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.46 }}
                >
                  <FormRow>
                    <FormGroup>
                      <InputField
                        type="text"
                        label="Code postal"
                        name="companyPostalCode"
                        placeholder="75001"
                        value={formData.companyPostalCode}
                        onChange={handleChange}
                        required
                        maxLength={5}
                      />
                      {errors.companyPostalCode && <ErrorMessage>{errors.companyPostalCode}</ErrorMessage>}
                    </FormGroup>
                    <FormGroup>
                      <InputField
                        type="text"
                        label="Ville"
                        name="companyCity"
                        placeholder="Paris"
                        value={formData.companyCity}
                        onChange={handleChange}
                        required
                      />
                      {errors.companyCity && <ErrorMessage>{errors.companyCity}</ErrorMessage>}
                    </FormGroup>
                  </FormRow>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.47 }}
                >
                  <FormGroup>
                    <label className="company-size-label block text-sm font-medium mb-2">
                      Taille de l'entreprise <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      required
                      className="company-size-select w-full px-4 py-3 rounded-lg transition-all duration-200"
                    >
                      <option value="">Sélectionnez la taille</option>
                      <option value="5">1-5 employés</option>
                      <option value="15">6-15 employés</option>
                      <option value="30">16-30 employés</option>
                      <option value="50">31-50 employés</option>
                      <option value="100">51-100 employés</option>
                      <option value="250">101-250 employés</option>
                      <option value="500">251-500 employés</option>
                      <option value="1000">501-1000 employés</option>
                      <option value="5000">1000+ employés</option>
                    </select>
                    {errors.companySize && <ErrorMessage>{errors.companySize}</ErrorMessage>}
                  </FormGroup>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <AvatarContainer>
                    <label className="block text-sm font-medium mb-2">
                      Logo de l'entreprise (facultatif)
                    </label>

                    {companyLogoPreview ? (
                      <ImagePreviewWrapper>
                        <ImagePreview src={companyLogoPreview} alt="Logo de l'entreprise" />
                        <DeleteButton
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
                          isUploadingCompanyLogo ? "Upload en cours..." : "Sélectionner un logo"
                        }
                        label=""
                      />
                      <HelperText>
                        Formats acceptés : JPG, PNG, GIF, WebP. Taille max. 3 Mo.
                      </HelperText>
                    </div>

                    {errors.companyLogo && <ErrorMessage>{errors.companyLogo}</ErrorMessage>}
                  </AvatarContainer>
                </motion.div>

                {/* Sécurité */}
                <SectionDivider>
                  <SectionTitle>Sécurité</SectionTitle>
                </SectionDivider>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <FormGroup>
                    <PasswordField
                      label="Mot de passe"
                      name="password"
                      placeholder="Minimum 8 caractères"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      helperText="Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial."
                    />
                    {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
                  </FormGroup>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <FormGroup>
                    <PasswordField
                      label="Confirmer le mot de passe"
                      name="confirmPassword"
                      placeholder="Saisissez à nouveau votre mot de passe"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
                  </FormGroup>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
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
                    <TermsLabel htmlFor="acceptTerms">
                      J'accepte les{" "}
                      <Link to="/mentions-legales">conditions d'utilisation</Link> et la{" "}
                      <Link to="/politique-de-confidentialite">
                        politique de confidentialité
                      </Link>
                    </TermsLabel>
                  </TermsContainer>
                  {errors.acceptTerms && <ErrorMessage>{errors.acceptTerms}</ErrorMessage>}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                >
                  <StyledButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isLoading || isUploadingProfilePicture || isUploadingCompanyLogo}
                  >
                    {isLoading || isUploadingProfilePicture || isUploadingCompanyLogo
                      ? "Inscription en cours..."
                      : "Créer mon compte"}
                  </StyledButton>
                </motion.div>
              </Form>

              <LoginLink>
                Déjà un compte ?<Link to="/connexion">Se connecter</Link>
              </LoginLink>
            </FormPanel>
          </FormSection>
        </FormContainer>
      </PageContainer>

      <Footer />
    </>
  );
};

export default RegisterPage;