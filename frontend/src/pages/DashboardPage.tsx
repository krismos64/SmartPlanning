import { motion } from "framer-motion";
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

  const titleVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.3,
        ease: "easeOut",
      },
    },
  };

  const features = [
    {
      title: "Planning hebdomadaire",
      description:
        "Consultez et gérez les horaires de travail de votre équipe pour la semaine en cours",
      icon: <CalendarCheck size={24} />,
      path: "/plannings-hebdomadaires",
    },
    {
      title: "Validation des plannings",
      description:
        "Approuvez ou refusez les plannings soumis par les employés ou autres responsables",
      icon: <CheckCircle size={24} />,
      path: "/validation-des-plannings",
    },
    {
      title: "Gestion d'équipe",
      description:
        "Visualisez, ajoutez ou modifiez les membres de votre équipe et leurs informations",
      icon: <Users size={24} />,
      path: "/gestion-des-equipes",
    },
    {
      title: "Gestion des congés",
      description:
        "Gérez les demandes de congés et visualisez le calendrier des absences",
      icon: <Plane size={24} />,
      path: "/gestion-des-conges",
    },
    {
      title: "Suivi des incidents",
      description:
        "Enregistrez et suivez les incidents survenus pendant les heures de travail",
      icon: <AlertTriangle size={24} />,
      path: "/suivi-des-incidents",
    },
    {
      title: "Tâches des employés",
      description:
        "Assignez et suivez l'avancement des tâches attribuées à vos collaborateurs",
      icon: <ClipboardList size={24} />,
      path: "/taches-employes",
    },
  ];

  return (
    <LayoutWithSidebar
      activeItem="tableau-de-bord"
      pageTitle="Dashboard SmartPlanning – Vue d'ensemble RH"
    >
      <div
        className={`max-w-6xl mx-auto mb-12 relative ${
          isDarkMode ? "text-gray-100" : "text-gray-900"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 rounded-3xl blur-3xl -z-10"></div>

        <motion.h1
          className="text-3xl md:text-5xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 font-['Rajdhani',sans-serif] tracking-wider"
          initial="hidden"
          animate="visible"
          variants={titleVariants}
        >
          Tableau de bord
        </motion.h1>

        <div className="h-1 w-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-8 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>

        <motion.p
          className="text-center mb-12 max-w-2xl mx-auto text-gray-500 dark:text-gray-400 text-lg"
          initial="hidden"
          animate="visible"
          variants={subtitleVariants}
        >
          Bienvenue sur votre espace de gestion SmartPlanning. Accédez
          rapidement à toutes les fonctionnalités pour gérer efficacement votre
          équipe.
        </motion.p>

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
