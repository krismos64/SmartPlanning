import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
// Utilisation du composant LoadingSpinner global
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Toast from "../components/ui/Toast"; // Import du composant Toast global

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

// Types pour les composants d'UI réutilisables
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
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
 * Obtient la couleur du badge pour un statut d'abonnement
 * @param status Statut d'abonnement
 * @returns Classes CSS pour la couleur du badge
 */
const getSubscriptionColor = (status: string): string => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "trial":
      return "bg-blue-100 text-blue-800";
    case "inactive":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
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
 * Obtient la couleur de la barre de progression en fonction du pourcentage d'utilisation
 * @param percentage Pourcentage d'utilisation
 * @returns Classes CSS pour la couleur de la barre
 */
const getProgressColor = (percentage: number): string => {
  if (percentage < 70) {
    return "bg-green-500";
  } else if (percentage < 90) {
    return "bg-orange-500";
  } else {
    return "bg-red-500";
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
    <motion.div
      className="bg-white rounded-lg shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {company.name}
            </h2>
            {company.industry && (
              <p className="text-sm text-gray-500">{company.industry}</p>
            )}
          </div>
          <div className="mt-2 md:mt-0">
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubscriptionColor(
                company.subscriptionStatus
              )}`}
            >
              {formatSubscriptionStatus(company.subscriptionStatus)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Détails de l'entreprise */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Client depuis</p>
              <p className="font-medium">{formatDate(company.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nombre d'utilisateurs</p>
              <p className="font-medium">{company.userCount}</p>
            </div>
          </div>

          {/* Barre de progression de l'utilisation de l'IA */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm text-gray-500">Consommation IA mensuelle</p>
              <p className="text-sm font-semibold">
                {aiUsagePercentage}% ({company.monthlyAiUsage} /{" "}
                {company.monthlyAiLimit})
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${getProgressColor(
                  aiUsagePercentage
                )}`}
                style={{ width: `${aiUsagePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
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
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial des données
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Fonction pour fermer les notifications
  const closeNotification = () => {
    setError(null);
    setSuccess(null);
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <Toast message={error} type="error" onClose={closeNotification} />
        )}
        {success && (
          <Toast message={success} type="success" onClose={closeNotification} />
        )}
      </AnimatePresence>

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Vue d'ensemble des entreprises
        </h1>
        <p className="text-gray-600">
          Consultez l'état et les statistiques de vos entreprises clientes
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nombre total d'entreprises */}
        <motion.div
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Entreprises
          </h2>
          <p className="text-3xl font-bold text-blue-600">
            {fallbackCompanies.length}
          </p>
        </motion.div>

        {/* Nombre total d'utilisateurs */}
        <motion.div
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Utilisateurs
          </h2>
          <p className="text-3xl font-bold text-green-600">
            {fallbackCompanies.reduce(
              (sum, company) => sum + company.userCount,
              0
            )}
          </p>
        </motion.div>

        {/* Consommation IA totale */}
        <motion.div
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Consommation IA
          </h2>
          <p className="text-3xl font-bold text-purple-600">
            {fallbackCompanies
              .reduce((sum, company) => sum + company.monthlyAiUsage, 0)
              .toLocaleString("fr-FR")}
          </p>
        </motion.div>
      </div>

      {/* Liste des entreprises */}
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : fallbackCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fallbackCompanies.map((company) => (
            <CompanyCard key={company._id} company={company} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-lg text-gray-500 mb-2">
            Aucune entreprise trouvée
          </p>
          <p className="text-sm text-gray-400">
            Ajoutez de nouvelles entreprises pour les voir apparaître ici
          </p>
        </div>
      )}
    </div>
  );
};

export default CompanyOverviewPage;
