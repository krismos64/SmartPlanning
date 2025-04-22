import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle,
  ClipboardList,
  Plane,
  Users,
} from "lucide-react";
import React from "react";
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import { useTheme } from "../components/ThemeProvider";
import CardGrid from "../components/ui/CardGrid";
import DashboardCard from "../components/ui/DashboardCard";

/**
 * Page du tableau de bord (dashboard RH) utilisant le layout principal
 */
const DashboardPage: React.FC = () => {
  const { isDarkMode } = useTheme();

  const features = [
    {
      title: "Planning hebdomadaire",
      description:
        "Consultez et gérez les horaires de travail de votre équipe pour la semaine en cours",
      icon: <CalendarCheck size={24} />,
      path: "/weekly-schedule",
    },
    {
      title: "Validation des plannings",
      description:
        "Approuvez ou refusez les plannings soumis par les employés ou autres responsables",
      icon: <CheckCircle size={24} />,
      path: "/planning-validation",
    },
    {
      title: "Gestion d'équipe",
      description:
        "Visualisez, ajoutez ou modifiez les membres de votre équipe et leurs informations",
      icon: <Users size={24} />,
      path: "/team-management",
    },
    {
      title: "Gestion des congés",
      description:
        "Gérez les demandes de congés et visualisez le calendrier des absences",
      icon: <Plane size={24} />,
      path: "/vacations",
    },
    {
      title: "Suivi des incidents",
      description:
        "Enregistrez et suivez les incidents survenus pendant les heures de travail",
      icon: <AlertTriangle size={24} />,
      path: "/incident-tracking",
    },
    {
      title: "Tâches des employés",
      description:
        "Assignez et suivez l'avancement des tâches attribuées à vos collaborateurs",
      icon: <ClipboardList size={24} />,
      path: "/employee-tasks",
    },
  ];

  return (
    <LayoutWithSidebar
      activeItem="dashboard"
      pageTitle="Dashboard SmartPlanning – Vue d'ensemble RH"
    >
      <div
        className={`max-w-6xl mx-auto mb-12 ${
          isDarkMode ? "text-gray-100" : "text-gray-900"
        }`}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center text-gray-900 dark:text-white">
          Tableau de bord
        </h1>
        <p className="text-center mb-10 max-w-2xl mx-auto text-gray-500 dark:text-gray-400">
          Bienvenue sur votre espace de gestion SmartPlanning. Accédez
          rapidement à toutes les fonctionnalités pour gérer efficacement votre
          équipe.
        </p>

        <CardGrid>
          {features.map((feature, index) => (
            <DashboardCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              path={feature.path}
              delay={index}
            />
          ))}
        </CardGrid>
      </div>
    </LayoutWithSidebar>
  );
};

export default DashboardPage;
