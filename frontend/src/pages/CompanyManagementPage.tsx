/**
 * CompanyManagementPage - Page de gestion des entreprises
 *
 * Interface complète permettant à un administrateur de gérer les entreprises:
 * - Affichage de la liste des entreprises
 * - Ajout de nouvelles entreprises
 * - Modification des entreprises existantes
 * - Suppression des entreprises
 */

import axios from "axios";
import { Building, Edit, Plus, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Composants de layout
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
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
  createdAt: string;
  updatedAt: string;
}

interface CompanyFormData {
  name: string;
  logoUrl: string;
}

interface CompanyFormErrors {
  name?: string;
  logoUrl?: string;
}

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

  /**
   * Récupération des entreprises depuis l'API
   */
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/admin/companies");
      const data = Array.isArray(response.data) ? response.data : [];
      console.log("Données entreprises récupérées :", response.data);
      setCompanies(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des entreprises:", err);
      setError("Impossible de récupérer la liste des entreprises.");
      setShowErrorToast(true);
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
   * Effet pour formater les données des entreprises pour le tableau
   */
  useEffect(() => {
    if (companies.length === 0) {
      setTableData([]);
      return;
    }

    // Format des données pour le tableau
    const formattedCompanies = companies.map((company) => {
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
        createdAt: new Date(company.createdAt).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
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
  }, [companies]);

  /**
   * Fermeture des toasts
   */
  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  const closeErrorToast = () => {
    setShowErrorToast(false);
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
    setModalOpen(false);
    resetForm();
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteCompanyId("");
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
      if (isEditMode && selectedCompany) {
        // Mise à jour d'une entreprise existante
        await axios.put(
          `/api/admin/companies/${selectedCompany._id}`,
          formData
        );
        setSuccess("Entreprise mise à jour avec succès !");
      } else {
        // Création d'une nouvelle entreprise
        await axios.post("/api/admin/companies", formData);
        setSuccess("Entreprise créée avec succès !");
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
      await axios.delete(`/api/admin/companies/${deleteCompanyId}`);
      setSuccess("Entreprise supprimée avec succès !");
      setShowSuccessToast(true);

      // Rafraîchir la liste des entreprises
      await fetchCompanies();
      handleCloseDeleteModal();
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

        {/* Contenu principal */}
        <SectionCard>
          {loading && !tableData.length ? (
            <div className="flex justify-center items-center py-10">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <Table
              columns={companyColumns}
              data={tableData}
              pagination={true}
              rowsPerPage={10}
              emptyState={{
                title: "Aucune entreprise trouvée",
                description:
                  "Il n'y a actuellement aucune entreprise enregistrée dans le système.",
                icon: <Building size={48} className="text-gray-300" />,
              }}
              className="w-full border-collapse"
            />
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

            <InputField
              label="URL du logo (facultatif)"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleInputChange}
              error={formErrors.logoUrl}
              className="text-gray-700 dark:text-sky-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              placeholder="https://exemple.com/logo.png"
            />

            {formData.logoUrl && isValidUrl(formData.logoUrl) && (
              <div className="flex justify-center">
                <img
                  src={formData.logoUrl}
                  alt="Aperçu du logo"
                  className="h-24 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    setFormErrors({
                      ...formErrors,
                      logoUrl: "Impossible de charger l'image depuis cette URL",
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
                isLoading={loading}
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
