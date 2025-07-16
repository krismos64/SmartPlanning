import { motion } from "framer-motion";
import {
  Building,
  Calendar,
  Clock,
  FileCheck,
  Plane,
  Timer,
  User,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { CountUp } from "use-count-up";
import axiosInstance from "../api/axiosInstance";
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import SEO from "../components/layout/SEO";

// Composants layout
import PageWrapper from "../components/layout/PageWrapper";

// Composants UI
import Card from "../components/ui/Card";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Select from "../components/ui/Select";
import Toast from "../components/ui/Toast";

// Hooks
import { useAuth } from "../hooks/useAuth";

// Types

// Interface pour les statistiques récupérées
interface Stats {
  // Stats communes
  teamsCount?: number;
  employeesCount?: number;
  pendingLeaveRequestsCount?: number;
  approvedUpcomingLeaveCount?: number;

  // Stats directeur
  managersCount?: number;

  // Stats admin
  totalUsersCount?: number;
  totalCompaniesCount?: number;
  totalDirectorsCount?: number;
  totalManagersCount?: number;
  totalEmployeesCount?: number;
  generatedPlanningsCount?: number;
  activeUsersCount?: number;
}

// Filtre de période pour les statistiques
type PeriodFilter = "week" | "month" | "year";

// Interface pour un élément de statistique
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  delay: number;
  colorClass?: string;
}

/**
 * Composant StatCard - Affiche une statistique avec animation
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  delay,
  colorClass = "text-blue-500 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="w-full"
    >
      <Card hoverable bordered className="h-full">
        <div className="flex flex-col h-full">
          <div className={`mb-4 p-3 rounded-lg w-fit ${colorClass}`}>
            {icon}
          </div>

          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            {title}
          </h3>

          <div className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
            <CountUp isCounting start={0} end={value} duration={2.5} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Page de statistiques - Affiche des données différentes selon le rôle de l'utilisateur
 */
const StatsPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("week");

  // Options pour le filtre de période
  const periodOptions = [
    { label: "Cette semaine", value: "week" },
    { label: "Ce mois-ci", value: "month" },
    { label: "Cette année", value: "year" },
  ];

  // Récupération des statistiques depuis l'API
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Les cookies httpOnly sont automatiquement envoyés avec axiosInstance
        const response = await axiosInstance.get(
          `/stats/overview?period=${periodFilter}`
        );
        if (response.data.success) {
          setStats(response.data.data);
        } else {
          throw new Error(
            response.data.message ||
              "Erreur lors de la récupération des statistiques"
          );
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des statistiques:", err);
        setError(
          "Impossible de charger les statistiques. Veuillez réessayer plus tard."
        );
        setShowErrorToast(true);

        // Utiliser des données simulées en cas d'erreur
        setStats(simulateStats());
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [periodFilter]);

  // Fonction pour simuler les données si l'API n'est pas disponible
  const simulateStats = (): Stats => {
    const baseMultiplier =
      periodFilter === "week" ? 1 : periodFilter === "month" ? 4 : 12;

    // Stats de base pour tous les rôles
    const baseStats: Stats = {
      teamsCount: Math.floor(3 * baseMultiplier),
      employeesCount: Math.floor(12 * baseMultiplier),
      pendingLeaveRequestsCount: Math.floor(5 * baseMultiplier),
      approvedUpcomingLeaveCount: Math.floor(8 * baseMultiplier),
    };

    // Stats supplémentaires selon le rôle
    if (user?.role === "admin") {
      return {
        ...baseStats,
        totalUsersCount: Math.floor(150 * baseMultiplier),
        totalCompaniesCount: Math.floor(10 * baseMultiplier),
        totalDirectorsCount: Math.floor(15 * baseMultiplier),
        totalManagersCount: Math.floor(35 * baseMultiplier),
        totalEmployeesCount: Math.floor(100 * baseMultiplier),
        generatedPlanningsCount: Math.floor(45 * baseMultiplier),
        activeUsersCount: Math.floor(85 * baseMultiplier),
      };
    } else if (user?.role === "directeur") {
      return {
        ...baseStats,
        managersCount: Math.floor(8 * baseMultiplier),
      };
    }

    return baseStats;
  };

  // Si les stats n'ont pas pu être récupérées, utiliser des données simulées
  useEffect(() => {
    if (!loading && !stats) {
      setStats(simulateStats());
    }
  }, [loading, stats, user?.role, periodFilter]);

  // Titre de la page selon le rôle
  const getPageTitle = () => {
    switch (user?.role) {
      case "admin":
        return "Statistiques plateforme";
      case "directeur":
        return "Statistiques entreprise";
      case "manager":
        return "Statistiques équipes";
      default:
        return "Statistiques";
    }
  };

  return (
    <LayoutWithSidebar
      activeItem="statistiques"
      pageTitle={`${getPageTitle()} - SmartPlanning`}
    >
      <SEO title={`${getPageTitle()} - SmartPlanning`} />
      <PageWrapper>
        <div className="max-w-7xl mx-auto">
          {/* En-tête de page */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getPageTitle()}
              </h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Vue d'ensemble des statistiques{" "}
                {user?.role === "admin"
                  ? "de la plateforme"
                  : user?.role === "directeur"
                  ? "de l'entreprise"
                  : "de vos équipes"}
              </p>
            </div>

            {/* Filtre de période */}
            <div className="w-full md:w-64">
              <Select
                label="Période"
                options={periodOptions}
                value={periodFilter}
                onChange={(value) => setPeriodFilter(value as PeriodFilter)}
              />
            </div>
          </div>

          {/* Affichage du chargement */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Affichage des statistiques */}
          {!loading && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Statistiques pour les managers */}
              {user?.role === "manager" && (
                <>
                  <StatCard
                    title="Équipes gérées"
                    value={stats.teamsCount || 0}
                    icon={<Users size={24} />}
                    delay={0}
                    colorClass="text-indigo-500 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20"
                  />
                  <StatCard
                    title="Employés actifs"
                    value={stats.employeesCount || 0}
                    icon={<UserCheck size={24} />}
                    delay={1}
                    colorClass="text-emerald-500 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
                  />
                  <StatCard
                    title="Demandes de congés en attente"
                    value={stats.pendingLeaveRequestsCount || 0}
                    icon={<Clock size={24} />}
                    delay={2}
                    colorClass="text-amber-500 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20"
                  />
                  <StatCard
                    title="Congés approuvés à venir"
                    value={stats.approvedUpcomingLeaveCount || 0}
                    icon={<Plane size={24} />}
                    delay={3}
                    colorClass="text-blue-500 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
                  />
                </>
              )}

              {/* Statistiques pour les directeurs */}
              {user?.role === "directeur" && (
                <>
                  <StatCard
                    title="Managers de l'entreprise"
                    value={stats.managersCount || 0}
                    icon={<UserCog size={24} />}
                    delay={0}
                    colorClass="text-indigo-500 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20"
                  />
                  <StatCard
                    title="Équipes dans l'entreprise"
                    value={stats.teamsCount || 0}
                    icon={<Users size={24} />}
                    delay={1}
                    colorClass="text-emerald-500 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
                  />
                  <StatCard
                    title="Employés actifs"
                    value={stats.employeesCount || 0}
                    icon={<UserCheck size={24} />}
                    delay={2}
                    colorClass="text-amber-500 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20"
                  />
                  <StatCard
                    title="Congés à venir approuvés"
                    value={stats.approvedUpcomingLeaveCount || 0}
                    icon={<Calendar size={24} />}
                    delay={3}
                    colorClass="text-blue-500 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
                  />
                  <StatCard
                    title="Demandes de congés en attente"
                    value={stats.pendingLeaveRequestsCount || 0}
                    icon={<Clock size={24} />}
                    delay={4}
                    colorClass="text-purple-500 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20"
                  />
                </>
              )}

              {/* Statistiques pour les administrateurs */}
              {user?.role === "admin" && (
                <>
                  <StatCard
                    title="Utilisateurs totaux"
                    value={stats.totalUsersCount || 0}
                    icon={<User size={24} />}
                    delay={0}
                    colorClass="text-indigo-500 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20"
                  />
                  <StatCard
                    title="Entreprises"
                    value={stats.totalCompaniesCount || 0}
                    icon={<Building size={24} />}
                    delay={1}
                    colorClass="text-emerald-500 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
                  />
                  <StatCard
                    title="Directeurs"
                    value={stats.totalDirectorsCount || 0}
                    icon={<UserCog size={24} />}
                    delay={2}
                    colorClass="text-amber-500 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20"
                  />
                  <StatCard
                    title="Managers"
                    value={stats.totalManagersCount || 0}
                    icon={<Users size={24} />}
                    delay={3}
                    colorClass="text-blue-500 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
                  />
                  <StatCard
                    title="Employés"
                    value={stats.totalEmployeesCount || 0}
                    icon={<UserCheck size={24} />}
                    delay={4}
                    colorClass="text-purple-500 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20"
                  />
                  <StatCard
                    title="Plannings générés"
                    value={stats.generatedPlanningsCount || 0}
                    icon={<FileCheck size={24} />}
                    delay={5}
                    colorClass="text-rose-500 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20"
                  />
                  <StatCard
                    title="Utilisateurs actifs"
                    value={stats.activeUsersCount || 0}
                    icon={<Timer size={24} />}
                    delay={6}
                    colorClass="text-teal-500 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/20"
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <Toast
            isVisible={showErrorToast}
            type="error"
            message={error}
            onClose={() => setShowErrorToast(false)}
          />
        )}
      </PageWrapper>
    </LayoutWithSidebar>
  );
};

export default StatsPage;
