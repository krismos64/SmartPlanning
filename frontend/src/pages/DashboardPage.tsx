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
import { Helmet } from "react-helmet-async";
import { useTheme } from "../components/ThemeProvider";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import PageWrapper from "../components/layout/PageWrapper";
import CardGrid from "../components/ui/CardGrid";
import DashboardCard from "../components/ui/DashboardCard";

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
    <>
      <Helmet>
        <title>Dashboard SmartPlanning – Vue d'ensemble RH</title>
        <meta
          name="description"
          content="Accédez rapidement à toutes les fonctionnalités clés de SmartPlanning via un tableau de bord clair et animé."
        />
      </Helmet>

      <Header />
      <PageWrapper>
        <main
          className={`min-h-screen ${
            isDarkMode ? "bg-gray-900" : "bg-gray-50"
          }`}
        >
          <div className="max-w-6xl mx-auto px-4">
            {/* En-tête */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                className={`text-3xl md:text-4xl font-bold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Tableau de bord
              </h1>
              <p
                className={`max-w-2xl mx-auto ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Bienvenue sur votre espace de gestion SmartPlanning. Accédez
                rapidement à toutes les fonctionnalités pour gérer efficacement
                votre équipe.
              </p>
            </motion.div>

            {/* Grille de cartes */}
            <CardGrid>
              {features.map((feature, index) => (
                <DashboardCard
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  path={feature.path}
                  delay={index} // utilisé uniquement pour un décalage interne
                />
              ))}
            </CardGrid>

            {/* Pied de page */}
            <motion.div
              className={`text-center mt-16 text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            ></motion.div>
          </div>
        </main>
      </PageWrapper>
      <Footer />
    </>
  );
};

export default DashboardPage;
