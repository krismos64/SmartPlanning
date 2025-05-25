/**
 * CompanyManagementPage - Page de gestion des entreprises
 *
 * Interface complète permettant à un administrateur de gérer les entreprises:
 * - Affichage de la liste des entreprises
 * - Ajout de nouvelles entreprises
 * - Modification des entreprises existantes
 * - Suppression des entreprises
 */

import { Building, Edit, Plus, Search, Trash2, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

// Composants de layout
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import FileUpload from "../components/ui/FileUpload";
import InputField from "../components/ui/InputField";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import Toast from "../components/ui/Toast";

// Types pour les formulaires
interface Company {
  _id: string;
  name: string;
  logoUrl?: string;
  plan?: string;
  subscription?: {
    status?: string;
    currentPeriodEnd?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface CompanyFormData {
  name: string;
  logoUrl: string;
}

interface CompanyFormErrors {
  name?: string;
  logoUrl?: string;
}

// Fonction d'upload d'image vers Cloudinary
const uploadImage = async (file: File): Promise<string> => {
  try {
    // Créer un objet FormData pour envoyer le fichier
    const formData = new FormData();
    formData.append("image", file);

    // Faire la requête POST vers l'endpoint d'upload
    const response = await axiosInstance.post("/upload/public", formData, {
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

// Définition des colonnes du tableau
const companyColumns = [
  { key: "name", label: "Nom", sortable: true },
  { key: "logo", label: "Logo", sortable: false },
  { key: "createdAt", label: "Date de création", sortable: true },
  { key: "actions", label: "Actions", sortable: false },
];

// Éléments du fil d'ariane
const breadcrumbItems = [
  { label: "Dashboard", link: "/tableau-de-bord" },
  { label: "Entreprises", link: "/gestion-des-entreprises" },
];

/**
 * Composant principal de la page de gestion des entreprises
 */
const CompanyManagementPage: React.FC = () => {
  // États pour les entreprises
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // États pour les notifications
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);

  // États pour le modal d'ajout/modification d'entreprise
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    logoUrl: "",
  });
  const [formErrors, setFormErrors] = useState<CompanyFormErrors>({});

  // États pour le modal de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteCompanyId, setDeleteCompanyId] = useState<string>("");
  const [deletingCompany, setDeletingCompany] = useState<boolean>(false);

  // États pour la gestion de l'upload d'image
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);

  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);

  /**
   * Récupération des entreprises depuis l'API
   */
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/admin/companies");
      console.log("Données entreprises récupérées :", response.data);

      // Extraire le tableau d'entreprises de la réponse
      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        setCompanies(response.data.data);
      } else {
        console.error("Format de réponse inattendu:", response.data);
        setCompanies([]);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des entreprises:", err);
      setError("Impossible de récupérer la liste des entreprises.");
      setShowErrorToast(true);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Chargement initial des entreprises
   */
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  /**
   * Effet pour filtrer les entreprises selon le terme de recherche
   */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCompanies(companies);
      return;
    }

    const filtered = companies.filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCompanies(filtered);
  }, [companies, searchTerm]);

  /**
   * Effet pour mettre à jour les données du tableau avec les entreprises filtrées
   */
  useEffect(() => {
    if (!filteredCompanies || filteredCompanies.length === 0) {
      setTableData([]);
      return;
    }

    // Format des données filtrées pour le tableau
    const formattedCompanies = filteredCompanies.map((company) => {
      return {
        _id: company._id,
        name: <Badge type="info" label={company.name} />,
        logo: company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={`Logo de ${company.name}`}
            className="h-10 w-10 object-contain rounded"
          />
        ) : (
          <span className="text-gray-400">-</span>
        ),
        createdAt: company.createdAt
          ? new Date(company.createdAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        actions: (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit size={16} />}
              onClick={() => handleEditCompany(company)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Éditer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Building size={16} />}
              onClick={() =>
                (window.location.href = `/admin/entreprises/${company._id}/equipes`)
              }
              className="text-indigo-600 hover:text-indigo-800 dark:text-sky-400 dark:hover:text-sky-300"
            >
              Équipes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={16} />}
              onClick={() => handleOpenDeleteModal(company._id)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Supprimer
            </Button>
          </div>
        ),
      };
    });

    setTableData(formattedCompanies);
  }, [filteredCompanies]);

  /**
   * Gestion des toasts de notification
   */
  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  /**
   * Gestion de la recherche
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

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
    if (formErrors[name as keyof CompanyFormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  /**
   * Validation du formulaire d'entreprise
   */
  const validateForm = (): boolean => {
    const errors: CompanyFormErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = "Le nom de l'entreprise est requis";
      isValid = false;
    }

    // Validation de l'URL du logo si fournie
    if (formData.logoUrl && !isValidUrl(formData.logoUrl)) {
      errors.logoUrl = "L'URL du logo n'est pas valide";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  /**
   * Validation basique d'une URL
   */
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  /**
   * Réinitialisation du formulaire
   */
  const resetForm = () => {
    setFormData({
      name: "",
      logoUrl: "",
    });
    setFormErrors({});
    setIsEditMode(false);
    setSelectedCompany(null);

    // Réinitialiser les états du logo
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(null);
  };

  /**
   * Ouverture du modal pour créer une nouvelle entreprise
   */
  const handleOpenCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  /**
   * Ouverture du modal pour éditer une entreprise existante
   */
  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      logoUrl: company.logoUrl || "",
    });

    // Réinitialiser les états du logo mais définir la prévisualisation si une URL existe
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(company.logoUrl || null);

    setIsEditMode(true);
    setModalOpen(true);
  };

  /**
   * Ouverture du modal de confirmation de suppression
   */
  const handleOpenDeleteModal = (companyId: string) => {
    setDeleteCompanyId(companyId);
    setDeleteModalOpen(true);
  };

  /**
   * Fermeture des modals
   */
  const handleCloseModal = () => {
    // Libérer les ressources de prévisualisation
    if (logoPreview && logoPreview !== formData.logoUrl) {
      URL.revokeObjectURL(logoPreview);
    }

    setModalOpen(false);
    resetForm();
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteCompanyId("");
  };

  /**
   * Gestion de la sélection d'un fichier image pour le logo
   */
  const handleLogoSelect = (file: File) => {
    setLogoFile(file);

    // Créer une URL de prévisualisation
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);

    // Effacer les erreurs liées au logo s'il y en a
    if (formErrors.logoUrl) {
      setFormErrors((prev) => ({
        ...prev,
        logoUrl: undefined,
      }));
    }
  };

  /**
   * Suppression du logo sélectionné
   */
  const handleDeleteLogo = () => {
    // Libérer l'URL de prévisualisation pour éviter les fuites de mémoire
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(null);
    setLogoPreview(null);

    // Si on est en mode édition, conserver l'URL existante
    if (!isEditMode) {
      setFormData((prev) => ({
        ...prev,
        logoUrl: "",
      }));
    }
  };

  /**
   * Upload du logo vers Cloudinary
   */
  const uploadLogo = async (): Promise<string | undefined> => {
    if (!logoFile) return formData.logoUrl; // Retourner l'URL existante si pas de nouveau fichier

    try {
      setIsUploadingLogo(true);
      const url = await uploadImage(logoFile);
      setIsUploadingLogo(false);
      return url;
    } catch (err) {
      console.error("Erreur lors de l'upload du logo:", err);
      setError("Impossible d'uploader le logo. Veuillez réessayer.");
      setShowErrorToast(true);
      setIsUploadingLogo(false);
      throw err;
    }
  };

  /**
   * Création ou mise à jour d'une entreprise
   */
  const handleSaveCompany = async () => {
    // Validation du formulaire
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Uploader le logo si un nouveau fichier est sélectionné
      let logoUrl = formData.logoUrl;
      if (logoFile) {
        try {
          logoUrl = (await uploadLogo()) || "";
        } catch (err) {
          // L'erreur est déjà gérée dans uploadLogo
          setLoading(false);
          return;
        }
      }

      // Préparer les données avec l'URL du logo
      const companyData = {
        name: formData.name,
        logoUrl,
      };

      if (isEditMode && selectedCompany) {
        // Mise à jour d'une entreprise existante
        const response = await axiosInstance.put(
          `/admin/companies/${selectedCompany._id}`,
          companyData
        );

        if (response.data && response.data.success) {
          setSuccess("Entreprise mise à jour avec succès !");
        } else {
          throw new Error("La mise à jour a échoué");
        }
      } else {
        // Création d'une nouvelle entreprise
        const response = await axiosInstance.post(
          "/admin/companies",
          companyData
        );

        if (response.data && response.data.success) {
          setSuccess("Entreprise créée avec succès !");
        } else {
          throw new Error("La création a échoué");
        }
      }

      // Rafraîchir la liste des entreprises
      await fetchCompanies();
      setShowSuccessToast(true);
      handleCloseModal();
    } catch (err) {
      console.error(
        isEditMode
          ? "Erreur lors de la mise à jour de l'entreprise:"
          : "Erreur lors de la création de l'entreprise:",
        err
      );
      setError(
        isEditMode
          ? "Erreur lors de la mise à jour de l'entreprise"
          : "Erreur lors de la création de l'entreprise"
      );
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Suppression d'une entreprise
   */
  const handleDeleteCompany = async () => {
    if (!deleteCompanyId) return;

    setDeletingCompany(true);
    try {
      const response = await axiosInstance.delete(
        `/admin/companies/${deleteCompanyId}`
      );

      if (response.data && response.data.success) {
        setSuccess("Entreprise supprimée avec succès !");
        setShowSuccessToast(true);

        // Rafraîchir la liste des entreprises
        await fetchCompanies();
        handleCloseDeleteModal();
      } else {
        throw new Error("La suppression a échoué");
      }
    } catch (err) {
      console.error("Erreur lors de la suppression de l'entreprise:", err);
      setError("Erreur lors de la suppression de l'entreprise");
      setShowErrorToast(true);
    } finally {
      setDeletingCompany(false);
    }
  };

  return (
    <LayoutWithSidebar activeItem="gestion-des-entreprises">
      <PageWrapper>
        {/* En-tête de la page */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="flex justify-between items-center mt-4">
            <SectionTitle
              title="Gestion des entreprises"
              subtitle="Gérez les entreprises de votre plateforme"
              icon={<Building className="h-8 w-8 text-indigo-600" />}
            />
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              icon={<Plus size={16} />}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
            >
              Ajouter une entreprise
            </Button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Rechercher une entreprise..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" />
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {filteredCompanies.length} résultat
              {filteredCompanies.length !== 1 ? "s" : ""} trouvé
              {filteredCompanies.length !== 1 ? "s" : ""} pour "{searchTerm}"
            </p>
          )}
        </div>

        {/* Contenu principal */}
        <SectionCard>
          {loading && !tableData.length ? (
            <div className="flex justify-center items-center py-10">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Affichage desktop - Tableau */}
              <div className="hidden md:block">
                <Table
                  columns={companyColumns}
                  data={tableData}
                  pagination={true}
                  rowsPerPage={10}
                  emptyState={{
                    title: "Aucune entreprise trouvée",
                    description:
                      "Il n'y a actuellement aucune entreprise enregistrée dans le système.",
                    icon: (
                      <Building
                        size={48}
                        className="text-gray-300 dark:text-gray-600"
                      />
                    ),
                  }}
                  className="text-gray-900 dark:text-gray-100 [&_thead]:bg-gray-100 [&_thead]:dark:bg-gray-800 [&_thead_th]:text-gray-700 [&_thead_th]:dark:text-sky-300 [&_td]:text-gray-900 [&_td]:dark:text-gray-100"
                />
              </div>

              {/* Affichage mobile - Cards */}
              <div className="md:hidden space-y-4">
                {filteredCompanies.length === 0 ? (
                  <div className="text-center py-12">
                    <Building
                      size={48}
                      className="mx-auto text-gray-300 dark:text-gray-600 mb-4"
                    />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {searchTerm
                        ? "Aucune entreprise trouvée"
                        : "Aucune entreprise trouvée"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm
                        ? `Aucune entreprise ne correspond à "${searchTerm}".`
                        : "Il n'y a actuellement aucune entreprise enregistrée dans le système."}
                    </p>
                  </div>
                ) : (
                  filteredCompanies.map((company) => (
                    <div
                      key={company._id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                    >
                      {/* En-tête de la card */}
                      <div className="flex items-start space-x-3 mb-3">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={`Logo de ${company.name}`}
                            className="w-12 h-12 object-contain rounded-lg border border-gray-200 dark:border-gray-600 p-1"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Building size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {company.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Créée le{" "}
                            {new Date(company.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit size={16} />}
                          onClick={() => handleEditCompany(company)}
                          className="flex-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800"
                        >
                          Éditer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Building size={16} />}
                          onClick={() =>
                            (window.location.href = `/admin/entreprises/${company._id}/equipes`)
                          }
                          className="flex-1 text-indigo-600 hover:text-indigo-800 dark:text-sky-400 dark:hover:text-sky-300 border border-indigo-200 dark:border-indigo-800"
                        >
                          Équipes
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => handleOpenDeleteModal(company._id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </SectionCard>

        {/* Modal de création/édition d'entreprise */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={
            isEditMode ? "Modifier l'entreprise" : "Ajouter une entreprise"
          }
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-indigo-300 rounded-2xl shadow-xl max-w-md w-full"
        >
          <div className="space-y-6">
            <InputField
              label="Nom de l'entreprise"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              error={formErrors.name}
              className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              icon={
                <Building
                  size={18}
                  className="text-indigo-600 dark:text-sky-300"
                />
              }
            />

            {/* Upload du logo d'entreprise */}
            <div className="space-y-2">
              <FileUpload
                label="Logo de l'entreprise"
                onFileSelect={handleLogoSelect}
                onPreviewChange={(url) => {}}
                acceptedTypes="image/*"
                maxSizeMB={5}
                buttonText="Choisir un logo"
                error={formErrors.logoUrl}
                buttonClassName="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
              />

              {/* Prévisualisation du logo */}
              {(logoPreview || formData.logoUrl) && (
                <div className="mt-4">
                  <div className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    {isUploadingLogo ? (
                      <div className="flex flex-col items-center justify-center h-32">
                        <LoadingSpinner size="md" />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Upload en cours...
                        </p>
                      </div>
                    ) : (
                      <img
                        src={logoPreview || formData.logoUrl}
                        alt="Aperçu du logo"
                        className="h-32 object-contain mb-3"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          setFormErrors({
                            ...formErrors,
                            logoUrl:
                              "Impossible de charger l'image depuis cette URL",
                          });
                        }}
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteLogo}
                      icon={<Trash2 size={16} />}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      disabled={isUploadingLogo}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <InputField
              label="URL du logo (facultatif)"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleInputChange}
              error={formErrors.logoUrl}
              className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              placeholder="https://exemple.com/logo.png"
            />

            {formData.logoUrl &&
              isValidUrl(formData.logoUrl) &&
              !logoPreview && (
                <div className="flex justify-center">
                  <img
                    src={formData.logoUrl}
                    alt="Aperçu du logo"
                    className="h-24 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      setFormErrors({
                        ...formErrors,
                        logoUrl:
                          "Impossible de charger l'image depuis cette URL",
                      });
                    }}
                  />
                </div>
              )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleCloseModal}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveCompany}
                isLoading={loading || isUploadingLogo}
                disabled={loading || isUploadingLogo}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
              >
                {isEditMode ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de confirmation de suppression */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          title="Confirmer la suppression"
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-indigo-300 rounded-2xl shadow-xl max-w-md w-full"
        >
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300">
              Êtes-vous sûr de vouloir supprimer cette entreprise ? Cette action
              est irréversible.
            </p>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleCloseDeleteModal}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteCompany}
                isLoading={deletingCompany}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>

        {/* Toast de succès */}
        <Toast
          type="success"
          message={success}
          isVisible={showSuccessToast}
          onClose={closeSuccessToast}
          duration={3000}
          position="bottom-right"
        />

        {/* Toast d'erreur */}
        <Toast
          type="error"
          message={error}
          isVisible={showErrorToast}
          onClose={closeErrorToast}
          duration={5000}
          position="bottom-right"
        />
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default CompanyManagementPage;
