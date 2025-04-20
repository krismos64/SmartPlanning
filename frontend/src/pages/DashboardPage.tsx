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
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";

/**
 * DashboardCard - Composant local pour afficher une fonctionnalité
 * avec animation et navigation intégrée
 */
interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  delay: number;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  icon,
  path,
  delay,
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: delay * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        scale: 1.03,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(path)}
    >
      <Card className="h-full cursor-pointer flex flex-col p-6 transition-all duration-300 hover:border-blue-400">
        <div className="mb-4 text-blue-600 bg-blue-50 p-3 rounded-lg w-fit">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
        <p className="text-gray-600 flex-grow">{description}</p>
        <div className="flex justify-end mt-4">
          <motion.div
            className="text-blue-500 font-medium text-sm"
            whileHover={{ x: 5 }}
          >
            Accéder →
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * DashboardPage - Page principale du tableau de bord pour les managers
 * Affiche une grille de cartes pour accéder aux fonctionnalités principales
 */
const DashboardPage: React.FC = () => {
  // Données des fonctionnalités principales
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

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* En-tête de la page */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Tableau de bord
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Bienvenue sur votre espace de gestion SmartPlanning. Accédez
              rapidement à toutes les fonctionnalités pour gérer efficacement
              votre équipe.
            </p>
          </motion.div>

          {/* Grille de cartes de fonctionnalités */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        </div>

        {/* Pied de page avec infos supplémentaires */}
        <motion.div
          className="text-center mt-16 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>
            Version: 2.4.0 • Dernière mise à jour:{" "}
            {new Date().toLocaleDateString("fr-FR")}
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default DashboardPage;
