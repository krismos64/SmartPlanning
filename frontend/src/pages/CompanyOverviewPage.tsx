/**
 * CompanyOverviewPage - Page de vue d'ensemble des entreprises
 *
 * Affiche une vue d'ensemble des entreprises clientes pour les administrateurs,
 * avec des statistiques globales et des informations détaillées sur chaque entreprise.
 * Intègre les composants du design system SmartPlanning pour une expérience cohérente.
 */
import axios from "axios";
import { motion } from "framer-motion";
import { Building2, LineChart, Users } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Composants de layout
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";

// Composants UI
import Badge from "../components/ui/Badge";
import Breadcrumb from "../components/ui/Breadcrumb";
import Card from "../components/ui/Card";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ProgressBar from "../components/ui/ProgressBar";
import Toast from "../components/ui/Toast";

// Types pour les entreprises
interface Company {
  _id: string;
  name: string;
  industry?: string;
  createdAt: string;
  subscriptionStatus: "active" | "inactive" | "trial";
  userCount: number;
  monthlyAiUsage: number;
  monthlyAiLimit: number;
}

/**
 * Formate une date au format français
 * @param dateString Chaîne de date à formater
 * @returns Date formatée (ex: "15 avril 2023")
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Formate le statut d'abonnement pour l'affichage
 * @param status Statut d'abonnement
 * @returns Statut formaté en français
 */
const formatSubscriptionStatus = (status: string): string => {
  switch (status) {
    case "active":
      return "Actif";
    case "trial":
      return "Essai";
    case "inactive":
      return "Inactif";
    default:
      return status;
  }
};

/**
 * Obtient la variante de badge pour un statut d'abonnement
 * @param status Statut d'abonnement
 * @returns Type de badge
 */
const getSubscriptionBadgeType = (
  status: string
): "success" | "error" | "info" | "warning" => {
  switch (status) {
    case "active":
      return "success";
    case "trial":
      return "info";
    case "inactive":
      return "error";
    default:
      return "warning";
  }
};

/**
 * Obtient la variante de couleur pour la barre de progression en fonction du pourcentage d'utilisation
 * @param percentage Pourcentage d'utilisation
 * @returns Type de couleur
 */
const getProgressColor = (
  percentage: number
): "primary" | "success" | "warning" | "error" => {
  if (percentage < 70) {
    return "success";
  } else if (percentage < 90) {
    return "warning";
  } else {
    return "error";
  }
};

/**
 * Composant pour afficher une carte d'entreprise
 */
const CompanyCard: React.FC<{ company: Company }> = ({ company }) => {
  // Calcul du pourcentage d'utilisation de l'IA
  const aiUsagePercentage = Math.min(
    Math.round((company.monthlyAiUsage / company.monthlyAiLimit) * 100),
    100
  );

  return (
    <Card hoverable className="h-full transition-transform duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {company.name}
          </h2>
          {company.industry && (
            <p className="text-sm text-[var(--text-secondary)]">
              {company.industry}
            </p>
          )}
        </div>
        <div className="mt-2 md:mt-0">
          <Badge
            label={formatSubscriptionStatus(company.subscriptionStatus)}
            type={getSubscriptionBadgeType(company.subscriptionStatus)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Détails de l'entreprise */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">
              Client depuis
            </p>
            <p className="font-medium text-[var(--text-primary)]">
              {formatDate(company.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">
              Nombre d'utilisateurs
            </p>
            <p className="font-medium text-[var(--text-primary)]">
              {company.userCount}
            </p>
          </div>
        </div>

        {/* Barre de progression de l'utilisation de l'IA */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm text-[var(--text-secondary)]">
              Consommation IA mensuelle
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {aiUsagePercentage}% (
              {company.monthlyAiUsage.toLocaleString("fr-FR")} /{" "}
              {company.monthlyAiLimit.toLocaleString("fr-FR")})
            </p>
          </div>
          <ProgressBar
            value={aiUsagePercentage}
            color={getProgressColor(aiUsagePercentage)}
          />
        </div>
      </div>
    </Card>
  );
};

/**
 * Composant principal CompanyOverviewPage
 * Page de vue d'ensemble des entreprises pour les administrateurs
 */
const CompanyOverviewPage: React.FC = () => {
  // États pour les données et l'UI
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Mon entreprise" },
  ];

  // Fonction pour récupérer les données des entreprises
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<{ success: boolean; data: Company[] }>(
        "/api/companies/overview"
      );

      setCompanies(response.data.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des entreprises:", error);
      setError(
        "Impossible de récupérer les données des entreprises. Veuillez réessayer."
      );
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial des données
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Fonction pour fermer les notifications
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  // Données de secours pour le développement
  const fallbackCompanies: Company[] =
    companies.length > 0
      ? companies
      : [
          {
            _id: "1",
            name: "TechSolutions SAS",
            industry: "Technologie",
            createdAt: "2022-05-10T10:30:00Z",
            subscriptionStatus: "active",
            userCount: 28,
            monthlyAiUsage: 8500,
            monthlyAiLimit: 10000,
          },
          {
            _id: "2",
            name: "Marketing Expert",
            industry: "Marketing",
            createdAt: "2022-08-15T14:20:00Z",
            subscriptionStatus: "trial",
            userCount: 7,
            monthlyAiUsage: 450,
            monthlyAiLimit: 500,
          },
          {
            _id: "3",
            name: "Finance Plus",
            industry: "Finance",
            createdAt: "2021-11-20T09:15:00Z",
            subscriptionStatus: "active",
            userCount: 43,
            monthlyAiUsage: 6200,
            monthlyAiLimit: 15000,
          },
          {
            _id: "4",
            name: "Retail Solutions",
            industry: "Commerce de détail",
            createdAt: "2023-01-05T11:45:00Z",
            subscriptionStatus: "inactive",
            userCount: 12,
            monthlyAiUsage: 0,
            monthlyAiLimit: 5000,
          },
        ];

  return (
    <PageWrapper>
      {/* Notifications */}
      <Toast
        message={error || ""}
        type="error"
        isVisible={showErrorToast}
        onClose={closeErrorToast}
      />
      <Toast
        message={success || ""}
        type="success"
        isVisible={showSuccessToast}
        onClose={closeSuccessToast}
      />

      {/* En-tête avec fil d'ariane */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Titre de la page */}
      <SectionTitle
        title="Vue d'ensemble des entreprises"
        subtitle="Consultez l'état et les statistiques de vos entreprises clientes"
        icon={<Building2 size={24} />}
        className="mb-8"
      />

      {/* Statistiques globales */}
      <SectionCard title="Statistiques globales" className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
          {/* Nombre total d'entreprises */}
          <motion.div
            className="bg-[var(--background-secondary)] rounded-lg shadow-sm p-6 border border-[var(--border)]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Entreprises
              </h2>
              <Building2 size={24} className="text-[var(--accent-primary)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--accent-primary)] mt-2">
              {fallbackCompanies.length}
            </p>
          </motion.div>

          {/* Nombre total d'utilisateurs */}
          <motion.div
            className="bg-[var(--background-secondary)] rounded-lg shadow-sm p-6 border border-[var(--border)]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Utilisateurs
              </h2>
              <Users size={24} className="text-[var(--success)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--success)] mt-2">
              {fallbackCompanies.reduce(
                (sum, company) => sum + company.userCount,
                0
              )}
            </p>
          </motion.div>

          {/* Consommation IA totale */}
          <motion.div
            className="bg-[var(--background-secondary)] rounded-lg shadow-sm p-6 border border-[var(--border)]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Consommation IA
              </h2>
              <LineChart size={24} className="text-[var(--accent-primary)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--accent-primary)] mt-2">
              {fallbackCompanies
                .reduce((sum, company) => sum + company.monthlyAiUsage, 0)
                .toLocaleString("fr-FR")}
            </p>
          </motion.div>
        </div>
      </SectionCard>

      {/* Liste des entreprises */}
      <SectionCard title="Entreprises clientes" className="mb-8">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : fallbackCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {fallbackCompanies.map((company) => (
              <CompanyCard key={company._id} company={company} />
            ))}
          </div>
        ) : (
          <div className="bg-[var(--background-secondary)] rounded-lg p-8 text-center">
            <Building2
              size={48}
              className="mx-auto text-[var(--text-tertiary)] mb-4"
            />
            <p className="text-lg text-[var(--text-primary)] mb-2">
              Aucune entreprise trouvée
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Ajoutez de nouvelles entreprises pour les voir apparaître ici
            </p>
          </div>
        )}
      </SectionCard>
    </PageWrapper>
  );
};

export default CompanyOverviewPage;
